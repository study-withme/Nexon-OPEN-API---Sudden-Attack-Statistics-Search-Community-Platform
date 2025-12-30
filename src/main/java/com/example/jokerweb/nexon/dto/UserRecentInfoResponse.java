package com.example.jokerweb.nexon.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserRecentInfoResponse {
    @JsonProperty("user_name")
    private String userName;
    @JsonProperty("recent_win_rate")
    private Double recentWinRate;
    @JsonProperty("recent_kill_death_rate")
    private Double recentKillDeathRate;
    @JsonProperty("recent_assault_rate")
    private Double recentAssaultRate;
    @JsonProperty("recent_sniper_rate")
    private Double recentSniperRate;
    @JsonProperty("recent_special_rate")
    private Double recentSpecialRate;
}

