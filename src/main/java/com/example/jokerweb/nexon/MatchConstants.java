package com.example.jokerweb.nexon;

import java.util.Set;

/**
 * Nexon API의 매치 모드 및 타입 상수 정의
 */
public class MatchConstants {

    /**
     * 가능한 매치 모드 목록
     */
    public static final Set<String> VALID_MATCH_MODES = Set.of(
        "개인전",
        "데스매치",
        "폭파미션",
        "진짜를 모아라"
    );

    /**
     * 가능한 매치 타입 목록
     */
    public static final Set<String> VALID_MATCH_TYPES = Set.of(
        "일반전",
        "랭크전 솔로",
        "랭크전 파티",
        "클랜 랭크전",
        "클랜전",
        "퀵매치 클랜전"
    );

    /**
     * 매치 모드가 유효한지 확인
     */
    public static boolean isValidMatchMode(String matchMode) {
        return matchMode != null && VALID_MATCH_MODES.contains(matchMode);
    }

    /**
     * 매치 타입이 유효한지 확인
     */
    public static boolean isValidMatchType(String matchType) {
        return matchType == null || VALID_MATCH_TYPES.contains(matchType);
    }
}
