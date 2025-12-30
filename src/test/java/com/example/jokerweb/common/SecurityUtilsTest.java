package com.example.jokerweb.common;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class SecurityUtilsTest {
    
    @Test
    void testEscapeHtml() {
        String input = "<script>alert('XSS')</script>";
        String result = SecurityUtils.escapeHtml(input);
        assertFalse(result.contains("<script>"));
        assertTrue(result.contains("&lt;"));
    }
    
    @Test
    void testEscapeHtmlWithNull() {
        assertNull(SecurityUtils.escapeHtml(null));
        assertEquals("", SecurityUtils.escapeHtml(""));
    }
    
    @Test
    void testSanitizeScriptTags() {
        String input = "<script>alert('XSS')</script>Hello";
        String result = SecurityUtils.sanitizeScriptTags(input);
        assertEquals("Hello", result);
    }
    
    @Test
    void testSanitizeScriptTagsWithJavaScript() {
        String input = "<a href=\"javascript:alert('XSS')\">Link</a>";
        String result = SecurityUtils.sanitizeScriptTags(input);
        assertFalse(result.contains("javascript:"));
    }
    
    @Test
    void testValidateLength() {
        String input = "a".repeat(100);
        assertDoesNotThrow(() -> SecurityUtils.validateLength(input, 100, "테스트"));
        assertThrows(IllegalArgumentException.class, 
                () -> SecurityUtils.validateLength(input, 99, "테스트"));
    }
    
    @Test
    void testIsSafeForSql() {
        assertTrue(SecurityUtils.isSafeForSql("normal text"));
        assertTrue(SecurityUtils.isSafeForSql(null));
        assertTrue(SecurityUtils.isSafeForSql(""));
        
        assertFalse(SecurityUtils.isSafeForSql("'; DROP TABLE users; --"));
        assertFalse(SecurityUtils.isSafeForSql("SELECT * FROM users"));
        assertFalse(SecurityUtils.isSafeForSql("UNION SELECT"));
    }
}
