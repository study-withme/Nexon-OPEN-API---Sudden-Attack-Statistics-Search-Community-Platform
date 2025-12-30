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
public class ContentReportDetailResponse {
    private Long id;
    private String targetType; // post, comment
    private Long targetId;
    private String reportReason; // spam, abuse, harassment, illegal, inappropriate, other
    private String description;
    private String reporter;
    private LocalDateTime reportedAt;
    private String status; // pending, processing, resolved, rejected
    private String processor;
    private LocalDateTime processedAt;
    private String adminNotes;
    
    // 대상 정보 (게시글 또는 댓글)
    private String targetTitle; // 게시글 제목 또는 댓글 내용 요약
    private String targetAuthor; // 대상 작성자
    private String targetContent; // 대상 내용 (댓글인 경우)
}
