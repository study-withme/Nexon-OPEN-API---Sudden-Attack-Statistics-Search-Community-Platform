package com.example.jokerweb.storage.client;

import com.example.jokerweb.storage.config.FtpProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.net.ftp.FTP;
import org.apache.commons.net.ftp.FTPClient;
import org.apache.commons.net.ftp.FTPReply;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Paths;

@Slf4j
@Component
@RequiredArgsConstructor
public class FtpClient {

    private final FtpProperties ftpProperties;

    public String uploadFile(InputStream inputStream, String remotePath) throws IOException {
        if (!ftpProperties.isEnabled()) {
            throw new IllegalStateException("FTP가 비활성화된 상태입니다.");
        }

        FTPClient ftpClient = new FTPClient();
        try {
            // 연결 설정
            ftpClient.setConnectTimeout(ftpProperties.getTimeout());
            ftpClient.connect(ftpProperties.getHost(), ftpProperties.getPort());
            int replyCode = ftpClient.getReplyCode();
            if (!FTPReply.isPositiveCompletion(replyCode)) {
                throw new IOException("FTP 서버 응답 오류: " + replyCode);
            }

            // 로그인
            if (!ftpClient.login(ftpProperties.getUsername(), ftpProperties.getPassword())) {
                throw new IOException("FTP 로그인 실패");
            }

            // 바이너리 모드
            ftpClient.setFileType(FTP.BINARY_FILE_TYPE);
            ftpClient.enterLocalPassiveMode();

            // 디렉터리 생성
            String fullPath = Paths.get(ftpProperties.getBasePath(), remotePath).toString().replace("\\", "/");
            String directory = Paths.get(fullPath).getParent().toString().replace("\\", "/");
            if (!createDirectories(ftpClient, directory)) {
                throw new IOException("디렉터리 생성 실패: " + directory);
            }

            // 파일 업로드
            String fileName = Paths.get(fullPath).getFileName().toString();
            boolean uploaded = ftpClient.storeFile(fileName, inputStream);
            if (!uploaded) {
                throw new IOException("파일 업로드 실패: " + fileName);
            }

            // URL 생성
            String fileUrl = ftpProperties.getBaseUrl() + "/" + remotePath.replace("\\", "/");
            log.info("파일 업로드 완료: {}", fileUrl);
            return fileUrl;

        } finally {
            if (ftpClient.isConnected()) {
                try {
                    ftpClient.logout();
                    ftpClient.disconnect();
                } catch (IOException e) {
                    log.warn("FTP 연결 종료 중 오류", e);
                }
            }
        }
    }

    public boolean deleteFile(String remotePath) throws IOException {
        if (!ftpProperties.isEnabled()) {
            return false;
        }

        FTPClient ftpClient = new FTPClient();
        try {
            ftpClient.setConnectTimeout(ftpProperties.getTimeout());
            ftpClient.connect(ftpProperties.getHost(), ftpProperties.getPort());
            int replyCode = ftpClient.getReplyCode();
            if (!FTPReply.isPositiveCompletion(replyCode)) {
                return false;
            }

            if (!ftpClient.login(ftpProperties.getUsername(), ftpProperties.getPassword())) {
                return false;
            }

            ftpClient.setFileType(FTP.BINARY_FILE_TYPE);
            String fullPath = Paths.get(ftpProperties.getBasePath(), remotePath).toString().replace("\\", "/");
            boolean deleted = ftpClient.deleteFile(fullPath);
            log.info("파일 삭제 {}: {}", deleted ? "성공" : "실패", fullPath);
            return deleted;

        } finally {
            if (ftpClient.isConnected()) {
                try {
                    ftpClient.logout();
                    ftpClient.disconnect();
                } catch (IOException e) {
                    log.warn("FTP ?���? 종료 �? ?���?", e);
                }
            }
        }
    }

    private boolean createDirectories(FTPClient ftpClient, String dirPath) throws IOException {
        String[] pathElements = dirPath.split("/");
        if (pathElements.length == 0) {
            return true;
        }

        StringBuilder currentPath = new StringBuilder();
        for (String element : pathElements) {
            if (element.isEmpty()) {
                continue;
            }
            currentPath.append("/").append(element);
            if (!ftpClient.changeWorkingDirectory(currentPath.toString())) {
                if (!ftpClient.makeDirectory(currentPath.toString())) {
                    return false;
                }
                ftpClient.changeWorkingDirectory(currentPath.toString());
            }
        }
        return true;
    }
}
