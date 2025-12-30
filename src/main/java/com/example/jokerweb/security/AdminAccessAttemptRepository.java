package com.example.jokerweb.security;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface AdminAccessAttemptRepository extends JpaRepository<AdminAccessAttempt, Long> {

    /**
     * 특정 IP의 최근 1시간 내 어드민 페이지 접속 시도 횟수 조회
     */
    @Query("SELECT COUNT(a) FROM AdminAccessAttempt a " +
           "WHERE a.clientIp = :ip " +
           "AND a.attemptedAt >= :since " +
           "AND a.hasAuth = false")
    long countFailedAttemptsSince(@Param("ip") String ip, @Param("since") LocalDateTime since);

    /**
     * 특정 IP의 최근 접속 시도 목록 조회
     */
    @Query("SELECT a FROM AdminAccessAttempt a " +
           "WHERE a.clientIp = :ip " +
           "ORDER BY a.attemptedAt DESC")
    List<AdminAccessAttempt> findRecentAttemptsByIp(@Param("ip") String ip);

    /**
     * 차단된 IP 목록 조회
     */
    @Query("SELECT DISTINCT a.clientIp FROM AdminAccessAttempt a " +
           "WHERE a.blocked = true")
    List<String> findBlockedIps();

    /**
     * 특정 IP가 차단되었는지 확인 (최근 1시간 내)
     */
    @Query("SELECT COUNT(a) > 0 FROM AdminAccessAttempt a " +
           "WHERE a.clientIp = :ip " +
           "AND a.blocked = true " +
           "AND a.attemptedAt >= :since")
    boolean isIpBlocked(@Param("ip") String ip, @Param("since") LocalDateTime since);
}
