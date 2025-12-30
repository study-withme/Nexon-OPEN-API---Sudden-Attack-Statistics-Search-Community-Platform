package com.example.jokerweb.community;

import com.example.jokerweb.auth.AuthService;
import com.example.jokerweb.community.dto.BarracksReportCreateRequest;
import com.example.jokerweb.community.dto.BarracksReportResponse;
import com.example.jokerweb.member.Member;
import com.example.jokerweb.member.MemberRepository;
import com.example.jokerweb.nexon.NxOpenApiClient;
import com.example.jokerweb.nexon.dto.UserBasicResponse;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class BarracksReportService {

    private final BarracksReportRepository repository;
    private final MemberRepository memberRepository;
    private final AuthService authService;
    private final NxOpenApiClient nxClient;
    private final BarracksLookupService barracksLookupService;

    @Transactional
    public BarracksReportResponse create(String authorization, BarracksReportCreateRequest req) {
        Member reporter = authService.authenticate(authorization)
                .orElseThrow(() -> new IllegalArgumentException("로그인이 필요합니다."));

        // 중복 제보 방지: 24시간 이내에 같은 reporter가 같은 targetNickname을 제보했는지 확인
        java.time.LocalDateTime oneDayAgo = java.time.LocalDateTime.now().minusDays(1);
        boolean hasRecentReport = repository.existsByReporterAndTargetNicknameAndCreatedAtAfter(
                reporter.getId(),
                req.getTargetNickname(),
                oneDayAgo
        );

        if (hasRecentReport) {
            throw new IllegalArgumentException(
                    "24시간 이내에 같은 대상에 대한 제보가 이미 존재합니다. " +
                    "추가 정보가 있다면 기존 제보에 댓글로 남겨주세요."
            );
        }

        // 병영주소와 닉네임/OUiD 일치 여부 검증
        validateTargetIdentity(req);

        // 해당 닉네임에 대한 전체 제보 건수 계산
        Long totalCount = repository.countByTargetNicknameAndReportTypeNot(req.getTargetNickname());
        
        BarracksReport report = BarracksReport.builder()
                .reporter(reporter)
                .targetNickname(req.getTargetNickname())
                .targetOuid(req.getTargetOuid())
                .barracksAddress(req.getBarracksAddress())
                .reportType(req.getReportType())
                .title(req.getTitle())
                .content(req.getContent())
                .isAnonymous(Boolean.TRUE.equals(req.getAnonymous()))
                .status("pending")
                .reportCount(1)
                .totalReportCount(totalCount.intValue() + 1) // 새 제보 포함
                .build();
        
        BarracksReport savedReport = repository.save(report);
        
        // 같은 닉네임의 다른 제보들의 totalReportCount도 업데이트
        updateTotalReportCountForNickname(req.getTargetNickname());
        
        return BarracksReportResponse.from(savedReport);
    }
    
    @Transactional
    public void updateTotalReportCountForNickname(String targetNickname) {
        Long totalCount = repository.countByTargetNicknameAndReportTypeNot(targetNickname);
        repository.findAll().stream()
                .filter(r -> targetNickname.equals(r.getTargetNickname()) && !Boolean.TRUE.equals(r.getIsDeleted()))
                .forEach(r -> {
                    r.setTotalReportCount(totalCount.intValue());
                    repository.save(r);
                });
    }

    @Transactional(readOnly = true)
    public List<BarracksReportResponse> list() {
        return repository.findAll().stream()
                .filter(r -> !Boolean.TRUE.equals(r.getIsDeleted()))
                .filter(r -> {
                    // 제보 5건 이상인 것만 노출
                    Integer totalCount = r.getTotalReportCount();
                    return totalCount != null && totalCount >= 5;
                })
                .map(BarracksReportResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BarracksReportResponse detail(Long id) {
        BarracksReport report = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("신고를 찾을 수 없습니다."));
        if (Boolean.TRUE.equals(report.getIsDeleted())) {
            throw new IllegalArgumentException("삭제된 신고입니다.");
        }
        return BarracksReportResponse.from(report);
    }

    @Transactional(readOnly = true)
    public Long getBarracksReportCount(String targetNickname) {
        return repository.countByTargetNicknameAndReportTypeNot(targetNickname);
    }

    @Transactional(readOnly = true)
    public Long getTrollReportCount(String targetNickname) {
        return repository.countByTargetNicknameAndReportType(targetNickname, "troll");
    }

    /**
     * 신고 대상 닉네임/OUiD 와 병영수첩 주소가 동일 인물을 가리키는지 검증한다.
     *
     * - 병영주소가 비어있으면 검증하지 않는다 (컨트롤러 레벨에서 NotBlank 이므로 일반적으로는 들어옴)
     * - 병영주소에서 스크래핑한 닉네임/클랜/OUiD 정보와
     *   요청에 포함된 targetNickname / targetOuid 를 비교한다.
     */
    @Transactional(readOnly = true)
    protected void validateTargetIdentity(BarracksReportCreateRequest req) {
        String barracksAddress = req.getBarracksAddress();
        if (barracksAddress == null || barracksAddress.isBlank()) {
            return;
        }

        var resolvedOpt = barracksLookupService.resolveByUrl(barracksAddress);
        if (resolvedOpt.isEmpty()) {
            throw new IllegalArgumentException("병영수첩 주소로 신고 대상을 확인할 수 없습니다. 주소를 다시 확인해주세요.");
        }

        var resolved = resolvedOpt.get();

        // 닉네임 비교 (대소문자 무시)
        if (resolved.getNickname() != null
                && req.getTargetNickname() != null
                && !resolved.getNickname().equalsIgnoreCase(req.getTargetNickname())) {
            throw new IllegalArgumentException("닉네임과 병영수첩 정보가 일치하지 않습니다. 병영수첩 주소를 다시 확인해주세요.");
        }

        // OUID 가 둘 다 있는 경우 비교
        if (resolved.getOuid() != null
                && req.getTargetOuid() != null
                && !resolved.getOuid().equals(req.getTargetOuid())) {
            throw new IllegalArgumentException("OUiD와 병영수첩 정보가 일치하지 않습니다. 병영수첩 주소를 다시 확인해주세요.");
        }
    }

    /**
     * 정지 상태 확인 및 업데이트
     * 서든어택 API를 통해 유저 정보를 조회하여 정지 상태를 판단
     */
    @Transactional
    @Async
    public void checkAndUpdateBanStatus(String targetNickname, String targetOuid) {
        try {
            // OUID가 없으면 닉네임으로 조회
            if (targetOuid == null || targetOuid.trim().isEmpty()) {
                var idResponse = nxClient.getIdByUserName(targetNickname);
                if (idResponse == null || idResponse.getOuid() == null) {
                    log.warn("정지 상태 확인 실패: 닉네임으로 OUID 조회 실패, targetNickname={}", targetNickname);
                    return;
                }
                targetOuid = idResponse.getOuid();
            }

            // 유저 기본 정보 조회
            UserBasicResponse userBasic = nxClient.getUserBasic(targetOuid);
            
            String banStatus = determineBanStatus(userBasic);
            
            // 해당 닉네임의 모든 제보에 정지 상태 업데이트
            List<BarracksReport> reports = repository.findAll().stream()
                    .filter(r -> targetNickname.equals(r.getTargetNickname()) && !Boolean.TRUE.equals(r.getIsDeleted()))
                    .collect(Collectors.toList());
            
            java.time.LocalDateTime now = java.time.LocalDateTime.now();
            for (BarracksReport report : reports) {
                report.setBanStatus(banStatus);
                report.setBanCheckedAt(now);
                repository.save(report);
            }
            
            log.info("정지 상태 업데이트 완료: targetNickname={}, banStatus={}", targetNickname, banStatus);
        } catch (Exception e) {
            log.error("정지 상태 확인 중 오류 발생: targetNickname={}, error={}", targetNickname, e.getMessage(), e);
        }
    }

    /**
     * 유저 정보를 기반으로 정지 상태 판단
     * 서든어택 API에는 직접적인 정지 상태가 없으므로 간접적으로 판단
     */
    private String determineBanStatus(UserBasicResponse userBasic) {
        if (userBasic == null) {
            // API 조회 실패 시 null 반환 (미확인)
            return null;
        }
        
        // 서든어택 API에는 정지 상태 정보가 직접 제공되지 않음
        // 따라서 간접적인 방법으로 판단:
        // 1. 유저 정보가 조회되면 활동중으로 판단
        // 2. 유저 정보가 조회되지 않으면 정지 가능성 (하지만 확실하지 않음)
        
        // 현재는 유저 정보가 조회되면 활동중으로 판단
        // 실제 정지 상태는 관리자가 수동으로 업데이트하거나
        // 다른 신호(예: 최근 매치 데이터 없음 등)를 통해 판단해야 함
        
        return "active"; // 기본값: 활동중
    }

    /**
     * 관리자가 수동으로 정지 상태 업데이트
     */
    @Transactional
    public void updateBanStatusManually(Long reportId, String banStatus) {
        BarracksReport report = repository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("신고를 찾을 수 없습니다."));
        
        report.setBanStatus(banStatus);
        report.setBanCheckedAt(java.time.LocalDateTime.now());
        repository.save(report);
        
        // 같은 닉네임의 다른 제보들도 업데이트
        List<BarracksReport> sameNicknameReports = repository.findAll().stream()
                .filter(r -> report.getTargetNickname().equals(r.getTargetNickname()) 
                        && !r.getId().equals(reportId)
                        && !Boolean.TRUE.equals(r.getIsDeleted()))
                .collect(Collectors.toList());
        
        for (BarracksReport r : sameNicknameReports) {
            r.setBanStatus(banStatus);
            r.setBanCheckedAt(java.time.LocalDateTime.now());
            repository.save(r);
        }
    }
}
