-- 매치 요약 정보 테이블 생성
-- match_id를 기준으로 upsert 수행
-- 주의: kill, death, assist는 MariaDB 예약어이므로 kill_count, death_count, assist_count로 변경

CREATE TABLE IF NOT EXISTS match_summary (
    match_id VARCHAR(64) PRIMARY KEY COMMENT '매치 ID (string, 절대 long으로 파싱하지 않음)',
    match_type VARCHAR(64) COMMENT '매치 유형',
    match_mode VARCHAR(64) COMMENT '매치 모드',
    date_match_utc DATETIME NOT NULL COMMENT '매치 날짜 (UTC)',
    match_result VARCHAR(16) COMMENT '매치 결과 (WIN, LOSE, UNKNOWN)',
    kill_count INT COMMENT '킬 수',
    death_count INT COMMENT '데스 수',
    assist_count INT COMMENT '어시스트 수',
    last_fetched_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '마지막 수집 시각',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 시각',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정 시각',
    INDEX idx_match_summary_mode_type (match_mode, match_type),
    INDEX idx_match_summary_date (date_match_utc DESC),
    INDEX idx_match_summary_fetched (last_fetched_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='매치 요약 정보';
