package com.example.jokerweb.player;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 서든어택 티어 및 계급 정보를 저장하는 엔티티
 * API에서 받은 모든 티어와 계급 정보를 저장
 */
@Entity
@Table(name = "tier_grade")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TierGrade {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true, length = 64)
    private String code; // 티어/계급 코드 (예: "SILVER I", "골드 1", "특급대장")
    
    @Column(nullable = false, length = 64)
    private String label; // 표시명 (예: "실버 I", "골드 I", "특급대장")
    
    @Column(length = 32)
    private String type; // "TIER" 또는 "GRADE"
    
    @Column(length = 32)
    private String category; // "SOLO", "PARTY", "SEASON", "INTEGRATED"
    
    @Column(length = 128)
    private String imagePath; // 이미지 경로
    
    @Column(length = 32)
    private String color; // 색상 클래스
    
    private Integer minScore; // 최소 점수
    private Integer maxScore; // 최대 점수
    private Integer minRanking; // 최소 랭킹 (RANKER, HIGH RANKER용)
    private Integer maxRanking; // 최대 랭킹
}
