package com.example.jokerweb.community;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PostViewHistoryRepository extends JpaRepository<PostViewHistory, PostViewHistory.PostViewHistoryId> {
    
    // 회원이 조회한 경우 (memberId가 0이 아닌 경우) - 24시간 이내 조회 기록 확인
    @Query("SELECT pvh FROM PostViewHistory pvh WHERE pvh.postId = :postId AND pvh.memberId = :memberId AND pvh.memberId != 0 AND pvh.viewedAt >= :since ORDER BY pvh.viewedAt DESC")
    Optional<PostViewHistory> findByPostIdAndMemberIdAndViewedAtAfter(
        @Param("postId") Long postId,
        @Param("memberId") Long memberId,
        @Param("since") LocalDateTime since
    );
    
    // 익명 사용자가 조회한 경우 (memberId가 0이고 실제 IP 주소로 확인) - 24시간 이내 조회 기록 확인
    @Query("SELECT pvh FROM PostViewHistory pvh WHERE pvh.postId = :postId AND pvh.memberId = 0 AND pvh.ipAddress = :ipAddress AND pvh.viewedAt >= :since ORDER BY pvh.viewedAt DESC")
    Optional<PostViewHistory> findByPostIdAndIpAddressAndViewedAtAfterForAnonymous(
        @Param("postId") Long postId,
        @Param("ipAddress") String ipAddress,
        @Param("since") LocalDateTime since
    );
    
    // 특정 IP 주소에서 조회한 모든 기록 (회원/익명 구분 없이) - 통계 및 분석용
    @Query("SELECT pvh FROM PostViewHistory pvh WHERE pvh.postId = :postId AND pvh.ipAddress = :ipAddress AND pvh.viewedAt >= :since ORDER BY pvh.viewedAt DESC")
    List<PostViewHistory> findAllByPostIdAndIpAddressAndViewedAtAfter(
        @Param("postId") Long postId,
        @Param("ipAddress") String ipAddress,
        @Param("since") LocalDateTime since
    );
}

