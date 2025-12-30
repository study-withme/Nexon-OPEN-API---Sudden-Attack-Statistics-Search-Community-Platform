package com.example.jokerweb.logging;

import com.example.jokerweb.member.Member;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "access_log")
public class AccessLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "occurred_at")
    private LocalDateTime occurredAt = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id")
    private Member member;

    @Column(length = 64)
    private String anonymousId;

    @Column(name = "is_member", nullable = false)
    private boolean memberFlag;

    @Column(name = "client_ip", length = 64, nullable = false)
    private String clientIp;

    @Column(columnDefinition = "TEXT")
    private String userAgent;

    @Column(length = 512)
    private String requestPath;

    @Column(length = 8)
    private String httpMethod;

    private Integer responseStatus;

    @Column(length = 512)
    private String referrer;

    @Column(length = 64)
    private String traceId;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
