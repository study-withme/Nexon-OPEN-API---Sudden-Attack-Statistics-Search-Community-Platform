package com.example.jokerweb.config;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.configuration.FluentConfiguration;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import javax.sql.DataSource;

/**
 * Flyway 설정
 * MariaDB mysql.proc 관련 문제를 우회하기 위한 커스텀 설정
 */
@Configuration
@Profile("dev")
public class FlywayConfig {

    @Autowired
    private DataSource dataSource;

    /**
     * Flyway 마이그레이션 전략 커스터마이징
     * mysql.proc 문제로 인한 마이그레이션 실패를 복구
     */
    @Bean
    public FlywayMigrationStrategy flywayMigrationStrategy() {
        return flyway -> {
            // 기본 마이그레이션 수행
            try {
                flyway.migrate();
            } catch (Exception e) {
                String errorMsg = e.getMessage();

                // 1) mysql.proc 관련 오류 처리 (기존 로직)
                if (errorMsg != null && errorMsg.contains("mysql.proc")) {
                    // mysql.proc 오류인 경우,
                    // Flyway가 내부적으로 수행하는 mysql.proc 체크를 우회
                    System.err.println("Warning: mysql.proc 체크 오류 감지, 우회 처리 진행...");

                    // Flyway 설정을 다시 구성
                    FluentConfiguration config = Flyway.configure()
                            .dataSource(dataSource)
                            .baselineOnMigrate(true)
                            .validateOnMigrate(false)
                            .locations("classpath:db/migration")
                            .schemas("jokercommunity");

                    Flyway retryFlyway = config.load();

                    // 재실행
                    retryFlyway.migrate();
                    return;
                }

                // 2) 실패한 마이그레이션 상태 복구 & 재시도
                // 예: "Schema `jokercommunity` contains a failed migration to version 7 !"
                if (errorMsg != null && errorMsg.contains("contains a failed migration to version")) {
                    System.err.println("Warning: Flyway 마이그레이션 오류 감지, repair 후 재시도합니다.");
                    try {
                        // 실패 상태 정리(flyway_schema_history의 오류 코드 정리)
                        flyway.repair();
                        // 다시 마이그레이션 수행
                        flyway.migrate();
                        return;
                    } catch (Exception retryEx) {
                        // 복구까지 시도했지만 실패한 경우, 상위로 예외 전달
                        throw retryEx;
                    }
                }

                // 3) 그 외 오류는 그대로 전파
                throw e;
            }
        };
    }
}
