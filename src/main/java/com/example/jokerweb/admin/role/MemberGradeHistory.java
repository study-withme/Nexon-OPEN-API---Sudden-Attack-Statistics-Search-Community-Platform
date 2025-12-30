package com.example.jokerweb.admin.role;

import com.example.jokerweb.member.Member;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "member_grade_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemberGradeHistory {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "member_id", nullable = false)
    private Long memberId;
    
    @Column(name = "old_grade", length = 50)
    private String oldGrade;
    
    @Column(name = "new_grade", length = 50, nullable = false)
    private String newGrade;
    
    @Column(name = "changed_by", nullable = false)
    private Long changedBy;
    
    @Column(name = "changed_at")
    @Builder.Default
    private LocalDateTime changedAt = LocalDateTime.now();
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", insertable = false, updatable = false)
    private Member member;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "changed_by", insertable = false, updatable = false)
    private Member changedByMember;
}
