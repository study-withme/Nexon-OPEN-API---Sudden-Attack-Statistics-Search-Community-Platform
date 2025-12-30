package com.example.jokerweb.auth.validation;

import java.util.regex.Pattern;

public class PasswordValidator {
    
    private static final int MIN_LENGTH = 8;
    private static final int MAX_LENGTH = 64;

    // ???? ?? ??
    public static PasswordStrength checkStrength(String password) {
        if (password == null || password.isEmpty()) {
            return PasswordStrength.WEAK;
        }
        
        int score = 0;
        boolean hasLower = false;
        boolean hasUpper = false;
        boolean hasDigit = false;
        boolean hasSpecial = false;
        
        Pattern lowerPattern = Pattern.compile("[a-z]");
        Pattern upperPattern = Pattern.compile("[A-Z]");
        Pattern digitPattern = Pattern.compile("[0-9]");
        Pattern specialPattern = Pattern.compile("[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?]");
        
        if (lowerPattern.matcher(password).find()) {
            hasLower = true;
            score += 1;
        }
        
        if (upperPattern.matcher(password).find()) {
            hasUpper = true;
            score += 1;
        }
        
        if (digitPattern.matcher(password).find()) {
            hasDigit = true;
            score += 1;
        }
        
        if (specialPattern.matcher(password).find()) {
            hasSpecial = true;
            score += 1;
        }
        
        // ??? ?? ?? ??
        if (password.length() >= 12) {
            score += 1;
        } else if (password.length() >= 8) {
            score += 0;
        } else {
            return PasswordStrength.WEAK;
        }
        
        // ???? ???? ?? ??
        if (isCommonPassword(password)) {
            return PasswordStrength.WEAK;
        }
        
        if (score <= 2) {
            return PasswordStrength.WEAK;
        } else if (score == 3) {
            return PasswordStrength.MEDIUM;
        } else {
            return PasswordStrength.STRONG;
        }
    }
    
    public static void validate(String password) {
        if (password == null || password.trim().isEmpty()) {
            throw new IllegalArgumentException("????? ??????.");
        }
        
        if (password.length() < MIN_LENGTH) {
            throw new IllegalArgumentException(String.format("????? ?? %d? ????? ???.", MIN_LENGTH));
        }
        
        if (password.length() > MAX_LENGTH) {
            throw new IllegalArgumentException(String.format("????? ?? %d??? ?????.", MAX_LENGTH));
        }
        
        PasswordStrength strength = checkStrength(password);
        if (strength == PasswordStrength.WEAK) {
            throw new IllegalArgumentException("????? ?? ????. ?? ????, ??, ????? ???? ??????.");
        }
    }
    
    private static boolean isCommonPassword(String password) {
        String lower = password.toLowerCase();
        String[] commonPasswords = {
            "password", "12345678", "123456789", "qwerty", "abc123",
            "password123", "admin123", "letmein", "welcome", "monkey",
            "1234567890", "password1", "sunshine", "princess", "football",
            "iloveyou", "123123", "dragon", "baseball", "qwerty123"
        };
        
        for (String common : commonPasswords) {
            if (lower.equals(common) || lower.contains(common)) {
                return true;
            }
        }
        
        return false;
    }
    
    public enum PasswordStrength {
        WEAK, MEDIUM, STRONG
    }
}

