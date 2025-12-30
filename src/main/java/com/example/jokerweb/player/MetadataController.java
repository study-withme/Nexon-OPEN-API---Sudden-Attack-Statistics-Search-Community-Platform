package com.example.jokerweb.player;

import com.example.jokerweb.nexon.NxOpenApiClient;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.concurrent.TimeUnit;

/**
 * 메타데이터 컨트롤러
 * HTTP 캐싱 헤더를 설정하여 브라우저 캐시 활용
 * - Cache-Control: 1시간 캐시 (자주 변경되지 않음)
 * - ETag: ShallowEtagHeaderFilter가 자동 생성
 */
@RestController
@RequestMapping("/api/metadata")
@RequiredArgsConstructor
public class MetadataController {

    private final NxOpenApiClient nxClient;

    // 메타데이터는 자주 변경되지 않으므로 1시간 캐시
    private static final CacheControl METADATA_CACHE_CONTROL = CacheControl.maxAge(1, TimeUnit.HOURS)
            .cachePublic()
            .mustRevalidate();

    @GetMapping("/logo")
    public ResponseEntity<String> getLogoMetadata() {
        String metadata = nxClient.getLogoMetadata();
        return ResponseEntity.ok()
                .cacheControl(METADATA_CACHE_CONTROL)
                .body(metadata != null ? metadata : "{}");
    }

    @GetMapping("/grade")
    public ResponseEntity<String> getGradeMetadata() {
        String metadata = nxClient.getGradeMetadata();
        return ResponseEntity.ok()
                .cacheControl(METADATA_CACHE_CONTROL)
                .body(metadata != null ? metadata : "{}");
    }

    @GetMapping("/season-grade")
    public ResponseEntity<String> getSeasonGradeMetadata() {
        String metadata = nxClient.getSeasonGradeMetadata();
        return ResponseEntity.ok()
                .cacheControl(METADATA_CACHE_CONTROL)
                .body(metadata != null ? metadata : "{}");
    }

    @GetMapping("/tier")
    public ResponseEntity<String> getTierMetadata() {
        String metadata = nxClient.getTierMetadata();
        return ResponseEntity.ok()
                .cacheControl(METADATA_CACHE_CONTROL)
                .body(metadata != null ? metadata : "{}");
    }
}
