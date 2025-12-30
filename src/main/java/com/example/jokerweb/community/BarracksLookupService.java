package com.example.jokerweb.community;

import com.example.jokerweb.barracks.BarracksPageInfo;
import com.example.jokerweb.barracks.BarracksWebClient;
import com.example.jokerweb.community.dto.BarracksResolveResponse;
import com.example.jokerweb.nexon.NxOpenApiClient;
import com.example.jokerweb.nexon.dto.IdResponse;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 닉네임/병영수첩 URL을 기반으로
 * - 병영수첩 주소
 * - 닉네임, 클랜, ouid
 * 를 조회해주는 도메인 서비스.
 *
 * 외부 병영 페이지 HTML 구조에 의존하는 부분은 BarracksWebClient 에 캡슐화되어 있다.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BarracksLookupService {

    private final BarracksWebClient barracksWebClient;
    private final NxOpenApiClient nxClient;
    private final BarracksReportRepository barracksReportRepository;

    /**
     * 병영수첩 URL을 기반으로 사용자 정보를 역으로 조회한다.
     *
     * 1) 병영 페이지를 스크래핑해 닉네임/클랜/병영ID를 얻고
     * 2) 닉네임으로 Nexon Open API 를 호출해 ouid 를 가져온다.
     */
    @Transactional(readOnly = true)
    public Optional<BarracksResolveResponse> resolveByUrl(String url) {
        Optional<BarracksPageInfo> pageInfoOpt = barracksWebClient.fetchByProfileUrl(url);
        if (pageInfoOpt.isEmpty()) {
            return Optional.empty();
        }

        BarracksPageInfo pageInfo = pageInfoOpt.get();

        String nickname = pageInfo.getNickname();
        String clanName = pageInfo.getClanName();
        String barracksId = pageInfo.getBarracksId();
        String barracksUrl = pageInfo.getCanonicalUrl();

        // 병영 페이지에서 닉네임을 읽지 못한 경우 (Cloudflare 차단 등)
        // 이 경우에도 병영 ID는 추출 가능하므로, URL 형식 검증은 통과한 것으로 간주
        // 실제 닉네임 검증은 프론트에서 이미 조회한 playerInfo와 비교하거나
        // 백엔드 저장 시점에 다시 시도
        if (nickname == null || nickname.isBlank()) {
            log.warn("병영 페이지에서 닉네임을 읽지 못함: url={}, Cloudflare 차단 가능. URL 형식만 검증하여 반환", url);
            // 병영 ID는 추출 가능하므로 최소한의 정보라도 반환
            return Optional.of(new BarracksResolveResponse(
                    null, // 닉네임은 읽지 못함
                    null, // 클랜도 읽지 못함
                    null, // ouid도 조회 불가
                    barracksId,
                    barracksUrl != null && !barracksUrl.isBlank() ? barracksUrl : url
            ));
        }

        String ouid = null;
        try {
            IdResponse idResponse = nxClient.getIdByUserName(nickname);
            if (idResponse != null && idResponse.getOuid() != null && !idResponse.getOuid().isBlank()) {
                ouid = idResponse.getOuid();
            }
        } catch (Exception e) {
            log.warn("병영수첩 URL 역조회 중 ouid 조회 실패: nickname={}, error={}", nickname, e.getMessage());
        }

        return Optional.of(new BarracksResolveResponse(
                nickname,
                clanName,
                ouid,
                barracksId,
                barracksUrl
        ));
    }

    /**
     * 닉네임 기준으로 병영수첩 주소를 조회한다.
     *
     * 현재는
     *  - 우리 DB(barracks_report)에 이미 저장된 병영주소가 있는 경우 그 값을 재사용하는 수준으로 동작한다.
     *  - 처음 제보되는 닉네임은 사용자가 병영주소를 한 번 입력해야 한다.
     *
     * 향후 넥슨 병영 검색 페이지 패턴이 확정되면, 여기서 BarracksWebClient 를 통해
     * 닉네임 기반 스크래핑을 추가로 수행할 수 있다.
     */
    @Transactional(readOnly = true)
    public Optional<BarracksResolveResponse> resolveByNickname(String nickname) {
        if (nickname == null || nickname.isBlank()) {
            return Optional.empty();
        }
        String trimmed = nickname.trim();

        // 1) 같은 닉네임으로 저장된 최근 병영 제보에서 병영주소 재사용
        BarracksReport latest = barracksReportRepository
                .findTop1ByTargetNicknameAndIsDeletedFalseOrderByCreatedAtDesc(trimmed)
                .orElse(null);

        if (latest == null || latest.getBarracksAddress() == null || latest.getBarracksAddress().isBlank()) {
            // 아직 우리 DB 에 병영주소가 한 번도 저장된 적이 없음
            return Optional.empty();
        }

        String existingUrl = latest.getBarracksAddress();
        Optional<BarracksPageInfo> pageInfoOpt = barracksWebClient.fetchByProfileUrl(existingUrl);

        String resolvedNickname = trimmed;
        String clanName = null;
        String barracksId = null;
        String barracksUrl = existingUrl;

        if (pageInfoOpt.isPresent()) {
            BarracksPageInfo pageInfo = pageInfoOpt.get();
            if (pageInfo.getNickname() != null && !pageInfo.getNickname().isBlank()) {
                resolvedNickname = pageInfo.getNickname();
            }
            clanName = pageInfo.getClanName();
            barracksId = pageInfo.getBarracksId();
            if (pageInfo.getCanonicalUrl() != null && !pageInfo.getCanonicalUrl().isBlank()) {
                barracksUrl = pageInfo.getCanonicalUrl();
            }
        }

        String ouid = null;
        try {
            IdResponse idResponse = nxClient.getIdByUserName(resolvedNickname);
            if (idResponse != null && idResponse.getOuid() != null && !idResponse.getOuid().isBlank()) {
                ouid = idResponse.getOuid();
            }
        } catch (Exception e) {
            log.warn("닉네임 기반 병영 조회 중 ouid 조회 실패: nickname={}, error={}", resolvedNickname, e.getMessage());
        }

        return Optional.of(new BarracksResolveResponse(
                resolvedNickname,
                clanName,
                ouid,
                barracksId,
                barracksUrl
        ));
    }
}

