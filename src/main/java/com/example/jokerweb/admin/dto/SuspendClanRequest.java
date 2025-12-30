package com.example.jokerweb.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SuspendClanRequest {
    private String reason; // 정지 사유
    private Integer periodDays; // 정지 기간 (일), null이면 영구 정지
}
