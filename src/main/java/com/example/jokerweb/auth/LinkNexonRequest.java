package com.example.jokerweb.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LinkNexonRequest {
    @NotBlank
    private String nickname;

    // 사용자가 알고 있다면 직접 입력하도록 허용
    private String ouid;
}
