package com.example.jokerweb.member;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MemberSessionRepository extends JpaRepository<MemberSession, String> {
    Optional<MemberSession> findByToken(String token);
}

