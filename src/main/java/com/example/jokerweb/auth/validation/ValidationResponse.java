package com.example.jokerweb.auth.validation;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ValidationResponse {
    private boolean valid;
    private String message;
    private PasswordValidator.PasswordStrength passwordStrength;
}

