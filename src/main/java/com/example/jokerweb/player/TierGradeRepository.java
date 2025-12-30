package com.example.jokerweb.player;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface TierGradeRepository extends JpaRepository<TierGrade, Long> {
    Optional<TierGrade> findByCode(String code);
}
