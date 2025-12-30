package com.example.jokerweb.community;

import com.example.jokerweb.member.Member;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "content_report")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContentReport {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_id", nullable = false)
    private Member reporter;
    
    @Column(name = "target_type", nullable = false, length = 32)
    private String targetType; // post, comment, market_item 등
    
    @Column(name = "target_id", nullable = false)
    private Long targetId;
    
    @Column(name = "report_reason", nullable = false, length = 64)
    private String reportReason; // spam, abuse, harassment, illegal, inappropriate, other
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(nullable = false, length = 32)
    @Builder.Default
    private String status = "pending"; // pending, processing, resolved, rejected
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "processed_by")
    private Member processedBy;
    
    @Column(name = "processed_at")
    private LocalDateTime processedAt;
    
    @Column(name = "admin_notes", columnDefinition = "TEXT")
    private String adminNotes;
    
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
