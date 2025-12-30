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
@Table(name = "player")
public class Player {

    @Id
    @Column(length = 64)
    private String ouid;

    @Column(nullable = false, length = 64)
    private String latestName;

    @Column(length = 128)
    private String clanName;

    @Column(length = 128)
    private String titleName;

    @Column(length = 32)
    private String mannerGrade;

    private LocalDateTime userDateCreate;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    public void touchUpdatedAt() {
        this.updatedAt = LocalDateTime.now();
    }
}

