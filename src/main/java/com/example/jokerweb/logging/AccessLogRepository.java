package com.example.jokerweb.logging;

import java.time.LocalDateTime;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AccessLogRepository extends JpaRepository<AccessLog, Long> {

    // 페이지뷰(PV) 집계
    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    // 고유 사용자(UV) 집계 (회원 기준)
    @Query("""
            SELECT COUNT(DISTINCT al.member.id)
            FROM AccessLog al
            WHERE al.member.id IS NOT NULL
              AND al.createdAt BETWEEN :start AND :end
            """)
    long countDistinctMemberIdByCreatedAtBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    // 고유 방문자(UV) 집계 (IP 기준) - 엔티티에는 clientIp만 존재
    @Query("""
            SELECT COUNT(DISTINCT al.clientIp)
            FROM AccessLog al
            WHERE al.createdAt BETWEEN :start AND :end
            """)
    long countDistinctIpAddressByCreatedAtBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    // 마지막 접속 시각
    @Query("SELECT MAX(al.createdAt) FROM AccessLog al WHERE al.member.id = :memberId")
    Optional<LocalDateTime> findLastAccessByMemberId(@Param("memberId") Long memberId);

    // occurredAt 기준으로 시간대별 접속 수 조회
    long countByOccurredAtBetween(LocalDateTime start, LocalDateTime end);
}
