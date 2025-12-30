package com.example.jokerweb.community;

import com.example.jokerweb.member.Member;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
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
@Table(name = "barracks_report")
public class TrollReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_id", nullable = false)
    private Member reporter;

    @Column(name = "target_nickname", nullable = false, length = 64)
    private String targetName;

    @Column(name = "content", columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(length = 512)
    private String evidenceUrl;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(length = 32)
    private String status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "processed_by")
    private Member processedBy;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @Column(name = "barracks_address", length = 255)
    private String barracksAddress;

    @Column(name = "report_type", length = 32)
    private String reportType;

    @Column(name = "report_count")
    @Builder.Default
    private Integer reportCount = 1;

    @Column(name = "title", length = 255, nullable = false)
    private String title;

    @Column(name = "admin_notes", columnDefinition = "TEXT")
    private String adminNotes;

    @Column(name = "is_deleted")
    @Builder.Default
    private Boolean isDeleted = false;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}
