package com.example.jokerweb.community.dto;

import com.example.jokerweb.common.SecurityUtils;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PostCreateRequest {
    @NotBlank(message = "카테고리는 필수입니다.")
    @Size(max = 32, message = "카테고리는 32자 이하여야 합니다.")
    private String category;
    
    @NotBlank(message = "제목은 필수입니다.")
    @Size(max = 255, message = "제목은 255자 이하여야 합니다.")
    private String title;
    
    @NotBlank(message = "내용은 필수입니다.")
    @Size(max = 10000, message = "내용은 10000자 이하여야 합니다.")
    private String content;
    private Boolean anonymous = false; // 익명 게시글 여부
    private String password; // 비로그인 게시글 비밀번호
}
