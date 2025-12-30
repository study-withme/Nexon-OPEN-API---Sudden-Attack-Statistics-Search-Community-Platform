package com.example.jokerweb.storage.service;

import net.coobird.thumbnailator.Thumbnails;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

@Service
public class ImageProcessingService {

    private static final int THUMBNAIL_WIDTH = 300;
    private static final int THUMBNAIL_HEIGHT = 300;
    private static final int MAX_IMAGE_WIDTH = 1920;
    private static final int MAX_IMAGE_HEIGHT = 1920;
    private static final double IMAGE_QUALITY = 0.85;

    public byte[] resizeImage(byte[] imageData, int maxWidth, int maxHeight) throws IOException {
        ByteArrayInputStream inputStream = new ByteArrayInputStream(imageData);
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();

        Thumbnails.of(inputStream)
                .size(maxWidth, maxHeight)
                .outputQuality(IMAGE_QUALITY)
                .toOutputStream(outputStream);

        return outputStream.toByteArray();
    }

    public byte[] createThumbnail(byte[] imageData) throws IOException {
        ByteArrayInputStream inputStream = new ByteArrayInputStream(imageData);
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();

        Thumbnails.of(inputStream)
                .size(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT)
                .outputQuality(0.8)
                .toOutputStream(outputStream);

        return outputStream.toByteArray();
    }

    public byte[] processImage(byte[] imageData) throws IOException {
        // 프로필/일반 이미지 리사이즈 (최대 해상도 제한)
        return resizeImage(imageData, MAX_IMAGE_WIDTH, MAX_IMAGE_HEIGHT);
    }

    public boolean isImage(String mimeType) {
        return mimeType != null && mimeType.startsWith("image/");
    }

    public byte[] getImageBytes(MultipartFile file) throws IOException {
        return file.getBytes();
    }
}
