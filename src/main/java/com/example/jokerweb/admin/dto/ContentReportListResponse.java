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
public class ContentReportListResponse {
    private Long id;
    private String targetType; // post, comment
    private Long targetId;
    private String reportReason; // spam, abuse, harassment, illegal, inappropriate, other
    private String reporter;
    private LocalDateTime reportedAt;
    private String status; // pending, processing, resolved, rejected
    private String processor;
    private LocalDateTime processedAt;
}
