package com.example.jokerweb.community;

import com.example.jokerweb.member.Member;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "post_like")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@IdClass(PostLike.PostLikeId.class)
public class PostLike {
    
    @Id
    @Column(name = "post_id", nullable = false)
    private Long postId;
    
    @Id
    @Column(name = "member_id", nullable = false)
    private Long memberId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false, insertable = false, updatable = false)
    private Post post;
    
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
    public static class PostLikeId implements java.io.Serializable {
        private Long postId;
        private Long memberId;
    }
}

