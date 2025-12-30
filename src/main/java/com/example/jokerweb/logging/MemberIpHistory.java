package com.example.jokerweb.logging;

import com.example.jokerweb.member.Member;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "member_ip_history",
        uniqueConstraints = @UniqueConstraint(name = "uk_member_ip", columnNames = {"member_id", "client_ip"}))
public class MemberIpHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Column(name = "client_ip", length = 64, nullable = false)
    private String clientIp;

    @Column(name = "first_seen_at", nullable = false)
    private LocalDateTime firstSeenAt = LocalDateTime.now();

    @Column(name = "last_seen_at", nullable = false)
    private LocalDateTime lastSeenAt = LocalDateTime.now();

    public void touch() {
        this.lastSeenAt = LocalDateTime.now();
    }
}
