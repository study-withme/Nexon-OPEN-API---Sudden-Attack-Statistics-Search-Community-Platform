package com.example.jokerweb.nexon;

import com.example.jokerweb.nexon.dto.GradeMetadataItem;
import com.example.jokerweb.nexon.dto.SeasonGradeMetadataItem;
import com.example.jokerweb.nexon.dto.TierMetadataItem;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class MetadataService {

    private final NxOpenApiClient nxClient;
    private final ObjectMapper objectMapper;

    // 티어 이름 -> 이미지 URL 매핑 캐시 (스레드 안전)
    private final Map<String, String> tierImageMap = new ConcurrentHashMap<>();
    private final Map<String, String> gradeImageMap = new ConcurrentHashMap<>();
    private final Map<String, String> seasonGradeImageMap = new ConcurrentHashMap<>();
    
    @PostConstruct
    public void init() {
        // 애플리케이션 시작 시 메타데이터 로드
        log.info("메타데이터 초기화 시작");
        refreshTierMetadata();
        refreshGradeMetadata();
        refreshSeasonGradeMetadata();
        log.info("메타데이터 초기화 완료");
    }

    /**
     * 티어 메타데이터를 조회하고 캐싱
     */
    public Map<String, String> getTierImageMap() {
        if (tierImageMap.isEmpty()) {
            refreshTierMetadata();
        }
        return tierImageMap;
    }

    /**
     * 티어 이름으로 이미지 URL 조회
     */
    public String getTierImageUrl(String tierName) {
        if (tierName == null || tierName.trim().isEmpty()) {
            return null;
        }

        Map<String, String> map = getTierImageMap();
        
        // 정확한 매칭 시도
        String imageUrl = map.get(tierName.toUpperCase());
        if (imageUrl != null) {
            return imageUrl;
        }

        // 대소문자 무시 매칭
        for (Map.Entry<String, String> entry : map.entrySet()) {
            if (entry.getKey().equalsIgnoreCase(tierName)) {
                return entry.getValue();
            }
        }

        // 부분 매칭 (예: "GRAND MASTER I" -> "GRAND MASTER I")
        String normalizedTier = tierName.toUpperCase().trim();
        for (Map.Entry<String, String> entry : map.entrySet()) {
            String key = entry.getKey().toUpperCase();
            if (key.equals(normalizedTier) || 
                key.replace(" ", "").equals(normalizedTier.replace(" ", ""))) {
                return entry.getValue();
            }
        }

        log.debug("티어 이미지 URL을 찾을 수 없음: tierName={}", tierName);
        return null;
    }

    /**
     * 티어 메타데이터 새로고침
     */
    public void refreshTierMetadata() {
        try {
            String metadataJson = nxClient.getTierMetadata();
            if (metadataJson != null && !metadataJson.trim().isEmpty()) {
                List<TierMetadataItem> items = objectMapper.readValue(
                    metadataJson, 
                    new TypeReference<List<TierMetadataItem>>() {}
                );
                
                tierImageMap.clear();
                for (TierMetadataItem item : items) {
                    if (item.getTier() != null && item.getTierImage() != null) {
                        tierImageMap.put(item.getTier().toUpperCase(), item.getTierImage());
                    }
                }
                log.info("티어 메타데이터 로드 완료: {}개 항목", tierImageMap.size());
            }
        } catch (Exception e) {
            log.error("티어 메타데이터 로드 실패: {}", e.getMessage(), e);
        }
    }

    /**
     * 계급 메타데이터를 조회하고 캐싱
     */
    public Map<String, String> getGradeImageMap() {
        if (gradeImageMap.isEmpty()) {
            refreshGradeMetadata();
        }
        return gradeImageMap;
    }

    /**
     * 계급 이름으로 이미지 URL 조회
     */
    public String getGradeImageUrl(String gradeName) {
        if (gradeName == null || gradeName.trim().isEmpty()) {
            return null;
        }

        Map<String, String> map = getGradeImageMap();
        
        // 한국어 계급명 매칭
        String imageUrl = map.get(gradeName);
        if (imageUrl != null) {
            return imageUrl;
        }

        log.debug("계급 이미지 URL을 찾을 수 없음: gradeName={}", gradeName);
        return null;
    }

    /**
     * 계급 메타데이터 새로고침
     */
    public void refreshGradeMetadata() {
        try {
            String metadataJson = nxClient.getGradeMetadata();
            if (metadataJson != null && !metadataJson.trim().isEmpty()) {
                List<GradeMetadataItem> items = objectMapper.readValue(
                    metadataJson, 
                    new TypeReference<List<GradeMetadataItem>>() {}
                );
                
                gradeImageMap.clear();
                for (GradeMetadataItem item : items) {
                    if (item.getGrade() != null && item.getGradeImage() != null) {
                        gradeImageMap.put(item.getGrade(), item.getGradeImage());
                    }
                }
                log.info("계급 메타데이터 로드 완료: {}개 항목", gradeImageMap.size());
            }
        } catch (Exception e) {
            log.error("계급 메타데이터 로드 실패: {}", e.getMessage(), e);
        }
    }

    /**
     * 시즌 계급 메타데이터를 조회하고 캐싱
     */
    public Map<String, String> getSeasonGradeImageMap() {
        if (seasonGradeImageMap.isEmpty()) {
            refreshSeasonGradeMetadata();
        }
        return seasonGradeImageMap;
    }

    /**
     * 시즌 계급 이름으로 이미지 URL 조회
     */
    public String getSeasonGradeImageUrl(String seasonGradeName) {
        if (seasonGradeName == null || seasonGradeName.trim().isEmpty()) {
            return null;
        }

        Map<String, String> map = getSeasonGradeImageMap();
        
        // 한국어 계급명 매칭
        String imageUrl = map.get(seasonGradeName);
        if (imageUrl != null) {
            return imageUrl;
        }

        log.debug("시즌 계급 이미지 URL을 찾을 수 없음: seasonGradeName={}", seasonGradeName);
        return null;
    }

    /**
     * 시즌 계급 메타데이터 새로고침
     */
    public void refreshSeasonGradeMetadata() {
        try {
            String metadataJson = nxClient.getSeasonGradeMetadata();
            if (metadataJson != null && !metadataJson.trim().isEmpty()) {
                List<SeasonGradeMetadataItem> items = objectMapper.readValue(
                    metadataJson, 
                    new TypeReference<List<SeasonGradeMetadataItem>>() {}
                );
                
                seasonGradeImageMap.clear();
                for (SeasonGradeMetadataItem item : items) {
                    if (item.getSeasonGrade() != null && item.getSeasonGradeImage() != null) {
                        seasonGradeImageMap.put(item.getSeasonGrade(), item.getSeasonGradeImage());
                    }
                }
                log.info("시즌 계급 메타데이터 로드 완료: {}개 항목", seasonGradeImageMap.size());
            }
        } catch (Exception e) {
            log.error("시즌 계급 메타데이터 로드 실패: {}", e.getMessage(), e);
        }
    }
}
