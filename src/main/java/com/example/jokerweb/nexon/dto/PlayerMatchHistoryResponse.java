package com.example.jokerweb.nexon.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 플레이어 전적검색 응답 DTO
 * 최근 200게임의 매치 정보와 상세 정보를 포함
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlayerMatchHistoryResponse {

    @JsonProperty("ouid")
    private String ouid;

    @JsonProperty("total_matches")
    private Integer totalMatches;

    @JsonProperty("matches")
    private List<MatchSummaryResponse.MatchSummary> matches;

    @JsonProperty("match_details")
    private MatchDetailsByCategory matchDetails;
    
    /**
     * Final 시즌 랭크전 통계 요약
     */
    @JsonProperty("final_season_stats")
    private FinalSeasonStats finalSeasonStats;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MatchDetailsByCategory {
        /**
         * 랭크전 솔로 매치 상세 정보
         */
        @JsonProperty("ranked_solo")
        private List<MatchDetailSummaryResponse> rankedSolo;

        /**
         * 랭크전 파티 매치 상세 정보
         */
        @JsonProperty("ranked_party")
        private List<MatchDetailSummaryResponse> rankedParty;

        /**
         * 클랜 랭크전 매치 상세 정보
         */
        @JsonProperty("clan_ranked")
        private List<MatchDetailSummaryResponse> clanRanked;

        /**
         * 클랜전 매치 상세 정보
         */
        @JsonProperty("clan_match")
        private List<MatchDetailSummaryResponse> clanMatch;
    }
    
    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FinalSeasonStats {
        @JsonProperty("ranked_solo")
        private RankedStatsSummary rankedSolo;
        
        @JsonProperty("ranked_party")
        private RankedStatsSummary rankedParty;
    }
}
