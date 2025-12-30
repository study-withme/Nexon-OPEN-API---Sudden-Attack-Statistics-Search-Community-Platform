package com.example.jokerweb.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.converter.StringHttpMessageConverter;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.charset.StandardCharsets;
import java.util.List;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${ftp.base-url:http://localhost:8080/files}")
    private String baseUrl;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 파일 업로드 경로 설정 (로컬 개발 환경 - 프로덕션에서는 Nginx 사용)
        // 프로덕션 환경에서는 Nginx가 정적 파일을 직접 서빙
        String projectDir = System.getProperty("user.dir");
        String filePath = "file:" + projectDir.replace("\\", "/") + "/uploads/";
        registry.addResourceHandler("/files/**")
                .addResourceLocations(filePath)
                .setCachePeriod(3600)
                .resourceChain(true);
    }

    // HTTP 응답 인코딩을 UTF-8로 설정
    @Override
    public void configureMessageConverters(List<HttpMessageConverter<?>> converters) {
        StringHttpMessageConverter stringConverter = new StringHttpMessageConverter(StandardCharsets.UTF_8);
        converters.add(stringConverter);
    }
}
