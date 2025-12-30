package com.example.jokerweb.security;

import com.example.jokerweb.common.IpUtils;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * 어드민 페이지 접근 보호 필터
 * - 비인가 사용자가 어드민 페이지 접속 시도 시 추적
 * - 2회 이상 시도 시 IP 차단 및 홈페이지로 리다이렉트
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AdminAccessProtectionFilter extends OncePerRequestFilter {

    private static final String ADMIN_PATH_PREFIX = "/admin";
    private static final int MAX_ATTEMPTS = 2;
    private static final int BLOCK_DURATION_HOURS = 24;

    private final AdminAccessAttemptRepository attemptRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String requestPath = request.getRequestURI();
        String clientIp = extractClientIp(request);

        // 어드민 페이지 접근인지 확인
        if (isAdminPageAccess(requestPath)) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            boolean hasAdminRole = hasAdminRole(auth);
            
            // 인증되지 않았거나 ADMIN 역할이 없는 경우
            if (auth == null || !hasAdminRole) {
                // 최근 1시간 내 시도 횟수 확인
                LocalDateTime since = LocalDateTime.now().minusHours(1);
                long attemptCount = attemptRepository.countFailedAttemptsSince(clientIp, since);

                // 접속 시도 기록
                AdminAccessAttempt attempt = AdminAccessAttempt.builder()
                        .clientIp(clientIp)
                        .userAgent(request.getHeader(HttpHeaders.USER_AGENT))
                        .requestPath(requestPath)
                        .hasAuth(false)
                        .blocked(attemptCount >= MAX_ATTEMPTS - 1)
                        .attemptedAt(LocalDateTime.now())
                        .build();
                attemptRepository.save(attempt);

                // 2회 이상 시도한 경우 차단
                if (attemptCount >= MAX_ATTEMPTS - 1) {
                    log.warn("차단된 IP가 어드민 페이지 접근 시도: IP={}, Path={}", clientIp, requestPath);
                    response.sendRedirect("/");
                    return;
                }
            }
        }

        filterChain.doFilter(request, response);
    }

    private boolean isAdminPageAccess(String path) {
        // 프론트엔드 라우트 또는 API 엔드포인트 모두 체크
        return path.startsWith(ADMIN_PATH_PREFIX) || path.startsWith("/api/admin");
    }

    private boolean hasAdminRole(Authentication auth) {
        if (auth == null || auth.getAuthorities() == null) {
            return false;
        }
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    private String extractClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        String xRealIp = request.getHeader("X-Real-IP");
        String remoteAddr = request.getRemoteAddr();
        // IPv4만 추출 (IPv6는 무시)
        String extractedIp = IpUtils.extractClientIp(xForwardedFor, xRealIp, remoteAddr);
        // IPv4를 찾지 못한 경우 빈 문자열 대신 "0.0.0.0" 반환 (차단 로직에서 사용)
        return StringUtils.hasText(extractedIp) ? extractedIp : "0.0.0.0";
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        // 정적 리소스는 필터링하지 않음
        String path = request.getRequestURI();
        return path.startsWith("/_next/") || 
               path.startsWith("/static/") || 
               path.endsWith(".ico") || 
               path.endsWith(".png") || 
               path.endsWith(".jpg") || 
               path.endsWith(".svg") ||
               path.endsWith(".css") ||
               path.endsWith(".js");
    }
}
