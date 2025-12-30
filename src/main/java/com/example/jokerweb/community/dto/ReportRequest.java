package com.example.jokerweb.community.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReportRequest {
    
    @NotBlank(message = "신고 사유는 필수입니다.")
    @Size(max = 100, message = "신고 사유는 100자 이하여야 합니다.")
    private String reason;
    
    @Size(max = 1000, message = "상세 설명은 1000자 이하여야 합니다.")
    private String description;
}

