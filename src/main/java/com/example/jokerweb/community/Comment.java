package com.example.jokerweb.community;

import com.example.jokerweb.member.Member;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "comment")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Comment {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = true)
    private Member author;
    
    @Column(name = "password_hash", length = 255)
    private String passwordHash;
    
    @Column(name = "author_ip", length = 64)
    private String authorIp;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Comment parent;
    
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;
    
    @Column(nullable = false)
    @Builder.Default
    private Integer likes = 0;
    
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
