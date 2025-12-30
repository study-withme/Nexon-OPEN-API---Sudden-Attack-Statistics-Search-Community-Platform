package com.example.jokerweb.community;

import com.example.jokerweb.member.Member;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.*;

@Getter
@Setter
@Entity
@Table(name = "barracks_report")
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BarracksReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_id", nullable = false)
    private Member reporter;

    @Column(name = "target_nickname", nullable = false, length = 64)
    private String targetNickname;

    @Column(name = "target_ouid", length = 64)
    private String targetOuid;

    @Column(name = "barracks_address", nullable = false, length = 255)
    private String barracksAddress;

    @Column(name = "report_type", nullable = false, length = 32)
    private String reportType;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(name = "report_count")
    @Builder.Default
    private Integer reportCount = 1;

    @Column(name = "is_anonymous")
    @Builder.Default
    private Boolean isAnonymous = false;

    @Column(length = 32)
    @Builder.Default
    private String status = "pending";

    @Column(name = "admin_notes", columnDefinition = "TEXT")
    private String adminNotes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "processed_by")
    private Member processedBy;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @Column(name = "is_deleted")
    @Builder.Default
    private Boolean isDeleted = false;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @Column(name = "ban_status", length = 32)
    private String banStatus; // null=미확인, active=활동중, temporary=임시정지, permanent=영구정지

    @Column(name = "ban_checked_at")
    private LocalDateTime banCheckedAt;

    @Column(name = "total_report_count")
    @Builder.Default
    private Integer totalReportCount = 1;

    @OneToMany(mappedBy = "report", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<BarracksReportAttachment> attachments = new ArrayList<>();

    @PrePersist
    public void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
