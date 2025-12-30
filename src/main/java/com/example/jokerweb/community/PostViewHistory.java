package com.example.jokerweb.community;

import com.example.jokerweb.member.Member;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "post_view_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@IdClass(PostViewHistory.PostViewHistoryId.class)
public class PostViewHistory {
    
    @Id
    @Column(name = "post_id", nullable = false)
    private Long postId;
    
    @Id
    @Column(name = "member_id", nullable = false)
    private Long memberId;
    
    @Id
    @Column(name = "ip_address", length = 64, nullable = false)
    private String ipAddress;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false, insertable = false, updatable = false)
    private Post post;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = true, insertable = false, updatable = false)
    private Member member;
    
    @Column(name = "viewed_at", nullable = false)
    @Builder.Default
    private LocalDateTime viewedAt = LocalDateTime.now();
    
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @EqualsAndHashCode
    public static class PostViewHistoryId implements java.io.Serializable {
        private Long postId;
        private Long memberId;
        private String ipAddress;
    }
}

