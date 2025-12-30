"use client";

import { useState, useEffect, useRef } from "react";
import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { LoadingSpinner, LoadingSpinnerLarge, LoadingCard, LoadingProgressBar, ErrorBox, EmptyState } from "@/components/ui/State";
import { getMatches, getOuidByNickname, MatchListResponse, getPlayerMatchHistory, PlayerMatchHistoryResponse } from "@/lib/playerApi";
import Image from "next/image";
import { useQuery as useMetadataQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

type Props = {
  params: Promise<{
    nickname: string;
  }>;
};

const matchModes = [
  { label: "전체", value: "all" },
  { label: "개인전", value: "개인전" },
  { label: "데스매치", value: "데스매치" },
  { label: "폭파미션", value: "폭파미션" },
  { label: "진짜를 모아라", value: "진짜를 모아라" },
];

const matchTypes = [
  { label: "전체", value: "all" },
  { label: "랭크전 솔로", value: "랭크전 솔로" },
  { label: "랭크전 파티", value: "랭크전 파티" },
  { label: "일반전", value: "일반전" },
  { label: "클랜전", value: "클랜전" },
  { label: "퀵매치 클랜전", value: "퀵매치 클랜전" },
  { label: "클랜 랭크전", value: "클랜 랭크전" },
  { label: "토너먼트", value: "토너먼트" },
];

/**
 * 매치 유형을 계층 구조로 변환
 */
function getMatchTypeHierarchy(matchType: string) {
  // 랭크전 관련
  if (matchType === "랭크전 솔로") {
    return { category: "랭크전", subType: "솔로", color: "emerald" };
  }
  if (matchType === "랭크전 파티") {
    return { category: "랭크전", subType: "파티", color: "emerald" };
  }
  if (matchType === "클랜 랭크전") {
    return { category: "랭크전", subType: "클랜 랭크전", color: "emerald" };
  }
  
  // 클랜전 관련
  if (matchType === "클랜전") {
    return { category: "클랜전", subType: null, color: "blue" };
  }
  if (matchType === "퀵매치 클랜전") {
    return { category: "클랜전", subType: "퀵매치", color: "blue" };
  }
  
  // 기타
  return { category: matchType || "알 수 없음", subType: null, color: "slate" };
}

const INITIAL_DISPLAY_COUNT = 20;

export default function MatchesPage({ params }: Props) {
  const { nickname: rawNickname } = use(params) as { nickname: string };
  const nickname = decodeURIComponent(rawNickname ?? "");
  const [mode, setMode] = useState("all");
  const [matchType, setMatchType] = useState("all");
  const [displayCount, setDisplayCount] = useState(INITIAL_DISPLAY_COUNT);
  const [showAll, setShowAll] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);

  const ouidQuery = useQuery({
    queryKey: ["ouid", nickname],
    queryFn: () => getOuidByNickname(nickname),
    enabled: !!nickname && nickname.trim().length > 0,
  });

  // 모드별 필터링된 매치 타입 결정
  const getFilteredMatchType = () => {
    if (matchType !== "all") {
      return matchType;
    }
    // 모드별 기본 타입 필터링
    if (mode === "개인전") {
      return "일반전"; // 개인전 모드는 일반전만
    }
    if (mode === "폭파미션") {
      return undefined; // 폭파미션은 모든 랭크전 타입 (백엔드에서 처리)
    }
    return undefined; // 전체는 모든 타입
  };

  const matchesQuery = useQuery({
    queryKey: ["matches", ouidQuery.data?.ouid, mode, matchType],
    queryFn: () => {
      const filteredType = getFilteredMatchType();
      return getMatches(ouidQuery.data!.ouid, mode, filteredType);
    },
    enabled: !!ouidQuery.data?.ouid,
    staleTime: 0, // 항상 최신 데이터 가져오기
    gcTime: 0, // 캐시 즉시 삭제
    refetchOnMount: true, // 마운트 시 항상 재조회
    refetchOnWindowFocus: false, // 윈도우 포커스 시 재조회 안 함
  });

  // 전적검색 (Final 시즌 통계 포함)
  const historyQuery = useQuery({
    queryKey: ["matchHistory", ouidQuery.data?.ouid],
    queryFn: () => getPlayerMatchHistory(ouidQuery.data!.ouid, true),
    enabled: !!ouidQuery.data?.ouid && mode === "all" && matchType === "all",
    staleTime: 5 * 60 * 1000, // 5분 캐시
    retry: 1, // 429 에러 시 재시도 최소화
  });

  // 계급 메타데이터 조회
  const seasonGradeMetadataQuery = useMetadataQuery({
    queryKey: ["seasonGradeMetadata"],
    queryFn: async () => {
      const { data } = await api.get("/metadata/season-grade");
      return data as Array<{ season_grade: string; season_grade_image: string }>;
    },
    staleTime: 60 * 60 * 1000, // 1시간 캐시
  });

  // 계급 이미지 URL 가져오기
  const getSeasonGradeImageUrl = (seasonGrade: string | null | undefined) => {
    if (!seasonGrade || !seasonGradeMetadataQuery.data) return null;
    const metadata = seasonGradeMetadataQuery.data.find(
      (item) => item.season_grade === seasonGrade
    );
    return metadata?.season_grade_image || null;
  };

  const loading = ouidQuery.isLoading || matchesQuery.isLoading;
  const error = ouidQuery.error || matchesQuery.error;
  const data: MatchListResponse | undefined = matchesQuery.data;

  // 필터 변경 시 초기화
  useEffect(() => {
    setDisplayCount(INITIAL_DISPLAY_COUNT);
    setShowAll(false);
  }, [mode, matchType]);

  // 무한 스크롤 구현
  useEffect(() => {
    if (showAll || !data?.match || data.match.length <= INITIAL_DISPLAY_COUNT) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && displayCount < data.match.length) {
          setDisplayCount((prev) => Math.min(prev + 10, data.match.length));
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [displayCount, data?.match, showAll]);

  const displayedMatches = showAll ? data?.match || [] : data?.match?.slice(0, displayCount) || [];
  const hasMore = data?.match && displayCount < data.match.length;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-10 space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-400">매치</p>
          <h1 className="text-3xl font-semibold text-emerald-200">
            {nickname || "닉네임 미지정"}
          </h1>
          <p className="text-sm text-slate-400">
            모드/유형별 필터와 상세 지표를 확인하세요.
          </p>
        </div>
        <button
          onClick={() => {
            ouidQuery.refetch();
            matchesQuery.refetch();
          }}
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-emerald-400"
        >
          새로고침
        </button>
      </div>

      {/* Final 시즌 통계 (전체 모드/타입일 때만 표시) */}
      {mode === "all" && matchType === "all" && !historyQuery.isLoading && historyQuery.data?.final_season_stats && 
        ((historyQuery.data.final_season_stats.ranked_solo?.total_games ?? 0) > 0 || 
         (historyQuery.data.final_season_stats.ranked_party?.total_games ?? 0) > 0) && (
        <section className="card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-emerald-200">2025 Final 시즌 통계</h2>
            <span className="text-xs text-slate-400">2024년 12월 12일 이후 데이터</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 랭크전 솔로 */}
            {historyQuery.data.final_season_stats.ranked_solo && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-emerald-300">랭크전 솔로</h3>
                  <span className="text-xs text-slate-400">2025 시즌FINAL</span>
                </div>
                
                {historyQuery.data.final_season_stats.ranked_solo.rank_image_url && (
                  <div className="flex items-center justify-center">
                    <Image
                      src={historyQuery.data.final_season_stats.ranked_solo.rank_image_url}
                      alt={historyQuery.data.final_season_stats.ranked_solo.rank_name || "계급"}
                      width={80}
                      height={80}
                      className="rounded-full"
                      unoptimized
                    />
                  </div>
                )}
                
                {historyQuery.data.final_season_stats.ranked_solo.rank_name && (
                  <div className="text-center space-y-1">
                    <p className="text-2xl font-bold text-slate-200">
                      {historyQuery.data.final_season_stats.ranked_solo.rank_name}
                    </p>
                    {historyQuery.data.final_season_stats.ranked_solo.rank_points && (
                      <p className="text-lg font-semibold text-slate-300">
                        {historyQuery.data.final_season_stats.ranked_solo.rank_points.toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-slate-400 text-xs mb-1">전적</p>
                    <p className="text-slate-200 font-semibold">
                      {historyQuery.data.final_season_stats.ranked_solo.total_games}전 {historyQuery.data.final_season_stats.ranked_solo.wins}승
                    </p>
                    <p className="text-slate-400 text-xs">
                      ({historyQuery.data.final_season_stats.ranked_solo.win_rate.toFixed(1)}%)
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs mb-1">킬뎃</p>
                    <p className="text-slate-200 font-semibold">
                      {historyQuery.data.final_season_stats.ranked_solo.kill_death_ratio.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs mb-1">헤드샷</p>
                    <p className="text-slate-200 font-semibold">
                      {historyQuery.data.final_season_stats.ranked_solo.headshot_rate.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs mb-1">딜량</p>
                    <p className="text-slate-200 font-semibold">
                      {Math.round(historyQuery.data.final_season_stats.ranked_solo.avg_damage).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* 랭크전 파티 */}
            {historyQuery.data.final_season_stats.ranked_party && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-emerald-300">랭크전 파티</h3>
                  <span className="text-xs text-slate-400">2025 시즌FINAL</span>
                </div>
                
                {historyQuery.data.final_season_stats.ranked_party.rank_image_url && (
                  <div className="flex items-center justify-center">
                    <Image
                      src={historyQuery.data.final_season_stats.ranked_party.rank_image_url}
                      alt={historyQuery.data.final_season_stats.ranked_party.rank_name || "계급"}
                      width={80}
                      height={80}
                      className="rounded-full"
                      unoptimized
                    />
                  </div>
                )}
                
                {historyQuery.data.final_season_stats.ranked_party.rank_name && (
                  <div className="text-center space-y-1">
                    <p className="text-2xl font-bold text-slate-200">
                      {historyQuery.data.final_season_stats.ranked_party.rank_name}
                    </p>
                    {historyQuery.data.final_season_stats.ranked_party.rank_points && (
                      <p className="text-lg font-semibold text-slate-300">
                        {historyQuery.data.final_season_stats.ranked_party.rank_points.toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-slate-400 text-xs mb-1">전적</p>
                    <p className="text-slate-200 font-semibold">
                      {historyQuery.data.final_season_stats.ranked_party.total_games}전 {historyQuery.data.final_season_stats.ranked_party.wins}승
                    </p>
                    <p className="text-slate-400 text-xs">
                      ({historyQuery.data.final_season_stats.ranked_party.win_rate.toFixed(1)}%)
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs mb-1">킬뎃</p>
                    <p className="text-slate-200 font-semibold">
                      {historyQuery.data.final_season_stats.ranked_party.kill_death_ratio.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs mb-1">헤드샷</p>
                    <p className="text-slate-200 font-semibold">
                      {historyQuery.data.final_season_stats.ranked_party.headshot_rate.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs mb-1">딜량</p>
                    <p className="text-slate-200 font-semibold">
                      {Math.round(historyQuery.data.final_season_stats.ranked_party.avg_damage).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="card p-5 space-y-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="text-slate-400 text-xs">게임 모드</span>
            {matchModes.map((m) => (
              <button
                key={m.value}
                onClick={() => {
                  setMode(m.value);
                  // 모드 변경 시 타입 초기화
                  setMatchType("all");
                }}
                className={`rounded-full border px-3 py-1 text-slate-200 hover:bg-slate-800 ${
                  mode === m.value ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-100" : "border-slate-700"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-slate-400 text-xs">매치 유형</span>
            <div className="flex flex-wrap gap-2 text-sm">
              {(() => {
                // 모드별로 표시할 타입 필터링
                let availableTypes = matchTypes;
                if (mode === "개인전") {
                  // 개인전 모드는 일반전만 표시
                  availableTypes = matchTypes.filter(t => t.value === "all" || t.value === "일반전");
                } else if (mode === "폭파미션") {
                  // 폭파미션 모드는 랭크전 관련 타입만 표시
                  availableTypes = matchTypes.filter(t => 
                    t.value === "all" || 
                    t.value === "랭크전 솔로" || 
                    t.value === "랭크전 파티" || 
                    t.value === "클랜 랭크전" || 
                    t.value === "토너먼트"
                  );
                }
                
                // 랭크전과 클랜전을 그룹화하여 표시
                const rankedTypes = availableTypes.filter(t => 
                  t.value === "랭크전 솔로" || 
                  t.value === "랭크전 파티" || 
                  t.value === "클랜 랭크전"
                );
                const clanTypes = availableTypes.filter(t => 
                  t.value === "클랜전" || 
                  t.value === "퀵매치 클랜전"
                );
                const otherTypes = availableTypes.filter(t => 
                  t.value === "all" || 
                  (!rankedTypes.includes(t) && !clanTypes.includes(t))
                );
                
                return (
                  <>
                    {/* 전체 버튼 */}
                    {otherTypes.map((t) => (
                      <button
                        key={t.value}
                        onClick={() => setMatchType(t.value)}
                        className={`rounded-full border px-3 py-1 text-slate-200 hover:bg-slate-800 ${
                          matchType === t.value ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-100" : "border-slate-700"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                    
                    {/* 랭크전 그룹 */}
                    {rankedTypes.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-xs text-slate-500 px-1">랭크전:</span>
                        {rankedTypes.map((t) => {
                          const hierarchy = getMatchTypeHierarchy(t.value);
                          return (
                            <button
                              key={t.value}
                              onClick={() => setMatchType(t.value)}
                              className={`rounded-full border px-3 py-1 text-slate-200 hover:bg-slate-800 ${
                                matchType === t.value 
                                  ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-100" 
                                  : "border-slate-700"
                              }`}
                            >
                              {hierarchy.subType || t.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    
                    {/* 클랜전 그룹 */}
                    {clanTypes.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-xs text-slate-500 px-1">클랜전:</span>
                        {clanTypes.map((t) => {
                          const hierarchy = getMatchTypeHierarchy(t.value);
                          return (
                            <button
                              key={t.value}
                              onClick={() => setMatchType(t.value)}
                              className={`rounded-full border px-3 py-1 text-slate-200 hover:bg-slate-800 ${
                                matchType === t.value 
                                  ? "border-blue-500/60 bg-blue-500/10 text-blue-100" 
                                  : "border-slate-700"
                              }`}
                            >
                              {hierarchy.subType || t.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
        {ouidQuery.isError && (
          <ErrorBox
            message={(ouidQuery.error as { message?: string })?.message || "닉네임으로 OUID를 찾지 못했습니다."}
            action={<button onClick={() => ouidQuery.refetch()}>다시 시도</button>}
          />
        )}
        {loading && (
          <div className="space-y-4 animate-fade-in">
            <LoadingProgressBar />
            <div className="flex items-center justify-center py-8">
              <LoadingSpinnerLarge message="매치 데이터를 불러오는 중입니다..." />
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              <LoadingCard count={4} />
            </div>
          </div>
        )}
        {error && !ouidQuery.error && (
          <ErrorBox
            message={(error as { message?: string })?.message || "매치를 불러오는 중 오류가 발생했습니다."}
            action={<button onClick={() => matchesQuery.refetch()}>다시 시도</button>}
          />
        )}
        {!loading && !error && data?.match?.length === 0 && (
          <EmptyState message="매치 데이터가 없습니다." />
        )}
        {!loading && !error && data?.match && data.match.length > 0 && (
          <>
            <div className="grid gap-3 lg:grid-cols-2">
              {displayedMatches.map((item, idx) => {
                // snake_case 필드명 사용 (타입 정의에 맞춤)
                const matchId = item.match_id || "";
                const matchMode = item.match_mode || "";
                const matchType = item.match_type || "";
                const matchResult = item.match_result || "";
                
                const hasMatchId = Boolean(matchId);
                const matchIdLabel = hasMatchId ? `${matchId.slice(0, 8)}...` : "ID 정보 없음";
                const resultLabel = matchResult === "1" || matchResult === "승" ? "승" : matchResult === "2" || matchResult === "패" ? "패" : matchResult === "3" ? "무" : (matchResult || "-");
                const resultColor =
                  resultLabel === "승" ? "text-emerald-300" : resultLabel === "패" ? "text-red-400" : "text-slate-400";

                return (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between text-sm text-slate-300">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-200">{matchMode || "-"}</span>
                        {(() => {
                          const hierarchy = getMatchTypeHierarchy(matchType);
                          const colorClasses = {
                            emerald: "bg-emerald-500/20 border-emerald-500/50 text-emerald-300",
                            blue: "bg-blue-500/20 border-blue-500/50 text-blue-300",
                            slate: "bg-slate-800 text-slate-200",
                          };
                          
                          return (
                            <span className="flex items-center gap-1">
                              <span className={`rounded-full border px-2 py-1 text-xs ${colorClasses[hierarchy.color as keyof typeof colorClasses]}`}>
                                {hierarchy.category}
                              </span>
                              {hierarchy.subType && (
                                <>
                                  <span className="text-slate-600 text-xs">/</span>
                                  <span className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-200">
                                    {hierarchy.subType}
                                  </span>
                                </>
                              )}
                            </span>
                          );
                        })()}
                      </div>
                      <span className={resultColor}>{resultLabel}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                      <div>K/D/A: {item.kill}/{item.death}/{item.assist}</div>
                      <div>매치 ID: {matchIdLabel}</div>
                    </div>
                    {item.date_match && (
                      <div className="text-xs text-slate-400">
                        {(() => {
                          try {
                            const date = new Date(item.date_match);
                            const now = new Date();
                            const diffMs = now.getTime() - date.getTime();
                            const diffMins = Math.floor(diffMs / 60000);
                            const diffHours = Math.floor(diffMs / 3600000);
                            const diffDays = Math.floor(diffMs / 86400000);
                            
                            if (diffMins < 60) {
                              return `${diffMins}분 전`;
                            } else if (diffHours < 24) {
                              return `${diffHours}시간 전`;
                            } else if (diffDays < 7) {
                              return `${diffDays}일 전`;
                            } else {
                              return new Intl.DateTimeFormat("ko-KR", {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                                timeZone: "Asia/Seoul",
                              }).format(date);
                            }
                          } catch {
                            return item.date_match;
                          }
                        })()}
                      </div>
                    )}
                    <div className="mt-2 pt-2 border-t border-slate-800">
                      {hasMatchId ? (
                        <Link
                          href={`/matches/${encodeURIComponent(nickname)}/${encodeURIComponent(matchId)}`}
                          className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/50 bg-emerald-500/20 text-emerald-300 text-xs hover:bg-emerald-500/30 transition-colors"
                        >
                          <span>📊</span>
                          <span>매치 상세 보기</span>
                        </Link>
                      ) : (
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-700 bg-slate-800 text-slate-400 text-xs">
                          <span>⚠️</span>
                          <span>매치 ID 없음</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {!showAll && hasMore && (
              <div className="flex justify-center mt-4">
                <button
                  onClick={() => setShowAll(true)}
                  className="rounded-lg bg-emerald-500 px-6 py-2 text-sm font-semibold text-slate-900 hover:bg-emerald-400"
                >
                  전체 매치 보기 ({data.match.length}경기)
                </button>
              </div>
            )}
            {!showAll && hasMore && (
              <div ref={observerRef} className="h-10" />
            )}
            {showAll && (
              <div className="flex justify-center mt-4">
                <button
                  onClick={() => {
                    setShowAll(false);
                    setDisplayCount(INITIAL_DISPLAY_COUNT);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="rounded-lg border border-slate-700 px-6 py-2 text-sm text-slate-200 hover:bg-slate-800"
                >
                  처음으로
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
