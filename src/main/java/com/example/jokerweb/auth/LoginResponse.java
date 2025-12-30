package com.example.jokerweb.auth;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class LoginResponse {
    private String token;
    private MemberResponse member;
}

