package com.example.jokerweb.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BarracksReportListResponse {
    private Long id;
    private String targetNickname;
    private String barracksAddress;
    private String reportType;
    private Integer reportCount;
    private LocalDateTime reportedAt;
    private String status;
    private String processor;
}
