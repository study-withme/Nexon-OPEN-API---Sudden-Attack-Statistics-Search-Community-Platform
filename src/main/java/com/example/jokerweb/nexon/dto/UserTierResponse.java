package com.example.jokerweb.nexon.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserTierResponse {
    @JsonProperty("user_name")
    private String userName;
    @JsonProperty("solo_rank_match_tier")
    private String soloRankMatchTier;
    @JsonProperty("solo_rank_match_score")
    private Long soloRankMatchScore;
    @JsonProperty("party_rank_match_tier")
    private String partyRankMatchTier;
    @JsonProperty("party_rank_match_score")
    private Long partyRankMatchScore;
    // 티어 이미지 URL (API 응답에 포함될 수 있음)
    @JsonProperty("solo_rank_match_tier_image")
    private String soloRankMatchTierImage;
    @JsonProperty("party_rank_match_tier_image")
    private String partyRankMatchTierImage;
}

