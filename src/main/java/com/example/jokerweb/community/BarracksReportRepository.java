package com.example.jokerweb.community;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BarracksReportRepository extends JpaRepository<BarracksReport, Long>, JpaSpecificationExecutor<BarracksReport> {

    List<BarracksReport> findByTargetNicknameContainingIgnoreCaseOrderByCreatedAtDesc(String targetNickname);

    List<BarracksReport> findAllByOrderByCreatedAtDesc();

    @Query("SELECT COUNT(br) FROM BarracksReport br WHERE br.status = :status AND br.processedAt BETWEEN :start AND :end")
    long countByStatusAndProcessedAtBetween(@Param("status") String status, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    @Query(value = "SELECT COALESCE(m.nickname, '익명'), br.created_at FROM barracks_report br LEFT JOIN member m ON br.reporter_id = m.id WHERE br.is_deleted = false ORDER BY br.created_at DESC LIMIT :limit", nativeQuery = true)
    List<Object[]> findRecentReports(@Param("limit") int limit);

    @Query("SELECT COUNT(br) FROM BarracksReport br WHERE br.reporter.id = :reporterId")
    long countByReporterId(@Param("reporterId") Long reporterId);

    @Query("SELECT COUNT(br) FROM BarracksReport br WHERE br.targetNickname = :targetNickname")
    long countByTargetNickname(@Param("targetNickname") String targetNickname);

    @Query("SELECT br.reportType, COUNT(br) FROM BarracksReport br WHERE br.isDeleted = false GROUP BY br.reportType")
    List<Object[]> countByReportType();

    @Query("SELECT COUNT(br) FROM BarracksReport br WHERE br.status = :status AND br.isDeleted = false")
    long countByStatusAndIsDeletedFalse(@Param("status") String status);

    @Query("SELECT COUNT(br) FROM BarracksReport br WHERE br.status = :status AND br.createdAt < :before AND br.isDeleted = false")
    long countByStatusAndCreatedAtBeforeAndIsDeletedFalse(@Param("status") String status, @Param("before") LocalDateTime before);

    // 중복 제보 체크: 같은 reporter가 같은 targetNickname을 일정 시간 내에 제보했는지 확인
    @Query("SELECT COUNT(br) > 0 FROM BarracksReport br WHERE br.reporter.id = :reporterId AND br.targetNickname = :targetNickname AND br.createdAt > :after AND br.isDeleted = false")
    boolean existsByReporterAndTargetNicknameAndCreatedAtAfter(
        @Param("reporterId") Long reporterId,
        @Param("targetNickname") String targetNickname,
        @Param("after") LocalDateTime after
    );

    // 특정 닉네임의 제보 건수 조회 (troll 제외)
    @Query("SELECT COUNT(br) FROM BarracksReport br WHERE br.targetNickname = :targetNickname AND br.reportType != 'troll' AND br.isDeleted = false")
    Long countByTargetNicknameAndReportTypeNot(@Param("targetNickname") String targetNickname);

    // 특정 닉네임의 troll 제보 건수 조회
    @Query("SELECT COUNT(br) FROM BarracksReport br WHERE br.targetNickname = :targetNickname AND br.reportType = :reportType AND br.isDeleted = false")
    Long countByTargetNicknameAndReportType(@Param("targetNickname") String targetNickname, @Param("reportType") String reportType);

    // 이상탐지(troll) 전체 건수 조회
    @Query("SELECT COUNT(br) FROM BarracksReport br WHERE br.reportType = 'troll' AND br.isDeleted = false")
    long countTrollReports();

    /**
     * 특정 닉네임에 대해, 삭제되지 않은 가장 최근 제보 한 건을 조회한다.
     * 병영수첩 주소를 재사용하기 위한 용도.
     */
    Optional<BarracksReport> findTop1ByTargetNicknameAndIsDeletedFalseOrderByCreatedAtDesc(String targetNickname);
}
