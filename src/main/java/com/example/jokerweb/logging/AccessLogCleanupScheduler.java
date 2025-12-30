package com.example.jokerweb.logging;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AccessLogCleanupScheduler {

    private final JdbcTemplate jdbcTemplate;

    // 매일 새벽 4시 삭제
    @Scheduled(cron = "0 0 4 * * *")
    public void deleteOldLogs() {
        jdbcTemplate.update("DELETE FROM access_log WHERE occurred_at < (NOW() - INTERVAL 30 DAY)");
    }
}
