package com.example.jokerweb.logging;

import com.example.jokerweb.common.IpUtils;
import com.example.jokerweb.member.Member;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@RequiredArgsConstructor
public class AccessLoggingFilter extends OncePerRequestFilter {

    private static final String ANON_COOKIE = "anon_id";
    private static final String COOKIE_CONSENT_KEY = "cookie-consent-accepted";
    private static final String COOKIE_CONSENT_HEADER = "X-Cookie-Consent";

    private final AccessLogService accessLogService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        
        // 정적 리소스나 불필요한 경로는 로깅하지 않음
        if (shouldSkipLogging(path)) {
            filterChain.doFilter(request, response);
            return;
        }

        // 쿠키 동의 여부 확인 (쿠키 또는 헤더에서)
        boolean hasConsent = hasCookieConsent(request);

        // Anonymous ID cookie (쿠키 동의가 있을 때만 설정)
        String anonId = null;
        if (hasConsent) {
            anonId = resolveAnonId(request, response);
        }

        // Proceed the chain first to capture status
        filterChain.doFilter(request, response);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Member member = (auth != null && auth.getPrincipal() instanceof Member) ? (Member) auth.getPrincipal() : null;

        // 쿠키 동의가 있을 때만 실제 접속자 정보 수집
        final String clientIp;
        final String userAgent;
        final String referrer;
        
        if (hasConsent) {
            // 실제 접속자 IPv4 주소 추출
            clientIp = extractClientIp(request);
            
            // 접속 환경 정보 수집
            userAgent = request.getHeader(HttpHeaders.USER_AGENT);
            referrer = request.getHeader(HttpHeaders.REFERER);
        } else {
            clientIp = "";
            userAgent = "";
            referrer = "";
        }

        String method = request.getMethod();

        // 비동기로 AccessLog 저장 (응답 시간에 영향 없음)
        accessLogService.saveAccessLogAsync(
                member,
                anonId,
                clientIp,
                userAgent,
                path,
                method,
                response.getStatus(),
                referrer
        );

        // Track member IP history (쿠키 동의가 있고 실제 IP가 있을 때만) - 비동기 처리
        if (member != null && hasConsent && StringUtils.hasText(clientIp) && !clientIp.equals("0.0.0.0")) {
            accessLogService.saveMemberIpHistoryAsync(member, clientIp);
        }
    }

    /**
     * 쿠키 동의 여부 확인
     * 쿠키 또는 헤더에서 확인
     */
    private boolean hasCookieConsent(HttpServletRequest request) {
        // 헤더에서 확인 (프론트엔드에서 전송)
        String headerConsent = request.getHeader(COOKIE_CONSENT_HEADER);
        if ("true".equals(headerConsent)) {
            return true;
        }
        
        // 쿠키에서 확인
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if (COOKIE_CONSENT_KEY.equals(cookie.getName()) && "true".equals(cookie.getValue())) {
                    return true;
                }
            }
        }
        
        return false;
    }

    /**
     * 실제 접속자 IPv4 주소 추출
     * 대형 커뮤니티에서 사용하는 방식으로 실제 클라이언트 IP를 추출
     */
    private String extractClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        String xRealIp = request.getHeader("X-Real-IP");
        String remoteAddr = request.getRemoteAddr();
        
        return IpUtils.extractClientIp(xForwardedFor, xRealIp, remoteAddr);
    }

    private String resolveAnonId(HttpServletRequest request, HttpServletResponse response) {
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if (ANON_COOKIE.equals(cookie.getName()) && StringUtils.hasText(cookie.getValue())) {
                    return cookie.getValue();
                }
            }
        }
        String generated = UUID.randomUUID().toString();
        Cookie cookie = new Cookie(ANON_COOKIE, generated);
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setMaxAge(60 * 60 * 24 * 365); // 1 year
        response.addCookie(cookie);
        return generated;
    }
    
    /**
     * 로깅을 건너뛸 경로인지 확인
     * API 요청만 로깅하고, 정적 리소스나 HTML 페이지는 제외
     */
    private boolean shouldSkipLogging(String path) {
        if (path == null || path.isEmpty()) {
            return true;
        }
        
        // API 요청만 로깅 (나머지는 제외)
        if (!path.startsWith("/api/")) {
            return true;
        }
        
        // 정적 리소스 경로 제외
        if (path.startsWith("/_next/") ||
            path.startsWith("/static/") ||
            path.startsWith("/assets/") ||
            path.startsWith("/images/") ||
            path.startsWith("/favicon.ico") ||
            path.startsWith("/robots.txt") ||
            path.startsWith("/sitemap.xml") ||
            path.endsWith(".js") ||
            path.endsWith(".css") ||
            path.endsWith(".png") ||
            path.endsWith(".jpg") ||
            path.endsWith(".jpeg") ||
            path.endsWith(".gif") ||
            path.endsWith(".svg") ||
            path.endsWith(".ico") ||
            path.endsWith(".woff") ||
            path.endsWith(".woff2") ||
            path.endsWith(".ttf") ||
            path.endsWith(".eot") ||
            path.endsWith(".map")) {
            return true;
        }
        
        // API 경로 중 특정 경로는 제외 (예: 헬스체크, 메타데이터 등)
        if (path.startsWith("/actuator/") ||
            path.startsWith("/api/metadata/")) {
            return true;
        }
        
        return false;
    }
}
