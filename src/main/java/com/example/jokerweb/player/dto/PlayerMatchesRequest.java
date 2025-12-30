package com.example.jokerweb.player.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PlayerMatchesRequest {
    @NotBlank(message = "ouid 파라미터는 필수입니다.")
    private String ouid;
    
    @NotBlank(message = "mode 파라미터는 필수입니다.")
    private String mode;
    
    private String type; // 선택적
}
