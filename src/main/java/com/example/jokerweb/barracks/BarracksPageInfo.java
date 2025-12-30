package com.example.jokerweb.barracks;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 넥슨 병영수첩 페이지에서 스크래핑한 최소 정보.
 */
@Getter
@AllArgsConstructor
public class BarracksPageInfo {

    /**
     * 병영수첩 고유 번호 (profile.aspx?sn={barracksId} 의 sn 값)
     */
    private final String barracksId;

    /**
     * 병영 페이지에 표시되는 닉네임.
     * HTML 구조 변경 시 null 이 될 수 있음.
     */
    private final String nickname;

    /**
     * 병영 페이지에 표시되는 클랜명.
     * 클랜이 없거나 파싱 실패 시 null.
     */
    private final String clanName;

    /**
     * 리다이렉트/파라미터 정리 이후의 정규화된 병영수첩 URL.
     */
    private final String canonicalUrl;
}

