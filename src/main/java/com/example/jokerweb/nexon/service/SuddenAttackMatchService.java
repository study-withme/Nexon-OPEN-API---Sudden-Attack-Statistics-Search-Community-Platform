package com.example.jokerweb.nexon.service;

import com.example.jokerweb.match.MatchSummary;
import com.example.jokerweb.match.MatchSummaryRepository;
import com.example.jokerweb.nexon.MatchConstants;
import com.example.jokerweb.nexon.NxOpenApiClient;
import com.example.jokerweb.nexon.dto.MatchDetailResponse;
import com.example.jokerweb.nexon.dto.MatchDetailSummaryResponse;
import com.example.jokerweb.nexon.dto.MatchListResponse;
import com.example.jokerweb.nexon.dto.MatchResult;
import com.example.jokerweb.nexon.dto.MatchSummaryResponse;
import com.example.jokerweb.nexon.dto.PlayerMatchHistoryResponse;
import com.example.jokerweb.nexon.dto.RankedStatsSummary;
import com.example.jokerweb.nexon.dto.UserTierResponse;
import com.example.jokerweb.nexon.MetadataService;
import com.example.jokerweb.nexon.util.RetryUtil;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * 서든어택 매치 정보 조회 서비스
 * Nexon API를 안전하게 감싸서 제공
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SuddenAttackMatchService {

    private final NxOpenApiClient nxOpenApiClient;
    private final MatchSummaryRepository matchSummaryRepository;
    private final MetadataService metadataService;
    
    // Final 시즌 시작일: 2024년 12월 12일 00:00:00 KST
    private static final Instant FINAL_SEASON_START = ZonedDateTime.of(2024, 12, 12, 0, 0, 0, 0, 
            java.time.ZoneId.of("Asia/Seoul")).toInstant();

    /**
     * 매치 정보 조회
     * 
     * 주의: 이 API는 /api/player/matches와는 다른 목적을 가집니다.
     * - /api/player/matches: 기존 API, 프론트엔드에서 사용 중, MatchService 사용
     * - /api/sa/matches: 새 API, 표준화된 응답, 재시도/캐시/에러 핸들링 강화
     * 
     * @param ouid 계정 식별자 (8-64자, 영문자/숫자만)
     * @param matchMode 게임 모드 (예: 폭파미션, 개인전, 데스매치 등)
     * @param matchType 매치 유형 (예: 랭크전 솔로, 랭크전 파티, 클랜전 등, 선택적)
     * @param cursor 페이지네이션 커서 (선택적, 미구현)
     * @param limit 최대 반환 개수 (1-1000, 기본값: 100)
     * @param useKst KST 시간대 사용 여부 (기본값: false, UTC 사용)
     * @return 매치 정보 응답
     * @throws IllegalArgumentException 파라미터 검증 실패 시
     * @throws RuntimeException API 호출 실패 시
     */
    @Cacheable(
        cacheNames = "saMatches",
        key = "#ouid + '_' + #matchMode + '_' + (#matchType != null ? #matchType : 'null') + '_' + (#cursor != null ? #cursor : 'null') + '_' + (#limit != null ? #limit : '100')",
        unless = "#result == null"
    )
    public MatchSummaryResponse getMatches(
            String ouid,
            String matchMode,
            String matchType,
            String cursor,
            Integer limit,
            Boolean useKst
    ) {
        // 파라미터 검증 (엄격한 검증)
        validateParameters(ouid, matchMode, matchType);
        
        // Limit 검증
        if (limit != null && (limit < 1 || limit > 1000)) {
            throw new IllegalArgumentException(
                    String.format("limit은 1 이상 1000 이하여야 합니다. 입력값: %d", limit));
        }
        int effectiveLimit = limit != null && limit > 0 ? limit : 100;

        log.debug("매치 정보 조회 시작: ouid={}, matchMode={}, matchType={}, cursor={}, limit={}, useKst={}",
                maskOuid(ouid), matchMode, matchType, cursor, effectiveLimit, useKst);

        try {
            // 재시도 로직을 포함한 API 호출 (지수 백오프)
            MatchListResponse nexonResponse = RetryUtil.executeWithExponentialBackoff(() -> {
                return nxOpenApiClient.getMatches(ouid, matchMode, matchType);
            });

            if (nexonResponse == null || nexonResponse.getMatch() == null || nexonResponse.getMatch().isEmpty()) {
                log.debug("매치 정보 없음: ouid={}, matchMode={}, matchType={}", maskOuid(ouid), matchMode, matchType);
                return MatchSummaryResponse.builder()
                        .matches(new ArrayList<>())
                        .hasMore(false)
                        .build();
            }

            // MatchItem을 MatchSummary로 변환
            boolean useKstTime = useKst != null && useKst;
            List<MatchSummaryResponse.MatchSummary> summaries = nexonResponse.getMatch().stream()
                    .map(item -> MatchSummaryResponse.MatchSummary.fromMatchItem(item, useKstTime))
                    .collect(Collectors.toList());

            // limit 적용
            boolean hasMore = summaries.size() > effectiveLimit;
            if (hasMore) {
                summaries = summaries.subList(0, effectiveLimit);
            }

            // DB에 저장 (비동기로 처리 가능하지만 여기서는 동기로)
            try {
                saveMatchesToDatabase(nexonResponse.getMatch());
            } catch (Exception e) {
                // DB 저장 실패는 로그만 남기고 계속 진행 (API 응답에는 영향 없음)
                log.warn("매치 정보 DB 저장 실패 (응답은 정상 반환): ouid={}, error={}",
                        maskOuid(ouid), e.getMessage());
            }

            log.info("매치 정보 조회 성공: ouid={}, matchMode={}, matchType={}, count={}, hasMore={}",
                    maskOuid(ouid), matchMode, matchType, summaries.size(), hasMore);

            return MatchSummaryResponse.builder()
                    .matches(summaries)
                    .hasMore(hasMore)
                    .build();

        } catch (IllegalArgumentException e) {
            // 검증 오류는 그대로 전파
            throw e;
        } catch (Exception e) {
            log.error("매치 정보 조회 실패: ouid={}, matchMode={}, matchType={}, error={}, errorType={}",
                    maskOuid(ouid), matchMode, matchType, e.getMessage(), e.getClass().getSimpleName(), e);
            throw new RuntimeException("매치 정보 조회 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }

    /**
     * 파라미터 검증 (프로 수준의 엄격한 검증)
     */
    private void validateParameters(String ouid, String matchMode, String matchType) {
        // OUID 검증
        if (!StringUtils.hasText(ouid)) {
            throw new IllegalArgumentException("ouid는 필수 파라미터입니다.");
        }
        if (ouid.length() < 8 || ouid.length() > 64) {
            throw new IllegalArgumentException(
                    String.format("ouid는 8자 이상 64자 이하여야 합니다. 입력값 길이: %d", ouid.length()));
        }
        if (!ouid.matches("^[a-zA-Z0-9]+$")) {
            throw new IllegalArgumentException("ouid는 영문자와 숫자만 허용됩니다.");
        }
        
        // MatchMode 검증
        if (!StringUtils.hasText(matchMode)) {
            throw new IllegalArgumentException("match_mode는 필수 파라미터입니다.");
        }
        if (matchMode.length() > 64) {
            throw new IllegalArgumentException(
                    String.format("match_mode는 64자 이하여야 합니다. 입력값 길이: %d", matchMode.length()));
        }
        if (!MatchConstants.isValidMatchMode(matchMode)) {
            throw new IllegalArgumentException(
                    String.format("유효하지 않은 match_mode입니다: '%s'. 가능한 값: %s",
                            matchMode, String.join(", ", MatchConstants.VALID_MATCH_MODES)));
        }
        
        // MatchType 검증 (선택적이지만 값이 있으면 검증)
        if (matchType != null && !matchType.trim().isEmpty()) {
            if (matchType.length() > 64) {
                throw new IllegalArgumentException(
                        String.format("match_type은 64자 이하여야 합니다. 입력값 길이: %d", matchType.length()));
            }
            if (!MatchConstants.isValidMatchType(matchType)) {
                throw new IllegalArgumentException(
                        String.format("유효하지 않은 match_type입니다: '%s'. 가능한 값: %s",
                                matchType, String.join(", ", MatchConstants.VALID_MATCH_TYPES)));
            }
        }
    }

    /**
     * URL 인코딩 처리 (로깅용)
     * 실제 인코딩은 Spring의 UriBuilder가 자동으로 처리하므로
     * 이 메서드는 로깅이나 검증 목적으로만 사용
     */
    private String encodeParameter(String value) {
        if (value == null) {
            return null;
        }
        try {
            return URLEncoder.encode(value, StandardCharsets.UTF_8);
        } catch (Exception e) {
            log.warn("URL 인코딩 실패: value={}, error={}", value, e.getMessage());
            return value; // 인코딩 실패 시 원본 반환
        }
    }

    /**
     * OUID 마스킹 (로그에서 민감정보 보호)
     */
    private String maskOuid(String ouid) {
        if (ouid == null || ouid.length() <= 8) {
            return "***";
        }
        return ouid.substring(0, 4) + "***" + ouid.substring(ouid.length() - 4);
    }

    /**
     * 매치 정보를 DB에 저장 (upsert)
     */
    @Transactional
    public void saveMatchesToDatabase(List<MatchListResponse.MatchItem> items) {
        if (items == null || items.isEmpty()) {
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        for (MatchListResponse.MatchItem item : items) {
            try {
                MatchSummary existing = matchSummaryRepository.findById(item.getMatchId()).orElse(null);
                
                LocalDateTime dateMatchUtc = item.getDateMatch() != null
                        ? item.getDateMatch().toInstant().atZone(ZoneOffset.UTC).toLocalDateTime()
                        : now;

                if (existing != null) {
                    // 업데이트
                    existing.setMatchType(item.getMatchType());
                    existing.setMatchMode(item.getMatchMode());
                    existing.setDateMatchUtc(dateMatchUtc);
                    existing.setMatchResult(MatchResult.fromApiValue(item.getMatchResult()));
                    existing.setKill(item.getKill());
                    existing.setDeath(item.getDeath());
                    existing.setAssist(item.getAssist());
                    existing.setLastFetchedAt(now);
                    existing.setUpdatedAt(now);
                    matchSummaryRepository.save(existing);
                } else {
                    // 신규 생성
                    MatchSummary summary = MatchSummary.builder()
                            .matchId(item.getMatchId())
                            .matchType(item.getMatchType())
                            .matchMode(item.getMatchMode())
                            .dateMatchUtc(dateMatchUtc)
                            .matchResult(MatchResult.fromApiValue(item.getMatchResult()))
                            .kill(item.getKill())
                            .death(item.getDeath())
                            .assist(item.getAssist())
                            .lastFetchedAt(now)
                            .createdAt(now)
                            .updatedAt(now)
                            .build();
                    matchSummaryRepository.save(summary);
                }
            } catch (Exception e) {
                log.warn("매치 정보 저장 실패: matchId={}, error={}", item.getMatchId(), e.getMessage());
                // 개별 실패는 무시하고 계속 진행
            }
        }

        log.debug("매치 정보 저장 완료: count={}", items.size());
    }

    /**
     * CompletableFuture에서 안전하게 결과 가져오기
     */
    private <T> T getSafely(CompletableFuture<T> future, T defaultValue) {
        try {
            return future.get();
        } catch (Exception e) {
            log.warn("비동기 작업 결과 조회 실패: error={}", e.getMessage());
            return defaultValue;
        }
    }
    
    /**
     * Final 시즌 통계 계산 (2024-12-12 이후 데이터만)
     */
    private RankedStatsSummary calculateFinalSeasonStats(
            List<MatchDetailSummaryResponse> matches,
            String matchType,
            String ouid,
            boolean isSolo
    ) {
        // Final 시즌 시작일 이후 매치만 필터링
        List<MatchDetailSummaryResponse> finalSeasonMatches = matches.stream()
                .filter(match -> {
                    if (match.getDateMatch() == null) return false;
                    Instant matchInstant = match.getDateMatch().toInstant();
                    return !matchInstant.isBefore(FINAL_SEASON_START);
                })
                .collect(Collectors.toList());
        
        if (finalSeasonMatches.isEmpty()) {
            return RankedStatsSummary.builder()
                    .matchType(matchType)
                    .totalGames(0)
                    .wins(0)
                    .losses(0)
                    .winRate(0.0)
                    .killDeathRatio(0.0)
                    .headshotRate(0.0)
                    .avgDamage(0.0)
                    .build();
        }
        
        // 플레이어의 매치 결과 집계
        int totalGames = finalSeasonMatches.size();
        int wins = 0;
        int losses = 0;
        int totalKills = 0;
        int totalDeaths = 0;
        int totalHeadshots = 0;
        double totalDamage = 0.0;
        int matchCount = 0;
        
        String playerName = null;
        String rankName = null;
        Integer rankPoints = null;
        String rankImageUrl = null;
        
        for (MatchDetailSummaryResponse match : finalSeasonMatches) {
            if (match.getPlayers() == null) continue;
            
            // 플레이어 찾기 (ouid로 매칭 - 여기서는 userName으로 대체)
            MatchDetailSummaryResponse.PlayerDetail player = match.getPlayers().stream()
                    .filter(p -> p.getUserName() != null)
                    .findFirst()
                    .orElse(null);
            
            if (player == null) continue;
            
            if (playerName == null) {
                playerName = player.getUserName();
            }
            
            // 승패 집계
            if (player.getMatchResult() == MatchResult.WIN) {
                wins++;
            } else if (player.getMatchResult() == MatchResult.LOSE) {
                losses++;
            }
            
            // 통계 집계
            if (player.getKill() != null) totalKills += player.getKill();
            if (player.getDeath() != null) totalDeaths += player.getDeath();
            if (player.getHeadshot() != null) totalHeadshots += player.getHeadshot();
            if (player.getDamage() != null) totalDamage += player.getDamage();
            
            // 계급 정보 (가장 최근 매치의 계급 사용)
            if (rankName == null && player.getSeasonGrade() != null) {
                rankName = player.getSeasonGrade();
            }
            
            matchCount++;
        }
        
        // 통계 계산
        double winRate = totalGames > 0 ? (double) wins / totalGames * 100.0 : 0.0;
        double killDeathRatio = totalDeaths > 0 ? (double) totalKills / totalDeaths * 100.0 : 
                (totalKills > 0 ? 100.0 : 0.0);
        double headshotRate = totalKills > 0 ? (double) totalHeadshots / totalKills * 100.0 : 0.0;
        double avgDamage = matchCount > 0 ? totalDamage / matchCount : 0.0;
        
        // 계급 정보 조회 (UserTier API 사용)
        try {
            UserTierResponse tier = nxOpenApiClient.getUserTier(ouid);
            if (tier != null) {
                if (isSolo) {
                    rankName = tier.getSoloRankMatchTier();
                    rankPoints = tier.getSoloRankMatchScore() != null ? tier.getSoloRankMatchScore().intValue() : null;
                    rankImageUrl = tier.getSoloRankMatchTierImage();
                } else {
                    rankName = tier.getPartyRankMatchTier();
                    rankPoints = tier.getPartyRankMatchScore() != null ? tier.getPartyRankMatchScore().intValue() : null;
                    rankImageUrl = tier.getPartyRankMatchTierImage();
                }
            }
        } catch (Exception e) {
            log.warn("계급 정보 조회 실패: ouid={}, isSolo={}, error={}", maskOuid(ouid), isSolo, e.getMessage());
        }
        
        return RankedStatsSummary.builder()
                .matchType(matchType)
                .totalGames(totalGames)
                .wins(wins)
                .losses(losses)
                .winRate(Math.round(winRate * 10.0) / 10.0) // 소수점 1자리
                .killDeathRatio(Math.round(killDeathRatio * 10.0) / 10.0)
                .headshotRate(Math.round(headshotRate * 10.0) / 10.0)
                .avgDamage(Math.round(avgDamage * 10.0) / 10.0)
                .rankName(rankName)
                .rankPoints(rankPoints)
                .rankImageUrl(rankImageUrl)
                .build();
    }

    /**
     * 플레이어 전적검색 - 최근 200게임의 매치 정보와 상세 정보를 조회
     * 
     * 주의: 이 메서드는 많은 API 호출을 수행하므로 시간이 오래 걸릴 수 있습니다.
     * 각 카테고리별로 비동기 배치 처리를 수행합니다.
     * 
     * @param ouid 계정 식별자 (8-64자, 영문자/숫자만)
     * @param useKst KST 시간대 사용 여부 (기본값: false)
     * @return 플레이어 전적 정보
     * @throws IllegalArgumentException 파라미터 검증 실패 시
     * @throws RuntimeException API 호출 실패 시
     */
    public PlayerMatchHistoryResponse getPlayerMatchHistory(String ouid, Boolean useKst) {
        // OUID 검증
        if (!StringUtils.hasText(ouid)) {
            throw new IllegalArgumentException("ouid는 필수 파라미터입니다.");
        }
        if (ouid.length() < 8 || ouid.length() > 64) {
            throw new IllegalArgumentException(
                    String.format("ouid는 8자 이상 64자 이하여야 합니다. 입력값 길이: %d", ouid.length()));
        }
        if (!ouid.matches("^[a-zA-Z0-9]+$")) {
            throw new IllegalArgumentException("ouid는 영문자와 숫자만 허용됩니다.");
        }
        
        log.info("전적검색 시작: ouid={}, useKst={}", maskOuid(ouid), useKst);

        try {
            // 1. 최근 200게임의 매치 정보 조회 (모든 모드/타입)
            List<MatchSummaryResponse.MatchSummary> allMatches = fetchRecentMatches(ouid, 200);
            
            if (allMatches.isEmpty()) {
                log.info("매치 정보 없음: ouid={}", maskOuid(ouid));
                return PlayerMatchHistoryResponse.builder()
                        .ouid(ouid)
                        .totalMatches(0)
                        .matches(Collections.emptyList())
                        .matchDetails(PlayerMatchHistoryResponse.MatchDetailsByCategory.builder()
                                .rankedSolo(Collections.emptyList())
                                .rankedParty(Collections.emptyList())
                                .clanRanked(Collections.emptyList())
                                .clanMatch(Collections.emptyList())
                                .build())
                        .build();
            }

            // 2. 카테고리별로 매치 ID 필터링
            List<String> rankedSoloMatchIds = filterMatchIdsByCategory(allMatches, "랭크전 솔로");
            List<String> rankedPartyMatchIds = filterMatchIdsByCategory(allMatches, "랭크전 파티");
            List<String> clanRankedMatchIds = filterMatchIdsByCategory(allMatches, "클랜 랭크전");
            List<String> clanMatchIds = filterMatchIdsByCategory(allMatches, "클랜전");

            log.info("카테고리별 매치 수: ouid={}, 솔로={}, 파티={}, 클랜랭크={}, 클랜전={}",
                    maskOuid(ouid), rankedSoloMatchIds.size(), rankedPartyMatchIds.size(),
                    clanRankedMatchIds.size(), clanMatchIds.size());

            // 3. 각 카테고리별로 매치 상세 정보 배치 조회 (비동기)
            boolean useKstTime = useKst != null && useKst;
            
            CompletableFuture<List<MatchDetailSummaryResponse>> rankedSoloFuture = 
                    fetchMatchDetailsBatch(rankedSoloMatchIds, useKstTime);
            CompletableFuture<List<MatchDetailSummaryResponse>> rankedPartyFuture = 
                    fetchMatchDetailsBatch(rankedPartyMatchIds, useKstTime);
            CompletableFuture<List<MatchDetailSummaryResponse>> clanRankedFuture = 
                    fetchMatchDetailsBatch(clanRankedMatchIds, useKstTime);
            CompletableFuture<List<MatchDetailSummaryResponse>> clanMatchFuture = 
                    fetchMatchDetailsBatch(clanMatchIds, useKstTime);

            // 4. 모든 비동기 작업 완료 대기
            CompletableFuture.allOf(rankedSoloFuture, rankedPartyFuture, clanRankedFuture, clanMatchFuture).join();

            List<MatchDetailSummaryResponse> rankedSolo = getSafely(
                    rankedSoloFuture, Collections.<MatchDetailSummaryResponse>emptyList());
            List<MatchDetailSummaryResponse> rankedParty = getSafely(
                    rankedPartyFuture, Collections.<MatchDetailSummaryResponse>emptyList());
            List<MatchDetailSummaryResponse> clanRanked = getSafely(
                    clanRankedFuture, Collections.<MatchDetailSummaryResponse>emptyList());
            List<MatchDetailSummaryResponse> clanMatch = getSafely(
                    clanMatchFuture, Collections.<MatchDetailSummaryResponse>emptyList());

            log.info("전적검색 완료: ouid={}, 총 매치={}, 솔로={}, 파티={}, 클랜랭크={}, 클랜전={}",
                    maskOuid(ouid), allMatches.size(), rankedSolo.size(), rankedParty.size(),
                    clanRanked.size(), clanMatch.size());

            // 5. Final 시즌 통계 계산 (2024-12-12 이후 데이터만)
            // 예외 발생 시에도 통계는 반환하도록 처리
            RankedStatsSummary soloStats;
            RankedStatsSummary partyStats;
            try {
                soloStats = calculateFinalSeasonStats(rankedSolo, "랭크전 솔로", ouid, true);
            } catch (Exception e) {
                log.warn("랭크전 솔로 통계 계산 실패: ouid={}, error={}", maskOuid(ouid), e.getMessage());
                soloStats = RankedStatsSummary.builder()
                        .matchType("랭크전 솔로")
                        .totalGames(0)
                        .wins(0)
                        .losses(0)
                        .winRate(0.0)
                        .killDeathRatio(0.0)
                        .headshotRate(0.0)
                        .avgDamage(0.0)
                        .build();
            }
            try {
                partyStats = calculateFinalSeasonStats(rankedParty, "랭크전 파티", ouid, false);
            } catch (Exception e) {
                log.warn("랭크전 파티 통계 계산 실패: ouid={}, error={}", maskOuid(ouid), e.getMessage());
                partyStats = RankedStatsSummary.builder()
                        .matchType("랭크전 파티")
                        .totalGames(0)
                        .wins(0)
                        .losses(0)
                        .winRate(0.0)
                        .killDeathRatio(0.0)
                        .headshotRate(0.0)
                        .avgDamage(0.0)
                        .build();
            }

            return PlayerMatchHistoryResponse.builder()
                    .ouid(ouid)
                    .totalMatches(allMatches.size())
                    .matches(allMatches)
                    .matchDetails(PlayerMatchHistoryResponse.MatchDetailsByCategory.builder()
                            .rankedSolo(rankedSolo != null ? rankedSolo : Collections.emptyList())
                            .rankedParty(rankedParty != null ? rankedParty : Collections.emptyList())
                            .clanRanked(clanRanked != null ? clanRanked : Collections.emptyList())
                            .clanMatch(clanMatch != null ? clanMatch : Collections.emptyList())
                            .build())
                    .finalSeasonStats(PlayerMatchHistoryResponse.FinalSeasonStats.builder()
                            .rankedSolo(soloStats)
                            .rankedParty(partyStats)
                            .build())
                    .build();

        } catch (IllegalArgumentException e) {
            // 검증 오류는 그대로 전파
            throw e;
        } catch (Exception e) {
            log.error("전적검색 실패: ouid={}, error={}, errorType={}",
                    maskOuid(ouid), e.getMessage(), e.getClass().getSimpleName(), e);
            throw new RuntimeException("전적검색 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }

    /**
     * 최근 N게임의 매치 정보 조회 (모든 모드/타입)
     */
    private List<MatchSummaryResponse.MatchSummary> fetchRecentMatches(String ouid, int limit) {
        List<MatchSummaryResponse.MatchSummary> allMatches = new ArrayList<>();

        // 모든 모드와 타입 조회
        String[] matchModes = {"개인전", "데스매치", "폭파미션", "진짜를 모아라"};
        String[] matchTypes = {null, "일반전", "랭크전 솔로", "랭크전 파티", "클랜 랭크전", "클랜전", "퀵매치 클랜전"};

        for (String mode : matchModes) {
            for (String type : matchTypes) {
                try {
                    MatchListResponse response = RetryUtil.executeWithExponentialBackoff(() -> {
                        return nxOpenApiClient.getMatches(ouid, mode, type);
                    });

                    if (response != null && response.getMatch() != null) {
                        boolean useKstTime = false;
                        List<MatchSummaryResponse.MatchSummary> summaries = response.getMatch().stream()
                                .map(item -> MatchSummaryResponse.MatchSummary.fromMatchItem(item, useKstTime))
                                .collect(Collectors.toList());
                        allMatches.addAll(summaries);
                    }
                } catch (Exception e) {
                    log.warn("매치 정보 조회 실패: ouid={}, mode={}, type={}, error={}",
                            maskOuid(ouid), mode, type, e.getMessage());
                }
            }
        }

        // 날짜순 정렬 (최신순) 및 limit 적용
        allMatches.sort((a, b) -> {
            if (a.getDateMatch() == null && b.getDateMatch() == null) return 0;
            if (a.getDateMatch() == null) return 1;
            if (b.getDateMatch() == null) return -1;
            return b.getDateMatch().compareTo(a.getDateMatch());
        });

        if (allMatches.size() > limit) {
            allMatches = allMatches.subList(0, limit);
        }
        
        // Final 시즌 필터링 (2024-12-12 이후 데이터만)
        List<MatchSummaryResponse.MatchSummary> finalSeasonMatches = allMatches.stream()
                .filter(match -> {
                    if (match.getDateMatch() == null) return false;
                    Instant matchInstant = match.getDateMatch().toInstant();
                    return !matchInstant.isBefore(FINAL_SEASON_START);
                })
                .collect(Collectors.toList());
        
        log.debug("Final 시즌 매치 필터링: 전체={}, Final시즌={}", allMatches.size(), finalSeasonMatches.size());

        // DB에 저장
        List<MatchListResponse.MatchItem> itemsToSave = allMatches.stream()
                .map(summary -> {
                    MatchListResponse.MatchItem item = new MatchListResponse.MatchItem();
                    item.setMatchId(summary.getMatchId());
                    item.setMatchType(summary.getMatchType());
                    item.setMatchMode(summary.getMatchMode());
                    item.setDateMatch(summary.getDateMatch());
                    item.setMatchResult(summary.getMatchResult() != null ? summary.getMatchResult().getApiValue() : null);
                    item.setKill(summary.getKill());
                    item.setDeath(summary.getDeath());
                    item.setAssist(summary.getAssist());
                    return item;
                })
                .collect(Collectors.toList());
        saveMatchesToDatabase(itemsToSave);

        return allMatches;
    }

    /**
     * 카테고리별로 매치 ID 필터링
     */
    private List<String> filterMatchIdsByCategory(
            List<MatchSummaryResponse.MatchSummary> matches,
            String category
    ) {
        return matches.stream()
                .filter(m -> category.equals(m.getMatchType()))
                .map(MatchSummaryResponse.MatchSummary::getMatchId)
                .filter(id -> id != null && !id.trim().isEmpty())
                .collect(Collectors.toList());
    }

    /**
     * 매치 상세 정보 배치 조회 (비동기)
     * 
     * @param matchIds 매치 ID 리스트 (최대 200개 권장)
     * @param useKst KST 시간대 사용 여부
     * @return 매치 상세 정보 리스트 (실패한 항목은 제외)
     */
    @Async
    public CompletableFuture<List<MatchDetailSummaryResponse>> fetchMatchDetailsBatch(
            List<String> matchIds,
            boolean useKst
    ) {
        if (matchIds == null || matchIds.isEmpty()) {
            return CompletableFuture.completedFuture(Collections.emptyList());
        }

        // 너무 많은 요청 방지
        int maxBatchSize = 200;
        if (matchIds.size() > maxBatchSize) {
            log.warn("배치 크기가 너무 큼: count={}, max={}, 처음 {}개만 처리", 
                    matchIds.size(), maxBatchSize, maxBatchSize);
            matchIds = matchIds.subList(0, maxBatchSize);
        }

        log.debug("매치 상세 정보 배치 조회 시작: count={}, useKst={}", matchIds.size(), useKst);

        List<MatchDetailSummaryResponse> details = new ArrayList<>();
        int successCount = 0;
        int failureCount = 0;
        
        for (String matchId : matchIds) {
            if (matchId == null || matchId.trim().isEmpty()) {
                failureCount++;
                continue;
            }
            
            try {
                MatchDetailResponse detail = RetryUtil.executeWithExponentialBackoff(() -> {
                    return nxOpenApiClient.getMatchDetail(matchId.trim());
                });

                if (detail != null) {
                    MatchDetailSummaryResponse summary = MatchDetailSummaryResponse.fromMatchDetailResponse(
                            detail, useKst, metadataService);
                    details.add(summary);
                    successCount++;
                } else {
                    log.warn("매치 상세 정보 없음: matchId={}", matchId);
                    failureCount++;
                }
            } catch (Exception e) {
                log.warn("매치 상세 정보 조회 실패: matchId={}, error={}, errorType={}", 
                        matchId, e.getMessage(), e.getClass().getSimpleName());
                failureCount++;
                // 개별 실패는 무시하고 계속 진행
            }
        }

        log.info("매치 상세 정보 배치 조회 완료: total={}, success={}, failure={}", 
                matchIds.size(), successCount, failureCount);
        return CompletableFuture.completedFuture(details);
    }

    /**
     * 매치 상세 정보 조회
     * 
     * @param matchId 매치 ID (필수, 1-64자)
     * @param useKst KST 시간대 사용 여부 (기본값: false)
     * @return 매치 상세 정보 (없으면 null)
     * @throws IllegalArgumentException 파라미터 검증 실패 시
     * @throws RuntimeException API 호출 실패 시
     */
    @Cacheable(
        cacheNames = "saMatchDetails",
        key = "#matchId + '_' + (#useKst != null ? #useKst : false)",
        unless = "#result == null"
    )
    public MatchDetailSummaryResponse getMatchDetail(String matchId, Boolean useKst) {
        // MatchId 검증 (엄격한 검증)
        if (!StringUtils.hasText(matchId)) {
            throw new IllegalArgumentException("match_id는 필수 파라미터입니다.");
        }
        String trimmedMatchId = matchId.trim();
        if (trimmedMatchId.length() < 1 || trimmedMatchId.length() > 64) {
            throw new IllegalArgumentException(
                    String.format("match_id는 1자 이상 64자 이하여야 합니다. 입력값 길이: %d", trimmedMatchId.length()));
        }
        // match_id는 숫자로만 구성된 긴 문자열일 수 있으므로 숫자/문자 모두 허용
        if (!trimmedMatchId.matches("^[a-zA-Z0-9]+$")) {
            throw new IllegalArgumentException("match_id는 영문자와 숫자만 허용됩니다.");
        }

        log.debug("매치 상세 정보 조회 시작: matchId={}, useKst={}", trimmedMatchId, useKst);

        try {
            MatchDetailResponse detail = RetryUtil.executeWithExponentialBackoff(() -> {
                return nxOpenApiClient.getMatchDetail(trimmedMatchId);
            });

            if (detail == null) {
                log.warn("매치 상세 정보 없음: matchId={}", trimmedMatchId);
                return null;
            }

            boolean useKstTime = useKst != null && useKst;
            MatchDetailSummaryResponse response = MatchDetailSummaryResponse.fromMatchDetailResponse(
                    detail, useKstTime, metadataService);

            int playerCount = response.getPlayers() != null ? response.getPlayers().size() : 0;
            log.info("매치 상세 정보 조회 성공: matchId={}, playerCount={}, useKst={}",
                    trimmedMatchId, playerCount, useKstTime);

            return response;

        } catch (IllegalArgumentException e) {
            // 검증 오류는 그대로 전파
            throw e;
        } catch (Exception e) {
            log.error("매치 상세 정보 조회 실패: matchId={}, error={}, errorType={}",
                    trimmedMatchId, e.getMessage(), e.getClass().getSimpleName(), e);
            throw new RuntimeException("매치 상세 정보 조회 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }
}
