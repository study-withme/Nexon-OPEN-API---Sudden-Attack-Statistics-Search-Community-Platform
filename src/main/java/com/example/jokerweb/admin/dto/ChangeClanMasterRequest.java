package com.example.jokerweb.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChangeClanMasterRequest {
    private Long newMasterId; // 새로운 마스터 회원 ID
    private String reason; // 변경 사유
}
