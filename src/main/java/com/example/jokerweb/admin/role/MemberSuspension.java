package com.example.jokerweb.admin.role;

import com.example.jokerweb.member.Member;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "member_suspension")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemberSuspension {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "member_id", nullable = false)
    private Long memberId;
    
    @Column(columnDefinition = "TEXT", nullable = false)
    private String reason;
    
    @Column(name = "suspended_by", nullable = false)
    private Long suspendedBy;
    
    @Column(name = "suspended_at")
    @Builder.Default
    private LocalDateTime suspendedAt = LocalDateTime.now();
    
    @Column(name = "expires_at")
    private LocalDateTime expiresAt;
    
    @Column(name = "released_at")
    private LocalDateTime releasedAt;
    
    @Column(name = "released_by")
    private Long releasedBy;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", insertable = false, updatable = false)
    private Member member;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "suspended_by", insertable = false, updatable = false)
    private Member suspendedByMember;
    
    public boolean isActive() {
        if (releasedAt != null) {
            return false;
        }
        if (expiresAt == null) {
            return true; // 영구 정지
        }
        return LocalDateTime.now().isBefore(expiresAt);
    }
}
