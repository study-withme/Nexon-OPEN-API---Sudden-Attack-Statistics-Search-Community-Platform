-- 추가 인덱스 최적화

-- player 테이블 인덱스 추가 (닉네임 검색 최적화)
CREATE INDEX IF NOT EXISTS idx_player_latest_name ON player(latest_name);
CREATE INDEX IF NOT EXISTS idx_player_updated_at ON player(updated_at);

-- match_meta 테이블 추가 인덱스 (날짜 범위 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_match_meta_created_at ON match_meta(created_at);

-- match_player 테이블 복합 인덱스 최적화 (통계 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_match_player_ouid_date ON match_player(ouid, match_id);

-- player_rank 테이블 인덱스 (랭킹 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_player_rank_solo_score ON player_rank(solo_rank_match_score DESC);
CREATE INDEX IF NOT EXISTS idx_player_rank_party_score ON player_rank(party_rank_match_score DESC);
