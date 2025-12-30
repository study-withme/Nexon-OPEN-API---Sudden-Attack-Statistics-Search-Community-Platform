package com.example.jokerweb.community;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "category")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Category {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true, length = 100)
    private String name; // notice, free, popular, ranked, custom, supply, duo
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "display_order", nullable = false)
    private Integer displayOrder;
    
    @Column(name = "can_write")
    @Builder.Default
    private Boolean canWrite = true;
    
    @Column(name = "can_read")
    @Builder.Default
    private Boolean canRead = true;
    
    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
    
    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
