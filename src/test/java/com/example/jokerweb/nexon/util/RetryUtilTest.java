package com.example.jokerweb.nexon.util;

import static org.junit.jupiter.api.Assertions.*;

import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.http.HttpStatus;

@DisplayName("RetryUtil 재시도 로직 테스트")
class RetryUtilTest {

    @Test
    @DisplayName("성공 시 재시도하지 않음")
    void testSuccess_NoRetry() throws Exception {
        AtomicInteger callCount = new AtomicInteger(0);
        
        String result = RetryUtil.executeWithExponentialBackoff(() -> {
            callCount.incrementAndGet();
            return "success";
        });
        
        assertEquals(1, callCount.get());
        assertEquals("success", result);
    }

    @Test
    @DisplayName("429 에러 시 재시도 후 성공")
    void test429Error_RetryAndSuccess() throws Exception {
        AtomicInteger callCount = new AtomicInteger(0);
        
        String result = RetryUtil.executeWithExponentialBackoff(() -> {
            int count = callCount.incrementAndGet();
            if (count < 3) {
                throw new HttpClientErrorException(HttpStatus.TOO_MANY_REQUESTS);
            }
            return "success";
        }, 3, 10); // 짧은 지연 시간으로 테스트
        
        assertEquals(3, callCount.get());
        assertEquals("success", result);
    }

    @Test
    @DisplayName("5xx 에러 시 재시도 후 성공")
    void test5xxError_RetryAndSuccess() throws Exception {
        AtomicInteger callCount = new AtomicInteger(0);
        
        String result = RetryUtil.executeWithExponentialBackoff(() -> {
            int count = callCount.incrementAndGet();
            if (count < 2) {
                throw new HttpServerErrorException(HttpStatus.INTERNAL_SERVER_ERROR);
            }
            return "success";
        }, 3, 10);
        
        assertEquals(2, callCount.get());
        assertEquals("success", result);
    }

    @Test
    @DisplayName("ResourceAccessException 시 재시도 후 성공")
    void testResourceAccessException_RetryAndSuccess() throws Exception {
        AtomicInteger callCount = new AtomicInteger(0);
        
        String result = RetryUtil.executeWithExponentialBackoff(() -> {
            int count = callCount.incrementAndGet();
            if (count < 2) {
                throw new ResourceAccessException("Connection timeout");
            }
            return "success";
        }, 3, 10);
        
        assertEquals(2, callCount.get());
        assertEquals("success", result);
    }

    @Test
    @DisplayName("모든 재시도 실패 시 예외 발생")
    void testAllRetriesFailed_ThrowsException() {
        AtomicInteger callCount = new AtomicInteger(0);
        
        assertThrows(RuntimeException.class, () -> {
            RetryUtil.executeWithExponentialBackoff(() -> {
                callCount.incrementAndGet();
                throw new HttpServerErrorException(HttpStatus.INTERNAL_SERVER_ERROR);
            }, 2, 10);
        });
        
        assertEquals(3, callCount.get()); // 초기 시도 + 2회 재시도
    }

    @Test
    @DisplayName("400 에러는 재시도하지 않음")
    void test400Error_NoRetry() {
        AtomicInteger callCount = new AtomicInteger(0);
        
        assertThrows(HttpClientErrorException.class, () -> {
            RetryUtil.executeWithExponentialBackoff(() -> {
                callCount.incrementAndGet();
                throw new HttpClientErrorException(HttpStatus.BAD_REQUEST);
            });
        });
        
        assertEquals(1, callCount.get()); // 재시도 없음
    }

    @Test
    @DisplayName("404 에러는 재시도하지 않음")
    void test404Error_NoRetry() {
        AtomicInteger callCount = new AtomicInteger(0);
        
        assertThrows(HttpClientErrorException.class, () -> {
            RetryUtil.executeWithExponentialBackoff(() -> {
                callCount.incrementAndGet();
                throw new HttpClientErrorException(HttpStatus.NOT_FOUND);
            });
        });
        
        assertEquals(1, callCount.get()); // 재시도 없음
    }
}
