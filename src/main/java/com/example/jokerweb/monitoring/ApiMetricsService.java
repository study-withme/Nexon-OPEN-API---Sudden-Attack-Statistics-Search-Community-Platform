package com.example.jokerweb.monitoring;

import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.LongAdder;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * API 호출 메트릭 수집 서비스
 * Nexon API 호출 성공률, 실패률, 평균 응답 시간 등을 추적
 */
@Service
@Slf4j
public class ApiMetricsService {
    
    // API 호출 통계
    private final LongAdder totalRequests = new LongAdder();
    private final LongAdder successRequests = new LongAdder();
    private final LongAdder failureRequests = new LongAdder();
    private final LongAdder rateLimitRequests = new LongAdder();
    
    // 응답 시간 통계
    private final AtomicLong totalResponseTime = new AtomicLong(0);
    private final AtomicLong minResponseTime = new AtomicLong(Long.MAX_VALUE);
    private final AtomicLong maxResponseTime = new AtomicLong(0);
    
    // 마지막 리셋 시간 (1시간마다 통계 리셋)
    private volatile long lastResetTime = System.currentTimeMillis();
    private static final long RESET_INTERVAL_MS = 60 * 60 * 1000; // 1시간
    
    /**
     * API 호출 시작 시 호출
     */
    public void recordRequestStart() {
        checkAndResetIfNeeded();
        totalRequests.increment();
    }
    
    /**
     * API 호출 성공 시 호출
     * @param responseTimeMs 응답 시간 (밀리초)
     */
    public void recordSuccess(long responseTimeMs) {
        checkAndResetIfNeeded();
        successRequests.increment();
        recordResponseTime(responseTimeMs);
    }
    
    /**
     * API 호출 실패 시 호출
     * @param responseTimeMs 응답 시간 (밀리초)
     */
    public void recordFailure(long responseTimeMs) {
        checkAndResetIfNeeded();
        failureRequests.increment();
        recordResponseTime(responseTimeMs);
    }
    
    /**
     * Rate Limit 발생 시 호출
     */
    public void recordRateLimit() {
        checkAndResetIfNeeded();
        rateLimitRequests.increment();
    }
    
    /**
     * 응답 시간 기록
     */
    private void recordResponseTime(long responseTimeMs) {
        totalResponseTime.addAndGet(responseTimeMs);
        
        // 최소/최대 응답 시간 업데이트
        minResponseTime.updateAndGet(current -> Math.min(current, responseTimeMs));
        maxResponseTime.updateAndGet(current -> Math.max(current, responseTimeMs));
    }
    
    /**
     * 통계 조회
     */
    public ApiMetrics getMetrics() {
        checkAndResetIfNeeded();
        
        long total = totalRequests.sum();
        long success = successRequests.sum();
        long failure = failureRequests.sum();
        long rateLimit = rateLimitRequests.sum();
        
        double successRate = total > 0 ? (double) success / total * 100 : 0.0;
        double failureRate = total > 0 ? (double) failure / total * 100 : 0.0;
        double rateLimitRate = total > 0 ? (double) rateLimit / total * 100 : 0.0;
        
        long avgResponseTime = total > 0 ? totalResponseTime.get() / total : 0;
        long min = minResponseTime.get() == Long.MAX_VALUE ? 0 : minResponseTime.get();
        long max = maxResponseTime.get();
        
        return new ApiMetrics(
            total, success, failure, rateLimit,
            successRate, failureRate, rateLimitRate,
            avgResponseTime, min, max
        );
    }
    
    /**
     * 1시간마다 통계 리셋
     */
    private void checkAndResetIfNeeded() {
        long now = System.currentTimeMillis();
        if (now - lastResetTime > RESET_INTERVAL_MS) {
            synchronized (this) {
                if (now - lastResetTime > RESET_INTERVAL_MS) {
                    log.info("API 메트릭 리셋 - 이전 통계: {}", getMetrics());
                    reset();
                    lastResetTime = now;
                }
            }
        }
    }
    
    /**
     * 통계 리셋
     */
    public void reset() {
        totalRequests.reset();
        successRequests.reset();
        failureRequests.reset();
        rateLimitRequests.reset();
        totalResponseTime.set(0);
        minResponseTime.set(Long.MAX_VALUE);
        maxResponseTime.set(0);
    }
    
    @Getter
    public static class ApiMetrics {
        private final long totalRequests;
        private final long successRequests;
        private final long failureRequests;
        private final long rateLimitRequests;
        private final double successRate;
        private final double failureRate;
        private final double rateLimitRate;
        private final long avgResponseTimeMs;
        private final long minResponseTimeMs;
        private final long maxResponseTimeMs;
        
        public ApiMetrics(long totalRequests, long successRequests, long failureRequests, 
                         long rateLimitRequests, double successRate, double failureRate, 
                         double rateLimitRate, long avgResponseTimeMs, long minResponseTimeMs, 
                         long maxResponseTimeMs) {
            this.totalRequests = totalRequests;
            this.successRequests = successRequests;
            this.failureRequests = failureRequests;
            this.rateLimitRequests = rateLimitRequests;
            this.successRate = successRate;
            this.failureRate = failureRate;
            this.rateLimitRate = rateLimitRate;
            this.avgResponseTimeMs = avgResponseTimeMs;
            this.minResponseTimeMs = minResponseTimeMs;
            this.maxResponseTimeMs = maxResponseTimeMs;
        }
        
        @Override
        public String toString() {
            return String.format(
                "ApiMetrics{total=%d, success=%d (%.2f%%), failure=%d (%.2f%%), rateLimit=%d (%.2f%%), " +
                "avgTime=%dms, min=%dms, max=%dms}",
                totalRequests, successRequests, successRate, failureRequests, failureRate,
                rateLimitRequests, rateLimitRate, avgResponseTimeMs, minResponseTimeMs, maxResponseTimeMs
            );
        }
    }
}
