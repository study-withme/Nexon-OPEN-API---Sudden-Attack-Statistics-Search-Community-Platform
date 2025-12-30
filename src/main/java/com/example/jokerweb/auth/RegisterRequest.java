package com.example.jokerweb.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegisterRequest {

    @Email
    @NotBlank
    private String email;

    @Size(min = 2, max = 16)
    private String nickname;

    @NotBlank
    @Size(min = 8, max = 64)
    private String password;

    // 선택 사항: OUID는 넥슨 계정과 연동할 때 사용
    private String ouid;
}

