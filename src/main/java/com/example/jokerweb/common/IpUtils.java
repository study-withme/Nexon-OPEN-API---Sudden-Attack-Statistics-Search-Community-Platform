package com.example.jokerweb.common;

import org.springframework.util.StringUtils;

public class IpUtils {
    
    /**
     * IP 주소를 블러 처리하여 반환
     * 예: 222.156.123.45 -> 222.156.xxx.xxx
     * IPv4를 우선적으로 처리하고, IPv6는 간단히 처리
     * 
     * @param ip IP 주소
     * @return 블러 처리된 IP 주소
     */
    public static String blurIp(String ip) {
        if (!StringUtils.hasText(ip)) {
            return null;
        }
        
        // IPv4 주소 처리 (우선)
        // IPv4는 점(.)으로 구분되고 4개의 숫자로 구성
        if (ip.contains(".") && !ip.contains(":")) {
            String[] parts = ip.split("\\.");
            if (parts.length == 4) {
                try {
                    // 각 부분이 숫자인지 확인
                    Integer.parseInt(parts[0]);
                    Integer.parseInt(parts[1]);
                    Integer.parseInt(parts[2]);
                    Integer.parseInt(parts[3]);
                    // IPv4 형식이 맞으면 블러 처리
                    return parts[0] + "." + parts[1] + ".xxx.xxx";
                } catch (NumberFormatException e) {
                    // 숫자가 아니면 IPv4가 아님
                }
            }
        }
        
        // IPv6 주소 처리 (콜론 포함)
        if (ip.contains(":")) {
            // IPv6는 복잡하므로 전체를 xxx로 처리하거나 일부만 표시
            String[] parts = ip.split(":");
            if (parts.length > 0 && !parts[0].isEmpty()) {
                return parts[0] + ":xxx:xxx:xxx";
            }
        }
        
        // 알 수 없는 형식은 그대로 반환
        return ip;
    }
    
    /**
     * IP 주소 추출 (X-Forwarded-For, X-Real-IP 등 고려)
     * 실제 접속자 IPv4 주소를 우선적으로 반환
     * 대형 커뮤니티에서 사용하는 방식: X-Forwarded-For의 첫 번째 IP가 실제 클라이언트 IP
     * 
     * @param xForwardedFor X-Forwarded-For 헤더 값
     * @param xRealIp X-Real-IP 헤더 값
     * @param remoteAddr 원격 주소
     * @return 추출된 IPv4 IP 주소 (IPv4를 찾지 못하면 빈 문자열)
     */
    public static String extractClientIp(String xForwardedFor, String xRealIp, String remoteAddr) {
        // X-Forwarded-For에서 실제 클라이언트 IP 추출 (첫 번째 IP가 실제 클라이언트)
        // 형식: "client_ip, proxy1_ip, proxy2_ip"
        if (StringUtils.hasText(xForwardedFor) && !"unknown".equalsIgnoreCase(xForwardedFor)) {
            String[] ips = xForwardedFor.split(",");
            // 첫 번째 IP가 실제 클라이언트 IP
            if (ips.length > 0) {
                String firstIp = ips[0].trim();
                // IPv4 주소 검증 및 반환
                if (isValidIPv4(firstIp)) {
                    return firstIp;
                }
            }
        }
        
        // X-Real-IP 확인 (일부 프록시에서 사용)
        if (StringUtils.hasText(xRealIp) && !"unknown".equalsIgnoreCase(xRealIp)) {
            String trimmed = xRealIp.trim();
            if (isValidIPv4(trimmed)) {
                return trimmed;
            }
        }
        
        // remoteAddr 확인 (직접 연결인 경우)
        if (remoteAddr != null && !remoteAddr.isEmpty()) {
            String trimmed = remoteAddr.trim();
            // IPv4 형식이면 반환 (내부 IP도 포함 - 개발 환경 대응)
            if (isValidIPv4(trimmed)) {
                return trimmed;
            }
        }
        
        // IPv4를 찾지 못한 경우 빈 문자열 반환 (수집하지 않음)
        return "";
    }
    
    /**
     * IPv4 주소 유효성 검증
     * 
     * @param ip IP 주소 문자열
     * @return 유효한 IPv4 주소인지 여부
     */
    private static boolean isValidIPv4(String ip) {
        if (!StringUtils.hasText(ip)) {
            return false;
        }
        
        // IPv4는 점(.)으로 구분되고 4개의 숫자로 구성, 콜론(:)이 없어야 함
        if (!ip.contains(".") || ip.contains(":")) {
            return false;
        }
        
        String[] parts = ip.split("\\.");
        if (parts.length != 4) {
            return false;
        }
        
        try {
            for (String part : parts) {
                int num = Integer.parseInt(part.trim());
                // 각 옥텟은 0-255 범위여야 함
                if (num < 0 || num > 255) {
                    return false;
                }
            }
            return true;
        } catch (NumberFormatException e) {
            return false;
        }
    }
}
