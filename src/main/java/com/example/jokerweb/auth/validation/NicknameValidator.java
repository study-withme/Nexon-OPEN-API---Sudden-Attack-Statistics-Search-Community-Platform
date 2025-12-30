package com.example.jokerweb.auth.validation;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.regex.Pattern;

public class NicknameValidator {
    
    private static final int MIN_LENGTH = 2;
    private static final int MAX_LENGTH = 16;

    // 한글, 영문, 숫자만 허용
    private static final Pattern VALID_PATTERN = Pattern.compile("^[가-힣a-zA-Z0-9]+$");

    // 금지어 목록
    private static final Set<String> FORBIDDEN_WORDS = new HashSet<>(Arrays.asList(
        "운영자", "관리자", "admin", "administrator", "root", "system",
        "moderator", "mod", "staff", "op", "operator",
        "서버", "server", "bot",
        "넥슨", "nexon", "서든어택", "suddenattack", "sa",
        "sa database", "jokerweb",
        "fuck", "shit", "damn", "bitch", "asshole", "bastard",
        "개새끼", "병신", "씨발", "미친", "좆같",
        "hack", "cheat", "치트", "exploit"
    ));
    
    public static void validate(String nickname) {
        if (nickname == null || nickname.trim().isEmpty()) {
            throw new IllegalArgumentException("닉네임을 입력해주세요.");
        }
        
        String trimmed = nickname.trim();
        
        // 길이 체크
        if (trimmed.length() < MIN_LENGTH) {
            throw new IllegalArgumentException(String.format("닉네임은 최소 %d자 이상이어야 합니다.", MIN_LENGTH));
        }
        
        if (trimmed.length() > MAX_LENGTH) {
            throw new IllegalArgumentException(String.format("닉네임은 최대 %d자까지 허용됩니다.", MAX_LENGTH));
        }

        // 문자 구성 체크 (한글, 영문, 숫자)
        if (!VALID_PATTERN.matcher(trimmed).matches()) {
            throw new IllegalArgumentException("닉네임은 한글, 영문, 숫자만 사용할 수 있습니다.");
        }

        // 금지어 체크 (대소문자 무시)
        String lowerNickname = trimmed.toLowerCase();
        for (String forbidden : FORBIDDEN_WORDS) {
            if (lowerNickname.contains(forbidden.toLowerCase())) {
                throw new IllegalArgumentException("닉네임에 금지어가 포함되어 있습니다.");
            }
        }

        // 연속된 문자 반복 체크 (예: aaa, 1111)
        if (containsRepeatedChars(trimmed, 3)) {
            throw new IllegalArgumentException("닉네임에 동일한 문자를 너무 많이 반복할 수 없습니다.");
        }
    }
    
    private static boolean containsRepeatedChars(String str, int maxRepeat) {
        if (str.length() < maxRepeat) {
            return false;
        }
        
        char[] chars = str.toCharArray();
        int count = 1;
        for (int i = 1; i < chars.length; i++) {
            if (chars[i] == chars[i - 1]) {
                count++;
                if (count >= maxRepeat) {
                    return true;
                }
            } else {
                count = 1;
            }
        }
        return false;
    }
}

