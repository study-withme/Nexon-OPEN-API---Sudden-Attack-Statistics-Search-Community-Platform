package com.example.jokerweb.nexon;

import java.time.LocalDateTime;

/**
 * Nexon API Rate Limit (429) 에러를 나타내는 예외
 */
public class NexonApiRateLimitException extends RuntimeException {
    
    private final LocalDateTime retryAfter;
    private final int retryAfterSeconds;
    
    public NexonApiRateLimitException(String message) {
        super(message);
        this.retryAfter = LocalDateTime.now().plusSeconds(30); // 기본 30초 후 재시도
        this.retryAfterSeconds = 30;
    }
    
    public NexonApiRateLimitException(String message, Throwable cause) {
        super(message, cause);
        this.retryAfter = LocalDateTime.now().plusSeconds(30);
        this.retryAfterSeconds = 30;
    }
    
    public NexonApiRateLimitException(String message, int retryAfterSeconds) {
        super(message);
        this.retryAfterSeconds = retryAfterSeconds;
        this.retryAfter = LocalDateTime.now().plusSeconds(retryAfterSeconds);
    }
    
    public NexonApiRateLimitException(String message, Throwable cause, int retryAfterSeconds) {
        super(message, cause);
        this.retryAfterSeconds = retryAfterSeconds;
        this.retryAfter = LocalDateTime.now().plusSeconds(retryAfterSeconds);
    }
    
    public LocalDateTime getRetryAfter() {
        return retryAfter;
    }
    
    public int getRetryAfterSeconds() {
        return retryAfterSeconds;
    }
}
