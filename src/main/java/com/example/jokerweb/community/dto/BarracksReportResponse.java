package com.example.jokerweb.community.dto;

import com.example.jokerweb.community.BarracksReport;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class BarracksReportResponse {
    private Long id;
    private String targetNickname;
    private String targetOuid;
    private String barracksAddress;
    private String reportType;
    private String title;
    private String content;
    private Boolean anonymous;
    private String status;
    private String reporter;
    private LocalDateTime createdAt;
    private String banStatus;
    private LocalDateTime banCheckedAt;
    private Integer totalReportCount;

    public static BarracksReportResponse from(BarracksReport report) {
        return BarracksReportResponse.builder()
                .id(report.getId())
                .targetNickname(report.getTargetNickname())
                .targetOuid(report.getTargetOuid())
                .barracksAddress(report.getBarracksAddress())
                .reportType(report.getReportType())
                .title(report.getTitle())
                .content(report.getContent())
                .anonymous(report.getIsAnonymous())
                .status(report.getStatus())
                .reporter(report.getReporter() != null ? report.getReporter().getNickname() : null)
                .createdAt(report.getCreatedAt())
                .banStatus(report.getBanStatus())
                .banCheckedAt(report.getBanCheckedAt())
                .totalReportCount(report.getTotalReportCount())
                .build();
    }
}
