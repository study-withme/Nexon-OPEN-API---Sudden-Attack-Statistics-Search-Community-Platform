package com.example.jokerweb.admin.service;

import com.example.jokerweb.admin.dto.*;
import com.example.jokerweb.community.BarracksReportRepository;
import com.example.jokerweb.community.CommentRepository;
import com.example.jokerweb.community.PostRepository;
import com.example.jokerweb.logging.AccessLogRepository;
import com.example.jokerweb.member.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminDashboardService {
    
    private final MemberRepository memberRepository;
    private final AccessLogRepository accessLogRepository;
    private final BarracksReportRepository barracksReportRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    
    public DashboardStatsResponse getStats(String period) {
        try {
            LocalDateTime startDate = getStartDate(period);
            LocalDateTime endDate = LocalDateTime.now();
            
            Long newMembers = safeCount(() -> memberRepository.countByCreatedAtBetween(startDate, endDate));
            Long activeUsers = safeCount(() -> getActiveUsersCount(startDate, endDate));
            Long posts = safeCount(() -> getPostsCount(startDate, endDate));
            Long comments = safeCount(() -> getCommentsCount(startDate, endDate));
            Long barracksReports = safeCount(() -> barracksReportRepository.countByCreatedAtBetween(startDate, endDate));
            Long processedReports = safeCount(() -> barracksReportRepository.countByStatusAndProcessedAtBetween("completed", startDate, endDate));
            
            // 방문자 통계 (PV/UV)
            Long visitorsPv = safeCount(() -> getPageViews(startDate, endDate));
            Long visitorsUv = safeCount(() -> getUniqueVisitors(startDate, endDate));
            
            // 가입률 계산
            Double signupRate = safeCalculate(() -> calculateSignupRate(startDate, endDate));
            
            // 처리 대기 중인 신고 수
            Long pendingReports = safeCount(() -> barracksReportRepository.countByStatusAndIsDeletedFalse("pending"));
            
            // 24시간 미처리 신고 수
            LocalDateTime yesterday = LocalDateTime.now().minusHours(24);
            Long unprocessedReports24h = safeCount(() -> barracksReportRepository.countByStatusAndCreatedAtBeforeAndIsDeletedFalse("pending", yesterday));
            
            return DashboardStatsResponse.builder()
                    .newMembers(newMembers)
                    .activeUsers(activeUsers)
                    .posts(posts)
                    .comments(comments)
                    .barracksReports(barracksReports)
                    .processedReports(processedReports)
                    .visitorsPv(visitorsPv)
                    .visitorsUv(visitorsUv)
                    .signupRate(signupRate)
                    .pendingReports(pendingReports)
                    .unprocessedReports24h(unprocessedReports24h)
                    .build();
        } catch (Exception e) {
            log.error("Failed to get dashboard stats", e);
            // 기본값 반환
            return DashboardStatsResponse.builder()
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
        }
    }
    
    private Long safeCount(java.util.function.Supplier<Long> supplier) {
        try {
            Long result = supplier.get();
            return result != null ? result : 0L;
        } catch (Exception e) {
            log.warn("Error counting: {}", e.getMessage());
            return 0L;
        }
    }
    
    private Double safeCalculate(java.util.function.Supplier<Double> supplier) {
        try {
            Double result = supplier.get();
            return result != null ? result : 0.0;
        } catch (Exception e) {
            log.warn("Error calculating: {}", e.getMessage());
            return 0.0;
        }
    }
    
    public List<HourlyAccessData> getHourlyAccessData() {
        try {
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime startOfDay = now.with(LocalTime.MIN);
            
            List<HourlyAccessData> data = new ArrayList<>();
            for (int hour = 0; hour < 24; hour++) {
                LocalDateTime hourStart = startOfDay.plusHours(hour);
                LocalDateTime hourEnd = hourStart.plusHours(1);
                
                Long count = getAccessCountByHour(hourStart, hourEnd);
                data.add(HourlyAccessData.builder()
                        .time(String.format("%02d", hour))
                        .users(count != null ? count : 0L)
                        .build());
            }
            return data;
        } catch (Exception e) {
            log.error("Failed to get hourly access data", e);
            // 빈 데이터 반환 (24시간 모두 0)
            List<HourlyAccessData> emptyData = new ArrayList<>();
            for (int hour = 0; hour < 24; hour++) {
                emptyData.add(HourlyAccessData.builder()
                        .time(String.format("%02d", hour))
                        .users(0L)
                        .build());
            }
            return emptyData;
        }
    }
    
    public List<DailySignupData> getDailySignupData(int days) {
        try {
            LocalDate endDate = LocalDate.now();
            LocalDate startDate = endDate.minusDays(days - 1);
            
            List<DailySignupData> data = new ArrayList<>();
            LocalDate current = startDate;
            while (!current.isAfter(endDate)) {
                LocalDateTime dayStart = current.atStartOfDay();
                LocalDateTime dayEnd = current.plusDays(1).atStartOfDay();
                
                Long count = memberRepository.countByCreatedAtBetween(dayStart, dayEnd);
                data.add(DailySignupData.builder()
                        .date(current.format(DateTimeFormatter.ofPattern("M일")))
                        .count(count != null ? count : 0L)
                        .build());
                current = current.plusDays(1);
            }
            return data;
        } catch (Exception e) {
            log.error("Failed to get daily signup data", e);
            return new ArrayList<>();
        }
    }
    
    public List<CategoryDistribution> getCategoryDistribution() {
        try {
            // 카테고리별 게시글 수 조회
            List<Object[]> results = getPostsByCategory();
            
            if (results == null || results.isEmpty()) {
                return new ArrayList<>();
            }
            
            String[] colors = {"#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444"};
            List<CategoryDistribution> distributions = new ArrayList<>();
            
            int colorIndex = 0;
            for (Object[] result : results) {
                if (result == null || result.length < 2) {
                    continue;
                }
                String category = result[0] != null ? (String) result[0] : "기타";
                Long count = result[1] != null ? ((Number) result[1]).longValue() : 0L;
                distributions.add(CategoryDistribution.builder()
                        .name(category)
                        .value(count)
                        .color(colors[colorIndex % colors.length])
                        .build());
                colorIndex++;
            }
            
            return distributions;
        } catch (Exception e) {
            log.error("Failed to get category distribution", e);
            return new ArrayList<>();
        }
    }
    
    public List<CategoryDistribution> getReportTypeDistribution() {
        try {
            // 신고 유형별 분포 조회
            List<Object[]> results = barracksReportRepository.countByReportType();
            
            if (results == null || results.isEmpty()) {
                log.debug("No report type distribution data found");
                return new ArrayList<>();
            }
            
            // 신고 유형별 색상 매핑
            java.util.Map<String, String> typeColors = java.util.Map.of(
                "비매너", "#ef4444",
                "비인가 프로그램", "#f59e0b",
                "어뷰징", "#8b5cf6",
                "사기", "#3b82f6",
                "troll", "#ef4444"
            );
            
            String[] defaultColors = {"#ef4444", "#f59e0b", "#8b5cf6", "#3b82f6", "#10b981"};
            List<CategoryDistribution> distributions = new ArrayList<>();
            
            int colorIndex = 0;
            for (Object[] result : results) {
                if (result == null || result.length < 2) {
                    log.warn("Invalid report type result: {}", java.util.Arrays.toString(result));
                    continue;
                }
                
                String reportType = result[0] != null ? (String) result[0] : "기타";
                Long count = result[1] != null ? ((Number) result[1]).longValue() : 0L;
                
                // 한글 이름 매핑
                String displayName = switch (reportType) {
                    case "troll" -> "비매너";
                    case "cheat" -> "비인가 프로그램";
                    case "abuse" -> "어뷰징";
                    case "scam" -> "사기";
                    default -> reportType;
                };
                
                String color = typeColors.getOrDefault(displayName, defaultColors[colorIndex % defaultColors.length]);
                
                distributions.add(CategoryDistribution.builder()
                        .name(displayName)
                        .value(count)
                        .color(color)
                        .build());
                colorIndex++;
            }
            
            return distributions;
        } catch (Exception e) {
            log.error("Failed to get report type distribution", e);
            return new ArrayList<>();
        }
    }
    
    public List<RecentActivity> getRecentActivities(int limit) {
        // 최근 활동 조회 (가입, 게시글, 댓글, 신고 등)
        List<RecentActivity> activities = new ArrayList<>();
        
        try {
            // 최근 가입 회원
            int itemsPerType = Math.max(1, limit / 3); // 각 타입별로 균등 분배
            List<Object[]> recentMembers = getRecentMembers(itemsPerType);
            for (Object[] member : recentMembers) {
                if (member != null && member.length >= 2 && member[0] != null) {
                    activities.add(RecentActivity.builder()
                            .type("member")
                            .title("새 회원 가입")
                            .user((String) member[0])
                            .time(formatTimeAgo((LocalDateTime) member[1]))
                            .color("emerald")
                            .build());
                }
            }
        } catch (Exception e) {
            // 에러 발생 시 해당 타입만 제외하고 계속 진행
            log.warn("Failed to fetch recent members: {}", e.getMessage());
        }
        
        try {
            // 최근 게시글
            int itemsPerType = Math.max(1, limit / 3);
            List<Object[]> recentPosts = getRecentPosts(itemsPerType);
            for (Object[] post : recentPosts) {
                if (post != null && post.length >= 2 && post[0] != null) {
                    activities.add(RecentActivity.builder()
                            .type("post")
                            .title("새 게시글 작성")
                            .user((String) post[0])
                            .time(formatTimeAgo((LocalDateTime) post[1]))
                            .color("blue")
                            .build());
                }
            }
        } catch (Exception e) {
            log.warn("Failed to fetch recent posts: {}", e.getMessage());
        }
        
        try {
            // 최근 신고
            int itemsPerType = Math.max(1, limit / 3);
            List<Object[]> recentReports = getRecentReports(itemsPerType);
            for (Object[] report : recentReports) {
                if (report != null && report.length >= 2 && report[0] != null) {
                    activities.add(RecentActivity.builder()
                            .type("report")
                            .title("병영신고 접수")
                            .user((String) report[0])
                            .time(formatTimeAgo((LocalDateTime) report[1]))
                            .color("red")
                            .build());
                }
            }
        } catch (Exception e) {
            log.warn("Failed to fetch recent reports: {}", e.getMessage());
        }
        
        // 빈 리스트일 경우 정렬하지 않고 바로 반환
        if (activities.isEmpty()) {
            log.debug("No recent activities found");
            return activities;
        }
        
        // 시간 순으로 정렬하여 최신순으로 반환
        // formatTimeAgo는 "방금 전", "N분 전", "N시간 전", "N일 전" 형식
        // 간단한 정렬을 위해 생성된 순서대로 반환 (이미 시간 순서대로 조회됨)
        return activities.stream()
                .limit(limit)
                .collect(Collectors.toList());
    }
    
    private LocalDateTime getStartDate(String period) {
        LocalDateTime now = LocalDateTime.now();
        return switch (period) {
            case "today" -> now.with(LocalTime.MIN);
            case "week" -> now.minusWeeks(1).with(LocalTime.MIN);
            case "month" -> now.minusMonths(1).with(LocalTime.MIN);
            default -> now.with(LocalTime.MIN);
        };
    }
    
    private Long getActiveUsersCount(LocalDateTime start, LocalDateTime end) {
        // 최근 접속한 사용자 수 (AccessLog 기반)
        return accessLogRepository.countDistinctMemberIdByCreatedAtBetween(start, end);
    }
    
    private Long getPostsCount(LocalDateTime start, LocalDateTime end) {
        return postRepository.countByCreatedAtBetween(start, end);
    }
    
    private Long getCommentsCount(LocalDateTime start, LocalDateTime end) {
        return commentRepository.countByCreatedAtBetween(start, end);
    }
    
    private Long getPageViews(LocalDateTime start, LocalDateTime end) {
        return accessLogRepository.countByCreatedAtBetween(start, end);
    }
    
    private Long getUniqueVisitors(LocalDateTime start, LocalDateTime end) {
        return accessLogRepository.countDistinctIpAddressByCreatedAtBetween(start, end);
    }
    
    private Double calculateSignupRate(LocalDateTime start, LocalDateTime end) {
        Long newMembers = memberRepository.countByCreatedAtBetween(start, end);
        Long totalVisitors = getUniqueVisitors(start, end);
        if (totalVisitors == 0) {
            return 0.0;
        }
        return (newMembers.doubleValue() / totalVisitors.doubleValue()) * 100;
    }
    
    private Long getAccessCountByHour(LocalDateTime start, LocalDateTime end) {
        // 시간대별 접속 수는 occurredAt 기반으로 조회 (AccessLog의 occurredAt 필드 사용)
        return accessLogRepository.countByOccurredAtBetween(start, end);
    }
    
    private List<Object[]> getPostsByCategory() {
        return postRepository.countByCategory();
    }
    
    private List<Object[]> getRecentMembers(int limit) {
        return memberRepository.findRecentMembers(limit);
    }
    
    private List<Object[]> getRecentPosts(int limit) {
        return postRepository.findRecentPosts(limit);
    }
    
    private List<Object[]> getRecentReports(int limit) {
        // 최근 신고 조회
        return barracksReportRepository.findRecentReports(limit);
    }
    
    private String formatTimeAgo(LocalDateTime dateTime) {
        LocalDateTime now = LocalDateTime.now();
        long minutes = java.time.Duration.between(dateTime, now).toMinutes();
        
        if (minutes < 1) {
            return "방금 전";
        } else if (minutes < 60) {
            return minutes + "분 전";
        } else {
            long hours = minutes / 60;
            if (hours < 24) {
                return hours + "시간 전";
            } else {
                long days = hours / 24;
                return days + "일 전";
            }
        }
    }
}
