package com.example.jokerweb.config;

import java.util.concurrent.Executor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.AsyncConfigurer;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

/**
 * 비동기 처리 설정
 * AccessLog 저장 등 비동기 작업에 사용
 */
@Slf4j
@Configuration
@EnableAsync
public class AsyncConfig implements AsyncConfigurer {

    @Bean(name = "taskExecutor")
    @Override
    public Executor getAsyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2); // 기본 스레드 수
        executor.setMaxPoolSize(5); // 최대 스레드 수
        executor.setQueueCapacity(100); // 대기 큐 크기
        executor.setThreadNamePrefix("async-");
        executor.setWaitForTasksToCompleteOnShutdown(true); // 종료 시 대기
        executor.setAwaitTerminationSeconds(60); // 최대 60초 대기
        executor.initialize();
        log.info("Async task executor initialized: core={}, max={}, queue={}", 
                executor.getCorePoolSize(), executor.getMaxPoolSize(), executor.getQueueCapacity());
        return executor;
    }
}
