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
public class ClanDetailResponse {
    private Long id;
    private String clanName;
    private String barracksAddress;
    private String master;
    private String masterEmail;
    private String description;
    private String contact;
    private Boolean isVerified;
    private String verifiedBy;
    private LocalDateTime verifiedAt;
    private Boolean isSuspicious;
    private String suspiciousReason;
    private Integer memberCount;
    private String status; // active, deleted, suspended
    private LocalDateTime deletedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
