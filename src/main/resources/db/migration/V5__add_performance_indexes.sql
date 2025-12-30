-- 성능 최적화를 위한 추가 인덱스

-- player_rank 업데이트 시간 인덱스 (캐시 무효화 전략에 활용)
CREATE INDEX IF NOT EXISTS idx_player_rank_updated ON player_rank(updated_at);

-- match_player 복합 인덱스 (통계 쿼리 최적화)
CREATE INDEX IF NOT EXISTS idx_match_player_ouid_date ON match_player(ouid, match_id);

-- match_meta 날짜 범위 쿼리 최적화
CREATE INDEX IF NOT EXISTS idx_match_meta_date_desc ON match_meta(date_match_utc DESC);

-- tier_grade 조회 최적화
CREATE INDEX IF NOT EXISTS idx_tier_grade_code ON tier_grade(code);
CREATE INDEX IF NOT EXISTS idx_tier_grade_type_category ON tier_grade(type, category);
