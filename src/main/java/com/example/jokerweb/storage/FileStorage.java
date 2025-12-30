package com.example.jokerweb.storage;

import com.example.jokerweb.member.Member;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.*;

@Getter
@Setter
@Entity
@Table(name = "file_storage")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileStorage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "file_path", nullable = false, length = 512)
    private String filePath;

    @Column(name = "file_url", nullable = false, length = 1024)
    private String fileUrl;

    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    @Column(name = "mime_type", length = 128)
    private String mimeType;

    @Column(name = "file_hash", length = 64)
    private String fileHash;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploader_id")
    private Member uploader;

    @Column(name = "reference_count")
    @Builder.Default
    private Integer referenceCount = 1;

    @Column(name = "is_temporary")
    @Builder.Default
    private Boolean isTemporary = false;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @PrePersist
    public void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (referenceCount == null) {
            referenceCount = 1;
        }
        if (isTemporary == null) {
            isTemporary = false;
        }
    }

    public void incrementReferenceCount() {
        this.referenceCount = (this.referenceCount == null ? 0 : this.referenceCount) + 1;
    }

    public void decrementReferenceCount() {
        this.referenceCount = Math.max(0, (this.referenceCount == null ? 0 : this.referenceCount) - 1);
    }
}
