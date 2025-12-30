package com.example.jokerweb.monitoring;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.stats.CacheStats;
import java.util.HashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCache;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * 캐시 히트율 모니터링 서비스
 * Caffeine 및 Redis 캐시의 통계 정보를 수집하여 제공
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CacheMetricsService {

    private final CacheManager cacheManager;

    /**
     * 모든 캐시의 통계 정보 조회
     */
    public Map<String, CacheMetrics> getAllCacheMetrics() {
        Map<String, CacheMetrics> metrics = new HashMap<>();
        
        if (cacheManager == null) {
            log.warn("CacheManager is null");
            return metrics;
        }

        // Redis Cache Manager인 경우
        if (cacheManager instanceof RedisCacheManager) {
            log.debug("Using Redis Cache Manager - detailed stats not available via Spring Cache abstraction");
            // Redis의 경우 Spring Cache 추상화로는 상세 통계를 가져오기 어려움
            // 필요시 RedisTemplate을 직접 사용하여 INFO 명령으로 통계 조회 가능
            metrics.put("cache_type", CacheMetrics.builder()
                    .cacheType("Redis")
                    .build());
            return metrics;
        }

        // Caffeine Cache Manager인 경우
        if (cacheManager instanceof org.springframework.cache.caffeine.CaffeineCacheManager) {
            for (String cacheName : cacheManager.getCacheNames()) {
                if (cacheName == null || cacheName.trim().isEmpty()) {
                    continue;
                }
                org.springframework.cache.Cache cache = cacheManager.getCache(cacheName);
                if (cache instanceof CaffeineCache) {
                    CaffeineCache caffeineCache = (CaffeineCache) cache;
                    Cache<Object, Object> nativeCache = caffeineCache.getNativeCache();
                    
                    if (nativeCache != null) {
                        CacheStats stats = nativeCache.stats();
                        double hitRate = stats.requestCount() > 0 
                                ? (double) stats.hitCount() / stats.requestCount() * 100 
                                : 0.0;
                        double missRate = stats.requestCount() > 0 
                                ? (double) stats.missCount() / stats.requestCount() * 100 
                                : 0.0;
                        
                        metrics.put(cacheName, CacheMetrics.builder()
                                .cacheType("Caffeine")
                                .hitCount(stats.hitCount())
                                .missCount(stats.missCount())
                                .requestCount(stats.requestCount())
                                .hitRate(hitRate)
                                .missRate(missRate)
                                .evictionCount(stats.evictionCount())
                                .loadCount(stats.loadCount())
                                .totalLoadTime(stats.totalLoadTime())
                                .averageLoadPenalty(stats.averageLoadPenalty())
                                .build());
                    }
                }
            }
        }

        return metrics;
    }

    /**
     * 특정 캐시의 통계 정보 조회
     */
    public CacheMetrics getCacheMetrics(String cacheName) {
        Map<String, CacheMetrics> allMetrics = getAllCacheMetrics();
        return allMetrics.getOrDefault(cacheName, CacheMetrics.builder()
                .cacheType("Unknown")
                .build());
    }

    @lombok.Builder
    @lombok.Getter
    public static class CacheMetrics {
        private String cacheType;
        private Long hitCount;
        private Long missCount;
        private Long requestCount;
        private Double hitRate; // 백분율
        private Double missRate; // 백분율
        private Long evictionCount;
        private Long loadCount;
        private Long totalLoadTime; // 나노초
        private Double averageLoadPenalty; // 나노초

        @Override
        public String toString() {
            return String.format(
                    "CacheMetrics{type=%s, hitRate=%.2f%%, missRate=%.2f%%, requests=%d, hits=%d, misses=%d}",
                    cacheType, hitRate != null ? hitRate : 0.0, missRate != null ? missRate : 0.0,
                    requestCount != null ? requestCount : 0, hitCount != null ? hitCount : 0, missCount != null ? missCount : 0
            );
        }
    }
}
