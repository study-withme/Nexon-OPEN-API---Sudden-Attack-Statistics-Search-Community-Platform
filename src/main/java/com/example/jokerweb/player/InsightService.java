package com.example.jokerweb.player;

import com.example.jokerweb.match.MatchPlayerRepository;
import com.example.jokerweb.match.MatchService;
import com.example.jokerweb.nexon.dto.MatchListResponse;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;

@Slf4j
@Service
@RequiredArgsConstructor
public class InsightService {

    private final MatchPlayerRepository matchPlayerRepository;
    private final MatchService matchService;

    @Cacheable(cacheNames = "mapStats", key = "#ouid")
    public List<InsightResponses.MapStat> getMapStats(String ouid) {
        return matchPlayerRepository.findMapStats(ouid).stream()
                .map(v -> InsightResponses.MapStat.builder()
                        .matchMap(v.getMatchMap())
                        .games(v.getGames())
                        .wins(v.getWins())
                        .winRate(v.getWinRate())
                        .kd(v.getKd())
                        .hsr(v.getHsr())
                        .build())
                .collect(Collectors.toList());
    }

    @Cacheable(cacheNames = "timeStats", key = "#ouid")
    public List<InsightResponses.TimeBucketStat> getTimeStats(String ouid) {
        return getTimeStatsWithDamage(ouid);
    }

    /**
     * 맵 통계 캐시 무효화
     */
    @CacheEvict(cacheNames = "mapStats", key = "#ouid")
    public void evictMapStatsCache(String ouid) {
        // 캐시만 무효화
    }

    /**
     * 시간대 통계 캐시 무효화
     */
    @CacheEvict(cacheNames = "timeStats", key = "#ouid")
    public void evictTimeStatsCache(String ouid) {
        // 캐시만 무효화
    }

    /**
     * 강제 새로고침: 캐시 무효화 후 최신 데이터 조회
     */
    @CacheEvict(cacheNames = {"mapStats", "timeStats"}, key = "#ouid", beforeInvocation = true)
    public List<InsightResponses.MapStat> refreshMapStats(String ouid) {
        return getMapStats(ouid);
    }

    @CacheEvict(cacheNames = {"mapStats", "timeStats"}, key = "#ouid", beforeInvocation = true)
    public List<InsightResponses.TimeBucketStat> refreshTimeStats(String ouid) {
        return getTimeStats(ouid);
    }

    /**
     * 시간대별 통계 조회 (딜량 포함)
     * 매치 정보와 상세 정보를 모두 불러와서 분석
     */
    @Cacheable(cacheNames = "timeStats", key = "#ouid + '_detailed'")
    public List<InsightResponses.TimeBucketStat> getTimeStatsWithDamage(String ouid) {
        // 시간대별 패턴 분석을 위해 매치 데이터 강제 로드
        try {
            log.info("시간대별 패턴 분석을 위해 매치 데이터 로드 시작: ouid={}", ouid);
            // 주요 매치 타입들을 모두 로드 (상세 정보 포함)
            matchService.fetchMatches(ouid, "개인전", null);
            matchService.fetchMatches(ouid, "개인전", "일반전");
            matchService.fetchMatches(ouid, "개인전", "랭크전 솔로");
            matchService.fetchMatches(ouid, "개인전", "랭크전 파티");
            matchService.fetchMatches(ouid, "개인전", "클랜전");
            // 추가 모드들도 로드
            matchService.fetchMatches(ouid, "데스매치", null);
            matchService.fetchMatches(ouid, "폭파미션", null);
            log.info("시간대별 패턴 분석용 매치 데이터 로드 완료: ouid={}", ouid);
        } catch (Exception e) {
            log.warn("시간대별 패턴 분석용 매치 데이터 로드 실패 (계속 진행): ouid={}, error={}", ouid, e.getMessage());
        }

        return matchPlayerRepository.findTimeBucketStats(ouid).stream()
                .map(v -> InsightResponses.TimeBucketStat.builder()
                        .hourKst(v.getHourKst())
                        .games(v.getGames())
                        .wins(v.getWins())
                        .winRate(v.getWinRate())
                        .kd(v.getKd())
                        .damage(v.getDamage())
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * 랭크전 솔로/파티별 통계 조회 및 숙련 등급 계산
     * 매치 정보와 상세 정보를 모두 불러와서 분석
     */
    @Cacheable(cacheNames = "rankedStats", key = "#ouid")
    public List<InsightResponses.RankedStats> getRankedStats(String ouid) {
        // 랭크전 및 클랜전 매치 데이터 강제 로드 (상세 정보 포함)
        try {
            log.info("랭크전/클랜전 통계 분석을 위해 매치 데이터 로드 시작: ouid={}", ouid);
            // 랭크전 솔로 매치 로드 (상세 정보 포함)
            MatchListResponse soloMatches = matchService.fetchMatches(ouid, "개인전", "랭크전 솔로");
            // 랭크전 파티 매치 로드 (상세 정보 포함)
            MatchListResponse partyMatches = matchService.fetchMatches(ouid, "개인전", "랭크전 파티");
            // 클랜전 매치 로드 (상세 정보 포함)
            MatchListResponse clanMatches = matchService.fetchMatches(ouid, "개인전", "클랜전");
            
            // 매치 상세 정보 동기적으로 로드
            List<String> allMatchIds = new java.util.ArrayList<>();
            if (soloMatches != null && soloMatches.getMatch() != null) {
                allMatchIds.addAll(soloMatches.getMatch().stream()
                    .map(MatchListResponse.MatchItem::getMatchId)
                    .filter(id -> id != null && !id.trim().isEmpty())
                    .limit(50) // 최대 50개만 동기 로드
                    .collect(Collectors.toList()));
            }
            if (partyMatches != null && partyMatches.getMatch() != null) {
                allMatchIds.addAll(partyMatches.getMatch().stream()
                    .map(MatchListResponse.MatchItem::getMatchId)
                    .filter(id -> id != null && !id.trim().isEmpty())
                    .limit(50) // 최대 50개만 동기 로드
                    .collect(Collectors.toList()));
            }
            if (clanMatches != null && clanMatches.getMatch() != null) {
                allMatchIds.addAll(clanMatches.getMatch().stream()
                    .map(MatchListResponse.MatchItem::getMatchId)
                    .filter(id -> id != null && !id.trim().isEmpty())
                    .limit(50) // 최대 50개만 동기 로드
                    .collect(Collectors.toList()));
            }
            
            if (!allMatchIds.isEmpty()) {
                matchService.fetchAndSaveMatchDetailsSync(allMatchIds);
            }
            
            log.info("랭크전/클랜전 매치 데이터 로드 완료: ouid={}, matchIds={}", ouid, allMatchIds.size());
        } catch (Exception e) {
            log.warn("랭크전/클랜전 매치 데이터 로드 실패 (계속 진행): ouid={}, error={}", ouid, e.getMessage());
        }

        return matchPlayerRepository.findRankedStats(ouid).stream()
                .map(v -> {
                    String queueType;
                    if (v.getMatchType().contains("솔로")) {
                        queueType = "solo";
                    } else if (v.getMatchType().contains("파티")) {
                        queueType = "party";
                    } else if (v.getMatchType().contains("클랜")) {
                        queueType = "clan";
                    } else {
                        queueType = "solo"; // 기본값
                    }
                    
                    double skillScore = calculateSkillScore(
                            v.getWinRate() != null ? v.getWinRate() : 0.0,
                            v.getKd() != null ? v.getKd() : 0.0,
                            v.getKda() != null ? v.getKda() : 0.0,
                            v.getDamage() != null ? v.getDamage() : 0.0
                    );
                    String skillGrade = getSkillGrade(skillScore);
                    String description = getSkillDescription(skillGrade, queueType);

                    return InsightResponses.RankedStats.builder()
                            .queueType(queueType)
                            .games(v.getGames())
                            .wins(v.getWins())
                            .winRate(v.getWinRate())
                            .kda(v.getKda())
                            .kd(v.getKd())
                            .avgDamage(v.getDamage())
                            .skillScore(skillScore)
                            .skillGrade(skillGrade)
                            .description(description)
                            .build();
                })
                .collect(Collectors.toList());
    }

    /**
     * 숙련 등급 점수 계산 (0-100)
     * 랭크전 특성을 고려한 정교한 알고리즘
     */
    private double calculateSkillScore(double winRate, double kd, double kda, double avgDamage) {
        // 가중치: 승률 35%, K/D 25%, KDA 20%, 딜량 20%
        // 승률 점수 (0-35점): 60% 이상이면 만점
        double winRateScore = Math.min(winRate / 60.0 * 35, 35);
        if (winRate < 40) winRateScore *= 0.7; // 40% 미만이면 패널티
        
        // K/D 점수 (0-25점): 2.5 이상이면 만점
        double kdScore = Math.min(kd / 2.5 * 25, 25);
        if (kd < 1.0) kdScore *= 0.5; // 1.0 미만이면 큰 패널티
        
        // KDA 점수 (0-20점): 3.5 이상이면 만점
        double kdaScore = Math.min(kda / 3.5 * 20, 20);
        if (kda < 1.5) kdaScore *= 0.6; // 1.5 미만이면 패널티
        
        // 딜량 점수 (0-20점): 1800 이상이면 만점
        double damageScore = Math.min(avgDamage / 1800.0 * 20, 20);
        if (avgDamage < 800) damageScore *= 0.5; // 800 미만이면 큰 패널티
        
        double totalScore = winRateScore + kdScore + kdaScore + damageScore;
        
        // 보너스: 모든 지표가 일정 수준 이상이면 보너스 점수
        if (winRate >= 55 && kd >= 1.8 && kda >= 2.5 && avgDamage >= 1200) {
            totalScore = Math.min(totalScore + 5, 100); // 최대 5점 보너스
        }
        
        return Math.max(0, Math.min(100, totalScore));
    }

    /**
     * 점수에 따른 숙련 등급 반환
     */
    private String getSkillGrade(double score) {
        if (score >= 91) return "전설";
        if (score >= 76) return "장인";
        if (score >= 61) return "고수";
        if (score >= 41) return "숙련";
        if (score >= 21) return "일반";
        return "초보";
    }

    /**
     * 등급에 따른 설명 생성
     */
    private String getSkillDescription(String grade, String queueType) {
        String queueName;
        String gameMode;
        if ("solo".equals(queueType)) {
            queueName = "솔로";
            gameMode = "랭크전";
        } else if ("party".equals(queueType)) {
            queueName = "파티";
            gameMode = "랭크전";
        } else if ("clan".equals(queueType)) {
            queueName = "클랜";
            gameMode = "클랜전";
        } else {
            queueName = "솔로";
            gameMode = "랭크전";
        }
        
        if ("전설".equals(grade)) {
            return String.format("%s %s에서 전설적인 실력을 보여주고 있습니다. 최상위권 플레이어입니다.", queueName, gameMode);
        } else if ("장인".equals(grade)) {
            return String.format("%s %s에서 장인급 실력을 발휘하고 있습니다. 매우 안정적인 플레이를 보여줍니다.", queueName, gameMode);
        } else if ("고수".equals(grade)) {
            return String.format("%s %s에서 고수 수준의 실력을 보여주고 있습니다. 세부 기술을 더 연마하면 장인에 도달할 수 있습니다.", queueName, gameMode);
        } else if ("숙련".equals(grade)) {
            return String.format("%s %s에서 숙련된 플레이를 하고 있습니다. 안정적인 실력으로 게임을 즐기고 있습니다.", queueName, gameMode);
        } else if ("일반".equals(grade)) {
            return String.format("%s %s에서 일반적인 수준입니다. 더 많은 연습으로 실력을 향상시킬 수 있습니다.", queueName, gameMode);
        } else {
            return String.format("%s %s에서 초보 단계입니다. 기본기를 다지며 실력을 키워나가세요.", queueName, gameMode);
        }
    }

    @CacheEvict(cacheNames = "rankedStats", key = "#ouid")
    public void evictRankedStatsCache(String ouid) {
        // 캐시만 무효화
    }

    @CacheEvict(cacheNames = "rankedStats", key = "#ouid", beforeInvocation = true)
    public List<InsightResponses.RankedStats> refreshRankedStats(String ouid) {
        return getRankedStats(ouid);
    }
}

