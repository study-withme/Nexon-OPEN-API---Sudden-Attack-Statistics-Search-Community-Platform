package com.example.jokerweb.nexon.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.OffsetDateTime;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MatchListResponse {

    @JsonProperty("match")
    private List<MatchItem> match;

    @Getter
    @Setter
    public static class MatchItem {
        @JsonProperty("match_id")
        private String matchId;
        @JsonProperty("match_type")
        private String matchType;
        @JsonProperty("match_mode")
        private String matchMode;
        @JsonProperty("date_match")
        private OffsetDateTime dateMatch;
        @JsonProperty("match_result")
        private String matchResult;
        private Integer kill;
        private Integer death;
        private Integer assist;
    }
}

