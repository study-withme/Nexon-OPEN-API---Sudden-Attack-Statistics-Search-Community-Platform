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
public class UserListResponse {
    private Long id;
    private String nickname;
    private String email;
    private LocalDateTime joinDate;
    private LocalDateTime lastAccess;
    private String status;
    private String grade;
    private Long postCount;
    private Long commentCount;
    private Long reportCount;
}
