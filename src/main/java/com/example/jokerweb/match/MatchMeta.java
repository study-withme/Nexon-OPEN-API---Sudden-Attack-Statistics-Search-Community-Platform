package com.example.jokerweb.match;

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
@Table(name = "match_meta")
public class MatchMeta {

    @Id
    @Column(name = "match_id", length = 64)
    private String matchId;

    @Column(length = 64)
    private String matchType;

    @Column(length = 64)
    private String matchMode;

    @Column(length = 128)
    private String matchMap;

    @Column(length = 16)
    private String matchResult;

    @Column(nullable = false)
    private LocalDateTime dateMatchUtc;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}

