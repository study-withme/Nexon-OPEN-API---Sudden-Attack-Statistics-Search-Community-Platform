package com.example.jokerweb.player;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
@Slf4j
public class SearchService {
    
    private final SearchHistoryRepository searchHistoryRepository;
    
    /**
     * 검색 기록 캐시 조회 (API 호출 최소화를 위한 DB 캐시 확인)
     */
    public SearchHistory findCachedSearch(String nickname) {
        if (!StringUtils.hasText(nickname)) {
            return null;
        }
        
        try {
            return searchHistoryRepository.findByNickname(nickname);
        } catch (Exception e) {
            log.warn("검색 기록 조회 실패: nickname={}, error={}", nickname, e.getMessage());
            return null;
        }
    }
    
    /**
     * 검색 기록 저장 또는 업데이트 (동기)
     */
    @Transactional
    public void recordSearch(String nickname, String ouid) {
        if (!StringUtils.hasText(nickname)) {
            return;
        }
        
        try {
            SearchHistory existing = searchHistoryRepository.findByNickname(nickname);
            if (existing != null) {
                existing.setSearchCount(existing.getSearchCount() + 1);
                if (StringUtils.hasText(ouid)) {
                    existing.setOuid(ouid);
                }
                existing.setCreatedAt(LocalDateTime.now());
                searchHistoryRepository.save(existing);
            } else {
                SearchHistory newHistory = SearchHistory.builder()
                        .nickname(nickname)
                        .ouid(ouid)
                        .createdAt(LocalDateTime.now())
                        .searchCount(1)
                        .build();
                searchHistoryRepository.save(newHistory);
            }
        } catch (Exception e) {
            log.warn("검색 기록 저장 실패: nickname={}, error={}", nickname, e.getMessage());
        }
    }
    
    /**
     * 검색 기록 저장 또는 업데이트 (비동기 - 응답 속도 향상)
     */
    @Async
    @Transactional
    public void recordSearchAsync(String nickname, String ouid) {
        recordSearch(nickname, ouid);
    }
    
    /**
     * 검색 자동완성 제안
     */
    public List<String> getSuggestions(String query, int limit) {
        if (!StringUtils.hasText(query) || query.length() < 2) {
            return List.of();
        }
        
        try {
            return searchHistoryRepository.findNicknamesByQuery(query.toLowerCase(), limit);
        } catch (Exception e) {
            log.warn("검색 제안 조회 실패: query={}, error={}", query, e.getMessage());
            return List.of();
        }
    }
    
    /**
     * 인기 검색어 조회
     */
    public List<String> getPopularSearches(int limit) {
        try {
            LocalDateTime since = LocalDateTime.now().minusDays(7);
            List<Object[]> results = searchHistoryRepository.findPopularSearches(since, limit);
            return results.stream()
                    .map(result -> (String) result[0])
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.warn("인기 검색어 조회 실패: error={}", e.getMessage());
            return List.of();
        }
    }
}
