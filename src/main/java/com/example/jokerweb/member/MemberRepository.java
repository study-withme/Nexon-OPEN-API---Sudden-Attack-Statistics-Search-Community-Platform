package com.example.jokerweb.member;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface MemberRepository extends JpaRepository<Member, Long>, JpaSpecificationExecutor<Member> {
    boolean existsByEmail(String email);
    Optional<Member> findByEmail(String email);
    
    boolean existsByNickname(String nickname);
    Optional<Member> findByNickname(String nickname);
    
    boolean existsByOuid(String ouid);
    Optional<Member> findByOuid(String ouid);
    
    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
    
    @Query(value = "SELECT m.nickname, m.created_at FROM member m ORDER BY m.created_at DESC LIMIT :limit", nativeQuery = true)
    List<Object[]> findRecentMembers(@Param("limit") int limit);
}

