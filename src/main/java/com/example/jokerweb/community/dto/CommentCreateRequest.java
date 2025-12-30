package com.example.jokerweb.community.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CommentCreateRequest {
    private Long postId;
    @NotBlank
    private String content;
    private Long parentId; // 대댓글의 경우 부모 댓글 ID
    private Boolean anonymous = false; // 익명 댓글 여부
    private String password; // 비로그인 댓글 비밀번호
}
