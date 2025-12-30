package com.example.jokerweb.community.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PostUpdateRequest {
    @NotBlank
    private String title;
    @NotBlank
    private String content;
    private Boolean anonymous = false; // 익명 게시글 여부
    private String password; // 비로그인(게스트) 게시글 수정용 비밀번호
}
