package com.example.jokerweb.nexon.util;

import com.example.jokerweb.nexon.NexonApiRateLimitException;
import java.util.function.Supplier;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;

/**
 * 지수 백오프를 사용한 재시도 유틸리티
 */
@Slf4j
public class RetryUtil {

    private static final int DEFAULT_MAX_RETRIES = 3;
    private static final long DEFAULT_INITIAL_DELAY_MS = 1000; // 1초
    private static final double BACKOFF_MULTIPLIER = 2.0;

    /**
     * 지수 백오프를 사용하여 재시도 실행
     * 
     * @param supplier 실행할 작업
     * @param maxRetries 최대 재시도 횟수
     * @param initialDelayMs 초기 지연 시간 (밀리초)
     * @return 작업 결과
     * @throws Exception 모든 재시도 실패 시 예외 발생
     */
    public static <T> T executeWithExponentialBackoff(
            Supplier<T> supplier,
            int maxRetries,
            long initialDelayMs
    ) throws Exception {
        Exception lastException = null;
        long delayMs = initialDelayMs;

        for (int attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return supplier.get();
            } catch (HttpClientErrorException e) {
                // 4xx 에러는 재시도하지 않음 (400, 401, 403, 404 등)
                // 단, 429(Too Many Requests)는 재시도
                if (e.getStatusCode().value() == 429) {
                    lastException = e;
                    if (attempt < maxRetries) {
                        log.warn("429 에러 발생, {}ms 후 재시도 (시도 {}/{})", delayMs, attempt + 1, maxRetries + 1);
                        try {
                            Thread.sleep(delayMs);
                        } catch (InterruptedException ie) {
                            Thread.currentThread().interrupt();
                            throw new RuntimeException("재시도 중단됨", ie);
                        }
                        delayMs = (long) (delayMs * BACKOFF_MULTIPLIER);
                        continue;
                    }
                }
                throw e; // 429가 아닌 4xx 에러는 즉시 전파
            } catch (HttpServerErrorException e) {
                // 5xx 에러는 재시도
                lastException = e;
                if (attempt < maxRetries) {
                    log.warn("5xx 서버 에러 발생, {}ms 후 재시도 (시도 {}/{})", delayMs, attempt + 1, maxRetries + 1);
                    try {
                        Thread.sleep(delayMs);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        throw new RuntimeException("재시도 중단됨", ie);
                    }
                    delayMs = (long) (delayMs * BACKOFF_MULTIPLIER);
                    continue;
                }
            } catch (ResourceAccessException e) {
                // 타임아웃/연결 에러는 재시도
                lastException = e;
                if (attempt < maxRetries) {
                    log.warn("연결 에러 발생, {}ms 후 재시도 (시도 {}/{})", delayMs, attempt + 1, maxRetries + 1);
                    try {
                        Thread.sleep(delayMs);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        throw new RuntimeException("재시도 중단됨", ie);
                    }
                    delayMs = (long) (delayMs * BACKOFF_MULTIPLIER);
                    continue;
                }
            } catch (NexonApiRateLimitException e) {
                // Nexon API Rate Limit 예외는 재시도 (Retry-After 헤더 값 사용)
                lastException = e;
                if (attempt < maxRetries) {
                    long retryDelay = Math.max(e.getRetryAfterSeconds() * 1000L, delayMs);
                    log.warn("Nexon API Rate Limit 발생, {}ms 후 재시도 (시도 {}/{})", retryDelay, attempt + 1, maxRetries + 1);
                    try {
                        Thread.sleep(retryDelay);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        throw new RuntimeException("재시도 중단됨", ie);
                    }
                    delayMs = (long) (delayMs * BACKOFF_MULTIPLIER);
                    continue;
                }
            } catch (Exception e) {
                // 예상치 못한 에러는 즉시 전파
                throw e;
            }
        }

        // 모든 재시도 실패
        if (lastException != null) {
            log.error("모든 재시도 실패 (총 {}회 시도)", maxRetries + 1);
            throw new RuntimeException("재시도 실패", lastException);
        }

        throw new RuntimeException("알 수 없는 오류");
    }

    /**
     * 기본 설정으로 재시도 실행
     */
    public static <T> T executeWithExponentialBackoff(Supplier<T> supplier) throws Exception {
        return executeWithExponentialBackoff(supplier, DEFAULT_MAX_RETRIES, DEFAULT_INITIAL_DELAY_MS);
    }
}
