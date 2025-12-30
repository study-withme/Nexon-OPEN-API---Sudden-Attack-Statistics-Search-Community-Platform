package com.example.jokerweb.admin.controller;

import com.example.jokerweb.admin.dto.*;
import com.example.jokerweb.admin.service.AdminDashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminDashboardController {
    
    private final AdminDashboardService dashboardService;
    
    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsResponse> getStats(
            @RequestParam(defaultValue = "today") String period
    ) {
        try {
            DashboardStatsResponse stats = dashboardService.getStats(period);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Failed to get stats", e);
            // 기본값 반환
            DashboardStatsResponse defaultStats = DashboardStatsResponse.builder()
                    .newMembers(0L)
                    .activeUsers(0L)
                    .posts(0L)
                    .comments(0L)
                    .barracksReports(0L)
                    .processedReports(0L)
                    .visitorsPv(0L)
                    .visitorsUv(0L)
                    .signupRate(0.0)
                    .pendingReports(0L)
                    .unprocessedReports24h(0L)
                    .build();
            return ResponseEntity.ok(defaultStats);
        }
    }
    
    @GetMapping("/charts/hourly-access")
    public ResponseEntity<List<HourlyAccessData>> getHourlyAccessData() {
        try {
            List<HourlyAccessData> data = dashboardService.getHourlyAccessData();
            return ResponseEntity.ok(data);
        } catch (Exception e) {
            log.error("Failed to get hourly access data", e);
            return ResponseEntity.ok(java.util.Collections.emptyList());
        }
    }
    
    @GetMapping("/charts/daily-signups")
    public ResponseEntity<List<DailySignupData>> getDailySignupData(
            @RequestParam(defaultValue = "7") int days
    ) {
        try {
            List<DailySignupData> data = dashboardService.getDailySignupData(days);
            return ResponseEntity.ok(data);
        } catch (Exception e) {
            log.error("Failed to get daily signup data", e);
            return ResponseEntity.ok(java.util.Collections.emptyList());
        }
    }
    
    @GetMapping("/charts/category-distribution")
    public ResponseEntity<List<CategoryDistribution>> getCategoryDistribution() {
        try {
            List<CategoryDistribution> data = dashboardService.getCategoryDistribution();
            return ResponseEntity.ok(data);
        } catch (Exception e) {
            log.error("Failed to get category distribution", e);
            return ResponseEntity.ok(java.util.Collections.emptyList());
        }
    }
    
    @GetMapping("/charts/report-type-distribution")
    public ResponseEntity<List<CategoryDistribution>> getReportTypeDistribution() {
        try {
            List<CategoryDistribution> data = dashboardService.getReportTypeDistribution();
            return ResponseEntity.ok(data);
        } catch (Exception e) {
            // 예외 발생 시 빈 리스트 반환하여 다른 기능은 정상 작동하도록
            log.error("Failed to get report type distribution", e);
            return ResponseEntity.ok(java.util.Collections.emptyList());
        }
    }
    
    @GetMapping("/activities")
    public ResponseEntity<List<RecentActivity>> getRecentActivities(
            @RequestParam(defaultValue = "10") int limit
    ) {
        try {
            List<RecentActivity> activities = dashboardService.getRecentActivities(limit);
            return ResponseEntity.ok(activities);
        } catch (Exception e) {
            // 예외 발생 시 빈 리스트 반환하여 다른 기능은 정상 작동하도록
            log.error("Failed to get recent activities", e);
            return ResponseEntity.ok(java.util.Collections.emptyList());
        }
    }
}
