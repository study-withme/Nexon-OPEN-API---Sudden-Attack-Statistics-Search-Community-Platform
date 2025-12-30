package com.example.jokerweb.player;

import com.example.jokerweb.match.MatchService;
import com.example.jokerweb.nexon.MetadataService;
import com.example.jokerweb.nexon.NxOpenApiClient;
import com.example.jokerweb.nexon.dto.MatchListResponse;
import com.example.jokerweb.nexon.dto.UserBasicResponse;
import com.example.jokerweb.nexon.dto.UserRankResponse;
import com.example.jokerweb.nexon.dto.UserRecentInfoResponse;
import com.example.jokerweb.nexon.dto.UserTierResponse;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProfileService {

    private final NxOpenApiClient nxClient;
    private final MetadataService metadataService;
    private final PlayerRepository playerRepository;
    private final PlayerRankRepository playerRankRepository;
    private final MatchService matchService;
    private final InsightService insightService;

    @Cacheable(cacheNames = "profile", key = "#ouid", unless = "#result == null")
    public PlayerProfileResponse fetchAndSaveProfile(String ouid) {
        // 병렬 API 호출로 속도 향상 (순차 호출 대신 동시에 호출)
        CompletableFuture<UserBasicResponse> basicFuture = CompletableFuture
            .supplyAsync(() -> {
                try {
                    return nxClient.getUserBasic(ouid);
                } catch (Exception e) {
                    log.warn("getUserBasic 실패: ouid={}, error={}", ouid, e.getMessage());
                    return null;
                }
            });
        
        CompletableFuture<UserRankResponse> rankFuture = CompletableFuture
            .supplyAsync(() -> {
                try {
                    return nxClient.getUserRank(ouid);
                } catch (Exception e) {
                    log.warn("getUserRank 실패: ouid={}, error={}", ouid, e.getMessage());
                    return null;
                }
            });
        
        CompletableFuture<UserTierResponse> tierFuture = CompletableFuture
            .supplyAsync(() -> {
                try {
                    return nxClient.getUserTier(ouid);
                } catch (Exception e) {
                    log.warn("getUserTier 실패: ouid={}, error={}", ouid, e.getMessage());
                    return null;
                }
            });
        
        CompletableFuture<UserRecentInfoResponse> recentFuture = CompletableFuture
            .supplyAsync(() -> {
                try {
                    return nxClient.getUserRecentInfo(ouid);
                } catch (Exception e) {
                    log.warn("getUserRecentInfo 실패: ouid={}, error={}", ouid, e.getMessage());
                    return null;
                }
            });
        
        // 모든 API 호출 완료 대기 (최대 10초 타임아웃)
        UserBasicResponse basic = null;
        UserRankResponse rank = null;
        UserTierResponse tier = null;
        UserRecentInfoResponse recent = null;
        
        try {
            CompletableFuture.allOf(basicFuture, rankFuture, tierFuture, recentFuture)
                .get(10, TimeUnit.SECONDS);
            basic = basicFuture.get();
            rank = rankFuture.get();
            tier = tierFuture.get();
            recent = recentFuture.get();
        } catch (Exception e) {
            log.warn("병렬 API 호출 중 오류 발생: ouid={}, error={}", ouid, e.getMessage());
            // 부분 실패를 허용하기 위해 개별적으로 결과 가져오기 시도
            try {
                basic = basicFuture.isDone() ? basicFuture.get() : null;
                rank = rankFuture.isDone() ? rankFuture.get() : null;
                tier = tierFuture.isDone() ? tierFuture.get() : null;
                recent = recentFuture.isDone() ? recentFuture.get() : null;
            } catch (Exception ex) {
                log.warn("부분 결과 가져오기 실패: ouid={}", ouid);
            }
        }

        // DB 저장은 별도 트랜잭션으로 분리 (캐시와 독립적으로 동작)
        // null 체크 후 저장
        if (basic != null || rank != null || tier != null) {
            try {
                saveProfileToDatabase(ouid, basic, rank, tier);
            } catch (Exception e) {
                log.warn("프로필 DB 저장 실패: ouid={}, error={}", ouid, e.getMessage());
            }
        }

        // DB에서 기본 데이터 조회 (API 실패 시에도 최소한의 데이터 제공)
        Player player = playerRepository.findById(ouid).orElse(null);
        PlayerRank playerRank = playerRankRepository.findById(ouid).orElse(null);
        
        // API에서 가져온 데이터가 있으면 사용, 없으면 DB 데이터 사용
        if (player == null) {
            if (basic != null && basic.getUserName() != null) {
                player = Player.builder().ouid(ouid).latestName(basic.getUserName()).build();
            } else {
                player = Player.builder().ouid(ouid).latestName("알 수 없음").build();
            }
        }
        
        if (playerRank == null) {
            playerRank = PlayerRank.builder().ouid(ouid).build();
        }
        
        // API 응답을 직접 전달 (티어 정보와 이미지 URL 포함)
        // 이미지 URL이 없으면 메타데이터에서 찾아서 채움
        PlayerProfileResponse response = PlayerProfileResponse.from(player, playerRank, recent, tier, rank);
        
        // API에서 이미지 URL이 없을 때 메타데이터에서 찾기
        if (response != null) {
            // 티어 이미지 URL 보완
            if (response.getSoloTierImage() == null && response.getSoloTier() != null) {
                String tierImageUrl = metadataService.getTierImageUrl(response.getSoloTier());
                if (tierImageUrl != null) {
                    response.setSoloTierImage(tierImageUrl);
                    log.debug("메타데이터에서 솔로 티어 이미지 URL 찾음: tier={}, imageUrl={}", response.getSoloTier(), tierImageUrl);
                }
            }
            
            if (response.getPartyTierImage() == null && response.getPartyTier() != null) {
                String tierImageUrl = metadataService.getTierImageUrl(response.getPartyTier());
                if (tierImageUrl != null) {
                    response.setPartyTierImage(tierImageUrl);
                    log.debug("메타데이터에서 파티 티어 이미지 URL 찾음: tier={}, imageUrl={}", response.getPartyTier(), tierImageUrl);
                }
            }
            
            // 계급 이미지 URL 보완
            if (response.getGradeImage() == null && response.getGrade() != null) {
                String gradeImageUrl = metadataService.getGradeImageUrl(response.getGrade());
                if (gradeImageUrl != null) {
                    response.setGradeImage(gradeImageUrl);
                    log.debug("메타데이터에서 계급 이미지 URL 찾음: grade={}, imageUrl={}", response.getGrade(), gradeImageUrl);
                }
            }
            
            if (response.getSeasonGradeImage() == null && response.getSeasonGrade() != null) {
                String seasonGradeImageUrl = metadataService.getSeasonGradeImageUrl(response.getSeasonGrade());
                if (seasonGradeImageUrl != null) {
                    response.setSeasonGradeImage(seasonGradeImageUrl);
                    log.debug("메타데이터에서 시즌 계급 이미지 URL 찾음: seasonGrade={}, imageUrl={}", response.getSeasonGrade(), seasonGradeImageUrl);
                }
            }
        }
        
        // 매치 정보는 지연 로딩 (필요할 때만 호출하도록 변경하여 초기 로딩 속도 향상)
        // fetchMatchesAsync 호출 제거 - 사용자가 매치 목록을 요청할 때만 조회
        
        return response;
    }
    
    @Transactional
    public void saveProfileToDatabase(String ouid, UserBasicResponse basic, UserRankResponse rank, UserTierResponse tier) {
        // basic이 null이 아닐 때만 저장
        if (basic != null) {
            Player player = playerRepository.findById(ouid)
                    .orElseGet(() -> Player.builder().ouid(ouid).build());
            
            if (basic.getUserName() != null) {
                player.setLatestName(basic.getUserName());
            }
            if (basic.getClanName() != null) {
                player.setClanName(basic.getClanName());
            }
            if (basic.getTitleName() != null) {
                player.setTitleName(basic.getTitleName());
            }
            if (basic.getMannerGrade() != null) {
                player.setMannerGrade(basic.getMannerGrade());
            }
            if (basic.getUserDateCreate() != null) {
                player.setUserDateCreate(basic.getUserDateCreate().toLocalDateTime());
            }
            player.touchUpdatedAt();
            playerRepository.save(player);
        }

        // rank나 tier가 null이 아닐 때만 저장
        if (rank != null || tier != null) {
            PlayerRank playerRank = playerRankRepository.findById(ouid)
                    .orElseGet(() -> PlayerRank.builder().ouid(ouid).build());
            
            if (rank != null) {
                if (rank.getGrade() != null) {
                    playerRank.setGrade(rank.getGrade());
                }
                if (rank.getGradeExp() != null) {
                    playerRank.setGradeExp(rank.getGradeExp());
                }
                if (rank.getGradeRanking() != null) {
                    playerRank.setGradeRanking(rank.getGradeRanking());
                }
                if (rank.getSeasonGrade() != null) {
                    playerRank.setSeasonGrade(rank.getSeasonGrade());
                }
                if (rank.getSeasonGradeExp() != null) {
                    playerRank.setSeasonGradeExp(rank.getSeasonGradeExp());
                }
                if (rank.getSeasonGradeRanking() != null) {
                    playerRank.setSeasonGradeRanking(rank.getSeasonGradeRanking());
                }
            }
            
            if (tier != null) {
                if (tier.getSoloRankMatchTier() != null) {
                    playerRank.setSoloRankMatchTier(tier.getSoloRankMatchTier());
                }
                if (tier.getSoloRankMatchScore() != null) {
                    playerRank.setSoloRankMatchScore(tier.getSoloRankMatchScore());
                }
                if (tier.getPartyRankMatchTier() != null) {
                    playerRank.setPartyRankMatchTier(tier.getPartyRankMatchTier());
                }
                if (tier.getPartyRankMatchScore() != null) {
                    playerRank.setPartyRankMatchScore(tier.getPartyRankMatchScore());
                }
            }
            
            playerRank.touchUpdatedAt();
            playerRankRepository.save(playerRank);
        }
    }

    /**
     * 프로필 캐시 무효화
     * 프로필 정보가 업데이트되었을 때 호출하여 캐시를 갱신
     */
    @CacheEvict(cacheNames = "profile", key = "#ouid")
    public void evictProfileCache(String ouid) {
        log.debug("프로필 캐시 무효화: ouid={}", ouid);
    }

    /**
     * 프로필을 강제로 새로고침하고 캐시 업데이트
     */
    @CacheEvict(cacheNames = "profile", key = "#ouid", beforeInvocation = true)
    public PlayerProfileResponse refreshProfile(String ouid) {
        log.info("프로필 강제 새로고침: ouid={}", ouid);
        return fetchAndSaveProfile(ouid);
    }

    /**
     * 비동기로 매치 정보를 조회하여 상세 정보까지 저장
     * 전적 검색 시 자동으로 연계 조회되도록 함
     */
    @Async
    public void fetchMatchesAsync(String ouid) {
        try {
            log.debug("전적 검색 연계: 매치 정보 조회 시작: ouid={}", ouid);
            
            // 일반전 매치 조회 (최근 매치 정보 수집)
            MatchListResponse normalMatches = matchService.fetchMatches(ouid, "normal", null);
            if (normalMatches != null && normalMatches.getMatch() != null) {
                log.debug("일반전 매치 조회 완료: ouid={}, count={}", ouid, normalMatches.getMatch().size());
            }
            
            // 랭크전 매치 조회 (폭파미션의 모든 랭크전 타입 포함)
            MatchListResponse ratingMatches = matchService.fetchMatches(ouid, "rating", null);
            if (ratingMatches != null && ratingMatches.getMatch() != null) {
                log.debug("랭크전 매치 조회 완료: ouid={}, count={}", ouid, ratingMatches.getMatch().size());
            }
            
            log.debug("전적 검색 연계: 매치 정보 조회 완료: ouid={}", ouid);
        } catch (Exception e) {
            log.warn("전적 검색 연계 매치 조회 실패: ouid={}, error={}", ouid, e.getMessage());
        }
    }
    
    /**
     * 두 플레이어의 통계를 비교
     * 캐시된 프로필 데이터를 최대한 활용하여 API 호출 최소화
     */
    public ComparisonResponse comparePlayers(String ouid1, String ouid2) {
        log.info("플레이어 비교 시작: ouid1={}, ouid2={}", ouid1, ouid2);
        
        // 두 플레이어의 프로필 정보 조회 (캐시 활용)
        PlayerProfileResponse profile1 = fetchAndSaveProfile(ouid1);
        PlayerProfileResponse profile2 = fetchAndSaveProfile(ouid2);
        
        if (profile1 == null || profile2 == null) {
            log.warn("플레이어 비교 실패: 프로필 정보 없음 - ouid1={}, ouid2={}", ouid1, ouid2);
            return null;
        }
        
        // 프로필에서 이미 가져온 정보를 재사용하여 API 호출 최소화
        // 인사이트 통계는 캐시를 활용하여 조회 (refresh=false로 설정하여 캐시 우선 사용)
        List<InsightResponses.MapStat> mapStats1 = insightService.getMapStats(ouid1);
        List<InsightResponses.MapStat> mapStats2 = insightService.getMapStats(ouid2);
        List<InsightResponses.TimeBucketStat> timeStats1 = insightService.getTimeStats(ouid1);
        List<InsightResponses.TimeBucketStat> timeStats2 = insightService.getTimeStats(ouid2);
        List<InsightResponses.RankedStats> rankedStats1 = insightService.getRankedStats(ouid1);
        List<InsightResponses.RankedStats> rankedStats2 = insightService.getRankedStats(ouid2);
        
        // 프로필에서 가져온 데이터로 기본 정보 구성 (추가 API 호출 없이)
        // 필요시에만 추가 정보를 조회하도록 변경
        ComparisonResponse.PlayerComparison player1 = ComparisonResponse.PlayerComparison.builder()
                .ouid(ouid1)
                .nickname(profile1.getUserName())
                .basic(null) // 프로필 정보로 대체 가능
                .rank(null) // 프로필 정보로 대체 가능
                .tier(null) // 프로필 정보로 대체 가능
                .mapStats(mapStats1)
                .timeStats(timeStats1)
                .rankedStats(rankedStats1)
                .build();
        
        ComparisonResponse.PlayerComparison player2 = ComparisonResponse.PlayerComparison.builder()
                .ouid(ouid2)
                .nickname(profile2.getUserName())
                .basic(null) // 프로필 정보로 대체 가능
                .rank(null) // 프로필 정보로 대체 가능
                .tier(null) // 프로필 정보로 대체 가능
                .mapStats(mapStats2)
                .timeStats(timeStats2)
                .rankedStats(rankedStats2)
                .build();
        
        return ComparisonResponse.builder()
                .player1(player1)
                .player2(player2)
                .build();
    }
}

