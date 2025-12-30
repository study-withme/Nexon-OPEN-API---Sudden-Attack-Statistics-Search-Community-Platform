package com.example.jokerweb.community;

import com.example.jokerweb.member.Member;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "comment_like")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@IdClass(CommentLike.CommentLikeId.class)
public class CommentLike {
    
    @Id
    @Column(name = "comment_id", nullable = false)
    private Long commentId;
    
    @Id
    @Column(name = "member_id", nullable = false)
    private Long memberId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "comment_id", nullable = false, insertable = false, updatable = false)
    private Comment comment;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false, insertable = false, updatable = false)
    private Member member;
    
    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @EqualsAndHashCode
    public static class CommentLikeId implements java.io.Serializable {
        private Long commentId;
        private Long memberId;
    }
}

