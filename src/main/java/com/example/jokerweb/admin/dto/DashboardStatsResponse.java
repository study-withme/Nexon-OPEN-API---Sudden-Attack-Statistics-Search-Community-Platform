package com.example.jokerweb.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsResponse {
    private Long newMembers;
    private Long activeUsers;
    private Long posts;
    private Long comments;
    private Long barracksReports;
    private Long processedReports;
    private Long visitorsPv;
    private Long visitorsUv;
    private Double signupRate;
    private Long pendingReports;
    private Long unprocessedReports24h;
}
