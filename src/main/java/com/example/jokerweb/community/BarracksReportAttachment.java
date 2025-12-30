package com.example.jokerweb.community;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.*;

@Getter
@Setter
@Entity
@Table(name = "barracks_report_attachment")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BarracksReportAttachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "report_id", nullable = false)
    private BarracksReport report;

    @Column(name = "attachment_type", nullable = false, length = 32)
    private String attachmentType;

    @Column(name = "file_path", length = 512)
    private String filePath;

    @Column(name = "file_url", length = 1024)
    private String fileUrl;

    @Column(name = "file_name", length = 255)
    private String fileName;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "thumbnail_url", length = 1024)
    private String thumbnailUrl;

    @Column(name = "display_order")
    @Builder.Default
    private Integer displayOrder = 0;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @PrePersist
    public void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
