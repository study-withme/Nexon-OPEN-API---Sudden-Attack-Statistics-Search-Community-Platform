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
 * 매치 정보 조회 API 응답 DTO
 * Nexon API 응답을 표준 포맷으로 변환하여 제공
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MatchSummaryResponse {

    @JsonProperty("matches")
    private List<MatchSummary> matches;

    @JsonProperty("cursor")
    private String cursor;

    @JsonProperty("hasMore")
    private Boolean hasMore;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MatchSummary {
        /**
         * 매치 ID (string으로 처리, 절대 long으로 파싱하지 않음)
         */
        @JsonProperty("match_id")
        private String matchId;

        @JsonProperty("match_type")
        private String matchType;

        @JsonProperty("match_mode")
        private String matchMode;

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

        /**
         * 매치 결과 (enum: WIN, LOSE, UNKNOWN)
         */
        @JsonProperty("match_result")
        private MatchResult matchResult;

        @JsonProperty("kill")
        private Integer kill;

        @JsonProperty("death")
        private Integer death;

        @JsonProperty("assist")
        private Integer assist;

        /**
         * Nexon API의 MatchItem을 MatchSummary로 변환
         * @param item Nexon API MatchItem
         * @param useKst KST 시간대 사용 여부
         */
        public static MatchSummary fromMatchItem(MatchListResponse.MatchItem item, boolean useKst) {
            OffsetDateTime dateMatch = item.getDateMatch();
            OffsetDateTime dateMatchKst = null;
            
            // UTC를 KST로 변환 (UTC+9)
            if (dateMatch != null) {
                ZonedDateTime zonedUtc = dateMatch.atZoneSameInstant(ZoneId.of("UTC"));
                ZonedDateTime zonedKst = zonedUtc.withZoneSameInstant(ZoneId.of("Asia/Seoul"));
                dateMatchKst = zonedKst.toOffsetDateTime();
            }

            return MatchSummary.builder()
                    .matchId(item.getMatchId())
                    .matchType(item.getMatchType())
                    .matchMode(item.getMatchMode())
                    .dateMatch(useKst ? dateMatchKst : dateMatch)
                    .dateMatchKst(dateMatchKst)
                    .matchResult(MatchResult.fromApiValue(item.getMatchResult()))
                    .kill(item.getKill())
                    .death(item.getDeath())
                    .assist(item.getAssist())
                    .build();
        }
    }
}
