package com.example.jokerweb.community;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;

public interface ContentReportRepository extends JpaRepository<ContentReport, Long>, JpaSpecificationExecutor<ContentReport> {
    
    Page<ContentReport> findByTargetTypeAndStatusOrderByCreatedAtDesc(String targetType, String status, Pageable pageable);
    
    Page<ContentReport> findByTargetTypeOrderByCreatedAtDesc(String targetType, Pageable pageable);
    
    List<ContentReport> findByTargetTypeAndTargetId(String targetType, Long targetId);
    
    @Query("SELECT cr FROM ContentReport cr WHERE cr.targetType = :targetType AND cr.targetId = :targetId AND cr.status = 'pending'")
    List<ContentReport> findPendingReportsByTarget(@Param("targetType") String targetType, @Param("targetId") Long targetId);
    
    @Query("SELECT COUNT(cr) FROM ContentReport cr WHERE cr.targetType = :targetType AND cr.createdAt BETWEEN :start AND :end")
    long countByTargetTypeAndCreatedAtBetween(@Param("targetType") String targetType, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
    
    @Query("SELECT COUNT(cr) FROM ContentReport cr WHERE cr.status = :status AND cr.processedAt BETWEEN :start AND :end")
    long countByStatusAndProcessedAtBetween(@Param("status") String status, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
    
    @Query("SELECT cr FROM ContentReport cr WHERE cr.createdAt >= :since ORDER BY cr.createdAt DESC")
    List<ContentReport> findRecentReports(@Param("since") LocalDateTime since);
    
    @Query("SELECT COUNT(cr) FROM ContentReport cr WHERE cr.reporter.id = :reporterId")
    long countByReporterId(@Param("reporterId") Long reporterId);
}
