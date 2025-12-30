package com.example.jokerweb.community.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BarracksReportCreateRequest {
    @NotBlank
    private String targetNickname;
    private String targetOuid;
    @NotBlank
    private String barracksAddress;
    @NotBlank
    private String reportType;
    @NotBlank
    private String title;
    @NotBlank
    private String content;
    private Boolean anonymous = false;
}
