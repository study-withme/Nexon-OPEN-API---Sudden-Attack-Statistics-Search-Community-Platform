-- Change solo_rank_match_tier and party_rank_match_tier from INT to VARCHAR
-- Nexon API returns tier as string (e.g., "GRAND MASTER I") not integer

ALTER TABLE player_rank 
  MODIFY COLUMN solo_rank_match_tier VARCHAR(64),
  MODIFY COLUMN party_rank_match_tier VARCHAR(64);
