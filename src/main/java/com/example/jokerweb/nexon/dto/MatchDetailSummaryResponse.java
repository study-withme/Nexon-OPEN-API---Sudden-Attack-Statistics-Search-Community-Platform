package com.example.jokerweb.nexon.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 매치 상세 정보 조회 API 응답 DTO
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MatchDetailSummaryResponse {

    @JsonProperty("match_id")
    private String matchId;

    @JsonProperty("match_type")
    private String matchType;

    @JsonProperty("match_mode")
    private String matchMode;

    @JsonProperty("match_map")
    private String matchMap;

    /**
     * 매치 날짜 (ISO 8601 형식, UTC)
     */
    @JsonProperty("date_match")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ssXXX")
    private OffsetDateTime dateMatch;

    /**
     * 매치 날짜 (KST, 한국 시간)
     */
    @JsonProperty("date_match_kst")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ssXXX")
    private OffsetDateTime dateMatchKst;

    @JsonProperty("players")
    private List<PlayerDetail> players;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlayerDetail {
        @JsonProperty("team_id")
        private String teamId;

        @JsonProperty("match_result")
        private MatchResult matchResult;

        @JsonProperty("user_name")
        private String userName;

        @JsonProperty("season_grade")
        private String seasonGrade;

        @JsonProperty("season_grade_image")
        private String seasonGradeImage;

        @JsonProperty("clan_name")
        private String clanName;

        @JsonProperty("kill")
        private Integer kill;

        @JsonProperty("death")
        private Integer death;

        @JsonProperty("headshot")
        private Integer headshot;

        @JsonProperty("damage")
        private Double damage;

        @JsonProperty("assist")
        private Integer assist;
    }

    /**
     * Nexon API의 MatchDetailResponse를 MatchDetailSummaryResponse로 변환
     */
    public static MatchDetailSummaryResponse fromMatchDetailResponse(
            MatchDetailResponse detail,
            boolean useKst,
            com.example.jokerweb.nexon.MetadataService metadataService
    ) {
        OffsetDateTime dateMatch = detail.getDateMatch();
        OffsetDateTime dateMatchKst = null;

        // UTC를 KST로 변환
        if (dateMatch != null) {
            ZonedDateTime zonedUtc = dateMatch.atZoneSameInstant(ZoneId.of("UTC"));
            ZonedDateTime zonedKst = zonedUtc.withZoneSameInstant(ZoneId.of("Asia/Seoul"));
            dateMatchKst = zonedKst.toOffsetDateTime();
        }

        List<PlayerDetail> players = detail.getMatchDetail() != null
                ? detail.getMatchDetail().stream()
                        .map(p -> {
                            // 계급 이미지 URL 조회
                            String seasonGradeImage = null;
                            if (p.getSeasonGrade() != null && metadataService != null) {
                                seasonGradeImage = metadataService.getSeasonGradeImageUrl(p.getSeasonGrade());
                            }
                            
                            return PlayerDetail.builder()
                                    .teamId(p.getTeamId())
                                    .matchResult(MatchResult.fromApiValue(p.getMatchResult()))
                                    .userName(p.getUserName())
                                    .seasonGrade(p.getSeasonGrade())
                                    .seasonGradeImage(seasonGradeImage)
                                    .clanName(p.getClanName())
                                    .kill(p.getKill())
                                    .death(p.getDeath())
                                    .headshot(p.getHeadshot())
                                    .damage(p.getDamage())
                                    .assist(p.getAssist())
                                    .build();
                        })
                        .toList()
                : List.of();

        return MatchDetailSummaryResponse.builder()
                .matchId(detail.getMatchId())
                .matchType(detail.getMatchType())
                .matchMode(detail.getMatchMode())
                .matchMap(detail.getMatchMap())
                .dateMatch(useKst ? dateMatchKst : dateMatch)
                .dateMatchKst(dateMatchKst)
                .players(players)
                .build();
    }
}
