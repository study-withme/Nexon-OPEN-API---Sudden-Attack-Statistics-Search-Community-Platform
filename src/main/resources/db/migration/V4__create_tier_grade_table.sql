-- 티어 및 계급 정보 저장 테이블
CREATE TABLE IF NOT EXISTS tier_grade (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(64) UNIQUE NOT NULL,
  label VARCHAR(64) NOT NULL,
  type VARCHAR(32),
  category VARCHAR(32),
  image_path VARCHAR(128),
  color VARCHAR(32),
  min_score INT,
  max_score INT,
  min_ranking INT,
  max_ranking INT
);

-- 서든어택 티어 정보 초기 데이터 삽입
INSERT INTO tier_grade (code, label, type, category, image_path, color, min_score, max_score, min_ranking, max_ranking) VALUES
-- 실버 티어
('SILVER I', '실버 I', 'TIER', 'SOLO', '/tiers/silver.svg', 'text-gray-400', 600, 799, NULL, NULL),
('SILVER II', '실버 II', 'TIER', 'SOLO', '/tiers/silver.svg', 'text-gray-400', 800, 999, NULL, NULL),
('SILVER III', '실버 III', 'TIER', 'SOLO', '/tiers/silver.svg', 'text-gray-400', 1000, 1199, NULL, NULL),
-- 골드 티어
('GOLD I', '골드 I', 'TIER', 'SOLO', '/tiers/gold.svg', 'text-yellow-400', 1200, 1399, NULL, NULL),
('GOLD II', '골드 II', 'TIER', 'SOLO', '/tiers/gold.svg', 'text-yellow-400', 1400, 1599, NULL, NULL),
('GOLD III', '골드 III', 'TIER', 'SOLO', '/tiers/gold.svg', 'text-yellow-400', 1600, 1799, NULL, NULL),
-- 마스터 티어
('MASTER I', '마스터 I', 'TIER', 'SOLO', '/tiers/platinum.svg', 'text-blue-400', 1800, 1999, NULL, NULL),
('MASTER II', '마스터 II', 'TIER', 'SOLO', '/tiers/platinum.svg', 'text-blue-400', 2000, 2199, NULL, NULL),
('MASTER III', '마스터 III', 'TIER', 'SOLO', '/tiers/platinum.svg', 'text-blue-400', 2200, 2399, NULL, NULL),
-- 그랜드마스터 티어
('GRAND MASTER I', '그랜드마스터 I', 'TIER', 'SOLO', '/tiers/gm.svg', 'text-purple-400', 2400, 2599, NULL, NULL),
('GRAND MASTER II', '그랜드마스터 II', 'TIER', 'SOLO', '/tiers/gm.svg', 'text-purple-400', 2600, 2799, NULL, NULL),
('GRAND MASTER III', '그랜드마스터 III', 'TIER', 'SOLO', '/tiers/gm.svg', 'text-purple-400', 2800, 2999, NULL, NULL),
-- 레전드
('LEGEND', '레전드', 'TIER', 'SOLO', '/tiers/gm.svg', 'text-yellow-300', 3000, NULL, NULL, NULL),
-- 랭커
('RANKER', 'RANKER', 'TIER', 'SOLO', '/tiers/gm.svg', 'text-emerald-400', NULL, NULL, 101, 300),
('HIGH RANKER', 'HIGH RANKER', 'TIER', 'SOLO', '/tiers/gm.svg', 'text-yellow-300', NULL, NULL, 1, 100),
-- 계급 (서든어택 계급표)
('특급대장', '특급대장', 'GRADE', 'INTEGRATED', '/tiers/gm.svg', 'text-purple-400', NULL, NULL, NULL, NULL),
('대장', '대장', 'GRADE', 'INTEGRATED', '/tiers/platinum.svg', 'text-blue-400', NULL, NULL, NULL, NULL),
('중장', '중장', 'GRADE', 'INTEGRATED', '/tiers/platinum.svg', 'text-blue-400', NULL, NULL, NULL, NULL),
('소장', '소장', 'GRADE', 'INTEGRATED', '/tiers/gold.svg', 'text-yellow-400', NULL, NULL, NULL, NULL),
('준장', '준장', 'GRADE', 'INTEGRATED', '/tiers/gold.svg', 'text-yellow-400', NULL, NULL, NULL, NULL),
('대위', '대위', 'GRADE', 'INTEGRATED', '/tiers/silver.svg', 'text-gray-400', NULL, NULL, NULL, NULL),
('중위', '중위', 'GRADE', 'INTEGRATED', '/tiers/silver.svg', 'text-gray-400', NULL, NULL, NULL, NULL),
('소위', '소위', 'GRADE', 'INTEGRATED', '/tiers/silver.svg', 'text-gray-400', NULL, NULL, NULL, NULL),
('상사', '상사', 'GRADE', 'INTEGRATED', '/tiers/bronze.svg', 'text-orange-400', NULL, NULL, NULL, NULL),
('중사', '중사', 'GRADE', 'INTEGRATED', '/tiers/bronze.svg', 'text-orange-400', NULL, NULL, NULL, NULL),
('하사', '하사', 'GRADE', 'INTEGRATED', '/tiers/bronze.svg', 'text-orange-400', NULL, NULL, NULL, NULL),
('병장', '병장', 'GRADE', 'INTEGRATED', '/tiers/bronze.svg', 'text-orange-400', NULL, NULL, NULL, NULL),
('상병', '상병', 'GRADE', 'INTEGRATED', '/tiers/bronze.svg', 'text-orange-400', NULL, NULL, NULL, NULL),
('일병', '일병', 'GRADE', 'INTEGRATED', '/tiers/bronze.svg', 'text-orange-400', NULL, NULL, NULL, NULL),
('이병', '이병', 'GRADE', 'INTEGRATED', '/tiers/unranked.svg', 'text-slate-400', NULL, NULL, NULL, NULL)
ON DUPLICATE KEY UPDATE code=code;
