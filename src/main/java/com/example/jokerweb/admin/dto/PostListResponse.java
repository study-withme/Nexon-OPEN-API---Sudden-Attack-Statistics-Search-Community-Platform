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
public class PostListResponse {
    private Long id;
    private String title;
    private String author;
    private String category;
    private LocalDateTime createdAt;
    private Integer views;
    private Integer comments;
    private Integer likes;
    private Integer reports;
    private String status;
}
