package com.example.jokerweb.player;

import jakarta.persistence.*;
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
@Table(name = "search_history", indexes = {
    @Index(name = "idx_search_nickname", columnList = "nickname"),
    @Index(name = "idx_search_created", columnList = "created_at")
})
public class SearchHistory {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(length = 64, nullable = false)
    private String nickname;
    
    @Column(length = 64)
    private String ouid;
    
    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(name = "search_count", nullable = false)
    @Builder.Default
    private Integer searchCount = 1;
}
