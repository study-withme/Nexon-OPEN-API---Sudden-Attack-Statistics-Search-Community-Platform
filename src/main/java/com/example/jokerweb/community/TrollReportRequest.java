package com.example.jokerweb.community;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TrollReportRequest {

    @NotBlank
    @Size(max = 64)
    private String targetName;

    @Size(max = 2000)
    private String description;

    @Size(max = 512)
    private String evidenceUrl;
}

