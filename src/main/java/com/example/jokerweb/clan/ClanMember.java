package com.example.jokerweb.clan;

import com.example.jokerweb.member.Member;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.*;

@Entity
@Table(name = "clan_member")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClanMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "clan_id", nullable = false)
    private Clan clan;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Column(length = 32)
    @Builder.Default
    private String role = "member"; // master, officer, member

    @Column(name = "joined_at")
    @Builder.Default
    private LocalDateTime joinedAt = LocalDateTime.now();

    @Column(name = "left_at")
    private LocalDateTime leftAt;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;
}
