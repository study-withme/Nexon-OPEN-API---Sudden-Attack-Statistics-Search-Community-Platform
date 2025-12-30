package com.example.jokerweb.clan;

import com.example.jokerweb.member.Member;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.*;

@Entity
@Table(name = "clan_delete_request")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClanDeleteRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "clan_id", nullable = false)
    private Clan clan;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requested_by", nullable = false)
    private Member requestedBy;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(length = 32)
    @Builder.Default
    private String status = "pending"; // pending, approved, rejected

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "processed_by")
    private Member processedBy;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}
