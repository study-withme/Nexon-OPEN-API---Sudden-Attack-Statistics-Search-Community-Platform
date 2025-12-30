package com.example.jokerweb.auth.validation;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class NicknameValidatorTest {
    
    @Test
    void testValidNickname() {
        assertDoesNotThrow(() -> NicknameValidator.validate("테스트"));
        assertDoesNotThrow(() -> NicknameValidator.validate("Test123"));
        assertDoesNotThrow(() -> NicknameValidator.validate("한글123"));
    }
    
    @Test
    void testNullNickname() {
        assertThrows(IllegalArgumentException.class, 
                () -> NicknameValidator.validate(null));
    }
    
    @Test
    void testEmptyNickname() {
        assertThrows(IllegalArgumentException.class, 
                () -> NicknameValidator.validate(""));
        assertThrows(IllegalArgumentException.class, 
                () -> NicknameValidator.validate("   "));
    }
    
    @Test
    void testTooShortNickname() {
        assertThrows(IllegalArgumentException.class, 
                () -> NicknameValidator.validate("a"));
    }
    
    @Test
    void testTooLongNickname() {
        assertThrows(IllegalArgumentException.class, 
                () -> NicknameValidator.validate("a".repeat(17)));
    }
    
    @Test
    void testInvalidCharacters() {
        assertThrows(IllegalArgumentException.class, 
                () -> NicknameValidator.validate("test@123"));
        assertThrows(IllegalArgumentException.class, 
                () -> NicknameValidator.validate("test 123"));
    }
    
    @Test
    void testForbiddenWords() {
        assertThrows(IllegalArgumentException.class, 
                () -> NicknameValidator.validate("admin"));
        assertThrows(IllegalArgumentException.class, 
                () -> NicknameValidator.validate("관리자"));
    }
    
    @Test
    void testRepeatedChars() {
        assertThrows(IllegalArgumentException.class, 
                () -> NicknameValidator.validate("aaa"));
        assertThrows(IllegalArgumentException.class, 
                () -> NicknameValidator.validate("1111"));
    }
}
