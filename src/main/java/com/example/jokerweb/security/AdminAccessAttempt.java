package com.example.jokerweb.security;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "admin_access_attempt", indexes = {
    @Index(name = "idx_admin_access_ip", columnList = "client_ip"),
    @Index(name = "idx_admin_access_time", columnList = "attempted_at")
})
public class AdminAccessAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "client_ip", length = 64, nullable = false)
    private String clientIp;

    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;

    @Column(name = "request_path", length = 512)
    private String requestPath;

    @Column(name = "has_auth", nullable = false)
    private boolean hasAuth;

    @Column(name = "is_blocked", nullable = false)
    @Builder.Default
    private boolean blocked = false;

    @Column(name = "attempted_at", nullable = false)
    @Builder.Default
    private LocalDateTime attemptedAt = LocalDateTime.now();
}
