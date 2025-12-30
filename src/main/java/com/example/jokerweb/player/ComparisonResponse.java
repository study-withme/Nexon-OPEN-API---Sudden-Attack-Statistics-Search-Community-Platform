package com.example.jokerweb.player;

import com.example.jokerweb.nexon.dto.UserBasicResponse;
import com.example.jokerweb.nexon.dto.UserRankResponse;
import com.example.jokerweb.nexon.dto.UserTierResponse;
import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ComparisonResponse {
    
    private PlayerComparison player1;
    private PlayerComparison player2;
    
    @Getter
    @Builder
    public static class PlayerComparison {
        private String ouid;
        private String nickname;
        private UserBasicResponse basic;
        private UserRankResponse rank;
        private UserTierResponse tier;
        private List<InsightResponses.MapStat> mapStats;
        private List<InsightResponses.TimeBucketStat> timeStats;
        private List<InsightResponses.RankedStats> rankedStats;
    }
}
