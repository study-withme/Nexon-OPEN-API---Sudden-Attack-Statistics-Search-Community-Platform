package com.example.jokerweb.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProcessContentReportRequest {
    private String action; // approve, reject
    private String reason; // 처리 사유
    private String adminNotes; // 관리자 메모
}
