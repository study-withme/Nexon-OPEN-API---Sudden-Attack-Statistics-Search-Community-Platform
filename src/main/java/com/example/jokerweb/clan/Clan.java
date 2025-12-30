package com.example.jokerweb.clan;

import com.example.jokerweb.member.Member;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "clan")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Clan {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "clan_name", nullable = false, unique = true, length = 128)
    private String clanName;
    
    @Column(name = "barracks_address", nullable = false, unique = true, length = 255)
    private String barracksAddress;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "master_id", nullable = false)
    private Member master;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(length = 255)
    private String contact;
    
    @Column(name = "is_verified")
    @Builder.Default
    private Boolean isVerified = false;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "verified_by")
    private Member verifiedBy;
    
    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;
    
    @Column(name = "is_suspicious")
    @Builder.Default
    private Boolean isSuspicious = false;
    
    @Column(name = "suspicious_reason", columnDefinition = "TEXT")
    private String suspiciousReason;
    
    @Column(name = "member_count")
    @Builder.Default
    private Integer memberCount = 0;
    
    @Column(nullable = false, length = 32)
    @Builder.Default
    private String status = "active"; // active, deleted, suspended
    
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
    
    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
    
    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
