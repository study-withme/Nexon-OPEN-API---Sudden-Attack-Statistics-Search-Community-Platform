package com.example.jokerweb.nexon.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.OffsetDateTime;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MatchDetailResponse {
    @JsonProperty("match_id")
    private String matchId;
    @JsonProperty("match_type")
    private String matchType;
    @JsonProperty("match_mode")
    private String matchMode;
    @JsonProperty("date_match")
    private OffsetDateTime dateMatch;
    @JsonProperty("match_map")
    private String matchMap;
    @JsonProperty("match_detail")
    private List<MatchPlayerDetail> matchDetail;

    @Getter
    @Setter
    public static class MatchPlayerDetail {
        @JsonProperty("team_id")
        private String teamId;
        @JsonProperty("match_result")
        private String matchResult;
        @JsonProperty("user_name")
        private String userName;
        @JsonProperty("season_grade")
        private String seasonGrade;
        @JsonProperty("clan_name")
        private String clanName;
        private Integer kill;
        private Integer death;
        private Integer headshot;
        private Double damage;
        private Integer assist;
    }
}

