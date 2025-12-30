package com.example.jokerweb.player;

import com.example.jokerweb.match.MatchService;
import com.example.jokerweb.nexon.NxOpenApiClient;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * 인기 플레이어 데이터 사전 수집 스케줄러
 * 검색 빈도가 높은 플레이어의 데이터를 미리 수집하여 응답 속도 향상
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class PopularPlayerScheduler {
    
    private final SearchService searchService;
    private final ProfileService profileService;
    private final MatchService matchService;
    private final NxOpenApiClient nxClient;
    
    /**
     * 매일 새벽 3시에 인기 플레이어 데이터 사전 수집
     */
    @Scheduled(cron = "0 0 3 * * *")
    public void collectPopularPlayerData() {
        log.info("인기 플레이어 데이터 사전 수집 시작");
        
        try {
            // 최근 7일간 인기 검색어 상위 50개 조회
            List<String> popularNicknames = searchService.getPopularSearches(50);
            
            if (popularNicknames.isEmpty()) {
                log.info("인기 플레이어가 없어서 수집 건너뜀");
                return;
            }
            
            log.info("인기 플레이어 {}명의 데이터 수집 시작", popularNicknames.size());
            int successCount = 0;
            int failCount = 0;
            
            for (String nickname : popularNicknames) {
                try {
                    // OUID 조회
                    com.example.jokerweb.nexon.dto.IdResponse idResponse = 
                        nxClient.getIdByUserName(nickname);
                    
                    if (idResponse == null || idResponse.getOuid() == null) {
                        log.debug("OUID 조회 실패: nickname={}", nickname);
                        failCount++;
                        continue;
                    }
                    
                    String ouid = idResponse.getOuid();
                    
                    // 프로필 정보 수집 (캐시에 저장됨)
                    profileService.fetchAndSaveProfile(ouid);
                    
                    // 최근 매치 정보 수집 (비동기로 처리되어 즉시 반환)
                    matchService.fetchMatches(ouid, "all", null);
                    
                    successCount++;
                    log.debug("인기 플레이어 데이터 수집 완료: nickname={}, ouid={}", nickname, ouid);
                    
                    // API Rate Limit을 고려하여 짧은 대기
                    Thread.sleep(200);
                    
                } catch (Exception e) {
                    log.warn("인기 플레이어 데이터 수집 실패: nickname={}, error={}", nickname, e.getMessage());
                    failCount++;
                }
            }
            
            log.info("인기 플레이어 데이터 사전 수집 완료: 성공={}, 실패={}, 총={}", 
                    successCount, failCount, popularNicknames.size());
                    
        } catch (Exception e) {
            log.error("인기 플레이어 데이터 사전 수집 중 오류 발생", e);
        }
    }
}
