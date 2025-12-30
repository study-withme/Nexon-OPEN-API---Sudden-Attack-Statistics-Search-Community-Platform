package com.example.jokerweb.member;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
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
@Table(name = "member")
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(nullable = false, length = 255)
    private String passwordHash;

    @Column(nullable = false, length = 64)
    private String nickname;

    // Nexon 연동 정보
    @Column(length = 64)
    private String ouid;

    @Column(length = 128)
    private String clanName;

    @Column(length = 128)
    private String titleName;

    @Column(length = 32)
    private String mannerGrade;

    @Column(nullable = false)
    @Builder.Default
    private boolean nexonLinked = false;

    @Column(name = "last_login_ip", length = 64)
    private String lastLoginIp;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    public void touchUpdatedAt() {
        this.updatedAt = LocalDateTime.now();
    }

    public void updateLoginInfo(String ipAddress) {
        this.lastLoginIp = ipAddress;
        this.lastLoginAt = LocalDateTime.now();
        this.touchUpdatedAt();
    }
}

