package com.example.jokerweb.storage;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface FileStorageRepository extends JpaRepository<FileStorage, Long> {

    Optional<FileStorage> findByFilePath(String filePath);

    Optional<FileStorage> findByFileHash(String fileHash);

    List<FileStorage> findByUploaderId(Long uploaderId);

    @Query("SELECT f FROM FileStorage f WHERE f.isTemporary = true AND f.expiresAt < :now")
    List<FileStorage> findExpiredTemporaryFiles(@Param("now") LocalDateTime now);

    @Modifying
    @Query("DELETE FROM FileStorage f WHERE f.isTemporary = true AND f.expiresAt < :now")
    int deleteExpiredTemporaryFiles(@Param("now") LocalDateTime now);
}
