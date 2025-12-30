package com.example.jokerweb.stats.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PublicStatsResponse {
    private long todaySignups;      // 오늘 가입자
    private long todayVisits;       // 오늘 방문수
    private long totalVisits;       // 총 방문수 (누적)
    private long trollReports;     // 이상탐지
}
