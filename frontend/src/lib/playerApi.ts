import { api } from "./api";
import { debounceAndMergeRequest, mergeRequest } from "./apiUtils";

// 로컬 캐시 (메모리 기반, 페이지 새로고침 시 초기화)
const searchCache = new Map<string, { data: IdResponse; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1시간

export type IdResponse = { ouid: string };

export type PlayerProfileResponse = {
  ouid: string;
  userName: string;
  clanName: string;
  titleName: string;
  mannerGrade: string;
  userDateCreate?: string;
  grade: string;
  gradeRanking: number;
  gradeImage?: string; // API에서 받은 계급 이미지 URL
  seasonGrade: string;
  seasonGradeRanking: number;
  seasonGradeImage?: string; // API에서 받은 시즌 계급 이미지 URL
  soloTier: string;
  soloScore: number;
  soloTierImage?: string; // API에서 받은 티어 이미지 URL
  partyTier: string;
  partyScore: number;
  partyTierImage?: string; // API에서 받은 티어 이미지 URL
  recentWinRate: number;
  recentKd: number;
  recentAssault: number;
  recentSniper: number;
  recentSpecial: number;
  previousWinRate?: number | null; // 전일 승률 (추가)
  previousKd?: number | null; // 전일 K/D (추가)
};

export type MatchListResponse = {
  match: Array<{
    match_id: string;  // snake_case로 변경
    match_type: string;
    match_mode: string;
    date_match: string;
    match_result: string;
    kill: number;
    death: number;
    assist: number;
  }>;
};

export type MapStat = {
  matchMap: string;
  games: number;
  wins: number;
  winRate: number;
  kd: number;
  hsr: number;
};

export type TimeBucketStat = {
  hourKst: number;
  games: number;
  wins: number;
  winRate: number;
  kd: number;
  damage?: number;
};

export type RankedStats = {
  queueType: "solo" | "party" | "clan";
  games: number;
  wins: number;
  winRate: number;
  kda: number;
  kd: number;
  avgDamage: number;
  skillScore: number;
  skillGrade: string;
  description: string;
};

/**
 * 닉네임으로 OUID 조회 (캐싱 및 디바운싱 적용)
 * - 로컬 캐시 우선 확인하여 API 호출 최소화
 * - 디바운싱으로 연속 검색 시 마지막 요청만 실행
 * - 동시 요청 병합으로 중복 호출 방지
 */
export async function getOuidByNickname(nickname: string): Promise<IdResponse> {
  const normalizedNickname = nickname.trim();
  const cacheKey = `search:${normalizedNickname}`;
  
  // 1. 로컬 캐시 확인 (1시간 TTL)
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  // 2. 디바운싱 및 병합 적용 (500ms 디바운스)
  const requestKey = `getOuidByNickname:${normalizedNickname}`;
  const data = await debounceAndMergeRequest(requestKey, async () => {
    const response = await api.get<IdResponse>("/player/search", {
      params: { name: normalizedNickname },
    });
    
    // 3. 성공 시 캐시 저장
    if (response.data && response.data.ouid) {
      searchCache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now(),
      });
      
      // 캐시 크기 제한 (최대 1000개)
      if (searchCache.size > 1000) {
        const oldestKey = Array.from(searchCache.entries())
          .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
        searchCache.delete(oldestKey);
      }
    }
    
    return response.data;
  }, 500);
  
  return data;
}

/**
 * 프로필 조회 (refresh=false일 때만 병합 적용)
 * refresh=true일 때는 강제 새로고침이므로 병합하지 않음
 */
export async function getProfile(ouid: string, refresh: boolean = false) {
  // refresh=false일 때만 병합 적용 (캐시된 데이터 활용)
  if (!refresh) {
    const requestKey = `getProfile:${ouid}`;
    const data = await mergeRequest(requestKey, async () => {
      const response = await api.get<PlayerProfileResponse>("/player/profile", {
        params: { ouid, refresh: false },
      });
      return response.data;
    });
    return data;
  }
  
  // refresh=true일 때는 일반 호출
  const { data } = await api.get<PlayerProfileResponse>("/player/profile", {
    params: { ouid, refresh: true },
  });
  return data;
}

/**
 * 매치 목록 조회 (병합 적용)
 */
export async function getMatches(ouid: string, matchMode = "all", matchType?: string) {
  try {
    const requestKey = `getMatches:${ouid}:${matchMode}:${matchType || "all"}`;
    const data = await mergeRequest(requestKey, async () => {
      const response = await api.get<MatchListResponse>("/player/matches", {
        params: { ouid, mode: matchMode, type: matchType },
      });
      return response.data;
    });
    return data;
  } catch (error) {
    throw error;
  }
}

export async function getMapInsights(ouid: string, refresh: boolean = true) {
  const { data } = await api.get<MapStat[]>("/player/insights/map", {
    params: { ouid, refresh },
  });
  return data;
}

export async function getTimeInsights(ouid: string, refresh: boolean = true) {
  const { data } = await api.get<TimeBucketStat[]>("/player/insights/time", {
    params: { ouid, refresh },
  });
  return data;
}

export async function getRankedInsights(ouid: string, refresh: boolean = true) {
  const { data } = await api.get<RankedStats[]>("/player/insights/ranked", {
    params: { ouid, refresh },
  });
  return data;
}

export type MatchDetailResponse = {
  match_id: string;  // snake_case로 변경
  match_type: string;
  match_mode: string;
  date_match: string;
  match_map: string;
  match_detail: Array<{
    team_id: string;
    match_result: string;
    user_name: string;
    season_grade: string;
    clan_name: string;
    kill: number;
    death: number;
    headshot: number;
    damage: number;
    assist: number;
  }>;
};

// 새 API용 타입 (표준화된 응답)
export type MatchDetailSummaryResponse = {
  match_id: string;
  match_type: string;
  match_mode: string;
  match_map: string;
  date_match: string;
  date_match_kst?: string;
  players: Array<{
    team_id: string;
    match_result: "WIN" | "LOSE" | "UNKNOWN";
    user_name: string;
    season_grade: string;
    season_grade_image?: string;
    clan_name: string;
    kill: number;
    death: number;
    headshot: number;
    damage: number;
    assist: number;
  }>;
};

export async function getMatchDetail(matchId: string) {
  try {
    const { data } = await api.get<MatchDetailResponse>(`/player/match/${encodeURIComponent(matchId)}`);
    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * 매치 상세 정보 조회 (새 API 사용)
 */
export async function getMatchDetailSummary(matchId: string, useKst: boolean = false) {
  try {
    const { data } = await api.get<MatchDetailSummaryResponse>(`/sa/matches/${encodeURIComponent(matchId)}/detail`, {
      params: { useKst },
    });
    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * 전적검색 (플레이어 매치 히스토리)
 */
export type RankedStatsSummary = {
  match_type: string;
  total_games: number;
  wins: number;
  losses: number;
  win_rate: number;
  kill_death_ratio: number;
  headshot_rate: number;
  avg_damage: number;
  rank_name?: string;
  rank_points?: number;
  rank_image_url?: string;
};

export type PlayerMatchHistoryResponse = {
  ouid: string;
  total_matches: number;
  matches: Array<{
    match_id: string;
    match_type: string;
    match_mode: string;
    date_match: string;
    date_match_kst?: string;
    match_result: "WIN" | "LOSE" | "UNKNOWN";
    kill: number;
    death: number;
    assist: number;
  }>;
  match_details: {
    ranked_solo: MatchDetailSummaryResponse[];
    ranked_party: MatchDetailSummaryResponse[];
    clan_ranked: MatchDetailSummaryResponse[];
    clan_match: MatchDetailSummaryResponse[];
  };
  final_season_stats?: {
    ranked_solo?: RankedStatsSummary;
    ranked_party?: RankedStatsSummary;
  };
};

export async function getPlayerMatchHistory(ouid: string, useKst: boolean = false) {
  try {
    const { data } = await api.get<PlayerMatchHistoryResponse>(`/sa/matches/history`, {
      params: { ouid, useKst },
    });
    return data;
  } catch (error) {
    throw error;
  }
}
