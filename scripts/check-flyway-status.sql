-- Flyway 상태 확인 스크립트
-- 클라우드타입 MariaDB 터미널에서 실행하세요

-- 1. Flyway 스키마 히스토리 테이블 확인
USE jokercommunity;

-- Flyway가 생성한 테이블 확인
SHOW TABLES LIKE 'flyway_schema_history';

-- Flyway 마이그레이션 히스토리 확인 (테이블이 있다면)
SELECT * FROM flyway_schema_history ORDER BY installed_rank;

-- 현재 데이터베이스의 모든 테이블 확인
SHOW TABLES;
