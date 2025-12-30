-- Flyway 실패한 마이그레이션 수정 스크립트
-- 클라우드타입 MariaDB 터미널에서 실행하세요

USE jokercommunity;

-- 1. 실패한 V4 마이그레이션 기록 확인
SELECT * FROM flyway_schema_history WHERE version = '4' AND success = 0;

-- 2. 실패한 V4 마이그레이션 기록 삭제
DELETE FROM flyway_schema_history WHERE version = '4' AND success = 0;

-- 3. tier_grade 테이블이 이미 존재하는 경우 데이터 정리 (선택사항)
-- 테이블이 비어있지 않다면 데이터 삭제
DELETE FROM tier_grade;

-- 4. 확인
SELECT * FROM flyway_schema_history WHERE version = '4';
SELECT COUNT(*) as tier_grade_count FROM tier_grade;

-- 5. Flyway repair 실행 (선택사항 - 애플리케이션에서 자동으로 처리됨)
-- 백엔드를 재시작하면 Flyway가 자동으로 수정된 V4 마이그레이션을 실행합니다.
