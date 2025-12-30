package com.example.jokerweb.logging;

import com.example.jokerweb.member.Member;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * AccessLog 비동기 저장 서비스
 * 로깅이 API 응답 시간에 영향을 주지 않도록 비동기 처리
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AccessLogService {

    private final AccessLogRepository accessLogRepository;
    private final MemberIpHistoryRepository memberIpHistoryRepository;

    /**
     * AccessLog 비동기 저장
     */
    @Async("taskExecutor")
    public void saveAccessLogAsync(
            Member member,
            String anonymousId,
            String clientIp,
            String userAgent,
            String requestPath,
            String httpMethod,
            Integer responseStatus,
            String referrer) {
        try {
            AccessLog log = new AccessLog();
            log.setMember(member);
            log.setAnonymousId(anonymousId);
            log.setMemberFlag(member != null);
            log.setClientIp(StringUtils.hasText(clientIp) ? clientIp : "0.0.0.0");
            log.setUserAgent(userAgent);
            log.setRequestPath(requestPath);
            log.setHttpMethod(httpMethod);
            log.setResponseStatus(responseStatus);
            log.setReferrer(referrer);
            accessLogRepository.save(log);
        } catch (Exception e) {
            // 로깅 실패해도 API 응답에는 영향 없도록 예외는 로그만 남김
            log.warn("Failed to save access log: {}", e.getMessage());
        }
    }

    /**
     * Member IP History 비동기 저장/업데이트
     */
    @Async("taskExecutor")
    public void saveMemberIpHistoryAsync(Member member, String clientIp) {
        try {
            if (member == null || !StringUtils.hasText(clientIp) || clientIp.equals("0.0.0.0")) {
                return;
            }

            memberIpHistoryRepository.findByMemberIdAndClientIp(member.getId(), clientIp)
                    .ifPresentOrElse(entry -> {
                        entry.touch();
                        memberIpHistoryRepository.save(entry);
                    }, () -> {
                        MemberIpHistory entry = new MemberIpHistory();
                        entry.setMember(member);
                        entry.setClientIp(clientIp);
                        memberIpHistoryRepository.save(entry);
                    });
        } catch (Exception e) {
            // 로깅 실패해도 API 응답에는 영향 없도록 예외는 로그만 남김
            log.warn("Failed to save member IP history: {}", e.getMessage());
        }
    }
}
