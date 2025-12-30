package com.example.jokerweb.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDetailResponse {
    private Long id;
    private String nickname;
    private String email;
    private LocalDateTime joinDate;
    private LocalDateTime lastAccess;
    private String status;
    private String grade;
    private UserStats stats;
    private List<String> roles;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserStats {
        private Long postCount;
        private Long commentCount;
        private Long likes;
        private Long reportCount;
        private Long reportedCount;
    }
}
