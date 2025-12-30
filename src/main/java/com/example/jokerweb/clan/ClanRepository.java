package com.example.jokerweb.clan;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ClanRepository extends JpaRepository<Clan, Long>, JpaSpecificationExecutor<Clan> {

    boolean existsByClanName(String clanName);

    boolean existsByBarracksAddress(String barracksAddress);

    Optional<Clan> findByClanName(String clanName);

    Optional<Clan> findByBarracksAddress(String barracksAddress);

    Page<Clan> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);

    @Query("SELECT COUNT(c) FROM Clan c WHERE c.status = :status")
    long countByStatus(@Param("status") String status);
}
