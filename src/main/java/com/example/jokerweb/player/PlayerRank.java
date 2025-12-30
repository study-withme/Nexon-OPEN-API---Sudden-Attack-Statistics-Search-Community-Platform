package com.example.jokerweb.player;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "player_rank")
public class PlayerRank {

    @Id
    @Column(length = 64)
    private String ouid;

    @Column(length = 64)
    private String grade;

    private Long gradeExp;
    private Long gradeRanking;

    @Column(length = 64)
    private String seasonGrade;

    private Long seasonGradeExp;
    private Long seasonGradeRanking;

    @Column(length = 64)
    private String soloRankMatchTier;
    private Long soloRankMatchScore;
    @Column(length = 64)
    private String partyRankMatchTier;
    private Long partyRankMatchScore;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    public void touchUpdatedAt() {
        this.updatedAt = LocalDateTime.now();
    }
}

