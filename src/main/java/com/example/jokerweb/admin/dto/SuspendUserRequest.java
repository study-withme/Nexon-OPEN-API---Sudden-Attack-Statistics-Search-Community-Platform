package com.example.jokerweb.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SuspendUserRequest {
    private String period; // "1일", "3일", "7일", "30일", "영구"
    private String reason;
}
