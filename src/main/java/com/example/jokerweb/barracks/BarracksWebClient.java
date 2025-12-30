package com.example.jokerweb.barracks;

import java.net.URI;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

/**
 * 넥슨 병영수첩 웹페이지를 호출해서 최소 정보를 스크래핑하는 클라이언트.
 *
 * - 외부 HTML 구조에 의존하므로, 파싱이 실패해도 전체 기능이 죽지 않도록 Optional 로 감싼다.
 * - 실제 CSS 셀렉터는 필요 시 병영 페이지 HTML 을 보면서 조정해야 한다.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class BarracksWebClient {

    private static final String BARRACKS_HOST = "barracks.sa.nexon.com";
    /**
     * 병영 ID 추출용 패턴.
     * - 구형: /barracks/profile.aspx?sn=352822630
     * - 신형: /352822630/match
     */
    private static final Pattern BARRACKS_ID_PATTERN =
            Pattern.compile("barracks\\.sa\\.nexon\\.com/(?:barracks/profile\\.aspx\\?sn=)?(\\d+)");
    
    /**
     * 닉네임 추출용 정규식 패턴
     * <p class="nick">닉네임</p> 또는 <p[^>]*class="nick"[^>]*>닉네임</p>
     */
    private static final Pattern NICKNAME_PATTERN =
            Pattern.compile("<p[^>]*class=\"nick\"[^>]*>([^<]+)</p>", Pattern.CASE_INSENSITIVE);
    
    /**
     * 클랜명 추출용 정규식 패턴
     * <a class="text-white">클랜명</a> (클랜 섹션 내)
     */
    private static final Pattern CLAN_PATTERN =
            Pattern.compile("<div[^>]*class=\"clan\"[^>]*>.*?<a[^>]*class=\"text-white\"[^>]*>([^<]+)</a>", Pattern.CASE_INSENSITIVE | Pattern.DOTALL);

    private final RestClient.Builder restClientBuilder;

    /**
     * 병영수첩 프로필 URL을 직접 받아서 스크래핑한다.
     *
     * 예시: https://barracks.sa.nexon.com/barracks/profile.aspx?sn=352822630
     */
    public Optional<BarracksPageInfo> fetchByProfileUrl(String url) {
        try {
            URI uri = URI.create(url);
            if (!BARRACKS_HOST.equalsIgnoreCase(uri.getHost())) {
                log.warn("병영수첩 도메인이 아님: url={}", url);
                return Optional.empty();
            }

            String barracksId = extractBarracksId(url);
            if (barracksId == null) {
                log.warn("병영수첩 ID(sn) 추출 실패: url={}", url);
            }

            RestClient client = restClientBuilder.baseUrl(uri.getScheme() + "://" + uri.getHost())
                    .defaultHeader("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                    .defaultHeader("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8")
                    .defaultHeader("Accept-Language", "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7")
                    // Accept-Encoding 제거: 서버가 압축 응답을 보내면 RestClient가 자동 해제하지만, 403 에러 시 문제 발생 가능
                    .defaultHeader("Connection", "keep-alive")
                    .defaultHeader("Upgrade-Insecure-Requests", "1")
                    .defaultHeader("Sec-Fetch-Dest", "document")
                    .defaultHeader("Sec-Fetch-Mode", "navigate")
                    .defaultHeader("Sec-Fetch-Site", "none")
                    .defaultHeader("Cache-Control", "max-age=0")
                    .build();

            ResponseEntity<String> response;
            try {
                response = client.get()
                        .uri(uri)
                        .retrieve()
                        .toEntity(String.class);
            } catch (org.springframework.web.client.HttpClientErrorException.Forbidden e) {
                log.warn("병영 페이지 접근 거부 (403): url={}, Cloudflare 보호로 인한 차단 가능", url);
                // 403이어도 ID는 추출 가능하면 반환
                return Optional.of(new BarracksPageInfo(barracksId, null, null, url));
            } catch (org.springframework.web.client.HttpClientErrorException e) {
                log.warn("병영 페이지 HTTP 에러: url={}, status={}", url, e.getStatusCode());
                return Optional.of(new BarracksPageInfo(barracksId, null, null, url));
            }

            String body = response.getBody();
            if (body == null || body.isBlank()) {
                log.warn("병영 페이지 HTML 이 비어있음: url={}", url);
                return Optional.of(new BarracksPageInfo(barracksId, null, null, url));
            }
            
            // Cloudflare 챌린지 페이지 체크
            if (body.contains("Just a moment") || body.contains("cf-challenge") || body.contains("challenge-platform")) {
                log.warn("Cloudflare 챌린지 페이지 감지: url={}", url);
                // 챌린지 페이지라도 ID는 추출 가능하면 반환
                return Optional.of(new BarracksPageInfo(barracksId, null, null, url));
            }

            // 정규식으로 닉네임과 클랜명 추출
            String nickname = null;
            String clanName = null;
            try {
                // 닉네임 추출: <p class="nick">닉네임</p>
                Matcher nicknameMatcher = NICKNAME_PATTERN.matcher(body);
                if (nicknameMatcher.find()) {
                    nickname = nicknameMatcher.group(1).trim();
                }
                
                // 클랜명 추출: <div class="clan">...<a class="text-white">클랜명</a>...
                Matcher clanMatcher = CLAN_PATTERN.matcher(body);
                if (clanMatcher.find()) {
                    clanName = clanMatcher.group(1).trim();
                }
                
                log.debug("병영 페이지 파싱 결과: nickname={}, clanName={}, url={}", nickname, clanName, url);
            } catch (Exception e) {
                log.warn("병영 페이지 파싱 중 오류: url={}, error={}", url, e.getMessage());
            }

            String canonicalUrl = response.getHeaders().getLocation() != null
                    ? response.getHeaders().getLocation().toString()
                    : url;

            return Optional.of(new BarracksPageInfo(barracksId, nickname, clanName, canonicalUrl));
        } catch (Exception e) {
            // 예외 메시지가 너무 길거나 바이너리일 수 있으므로 간단히만 로깅
            String errorMsg = e.getMessage();
            if (errorMsg != null && errorMsg.length() > 200) {
                errorMsg = errorMsg.substring(0, 200) + "...";
            }
            log.warn("병영 페이지 호출 실패: url={}, error={}", url, errorMsg);
            // 예외가 발생해도 ID는 추출 가능하면 반환
            String barracksId = extractBarracksId(url);
            return Optional.of(new BarracksPageInfo(barracksId, null, null, url));
        }
    }

    private String extractBarracksId(String url) {
        Matcher matcher = BARRACKS_ID_PATTERN.matcher(url);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return null;
    }
}

