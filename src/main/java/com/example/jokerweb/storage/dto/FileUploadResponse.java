package com.example.jokerweb.storage.dto;

import com.example.jokerweb.storage.FileStorage;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileUploadResponse {
    private Long id;
    private String fileUrl;
    private String filePath;
    private Long fileSize;
    private String mimeType;
    private String thumbnailUrl;
    private LocalDateTime createdAt;

    public static FileUploadResponse from(FileStorage fileStorage) {
        return FileUploadResponse.builder()
                .id(fileStorage.getId())
                .fileUrl(fileStorage.getFileUrl())
                .filePath(fileStorage.getFilePath())
                .fileSize(fileStorage.getFileSize())
                .mimeType(fileStorage.getMimeType())
                .createdAt(fileStorage.getCreatedAt())
                .build();
    }

    public static FileUploadResponse from(FileStorage fileStorage, String thumbnailUrl) {
        FileUploadResponse response = from(fileStorage);
        response.thumbnailUrl = thumbnailUrl;
        return response;
    }
}
