package com.example.jokerweb.community.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 병영수첩 주소와 플레이어 기본 정보를 함께 내려주기 위한 응답 DTO.
 *
 * 병영신고 작성 화면에서 닉네임/병영주소를 자동으로 채우는 데 사용된다.
 */
@Getter
@AllArgsConstructor
public class BarracksResolveResponse {

    private final String nickname;
    private final String clanName;
    private final String ouid;
    private final String barracksId;
    private final String barracksUrl;
}

