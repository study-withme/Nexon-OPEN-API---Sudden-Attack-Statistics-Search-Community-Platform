package com.example.jokerweb.nexon.dto;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("MatchResult Enum 테스트")
class MatchResultTest {

    @Test
    @DisplayName("API 값 '1'을 WIN으로 변환")
    void testFromApiValue_Win() {
        MatchResult result = MatchResult.fromApiValue("1");
        assertEquals(MatchResult.WIN, result);
        assertEquals("1", result.getApiValue());
        assertEquals("승리", result.getDescription());
    }

    @Test
    @DisplayName("API 값 '2'를 LOSE로 변환")
    void testFromApiValue_Lose() {
        MatchResult result = MatchResult.fromApiValue("2");
        assertEquals(MatchResult.LOSE, result);
        assertEquals("2", result.getApiValue());
        assertEquals("패배", result.getDescription());
    }

    @Test
    @DisplayName("null 값을 UNKNOWN으로 변환")
    void testFromApiValue_Null() {
        MatchResult result = MatchResult.fromApiValue(null);
        assertEquals(MatchResult.UNKNOWN, result);
    }

    @Test
    @DisplayName("빈 문자열을 UNKNOWN으로 변환")
    void testFromApiValue_Empty() {
        MatchResult result = MatchResult.fromApiValue("");
        assertEquals(MatchResult.UNKNOWN, result);
    }

    @Test
    @DisplayName("공백 문자열을 UNKNOWN으로 변환")
    void testFromApiValue_Whitespace() {
        MatchResult result = MatchResult.fromApiValue("   ");
        assertEquals(MatchResult.UNKNOWN, result);
    }

    @Test
    @DisplayName("알 수 없는 값을 UNKNOWN으로 변환")
    void testFromApiValue_Unknown() {
        MatchResult result = MatchResult.fromApiValue("3");
        assertEquals(MatchResult.UNKNOWN, result);
    }

    @Test
    @DisplayName("알파벳 값을 UNKNOWN으로 변환")
    void testFromApiValue_Alphabet() {
        MatchResult result = MatchResult.fromApiValue("WIN");
        assertEquals(MatchResult.UNKNOWN, result);
    }
}
