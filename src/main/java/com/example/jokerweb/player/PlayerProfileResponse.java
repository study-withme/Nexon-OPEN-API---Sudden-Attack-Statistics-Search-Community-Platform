package com.example.jokerweb.player;

import com.example.jokerweb.nexon.dto.UserRankResponse;
import com.example.jokerweb.nexon.dto.UserRecentInfoResponse;
import com.example.jokerweb.nexon.dto.UserTierResponse;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class PlayerProfileResponse {
    private String ouid;
    private String userName;
    private String clanName;
    private String titleName;
    private String mannerGrade;
    private LocalDateTime userDateCreate;
    private String grade;
    private Long gradeRanking;
    private String gradeImage; // API에서 받은 계급 이미지 URL
    private String seasonGrade;
    private Long seasonGradeRanking;
    private String seasonGradeImage; // API에서 받은 시즌 계급 이미지 URL
    private String soloTier;
    private Long soloScore;
    private String soloTierImage; // API에서 받은 티어 이미지 URL
    private String partyTier;
    private Long partyScore;
    private String partyTierImage; // API에서 받은 티어 이미지 URL
    private Double recentWinRate;
    private Double recentKd;
    private Double recentAssault;
    private Double recentSniper;
    private Double recentSpecial;

    public static PlayerProfileResponse from(Player player, PlayerRank rank, UserRecentInfoResponse recent, 
                                            UserTierResponse tier, UserRankResponse rankResponse) {
        return PlayerProfileResponse.builder()
                .ouid(player.getOuid())
                .userName(player.getLatestName())
                .clanName(player.getClanName())
                .titleName(player.getTitleName())
                .mannerGrade(player.getMannerGrade())
                .userDateCreate(player.getUserDateCreate())
                // API에서 받은 계급 정보 직접 사용
                .grade(rankResponse != null ? rankResponse.getGrade() : rank.getGrade())
                .gradeRanking(rankResponse != null ? rankResponse.getGradeRanking() : rank.getGradeRanking())
                .gradeImage(rankResponse != null ? rankResponse.getGradeImage() : null)
                .seasonGrade(rankResponse != null ? rankResponse.getSeasonGrade() : rank.getSeasonGrade())
                .seasonGradeRanking(rankResponse != null ? rankResponse.getSeasonGradeRanking() : rank.getSeasonGradeRanking())
                .seasonGradeImage(rankResponse != null ? rankResponse.getSeasonGradeImage() : null)
                // API에서 받은 티어 정보 직접 사용
                .soloTier(tier != null ? tier.getSoloRankMatchTier() : rank.getSoloRankMatchTier())
                .soloScore(tier != null ? tier.getSoloRankMatchScore() : rank.getSoloRankMatchScore())
                .soloTierImage(tier != null ? tier.getSoloRankMatchTierImage() : null)
                .partyTier(tier != null ? tier.getPartyRankMatchTier() : rank.getPartyRankMatchTier())
                .partyScore(tier != null ? tier.getPartyRankMatchScore() : rank.getPartyRankMatchScore())
                .partyTierImage(tier != null ? tier.getPartyRankMatchTierImage() : null)
                .recentWinRate(recent != null ? recent.getRecentWinRate() : null)
                .recentKd(recent != null ? recent.getRecentKillDeathRate() : null)
                .recentAssault(recent != null ? recent.getRecentAssaultRate() : null)
                .recentSniper(recent != null ? recent.getRecentSniperRate() : null)
                .recentSpecial(recent != null ? recent.getRecentSpecialRate() : null)
                .build();
    }
}

