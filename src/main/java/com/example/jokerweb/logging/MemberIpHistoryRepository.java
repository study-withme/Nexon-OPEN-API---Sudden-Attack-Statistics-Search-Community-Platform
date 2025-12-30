package com.example.jokerweb.logging;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MemberIpHistoryRepository extends JpaRepository<MemberIpHistory, Long> {
    Optional<MemberIpHistory> findByMemberIdAndClientIp(Long memberId, String clientIp);
}
