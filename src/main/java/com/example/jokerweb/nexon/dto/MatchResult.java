package com.example.jokerweb.nexon.dto;

/**
 * 매치 결과를 나타내는 enum
 * Nexon API에서 "1" 또는 "2"로 반환되는 값을 enum으로 변환
 */
public enum MatchResult {
    WIN("1", "승리"),
    LOSE("2", "패배"),
    UNKNOWN(null, "알 수 없음");

    private final String apiValue;
    private final String description;

    MatchResult(String apiValue, String description) {
        this.apiValue = apiValue;
        this.description = description;
    }

    public String getApiValue() {
        return apiValue;
    }

    public String getDescription() {
        return description;
    }

    /**
     * Nexon API에서 받은 문자열 값을 MatchResult enum으로 변환
     * @param apiValue Nexon API에서 받은 값 ("1" 또는 "2")
     * @return MatchResult enum
     */
    public static MatchResult fromApiValue(String apiValue) {
        if (apiValue == null || apiValue.trim().isEmpty()) {
            return UNKNOWN;
        }
        return switch (apiValue.trim()) {
            case "1" -> WIN;
            case "2" -> LOSE;
            default -> UNKNOWN;
        };
    }
}
