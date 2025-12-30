"use client";

import { use, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "@/hooks/useTheme";
import { clsx } from "clsx";
import Link from "next/link";
import { 
  LoadingSpinner, 
  LoadingSpinnerLarge, 
  LoadingCard, 
  LoadingProgressBar, 
  ErrorBox, 
  EmptyState 
} from "@/components/ui/State";
import { getMatchDetailSummary, MatchDetailSummaryResponse } from "@/lib/playerApi";
import Image from "next/image";

type Props = {
  params: Promise<{
    nickname: string;
    matchId: string;
  }>;
};

/**
 * 매치 유형을 계층 구조로 표시
 */
function getMatchTypeHierarchy(matchType: string, matchMode: string) {
  // 랭크전 관련
  if (matchType === "랭크전 솔로") {
    return { category: "랭크전", subType: "솔로" };
  }
  if (matchType === "랭크전 파티") {
    return { category: "랭크전", subType: "파티" };
  }
  if (matchType === "클랜 랭크전") {
    return { category: "랭크전", subType: "클랜 랭크전" };
  }
  
  // 클랜전 관련
  if (matchType === "클랜전") {
    return { category: "클랜전", subType: null };
  }
  if (matchType === "퀵매치 클랜전") {
    return { category: "클랜전", subType: "퀵매치" };
  }
  
  // 기타
  return { category: matchType || matchMode || "알 수 없음", subType: null };
}

/**
 * 날짜 포맷팅
 */
function formatDate(dateString?: string) {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Seoul",
    }).format(date);
  } catch {
    return dateString;
  }
}

export default function MatchDetailPage({ params }: Props) {
  const resolvedParams = use(params) as { nickname: string; matchId: string };
  const { nickname: rawNickname, matchId: rawMatchId } = resolvedParams;
  const nickname = decodeURIComponent(rawNickname ?? "");
  const matchId = decodeURIComponent(rawMatchId ?? "");
  const { theme } = useTheme();
  const [useKst, setUseKst] = useState(true);

  const matchDetailQuery = useQuery({
    queryKey: ["matchDetail", matchId, useKst],
    queryFn: () => getMatchDetailSummary(matchId, useKst),
    enabled: !!matchId && matchId.trim().length > 0,
    staleTime: 5 * 60 * 1000, // 5분 캐시
  });

  const loading = matchDetailQuery.isLoading;
  const error = matchDetailQuery.error;
  const data: MatchDetailSummaryResponse | undefined = matchDetailQuery.data;

  // 팀별로 플레이어 그룹화 및 아군/적군 구분
  const playersByTeam = data?.players?.reduce((acc, player) => {
    const teamId = player.team_id || "unknown";
    if (!acc[teamId]) {
      acc[teamId] = [];
    }
    acc[teamId].push(player);
    return acc;
  }, {} as Record<string, typeof data.players>) || {};
  
  // 아군 팀 찾기 (닉네임과 일치하는 플레이어가 있는 팀)
  const allyTeamId = data?.players?.find(p => 
    p.user_name?.toLowerCase() === nickname.toLowerCase()
  )?.team_id;
  
  // 계급 이미지 URL 가져오기 (메타데이터 API 사용)
  const getSeasonGradeImageUrl = (seasonGrade: string | null | undefined) => {
    if (!seasonGrade) return null;
    // 메타데이터 API에서 계급 이미지 URL 가져오기
    // 실제 구현 시 /api/metadata/season-grade 엔드포인트 사용
    return null; // 임시로 null 반환
  };

  const hierarchy = data ? getMatchTypeHierarchy(data.match_type, data.match_mode) : null;

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-10 space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href={`/matches/${encodeURIComponent(nickname)}`}
            className="text-sm text-emerald-400 hover:text-emerald-300 mb-2 inline-block"
          >
            ← 매치 리스트로 돌아가기
          </Link>
          <p className="text-sm text-slate-400">매치 상세</p>
          <h1 className="text-3xl font-semibold text-emerald-200">
            {nickname || "닉네임 미지정"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={useKst}
              onChange={(e) => setUseKst(e.target.checked)}
              className="rounded"
            />
            <span>KST 시간대</span>
          </label>
          <button
            onClick={() => matchDetailQuery.refetch()}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-emerald-400"
          >
            새로고침
          </button>
        </div>
      </div>

      {loading && (
        <div className="space-y-4 animate-fade-in">
          <LoadingProgressBar />
          <div className="flex items-center justify-center py-8">
            <LoadingSpinnerLarge message="매치 상세 정보를 불러오는 중입니다..." />
          </div>
        </div>
      )}

      {error && (
        <ErrorBox
          message={(error as { message?: string })?.message || "매치 상세 정보를 불러오는 중 오류가 발생했습니다."}
          action={<button onClick={() => matchDetailQuery.refetch()}>다시 시도</button>}
        />
      )}

      {!loading && !error && !data && (
        <EmptyState message="매치 상세 정보를 찾을 수 없습니다." />
      )}

      {!loading && !error && data && (
        <>
          {/* 매치 기본 정보 */}
          <section className="card p-6 space-y-4">
            <h2 className="text-xl font-semibold text-emerald-200">매치 정보</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-slate-400">게임 모드</p>
                <p className="text-sm font-medium text-slate-200">{data.match_mode || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-400">매치 유형</p>
                <div className="flex flex-col gap-1">
                  {hierarchy?.category && (
                    <span className="inline-flex items-center gap-1">
                      <span className="rounded-full bg-emerald-500/20 border border-emerald-500/50 px-2 py-1 text-xs text-emerald-300">
                        {hierarchy.category}
                      </span>
                      {hierarchy.subType && (
                        <>
                          <span className="text-slate-500">/</span>
                          <span className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-300">
                            {hierarchy.subType}
                          </span>
                        </>
                      )}
                    </span>
                  )}
                  {!hierarchy?.category && (
                    <span className="text-sm text-slate-300">{data.match_type || "-"}</span>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-400">맵</p>
                <p className="text-sm font-medium text-slate-200">{data.match_map || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-400">매치 시간</p>
                <p className="text-sm font-medium text-slate-200">
                  {formatDate(useKst ? data.date_match_kst : data.date_match)}
                </p>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-800">
              <p className="text-xs text-slate-400">매치 ID</p>
              <p className="text-sm font-mono text-slate-300 break-all">{data.match_id}</p>
            </div>
          </section>

          {/* 플레이어 정보 (팀별) */}
          <section className="card p-6 space-y-6">
            <h2 className="text-xl font-semibold text-emerald-200">참여자 정보</h2>
            
            {Object.entries(playersByTeam).map(([teamId, players]) => {
              const teamResult = players[0]?.match_result;
              const isWin = teamResult === "WIN";
              const isAlly = teamId === allyTeamId;
              
              return (
                <div key={teamId} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h3 className={clsx(
                      "text-lg font-semibold",
                      isAlly ? "text-emerald-300" : "text-blue-300"
                    )}>
                      {isAlly ? "아군" : "적군"} (팀 {teamId})
                    </h3>
                    <span
                      className={clsx(
                        "rounded-full px-3 py-1 text-xs font-semibold",
                        isWin
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50"
                          : "bg-red-500/20 text-red-300 border border-red-500/50"
                      )}
                    >
                      {teamResult === "WIN" ? "승리" : teamResult === "LOSE" ? "패배" : "알 수 없음"}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-800">
                          <th className="text-left py-2 px-3 text-slate-400 font-medium">플레이어</th>
                          <th className="text-left py-2 px-3 text-slate-400 font-medium">클랜</th>
                          <th className="text-center py-2 px-3 text-slate-400 font-medium">계급</th>
                          <th className="text-center py-2 px-3 text-slate-400 font-medium">K</th>
                          <th className="text-center py-2 px-3 text-slate-400 font-medium">D</th>
                          <th className="text-center py-2 px-3 text-slate-400 font-medium">A</th>
                          <th className="text-center py-2 px-3 text-slate-400 font-medium">HS</th>
                          <th className="text-center py-2 px-3 text-slate-400 font-medium">데미지</th>
                          <th className="text-center py-2 px-3 text-slate-400 font-medium">K/D</th>
                        </tr>
                      </thead>
                      <tbody>
                        {players.map((player, idx) => {
                          const kd = player.death > 0 ? (player.kill / player.death).toFixed(2) : player.kill.toFixed(2);
                          return (
                            <tr
                              key={idx}
                              className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                            >
                              <td className="py-2 px-3 text-slate-200 font-medium">
                                {player.user_name || "-"}
                              </td>
                              <td className="py-2 px-3 text-slate-300">
                                {player.clan_name || "-"}
                              </td>
                              <td className="py-2 px-3 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  {player.season_grade && (
                                    <>
                                      {(player.season_grade_image || (player.season_grade && player.season_grade.includes("http"))) ? (
                                        <Image
                                          src={player.season_grade_image || player.season_grade}
                                          alt={player.season_grade || "계급"}
                                          width={24}
                                          height={24}
                                          className="rounded"
                                          unoptimized
                                        />
                                      ) : (
                                        <span className="text-slate-300 text-xs">{player.season_grade}</span>
                                      )}
                                    </>
                                  )}
                                  {!player.season_grade && <span className="text-slate-500">-</span>}
                                </div>
                              </td>
                              <td className="py-2 px-3 text-center text-emerald-300 font-semibold">
                                {player.kill ?? 0}
                              </td>
                              <td className="py-2 px-3 text-center text-red-300 font-semibold">
                                {player.death ?? 0}
                              </td>
                              <td className="py-2 px-3 text-center text-blue-300 font-semibold">
                                {player.assist ?? 0}
                              </td>
                              <td className="py-2 px-3 text-center text-slate-300">
                                {player.headshot ?? 0}
                              </td>
                              <td className="py-2 px-3 text-center text-slate-300">
                                {player.damage ? player.damage.toFixed(1) : "0.0"}
                              </td>
                              <td className="py-2 px-3 text-center text-slate-200 font-semibold">
                                {kd}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </section>
        </>
      )}
    </div>
  );
}
