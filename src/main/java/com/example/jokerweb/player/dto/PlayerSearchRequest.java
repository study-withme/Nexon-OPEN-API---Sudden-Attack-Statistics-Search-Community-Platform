package com.example.jokerweb.player.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PlayerSearchRequest {
    @NotBlank(message = "name 파라미터는 필수입니다.")
    private String name;
}
