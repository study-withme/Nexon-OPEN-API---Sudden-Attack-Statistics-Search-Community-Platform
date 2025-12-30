package com.example.jokerweb.admin.role;

import com.example.jokerweb.member.Member;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "member_role")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemberRole {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "member_id", nullable = false)
    private Long memberId;
    
    @Column(name = "role_id")
    private Long roleId;
    
    @Column(name = "role", length = 32)
    private String role; // 기존 호환성을 위한 컬럼
    
    @Column(name = "granted_by")
    private Long grantedBy;
    
    @Column(name = "granted_at")
    @Builder.Default
    private LocalDateTime grantedAt = LocalDateTime.now();
    
    @Column(name = "revoked_at")
    private LocalDateTime revokedAt;
    
    @Column(name = "revoked_by")
    private Long revokedBy;
    
    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", insertable = false, updatable = false)
    private Member member;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_id", insertable = false, updatable = false)
    private Role roleEntity;
}
