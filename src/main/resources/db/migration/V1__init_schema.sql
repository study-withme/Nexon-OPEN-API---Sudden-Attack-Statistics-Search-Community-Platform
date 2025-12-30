-- Initial schema for jokercommunity

-- member
CREATE TABLE IF NOT EXISTS member (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nickname VARCHAR(64) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- member_session (미사용이지만 호환을 위해 유지)
CREATE TABLE IF NOT EXISTS member_session (
  token VARCHAR(64) PRIMARY KEY,
  member_id BIGINT NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_member_session_member FOREIGN KEY (member_id) REFERENCES member(id) ON DELETE CASCADE
);

-- troll_report
CREATE TABLE IF NOT EXISTS troll_report (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  reporter_id BIGINT NOT NULL,
  target_name VARCHAR(64) NOT NULL,
  description TEXT,
  evidence_url VARCHAR(512),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_troll_reporter FOREIGN KEY (reporter_id) REFERENCES member(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_troll_target ON troll_report(target_name);

-- player
CREATE TABLE IF NOT EXISTS player (
  ouid VARCHAR(64) PRIMARY KEY,
  latest_name VARCHAR(64) NOT NULL,
  clan_name VARCHAR(128),
  title_name VARCHAR(128),
  manner_grade VARCHAR(32),
  user_date_create DATETIME NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- player_rank
CREATE TABLE IF NOT EXISTS player_rank (
  ouid VARCHAR(64) PRIMARY KEY,
  grade VARCHAR(64),
  grade_exp BIGINT,
  grade_ranking BIGINT,
  season_grade VARCHAR(64),
  season_grade_exp BIGINT,
  season_grade_ranking BIGINT,
  solo_rank_match_tier INT,
  solo_rank_match_score BIGINT,
  party_rank_match_tier INT,
  party_rank_match_score BIGINT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_player_rank FOREIGN KEY (ouid) REFERENCES player(ouid) ON DELETE CASCADE
);

-- match_meta
CREATE TABLE IF NOT EXISTS match_meta (
  match_id VARCHAR(64) PRIMARY KEY,
  match_type VARCHAR(64),
  match_mode VARCHAR(64),
  match_map VARCHAR(128),
  match_result VARCHAR(16),
  date_match_utc DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- match_player
CREATE TABLE IF NOT EXISTS match_player (
  match_id VARCHAR(64),
  ouid VARCHAR(64),
  team_id VARCHAR(32),
  match_result VARCHAR(16),
  user_name VARCHAR(64),
  season_grade VARCHAR(64),
  clan_name VARCHAR(128),
  kill_count INT,
  death_count INT,
  assist_count INT,
  headshot INT,
  damage DOUBLE,
  PRIMARY KEY (match_id, ouid),
  CONSTRAINT fk_mp_match FOREIGN KEY (match_id) REFERENCES match_meta(match_id) ON DELETE CASCADE,
  CONSTRAINT fk_mp_player FOREIGN KEY (ouid) REFERENCES player(ouid) ON DELETE CASCADE
);

-- indexes
CREATE INDEX IF NOT EXISTS idx_match_meta_date ON match_meta(date_match_utc);
CREATE INDEX IF NOT EXISTS idx_match_meta_mode_type ON match_meta(match_mode, match_type);
CREATE INDEX IF NOT EXISTS idx_match_player_ouid ON match_player(ouid, match_id);
CREATE INDEX IF NOT EXISTS idx_match_player_team ON match_player(match_id, team_id);
