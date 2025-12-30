-- 클라우드타입 MariaDB에서 데이터베이스 생성 스크립트
-- 이 스크립트를 클라우드타입 MariaDB 서비스의 터미널에서 실행하세요

CREATE DATABASE IF NOT EXISTS jokercommunity 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- 데이터베이스 생성 확인
SHOW DATABASES LIKE 'jokercommunity';

-- 사용자 권한 확인 (필요시)
-- GRANT ALL PRIVILEGES ON jokercommunity.* TO 'root'@'%';
-- FLUSH PRIVILEGES;
