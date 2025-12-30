package com.example.jokerweb.config;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.web.filter.ShallowEtagHeaderFilter;

/**
 * HTTP 캐싱 설정
 * ETag/Last-Modified 헤더를 활용한 브라우저 캐싱
 * 
 * ShallowEtagHeaderFilter는 응답 본문의 해시값을 기반으로 ETag를 자동 생성합니다.
 * 클라이언트가 If-None-Match 헤더로 같은 ETag를 보내면 304 Not Modified 응답을 반환하여
 * 네트워크 트래픽을 줄입니다.
 */
@Slf4j
@Configuration
public class HttpCacheConfig {

    /**
     * ETag 필터 등록
     * 모든 GET 요청에 대해 ETag를 자동 생성하고 If-None-Match 체크를 수행
     */
    @Bean
    public FilterRegistrationBean<ShallowEtagHeaderFilter> shallowEtagHeaderFilter() {
        ShallowEtagHeaderFilter filter = new ShallowEtagHeaderFilter();
        FilterRegistrationBean<ShallowEtagHeaderFilter> registration = new FilterRegistrationBean<>(filter);
        registration.addUrlPatterns("/api/*"); // API 엔드포인트만 적용
        registration.setOrder(Ordered.LOWEST_PRECEDENCE - 10); // 다른 필터들 이후에 실행
        log.info("ShallowEtagHeaderFilter enabled for HTTP caching (ETag support)");
        return registration;
    }

    /**
     * ETag 생성 유틸리티 메서드 (필요시 사용)
     */
    public static class EtagUtils {
        public static String generateEtag(String content) {
            try {
                MessageDigest digest = MessageDigest.getInstance("MD5");
                byte[] hash = digest.digest(content.getBytes(StandardCharsets.UTF_8));
                StringBuilder hexString = new StringBuilder();
                for (byte b : hash) {
                    String hex = Integer.toHexString(0xff & b);
                    if (hex.length() == 1) {
                        hexString.append('0');
                    }
                    hexString.append(hex);
                }
                return "\"" + hexString.toString() + "\"";
            } catch (NoSuchAlgorithmException e) {
                log.warn("MD5 algorithm not found, using simple hash", e);
                return "\"" + Integer.toHexString(content.hashCode()) + "\"";
            }
        }
    }
}
