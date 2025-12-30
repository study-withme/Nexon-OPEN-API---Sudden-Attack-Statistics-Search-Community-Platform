package com.example.jokerweb.auth.exception;

public class WeakPasswordException extends RuntimeException {
    public WeakPasswordException(String message) {
        super(message);
    }
}

