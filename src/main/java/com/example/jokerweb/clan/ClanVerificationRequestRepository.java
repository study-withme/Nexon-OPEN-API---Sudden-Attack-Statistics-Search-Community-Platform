package com.example.jokerweb.clan;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ClanVerificationRequestRepository extends JpaRepository<ClanVerificationRequest, Long> {
}
