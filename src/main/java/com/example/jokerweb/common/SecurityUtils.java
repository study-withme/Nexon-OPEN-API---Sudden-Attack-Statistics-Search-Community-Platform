package com.example.jokerweb.common;

import org.springframework.util.StringUtils;

/**
 * 보안 관련 유틸리티 클래스
 * XSS 방지 및 입력 검증
 */
public class SecurityUtils {
    
    /**
     * HTML 태그를 이스케이프하여 XSS 공격 방지
     * 
     * @param input 입력 문자열
     * @return 이스케이프된 문자열
     */
    public static String escapeHtml(String input) {
        if (!StringUtils.hasText(input)) {
            return input;
        }
        
        return input
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#x27;")
                .replace("/", "&#x2F;");
    }
    
    /**
     * 위험한 스크립트 태그 제거
     * 
     * @param input 입력 문자열
     * @return 정제된 문자열
     */
    public static String sanitizeScriptTags(String input) {
        if (!StringUtils.hasText(input)) {
            return input;
        }
        
        // 위험한 스크립트 태그 패턴 제거
        return input
                .replaceAll("(?i)<script[^>]*>.*?</script>", "")
                .replaceAll("(?i)javascript:", "")
                .replaceAll("(?i)onerror\\s*=", "")
                .replaceAll("(?i)onclick\\s*=", "")
                .replaceAll("(?i)onload\\s*=", "")
                .replaceAll("(?i)onmouseover\\s*=", "");
    }
    
    /**
     * 입력 길이 검증
     * 
     * @param input 입력 문자열
     * @param maxLength 최대 길이
     * @param fieldName 필드 이름 (에러 메시지용)
     * @throws IllegalArgumentException 길이 초과 시
     */
    public static void validateLength(String input, int maxLength, String fieldName) {
        if (input != null && input.length() > maxLength) {
            throw new IllegalArgumentException(
                    String.format("%s는 최대 %d자까지 입력 가능합니다.", fieldName, maxLength)
            );
        }
    }
    
    /**
     * SQL Injection 방지를 위한 특수 문자 검증
     * 
     * @param input 입력 문자열
     * @return 안전한 문자열인지 여부
     */
    public static boolean isSafeForSql(String input) {
        if (!StringUtils.hasText(input)) {
            return true;
        }
        
        // 위험한 SQL 키워드 패턴 체크
        String lowerInput = input.toLowerCase();
        String[] dangerousPatterns = {
                "';", "--", "/*", "*/", "xp_", "sp_", 
                "union", "select", "insert", "update", "delete", 
                "drop", "create", "alter", "exec", "execute"
        };
        
        for (String pattern : dangerousPatterns) {
            if (lowerInput.contains(pattern)) {
                return false;
            }
        }
        
        return true;
    }
}
