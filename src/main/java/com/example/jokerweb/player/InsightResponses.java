package com.example.jokerweb.player;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class InsightResponses {

    @Getter
    @Builder
    public static class MapStat {
        private String matchMap;
        private Long games;
        private Long wins;
        private Double winRate;
        private Double kd;
        private Double hsr;
    }

    @Getter
    @Builder
    public static class TimeBucketStat {
        private Integer hourKst;
        private Long games;
        private Long wins;
        private Double winRate;
        private Double kd;
        private Double damage; // 평균 딜량
    }

    @Getter
    @Builder
    public static class RankedStats {
        private String queueType; // "solo", "party", or "clan"
        private Long games;
        private Long wins;
        private Double winRate;
        private Double kda; // (kill + assist) / death
        private Double kd; // kill / death
        private Double avgDamage;
        private Double skillScore; // 숙련 등급 점수 (0-100)
        private String skillGrade; // 초보, 일반, 숙련, 고수, 장인, 전설
        private String description; // 등급 설명
    }
}

