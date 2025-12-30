package com.example.jokerweb.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProcessBarracksReportRequest {
    private String status; // 처리중, 완료, 반려
    private String reason;
    private String action; // none, warning, suspend
    private String actionPeriod; // 정지 기간
}
