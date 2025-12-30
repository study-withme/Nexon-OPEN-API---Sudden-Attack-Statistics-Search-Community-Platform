package com.example.jokerweb.nexon.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 랭크전 통계 요약 (Final 시즌)
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RankedStatsSummary {
    
    @JsonProperty("match_type")
    private String matchType; // "랭크전 솔로" 또는 "랭크전 파티"
    
    @JsonProperty("total_games")
    private Integer totalGames;
    
    @JsonProperty("wins")
    private Integer wins;
    
    @JsonProperty("losses")
    private Integer losses;
    
    @JsonProperty("win_rate")
    private Double winRate; // 승률 (%)
    
    @JsonProperty("kill_death_ratio")
    private Double killDeathRatio; // 킬뎃 (%)
    
    @JsonProperty("headshot_rate")
    private Double headshotRate; // 헤드샷률 (%)
    
    @JsonProperty("avg_damage")
    private Double avgDamage; // 평균 딜량
    
    @JsonProperty("rank_name")
    private String rankName; // 계급명 (예: "MASTER I")
    
    @JsonProperty("rank_points")
    private Integer rankPoints; // 계급 점수
    
    @JsonProperty("rank_image_url")
    private String rankImageUrl; // 계급 이미지 URL
}
