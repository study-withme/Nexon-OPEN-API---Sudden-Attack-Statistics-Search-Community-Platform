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
public class ClanListResponse {
    private Long id;
    private String clanName;
    private String barracksAddress;
    private String master;
    private Integer memberCount;
    private Boolean isVerified;
    private String status; // active, deleted, suspended
    private LocalDateTime createdAt;
}
