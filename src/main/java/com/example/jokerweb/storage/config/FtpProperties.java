package com.example.jokerweb.storage.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "ftp")
public class FtpProperties {

    private String host = "localhost";
    private int port = 21;
    private String username;
    private String password;
    private String basePath = "/uploads";
    private String baseUrl = "http://localhost:8080/files";
    private boolean useSftp = false;
    private int timeout = 30000;
    private int maxFileSize = 100 * 1024 * 1024; // 100MB
    private boolean enabled = true;
}
