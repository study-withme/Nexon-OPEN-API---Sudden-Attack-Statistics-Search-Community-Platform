package com.example.jokerweb.match;

import com.example.jokerweb.player.Player;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
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
@Table(name = "match_player")
@IdClass(MatchPlayerId.class)
public class MatchPlayer {

    @Id
    @Column(name = "match_id", length = 64)
    private String matchId;

    @Id
    @Column(name = "ouid", length = 64)
    private String ouid;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "match_id", referencedColumnName = "match_id", insertable = false, updatable = false)
    private MatchMeta matchMeta;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ouid", referencedColumnName = "ouid", insertable = false, updatable = false)
    private Player player;

    @Column(length = 32)
    private String teamId;

    @Column(length = 16)
    private String matchResult;

    @Column(length = 64)
    private String userName;

    @Column(length = 64)
    private String seasonGrade;

    @Column(length = 128)
    private String clanName;

    private Integer killCount;
    private Integer deathCount;
    private Integer assistCount;
    private Integer headshot;
    private Double damage;
}

