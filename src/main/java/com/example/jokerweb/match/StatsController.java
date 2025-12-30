package com.example.jokerweb.match;

import com.example.jokerweb.player.InsightResponses;
import com.example.jokerweb.stats.PublicStatsService;
import com.example.jokerweb.stats.dto.PublicStatsResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
public class StatsController {

    private final GlobalStatsService globalStatsService;
    private final PublicStatsService publicStatsService;

    @GetMapping("/map")
    public ResponseEntity<List<InsightResponses.MapStat>> mapStats() {
        return ResponseEntity.ok(globalStatsService.getGlobalMapStats());
    }

    @GetMapping("/time")
    public ResponseEntity<List<InsightResponses.TimeBucketStat>> timeStats() {
        return ResponseEntity.ok(globalStatsService.getGlobalTimeStats());
    }

    @GetMapping("/public")
    public ResponseEntity<PublicStatsResponse> publicStats() {
        try {
            log.info("공개 통계 API 호출됨");
            PublicStatsResponse response = publicStatsService.getPublicStats();
            log.info("공개 통계 조회 성공: todaySignups={}, todayVisits={}, totalVisits={}, trollReports={}", 
                    response.getTodaySignups(), response.getTodayVisits(), 
                    response.getTotalVisits(), response.getTrollReports());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("공개 통계 API 오류 발생", e);
            throw e;
        }
    }
}
