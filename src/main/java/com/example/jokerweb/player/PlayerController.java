package com.example.jokerweb.player;

import com.example.jokerweb.match.MatchService;
import com.example.jokerweb.nexon.NexonApiRateLimitException;
import com.example.jokerweb.nexon.NxOpenApiClient;
import com.example.jokerweb.nexon.dto.IdResponse;
import com.example.jokerweb.nexon.dto.MatchDetailResponse;
import com.example.jokerweb.nexon.dto.MatchListResponse;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.HttpClientErrorException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/player")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Player", description = "플레이어 관련 API")
public class PlayerController {

    private final NxOpenApiClient nxClient;
    private final ProfileService profileService;
    private final MatchService matchService;
    private final InsightService insightService;
    private final SearchService searchService;

    @Operation(summary = "플레이어 검색", description = "닉네임으로 플레이어의 ouid를 조회합니다.")
    @GetMapping("/search")
    public ResponseEntity<?> search(
            @Parameter(description = "플레이어 닉네임", required = true, example = "플레이어명")
            @RequestParam("name") String name) {
        if (!StringUtils.hasText(name)) {
            return ResponseEntity.badRequest()
                .body(Map.of("message", "name 파라미터는 필수입니다."));
        }
        
        // 닉네임 최소 길이 검증 (2글자 이상)
        String trimmedName = name.trim();
        if (trimmedName.length() < 2) {
            return ResponseEntity.badRequest()
                .body(Map.of("message", "닉네임은 최소 2글자 이상 입력해주세요."));
        }
        
        try {
            // 1. DB 캐시에서 먼저 확인 (API 호출 최소화)
            SearchHistory cached = searchService.findCachedSearch(trimmedName);
            if (cached != null && StringUtils.hasText(cached.getOuid())) {
                log.debug("검색 결과 DB 캐시 히트: nickname={}, ouid={}", trimmedName, cached.getOuid());
                // 검색 횟수 증가 (비동기로 처리하여 응답 속도 유지)
                searchService.recordSearchAsync(trimmedName, cached.getOuid());
                IdResponse cachedResponse = new IdResponse();
                cachedResponse.setOuid(cached.getOuid());
                return ResponseEntity.ok(cachedResponse);
            }
            
            // 2. DB 캐시에 없을 때만 외부 API 호출
            log.debug("DB 캐시 미스, 외부 API 호출: nickname={}", trimmedName);
            IdResponse response = nxClient.getIdByUserName(trimmedName);
            if (response == null || response.getOuid() == null || response.getOuid().trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "해당 닉네임을 찾을 수 없습니다."));
            }
            
            // 3. 검색 기록 저장 (비동기로 처리하여 응답 속도 유지)
            searchService.recordSearchAsync(trimmedName, response.getOuid());
            
            return ResponseEntity.ok(response);
        } catch (NexonApiRateLimitException e) {
            log.warn("Nexon API Rate Limit 초과: name={}", trimmedName);
            // Rate limit 예외는 그대로 전파하여 GlobalExceptionHandler에서 429로 처리
            throw e;
        } catch (HttpClientErrorException e) {
            if (e.getStatusCode() == HttpStatus.BAD_REQUEST) {
                log.warn("플레이어 검색 실패: name={}, status={}", trimmedName, e.getStatusCode());
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "해당 닉네임을 찾을 수 없습니다."));
            }
            throw e; // GlobalExceptionHandler에서 처리
        } catch (Exception e) {
            log.error("플레이어 검색 중 오류 발생: name={}", trimmedName, e);
            throw e; // GlobalExceptionHandler에서 처리
        }
    }

    @Operation(summary = "플레이어 프로필 조회", description = "ouid를 기반으로 플레이어 프로필 정보를 조회합니다.")
    @GetMapping("/profile")
    public ResponseEntity<?> profile(
            @Parameter(description = "플레이어 ouid", required = true, example = "abc123")
            @RequestParam("ouid") String ouid,
            @Parameter(description = "강제 새로고침 여부", required = false)
            @RequestParam(value = "refresh", defaultValue = "true") boolean refresh) {
        if (!StringUtils.hasText(ouid)) {
            return ResponseEntity.badRequest()
                .body(Map.of("message", "ouid 파라미터는 필수입니다."));
        }
        
        try {
            PlayerProfileResponse response = refresh 
                ? profileService.refreshProfile(ouid) 
                : profileService.fetchAndSaveProfile(ouid);
            if (response == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "플레이어 프로필을 찾을 수 없습니다."));
            }
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("프로필 조회 중 오류 발생: ouid={}, refresh={}", ouid, refresh, e);
            throw e; // GlobalExceptionHandler에서 처리
        }
    }

    @Operation(summary = "플레이어 매치 목록 조회", description = "플레이어의 매치 목록을 조회합니다. (넥슨 API 직접 호출)")
    @GetMapping("/matches")
    public ResponseEntity<?> matches(
            @Parameter(description = "플레이어 ouid", required = true)
            @RequestParam("ouid") String ouid,
            @Parameter(description = "매치 모드 (폭파미션 등)", required = true)
            @RequestParam("mode") String mode,
            @Parameter(description = "매치 타입 (랭크전 솔로, 랭크전 파티 등, 선택적)")
            @RequestParam(value = "type", required = false) String type
    ) {
        if (!StringUtils.hasText(ouid)) {
            return ResponseEntity.badRequest()
                .body(Map.of("message", "ouid 파라미터는 필수입니다."));
        }
        if (!StringUtils.hasText(mode)) {
            return ResponseEntity.badRequest()
                .body(Map.of("message", "mode 파라미터는 필수입니다."));
        }
        
        try {
            // 단순 API 호출만 수행 (DB 저장 없음)
            MatchListResponse response = matchService.fetchMatchesSimple(ouid, mode, type);
            if (response == null) {
                return ResponseEntity.ok(new MatchListResponse());
            }
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("매치 조회 중 오류 발생: ouid={}, mode={}, type={}", ouid, mode, type, e);
            throw e; // GlobalExceptionHandler에서 처리
        }
    }

    @Operation(summary = "매치 상세 정보 조회", description = "매치 ID를 기반으로 매치 상세 정보를 조회합니다. (넥슨 API 직접 호출)")
    @GetMapping("/match/{id}")
    public ResponseEntity<?> matchDetail(
            @Parameter(description = "매치 ID", required = true)
            @PathVariable("id") String matchId) {
        if (!StringUtils.hasText(matchId)) {
            return ResponseEntity.badRequest()
                .body(Map.of("message", "matchId는 필수입니다."));
        }
        
        try {
            // 단순 API 호출만 수행 (DB 저장 없음)
            MatchDetailResponse response = matchService.fetchMatchDetailSimple(matchId);
            if (response == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "매치 상세 정보를 찾을 수 없습니다."));
            }
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("매치 상세 조회 중 오류 발생: matchId={}", matchId, e);
            throw e; // GlobalExceptionHandler에서 처리
        }
    }

    @Operation(summary = "맵별 통계 조회", description = "플레이어의 맵별 통계를 조회합니다.")
    @GetMapping("/insights/map")
    public ResponseEntity<?> mapStats(
            @Parameter(description = "플레이어 ouid", required = true)
            @RequestParam("ouid") String ouid,
            @Parameter(description = "강제 새로고침 여부", required = false)
            @RequestParam(value = "refresh", defaultValue = "true") boolean refresh) {
        if (!StringUtils.hasText(ouid)) {
            return ResponseEntity.badRequest()
                .body(Map.of("message", "ouid 파라미터는 필수입니다."));
        }
        
        try {
            List<InsightResponses.MapStat> stats = refresh 
                ? insightService.refreshMapStats(ouid) 
                : insightService.getMapStats(ouid);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("맵 통계 조회 중 오류 발생: ouid={}, refresh={}", ouid, refresh, e);
            throw e; // GlobalExceptionHandler에서 처리
        }
    }

    @Operation(summary = "시간대별 통계 조회", description = "플레이어의 시간대별 통계를 조회합니다.")
    @GetMapping("/insights/time")
    public ResponseEntity<?> timeStats(
            @Parameter(description = "플레이어 ouid", required = true)
            @RequestParam("ouid") String ouid,
            @Parameter(description = "강제 새로고침 여부", required = false)
            @RequestParam(value = "refresh", defaultValue = "true") boolean refresh) {
        if (!StringUtils.hasText(ouid)) {
            return ResponseEntity.badRequest()
                .body(Map.of("message", "ouid 파라미터는 필수입니다."));
        }
        
        try {
            List<InsightResponses.TimeBucketStat> stats = refresh 
                ? insightService.refreshTimeStats(ouid) 
                : insightService.getTimeStats(ouid);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("시간대 통계 조회 중 오류 발생: ouid={}, refresh={}", ouid, refresh, e);
            throw e; // GlobalExceptionHandler에서 처리
        }
    }

    @Operation(summary = "랭크전 통계 조회", description = "플레이어의 랭크전 솔로/파티별 통계와 숙련 등급을 조회합니다.")
    @GetMapping("/insights/ranked")
    public ResponseEntity<?> rankedStats(
            @Parameter(description = "플레이어 ouid", required = true)
            @RequestParam("ouid") String ouid,
            @Parameter(description = "강제 새로고침 여부", required = false)
            @RequestParam(value = "refresh", defaultValue = "true") boolean refresh) {
        if (!StringUtils.hasText(ouid)) {
            return ResponseEntity.badRequest()
                .body(Map.of("message", "ouid 파라미터는 필수입니다."));
        }
        
        try {
            List<InsightResponses.RankedStats> stats = refresh 
                ? insightService.refreshRankedStats(ouid) 
                : insightService.getRankedStats(ouid);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("랭크전 통계 조회 중 오류 발생: ouid={}, refresh={}", ouid, refresh, e);
            throw e; // GlobalExceptionHandler에서 처리
        }
    }
    
    @Operation(summary = "검색 자동완성", description = "검색어에 대한 자동완성 제안을 제공합니다.")
    @GetMapping("/search/suggestions")
    public ResponseEntity<?> searchSuggestions(
            @Parameter(description = "검색어", required = true)
            @RequestParam("q") String query,
            @Parameter(description = "최대 결과 수", required = false)
            @RequestParam(value = "limit", defaultValue = "10") int limit) {
        if (!StringUtils.hasText(query) || query.length() < 2) {
            return ResponseEntity.ok(List.of());
        }
        
        try {
            List<String> suggestions = searchService.getSuggestions(query, limit);
            return ResponseEntity.ok(suggestions);
        } catch (Exception e) {
            log.error("검색 제안 조회 중 오류 발생: query={}", query, e);
            return ResponseEntity.ok(List.of());
        }
    }
    
    @Operation(summary = "인기 검색어 조회", description = "최근 7일간 인기 검색어를 조회합니다.")
    @GetMapping("/search/popular")
    public ResponseEntity<?> popularSearches(
            @Parameter(description = "최대 결과 수", required = false)
            @RequestParam(value = "limit", defaultValue = "10") int limit) {
        try {
            List<String> popular = searchService.getPopularSearches(limit);
            return ResponseEntity.ok(popular);
        } catch (Exception e) {
            log.error("인기 검색어 조회 중 오류 발생", e);
            return ResponseEntity.ok(List.of());
        }
    }
    
    @Operation(summary = "플레이어 비교", description = "두 플레이어의 통계를 비교합니다.")
    @GetMapping("/compare")
    public ResponseEntity<?> compare(
            @Parameter(description = "첫 번째 플레이어 ouid", required = true)
            @RequestParam("ouid1") String ouid1,
            @Parameter(description = "두 번째 플레이어 ouid", required = true)
            @RequestParam("ouid2") String ouid2) {
        if (!StringUtils.hasText(ouid1) || !StringUtils.hasText(ouid2)) {
            return ResponseEntity.badRequest()
                .body(Map.of("message", "ouid1과 ouid2 파라미터는 필수입니다."));
        }
        
        try {
            ComparisonResponse response = profileService.comparePlayers(ouid1, ouid2);
            if (response == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "플레이어 정보를 찾을 수 없습니다."));
            }
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("플레이어 비교 중 오류 발생: ouid1={}, ouid2={}", ouid1, ouid2, e);
            throw e; // GlobalExceptionHandler에서 처리
        }
    }
}

