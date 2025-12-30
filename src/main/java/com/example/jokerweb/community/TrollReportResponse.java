package com.example.jokerweb.community;

import com.example.jokerweb.member.Member;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TrollReportResponse {
    private Long id;
    private String targetName;
    private String description;
    private String evidenceUrl;
    private String reporterNickname;
    private LocalDateTime createdAt;

    public static TrollReportResponse from(BarracksReport report) {
        Member reporter = report.getReporter();
        return TrollReportResponse.builder()
                .id(report.getId())
                .targetName(report.getTargetNickname())
                .description(report.getContent())
                .evidenceUrl(report.getAdminNotes())
                .reporterNickname(reporter != null ? reporter.getNickname() : null)
                .createdAt(report.getCreatedAt())
                .build();
    }
}
