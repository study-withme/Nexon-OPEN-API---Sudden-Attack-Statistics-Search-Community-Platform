package com.example.jokerweb.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * IP 기반 Rate Limiting 필터
 * - 익명 사용자: 분당 100회 요청
 * - 인증 사용자: 분당 500회 요청
 */
@Slf4j
@Component
@Order(1) // TraceIdFilter보다 먼저 실행
public class RateLimitingFilter extends OncePerRequestFilter {

    private final Map<String, Bucket> cache = new ConcurrentHashMap<>();
    
    // 익명 사용자: 분당 100회
    private static final int ANONYMOUS_REQUESTS_PER_MINUTE = 100;
    
    // 인증 사용자: 분당 500회
    private static final int AUTHENTICATED_REQUESTS_PER_MINUTE = 500;
    
    // 회원가입 엔드포인트: IP당 1시간에 5회
    private static final int REGISTER_REQUESTS_PER_HOUR = 5;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        String path = request.getRequestURI();
        
        // 정적 리소스나 헬스체크는 제외
        if (shouldSkipRateLimit(path)) {
            filterChain.doFilter(request, response);
            return;
        }
        
        String clientKey = getClientKey(request);
        boolean isAuthenticated = isAuthenticated(request);
        
        Bucket bucket = resolveBucket(clientKey, isAuthenticated);
        
        if (bucket.tryConsume(1)) {
            filterChain.doFilter(request, response);
        } else {
            log.warn("Rate limit exceeded for {} (authenticated: {})", clientKey, isAuthenticated);
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json");
            response.getWriter().write(
                String.format("{\"message\":\"요청이 너무 많습니다. 잠시 후 다시 시도해주세요.\",\"code\":\"RATE_LIMIT_EXCEEDED\"}")
            );
        }
    }
    
    private boolean shouldSkipRateLimit(String path) {
        return path.startsWith("/actuator/health") 
            || path.startsWith("/actuator/info")
            || path.startsWith("/favicon.ico")
            || path.startsWith("/static")
            || path.startsWith("/_next");
    }
    
    private String getClientKey(HttpServletRequest request) {
        // X-Forwarded-For 헤더에서 IP 추출
        String xff = request.getHeader("X-Forwarded-For");
        if (StringUtils.hasText(xff)) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
    
    private boolean isAuthenticated(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        return StringUtils.hasText(authHeader) && authHeader.startsWith("Bearer ");
    }
    
    private Bucket resolveBucket(String clientKey, boolean isAuthenticated) {
        String bucketKey = clientKey + ":" + (isAuthenticated ? "auth" : "anon");
        
        return cache.computeIfAbsent(bucketKey, key -> {
            int requestsPerMinute = isAuthenticated 
                ? AUTHENTICATED_REQUESTS_PER_MINUTE 
                : ANONYMOUS_REQUESTS_PER_MINUTE;
            
            Refill refill = Refill.intervally(requestsPerMinute, Duration.ofMinutes(1));
            Bandwidth limit = Bandwidth.classic(requestsPerMinute, refill);
            return Bucket.builder()
                .addLimit(limit)
                .build();
        });
    }
    
    private Bucket resolveRegisterBucket(String clientKey) {
        String bucketKey = clientKey + ":register";
        
        return cache.computeIfAbsent(bucketKey, key -> {
            Refill refill = Refill.intervally(REGISTER_REQUESTS_PER_HOUR, Duration.ofHours(1));
            Bandwidth limit = Bandwidth.classic(REGISTER_REQUESTS_PER_HOUR, refill);
            return Bucket.builder()
                .addLimit(limit)
                .build();
        });
    }
}