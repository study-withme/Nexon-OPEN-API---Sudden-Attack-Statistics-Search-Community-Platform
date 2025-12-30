package com.example.jokerweb.admin.role;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface MemberSuspensionRepository extends JpaRepository<MemberSuspension, Long> {
    
    @Query("SELECT ms FROM MemberSuspension ms WHERE ms.memberId = :memberId " +
           "AND ms.releasedAt IS NULL " +
           "AND (ms.expiresAt IS NULL OR ms.expiresAt > :now)")
    Optional<MemberSuspension> findActiveSuspension(@Param("memberId") Long memberId, @Param("now") LocalDateTime now);
    
    List<MemberSuspension> findByMemberIdOrderBySuspendedAtDesc(Long memberId);
}
