-- 추가 성능 인덱스 최적화

-- player_rank.updated_at 인덱스 (최신 랭크 조회용)
CREATE INDEX IF NOT EXISTS idx_player_rank_updated_at ON player_rank(updated_at DESC);

-- match_player.user_name 인덱스 (이름으로 검색 시)
CREATE INDEX IF NOT EXISTS idx_match_player_user_name ON match_player(user_name);

-- player.updated_at 인덱스 (최신 플레이어 정보 조회용)
CREATE INDEX IF NOT EXISTS idx_player_updated_at ON player(updated_at DESC);

-- match_meta.date_match_utc DESC 인덱스 개선 (이미 존재하지만 명시적으로 추가)
-- V5에서 이미 생성되었을 수 있으므로 IF NOT EXISTS 사용
