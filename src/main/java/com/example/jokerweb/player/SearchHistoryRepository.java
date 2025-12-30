package com.example.jokerweb.player;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SearchHistoryRepository extends JpaRepository<SearchHistory, Long> {
    
    /**
     * 닉네임으로 검색 (자동완성용)
     */
    @Query("SELECT DISTINCT s.nickname FROM SearchHistory s " +
           "WHERE s.nickname LIKE :query% " +
           "ORDER BY s.searchCount DESC, s.createdAt DESC " +
           "LIMIT :limit")
    List<String> findNicknamesByQuery(@Param("query") String query, @Param("limit") int limit);
    
    /**
     * 인기 검색어 조회 (최근 7일)
     */
    @Query("SELECT s.nickname, SUM(s.searchCount) as totalCount " +
           "FROM SearchHistory s " +
           "WHERE s.createdAt >= :since " +
           "GROUP BY s.nickname " +
           "ORDER BY totalCount DESC " +
           "LIMIT :limit")
    List<Object[]> findPopularSearches(@Param("since") LocalDateTime since, @Param("limit") int limit);
    
    /**
     * 닉네임으로 검색 기록 찾기
     */
    SearchHistory findByNickname(String nickname);
    
    /**
     * 오래된 검색 기록 삭제 (30일 이상)
     */
    @Modifying
    @Query("DELETE FROM SearchHistory s WHERE s.createdAt < :cutoff")
    void deleteOldSearches(@Param("cutoff") LocalDateTime cutoff);
}
