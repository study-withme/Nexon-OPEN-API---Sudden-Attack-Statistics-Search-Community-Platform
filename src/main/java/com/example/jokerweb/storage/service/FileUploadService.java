package com.example.jokerweb.storage.service;

import com.example.jokerweb.member.Member;
import com.example.jokerweb.member.MemberRepository;
import com.example.jokerweb.storage.FileStorage;
import com.example.jokerweb.storage.FileStorageRepository;
import com.example.jokerweb.storage.client.FtpClient;
import com.example.jokerweb.storage.client.SftpClient;
import com.example.jokerweb.storage.config.FtpProperties;
import com.example.jokerweb.storage.dto.FileUploadResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.security.MessageDigest;
import java.time.LocalDate;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class FileUploadService {

    private final FileStorageRepository fileStorageRepository;
    private final MemberRepository memberRepository;
    private final FtpClient ftpClient;
    private final SftpClient sftpClient;
    private final FtpProperties ftpProperties;
    private final ImageProcessingService imageProcessingService;

    @Transactional
    public FileUploadResponse uploadFile(MultipartFile file, Long uploaderId) {
        // 1. 업로드 파일 검증
        validateFile(file);

        // 2. 업로더 조회
        Member uploader = uploaderId != null
                ? memberRepository.findById(uploaderId).orElse(null)
                : null;

        // 3. 파일 해시 계산 (중복 검사용)
        String fileHash = calculateFileHash(file);

        // 4. 기존 동일 파일 있는지 확인 (중복 방지)
        FileStorage existingFile = fileStorageRepository.findByFileHash(fileHash).orElse(null);
        if (existingFile != null) {
            existingFile.incrementReferenceCount();
            fileStorageRepository.save(existingFile);
            return FileUploadResponse.from(existingFile);
        }

        // 5. 파일 처리 (이미지의 경우 리사이즈 등)
        byte[] processedFileData = processFile(file);

        // 6. 고유 파일명 및 경로 생성
        String fileName = generateUniqueFileName(file.getOriginalFilename());
        String datePath = LocalDate.now().toString().replace("-", "/");
        String remotePath = datePath + "/" + fileName;

        // 7. FTP/SFTP 서버에 업로드
        String fileUrl;
        String thumbnailUrl = null;
        try {
            InputStream inputStream = new ByteArrayInputStream(processedFileData);
            if (ftpProperties.isUseSftp()) {
                fileUrl = sftpClient.uploadFile(inputStream, remotePath);
            } else {
                fileUrl = ftpClient.uploadFile(inputStream, remotePath);
            }

            // 8. 썸네일 이미지가 필요한 경우 업로드
            if (imageProcessingService.isImage(file.getContentType())) {
                thumbnailUrl = uploadThumbnail(processedFileData, datePath, fileName);
            }
        } catch (Exception e) {
            log.error("파일 업로드 실패", e);
            throw new RuntimeException("파일 업로드 중 오류가 발생했습니다: " + e.getMessage(), e);
        }

        // 9. DB에 메타데이터 저장
        FileStorage fileStorage = FileStorage.builder()
                .filePath(remotePath)
                .fileUrl(fileUrl)
                .fileSize((long) processedFileData.length)
                .mimeType(file.getContentType())
                .fileHash(fileHash)
                .uploader(uploader)
                .referenceCount(1)
                .isTemporary(false)
                .build();

        fileStorageRepository.save(fileStorage);

        FileUploadResponse response = FileUploadResponse.from(fileStorage);
        if (thumbnailUrl != null) {
            response = FileUploadResponse.from(fileStorage, thumbnailUrl);
        }

        log.info("파일 업로드 완료: {} (ID: {})", fileUrl, fileStorage.getId());
        return response;
    }

    @Transactional
    public void deleteFile(Long fileId) {
        FileStorage fileStorage = fileStorageRepository.findById(fileId)
                .orElseThrow(() -> new IllegalArgumentException("파일을 찾을 수 없습니다: " + fileId));

        fileStorage.decrementReferenceCount();
        if (fileStorage.getReferenceCount() <= 0) {
            // 실제 원본 파일 삭제
            try {
                if (ftpProperties.isUseSftp()) {
                    sftpClient.deleteFile(fileStorage.getFilePath());
                } else {
                    ftpClient.deleteFile(fileStorage.getFilePath());
                }
                // 썸네일도 함께 삭제
                String thumbnailPath = fileStorage.getFilePath().replace("/", "/thumbnails/");
                if (ftpProperties.isUseSftp()) {
                    sftpClient.deleteFile(thumbnailPath);
                } else {
                    ftpClient.deleteFile(thumbnailPath);
                }
            } catch (Exception e) {
                log.warn("파일 삭제 실패: {}", fileStorage.getFilePath(), e);
            }
            fileStorageRepository.delete(fileStorage);
        } else {
            fileStorageRepository.save(fileStorage);
        }
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("업로드할 파일을 선택해주세요.");
        }

        if (file.getSize() > ftpProperties.getMaxFileSize()) {
            long maxMb = ftpProperties.getMaxFileSize() / 1024 / 1024;
            throw new IllegalArgumentException(
                    "파일 크기가 허용 범위를 초과했습니다. 최대 용량: " + maxMb + "MB");
        }

        // MIME 타입 기본 체크 (추가 검증은 이후에 처리)
        String contentType = file.getContentType();
        if (contentType == null) {
            throw new IllegalArgumentException("파일의 콘텐츠 타입을 확인할 수 없습니다.");
        }
    }

    private byte[] processFile(MultipartFile file) {
        try {
            byte[] fileData = imageProcessingService.getImageBytes(file);

            // 이미지인 경우 리사이즈/압축 처리
            if (imageProcessingService.isImage(file.getContentType())) {
                return imageProcessingService.processImage(fileData);
            }

            return fileData;
        } catch (IOException e) {
            log.warn("파일 처리 실패, 원본 데이터로 대체: {}", e.getMessage());
            try {
                return file.getBytes();
            } catch (IOException ex) {
                throw new RuntimeException("파일 데이터를 읽는 중 오류가 발생했습니다.", ex);
            }
        }
    }

    private String uploadThumbnail(byte[] imageData, String datePath, String fileName) {
        try {
            byte[] thumbnailData = imageProcessingService.createThumbnail(imageData);
            String thumbnailPath = datePath + "/thumbnails/" + fileName;

            InputStream inputStream = new ByteArrayInputStream(thumbnailData);
            if (ftpProperties.isUseSftp()) {
                return sftpClient.uploadFile(inputStream, thumbnailPath);
            } else {
                return ftpClient.uploadFile(inputStream, thumbnailPath);
            }
        } catch (Exception e) {
            log.warn("썸네일 업로드 실패: {}", fileName, e);
            return null;
        }
    }

    private String generateUniqueFileName(String originalFilename) {
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        return UUID.randomUUID().toString().replace("-", "") + extension;
    }

    private String calculateFileHash(MultipartFile file) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(file.getBytes());
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            log.warn("파일 해시 계산 실패", e);
            return UUID.randomUUID().toString();
        }
    }
}
