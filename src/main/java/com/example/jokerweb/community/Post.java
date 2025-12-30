package com.example.jokerweb.community;

import com.example.jokerweb.member.Member;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "post")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Post {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = true)
    private Member author;
    
    @Column(name = "password_hash", length = 255)
    private String passwordHash;
    
    @Column(name = "author_ip", length = 64)
    private String authorIp;
    
    @Column(nullable = false, length = 32)
    private String category;
    
    @Column(nullable = false, length = 255)
    private String title;
    
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;
    
    @Column(nullable = false)
    @Builder.Default
    private Integer views = 0;
    
    @Column(nullable = false)
    @Builder.Default
    private Integer likes = 0;
    
    @Column(name = "is_notice")
    @Builder.Default
    private Boolean isNotice = false;
    
    @Column(name = "is_pinned")
    @Builder.Default
    private Boolean isPinned = false;
    
    @Column(name = "is_deleted")
    @Builder.Default
    private Boolean isDeleted = false;
    
    @Column(name = "is_anonymous", nullable = true)
    @Builder.Default
    private Boolean isAnonymous = false;
    
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
    
    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}
