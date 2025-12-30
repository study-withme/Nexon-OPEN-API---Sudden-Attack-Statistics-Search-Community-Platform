package com.example.jokerweb.nexon;

import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Nexon API 레이트 리밋 관리
 * Nexon Open API는 일반적으로 초당 10회 제한이 있으므로 안전하게 초당 8회로 제한
 * 
 * 슬라이딩 윈도우 방식으로 구현 (매 초마다 카운터 리셋)
 */
@Component
@Slf4j
public class NexonApiRateLimiter {
    
    // 초당 최대 8회 요청 허용
    private static final int MAX_PERMITS_PER_SECOND = 8;
    
    // 현재 초의 카운터와 타임스탬프
    private final AtomicInteger currentSecondCount = new AtomicInteger(0);
    private final AtomicLong currentSecond = new AtomicLong(System.currentTimeMillis() / 1000);
    
    /**
     * API 호출 전에 permit 획득
     * @throws InterruptedException 대기 중 인터럽트 발생 시
     */
    public void acquire() throws InterruptedException {
        long now = System.currentTimeMillis() / 1000;
        long current = currentSecond.get();
        
        // 새로운 초가 시작되면 카운터 리셋
        if (now > current) {
            synchronized (this) {
                // Double-check locking
                if (now > currentSecond.get()) {
                    currentSecond.set(now);
                    currentSecondCount.set(0);
                }
            }
        }
        
        // 현재 초의 카운터 증가
        int count = currentSecondCount.incrementAndGet();
        
        if (count > MAX_PERMITS_PER_SECOND) {
            // 초과된 경우 다음 초까지 대기
            long waitTime = 1000 - (System.currentTimeMillis() % 1000);
            if (waitTime > 0) {
                Thread.sleep(waitTime);
                // 다음 초로 이동
                currentSecond.set(System.currentTimeMillis() / 1000);
                currentSecondCount.set(1);
            }
        }
    }
    
    /**
     * API 호출 후 permit 반환 (현재 구현에서는 불필요하지만 호환성을 위해 유지)
     */
    public void release() {
        // 슬라이딩 윈도우 방식에서는 자동으로 리셋되므로 별도 작업 불필요
    }
}
