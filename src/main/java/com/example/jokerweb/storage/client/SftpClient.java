package com.example.jokerweb.storage.client;

import com.example.jokerweb.storage.config.FtpProperties;
import com.jcraft.jsch.Channel;
import com.jcraft.jsch.ChannelSftp;
import com.jcraft.jsch.JSch;
import com.jcraft.jsch.Session;
import com.jcraft.jsch.SftpException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.nio.file.Paths;

@Slf4j
@Component
@RequiredArgsConstructor
public class SftpClient {

    private final FtpProperties ftpProperties;

    public String uploadFile(InputStream inputStream, String remotePath) throws Exception {
        if (!ftpProperties.isEnabled()) {
            throw new IllegalStateException("SFTP가 비활성화된 상태입니다.");
        }

        JSch jsch = new JSch();
        Session session = null;
        ChannelSftp channelSftp = null;

        try {
            session = jsch.getSession(ftpProperties.getUsername(), ftpProperties.getHost(), ftpProperties.getPort());
            session.setPassword(ftpProperties.getPassword());
            session.setConfig("StrictHostKeyChecking", "no");
            session.setTimeout(ftpProperties.getTimeout());
            session.connect();

            Channel channel = session.openChannel("sftp");
            channel.connect();
            channelSftp = (ChannelSftp) channel;

            // 디렉터리 생성
            String fullPath = Paths.get(ftpProperties.getBasePath(), remotePath)
                    .toString()
                    .replace("\\", "/");
            String directory = Paths.get(fullPath).getParent()
                    .toString()
                    .replace("\\", "/");
            createDirectories(channelSftp, directory);

            // 파일 업로드
            String fileName = Paths.get(fullPath).getFileName().toString();
            channelSftp.cd(directory);
            channelSftp.put(inputStream, fileName);

            // URL 생성
            String fileUrl = ftpProperties.getBaseUrl() + "/" + remotePath.replace("\\", "/");
            log.info("SFTP 파일 업로드 완료: {}", fileUrl);
            return fileUrl;

        } finally {
            if (channelSftp != null && channelSftp.isConnected()) {
                channelSftp.exit();
            }
            if (session != null && session.isConnected()) {
                session.disconnect();
            }
        }
    }

    public boolean deleteFile(String remotePath) throws Exception {
        if (!ftpProperties.isEnabled()) {
            return false;
        }

        JSch jsch = new JSch();
        Session session = null;
        ChannelSftp channelSftp = null;

        try {
            session = jsch.getSession(ftpProperties.getUsername(), ftpProperties.getHost(), ftpProperties.getPort());
            session.setPassword(ftpProperties.getPassword());
            session.setConfig("StrictHostKeyChecking", "no");
            session.setTimeout(ftpProperties.getTimeout());
            session.connect();

            Channel channel = session.openChannel("sftp");
            channel.connect();
            channelSftp = (ChannelSftp) channel;

            String fullPath = Paths.get(ftpProperties.getBasePath(), remotePath)
                    .toString()
                    .replace("\\", "/");
            channelSftp.rm(fullPath);
            log.info("SFTP 파일 삭제 완료: {}", fullPath);
            return true;

        } catch (Exception e) {
            log.warn("SFTP 파일 삭제 실패: {}", remotePath, e);
            return false;
        } finally {
            if (channelSftp != null && channelSftp.isConnected()) {
                channelSftp.exit();
            }
            if (session != null && session.isConnected()) {
                session.disconnect();
            }
        }
    }

    private void createDirectories(ChannelSftp channelSftp, String dirPath) throws SftpException {
        String[] pathElements = dirPath.split("/");
        StringBuilder currentPath = new StringBuilder();
        for (String element : pathElements) {
            if (element.isEmpty()) {
                continue;
            }
            currentPath.append("/").append(element);
            try {
                channelSftp.cd(currentPath.toString());
            } catch (SftpException e) {
                channelSftp.mkdir(currentPath.toString());
                channelSftp.cd(currentPath.toString());
            }
        }
    }
}
