package com.example.jokerweb.monitoring;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.Map;

@RestController
@RequestMapping("/api/metrics")
@RequiredArgsConstructor
@Tag(name = "Metrics", description = "시스템 메트릭 조회 API")
public class MetricsController {
    
    private final ApiMetricsService apiMetricsService;
    private final CacheMetricsService cacheMetricsService;
    
    @Operation(summary = "API 메트릭 조회", description = "Nexon API 호출 통계를 조회합니다.")
    @GetMapping("/api")
    public ResponseEntity<ApiMetricsService.ApiMetrics> getApiMetrics() {
        return ResponseEntity.ok(apiMetricsService.getMetrics());
    }
    
    @Operation(summary = "캐시 메트릭 조회", description = "모든 캐시의 히트율 및 통계 정보를 조회합니다.")
    @GetMapping("/cache")
    public ResponseEntity<Map<String, CacheMetricsService.CacheMetrics>> getAllCacheMetrics() {
        return ResponseEntity.ok(cacheMetricsService.getAllCacheMetrics());
    }
    
    @Operation(summary = "특정 캐시 메트릭 조회", description = "특정 캐시의 히트율 및 통계 정보를 조회합니다.")
    @GetMapping("/cache/{cacheName}")
    public ResponseEntity<CacheMetricsService.CacheMetrics> getCacheMetrics(
            @PathVariable String cacheName) {
        return ResponseEntity.ok(cacheMetricsService.getCacheMetrics(cacheName));
    }
}
