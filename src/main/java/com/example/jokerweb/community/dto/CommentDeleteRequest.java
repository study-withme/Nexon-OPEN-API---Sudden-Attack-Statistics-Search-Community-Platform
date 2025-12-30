package com.example.jokerweb.community.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CommentDeleteRequest {
    private String password; // 비로그인 댓글 삭제용 비밀번호
}
