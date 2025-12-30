package com.example.jokerweb.auth;

import com.example.jokerweb.member.Member;
import lombok.Builder;
import lombok.Getter;
import java.util.List;

@Getter
@Builder
public class MemberResponse {
    private Long id;
    private String email;
    private String nickname;
    private List<String> roles;
    private boolean admin;
    private String ouid;
    private String clanName;
    private String titleName;
    private String mannerGrade;
    private boolean nexonLinked;

    public static MemberResponse from(Member member, List<String> roles) {
        return MemberResponse.builder()
                .id(member.getId())
                .email(member.getEmail())
                .nickname(member.getNickname())
                .ouid(member.getOuid())
                .clanName(member.getClanName())
                .titleName(member.getTitleName())
                .mannerGrade(member.getMannerGrade())
                .nexonLinked(member.isNexonLinked())
                .roles(roles)
                .admin(roles.stream().anyMatch(r -> r.equalsIgnoreCase("ADMIN") || r.equalsIgnoreCase("MODERATOR")))
                .build();
    }
}

