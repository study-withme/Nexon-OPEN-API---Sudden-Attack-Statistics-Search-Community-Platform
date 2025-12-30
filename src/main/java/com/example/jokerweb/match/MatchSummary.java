package com.example.jokerweb.match;

import com.example.jokerweb.nexon.dto.MatchResult;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 매치 요약 정보를 저장하는 Entity
 * match_id를 기준으로 upsert 수행
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "match_summary")
public class MatchSummary {

    @Id
    @Column(name = "match_id", length = 64)
    private String matchId;

    @Column(name = "match_type", length = 64)
    private String matchType;

    @Column(name = "match_mode", length = 64)
    private String matchMode;

    @Column(name = "date_match_utc", nullable = false)
    private LocalDateTime dateMatchUtc;

    @Column(name = "match_result", length = 16)
    @Enumerated(EnumType.STRING)
    private MatchResult matchResult;

    /**
     * 킬 수 (MariaDB 예약어 회피를 위해 kill_count 사용)
     */
    @Column(name = "kill_count")
    private Integer kill;

    /**
     * 데스 수 (MariaDB 예약어 회피를 위해 death_count 사용)
     */
    @Column(name = "death_count")
    private Integer death;

    /**
     * 어시스트 수 (MariaDB 예약어 회피를 위해 assist_count 사용)
     */
    @Column(name = "assist_count")
    private Integer assist;

    @Column(name = "last_fetched_at", nullable = false)
    @Builder.Default
    private LocalDateTime lastFetchedAt = LocalDateTime.now();

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}
