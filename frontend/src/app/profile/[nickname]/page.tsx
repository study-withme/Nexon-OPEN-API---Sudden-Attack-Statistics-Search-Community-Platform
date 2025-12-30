"use client";

import { useQuery } from "@tanstack/react-query";
import { LoadingSpinner, LoadingSpinnerLarge, LoadingCard, LoadingProgressBar, ErrorBox, EmptyState } from "@/components/ui/State";
import { getOuidByNickname, getProfile, getTimeInsights, getRankedInsights, PlayerProfileResponse, RankedStats } from "@/lib/playerApi";
import { use, useEffect, useRef, useState } from "react";
import { TierIcon } from "@/components/ui/TierIcon";
import { ShareIcon, PhotoIcon, CodeBracketIcon, CheckIcon } from "@heroicons/react/24/outline";

type Props = {
  params: Promise<{
    nickname: string;
  }>;
};

export default function ProfilePage({ params }: Props) {
  const { nickname: rawNickname } = use(params) as { nickname: string };
  const nickname = decodeURIComponent(rawNickname ?? "");
  const ouidQuery = useQuery({
    queryKey: ["ouid", nickname],
    queryFn: () => getOuidByNickname(nickname),
    enabled: !!nickname && nickname.trim().length > 0,
  });

  const profileQuery = useQuery({
    queryKey: ["profile", ouidQuery.data?.ouid],
    queryFn: () => getProfile(ouidQuery.data!.ouid, true),
    enabled: !!ouidQuery.data?.ouid,
    staleTime: 0, // 항상 최신 데이터 가져오기
    gcTime: 0, // 캐시 즉시 삭제
    refetchOnMount: true, // 마운트 시 항상 재조회
    refetchOnWindowFocus: false, // 윈도우 포커스 시 재조회 안 함
  });
  const timeQuery = useQuery({
    queryKey: ["timeInsights", ouidQuery.data?.ouid],
    queryFn: () => getTimeInsights(ouidQuery.data!.ouid, true),
    enabled: !!ouidQuery.data?.ouid,
    staleTime: 0, // 항상 최신 데이터 가져오기
    gcTime: 0, // 캐시 즉시 삭제
    refetchOnMount: true, // 마운트 시 항상 재조회
    refetchOnWindowFocus: false, // 윈도우 포커스 시 재조회 안 함
  });
  const rankedQuery = useQuery({
    queryKey: ["rankedInsights", ouidQuery.data?.ouid],
    queryFn: () => getRankedInsights(ouidQuery.data!.ouid, true),
    enabled: !!ouidQuery.data?.ouid,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  const loading = ouidQuery.isLoading || profileQuery.isLoading;
  const error = ouidQuery.error || profileQuery.error;
  const data: PlayerProfileResponse | undefined = profileQuery.data;
  const ouid = ouidQuery.data?.ouid;
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const rifleStat = data?.recentAssault;
  const [skillTab, setSkillTab] = useState<"ranked" | "normal">("ranked");
  const [rankQueue, setRankQueue] = useState<"solo" | "party">("solo");
  const [skillLoading, setSkillLoading] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);
  
  // 디버깅: 프로필 데이터 로깅 (개발 환경에서만)
  if (process.env.NODE_ENV === 'development' && data) {
    console.log('[ProfilePage] 프로필 데이터:', {
      gradeImage: data.gradeImage,
      seasonGradeImage: data.seasonGradeImage,
      soloTierImage: data.soloTierImage,
      partyTierImage: data.partyTierImage,
    });
  }

  useEffect(() => {
    if (!data) return;

    const observers: IntersectionObserver[] = [];

    sectionRefs.current.forEach((ref, index) => {
      if (!ref) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setRevealed((prev) => new Set([...prev, index]));
            }
          });
        },
        { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
      );

      observer.observe(ref);
      observers.push(observer);
    });

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, [data]);

  // 공유 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.relative')) {
        setShowShareMenu(false);
      }
    };
    if (showShareMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showShareMenu]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 pb-14 sm:pb-20 pt-6 sm:pt-10 space-y-8">
      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/15 shadow-emerald-900/40 shadow-2xl bg-slate-950/70">
        <div className="absolute -left-14 -top-16 h-56 w-56 bg-emerald-500/15 blur-3xl" />
        <div className="absolute -right-10 bottom-0 h-64 w-64 bg-sky-500/10 blur-[90px]" />
        <div className="relative p-6 sm:p-8 lg:p-10 space-y-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4 sm:gap-6 flex-1 min-w-0">
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-3xl bg-gradient-to-br from-emerald-500/30 to-slate-900 border border-emerald-400/40 flex items-center justify-center text-3xl sm:text-4xl font-bold text-emerald-50 shadow-xl shadow-emerald-900/40 animate-float">
                {nickname?.charAt(0) || "?"}
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="section-pill">프로필</span>
                  {data?.mannerGrade && (
                    <span className="rounded-full bg-amber-400/20 px-3 py-1 text-xs font-semibold text-amber-200 border border-amber-300/30">
                      매너 {data.mannerGrade}
                    </span>
                  )}
                </div>
                <h1 className="text-3xl sm:text-4xl font-semibold text-emerald-50 truncate drop-shadow">
                  {nickname || "닉네임 미지정"}
                </h1>
                <p className="text-sm sm:text-base text-emerald-50/80">
                  기본 정보, 계급, 티어, 최근 동향을 한 곳에서 확인하세요.
                </p>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => {
                  ouidQuery.refetch();
                  profileQuery.refetch();
                }}
                className="rounded-xl bg-emerald-400/90 px-4 sm:px-5 py-2.5 text-sm font-semibold text-slate-900 transition-all duration-300 hover:bg-emerald-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-900/40 active:translate-y-0"
              >
                새로고침
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className="rounded-xl border border-white/15 bg-white/5 px-4 sm:px-5 py-2.5 text-sm font-semibold text-emerald-50 transition-all duration-300 hover:bg-white/10 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-900/30 active:translate-y-0 flex items-center gap-2"
                >
                  <ShareIcon className="h-4 w-4" />
                  공유
                </button>
                {showShareMenu && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-emerald-500/30 bg-slate-900/95 backdrop-blur-sm shadow-2xl z-50 overflow-hidden">
                    <div className="p-2">
                      <button
                        onClick={async () => {
                          const url = window.location.href;
                          try {
                            await navigator.clipboard.writeText(url);
                            setShareCopied(true);
                            setTimeout(() => {
                              setShareCopied(false);
                              setShowShareMenu(false);
                            }, 2000);
                          } catch (err) {
                            alert("링크 복사에 실패했습니다.");
                          }
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-emerald-500/20 transition-colors text-left"
                      >
                        <ShareIcon className="h-5 w-5 text-emerald-400" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-emerald-50">링크 공유</p>
                          <p className="text-xs text-slate-400">프로필 링크 복사</p>
                        </div>
                        {shareCopied && <CheckIcon className="h-5 w-5 text-green-400" />}
                      </button>
                      <button
                        onClick={async () => {
                          const embedCode = `<iframe src="${window.location.origin}/profile/${encodeURIComponent(nickname)}" width="100%" height="600" frameborder="0"></iframe>`;
                          try {
                            await navigator.clipboard.writeText(embedCode);
                            setEmbedCopied(true);
                            setTimeout(() => {
                              setEmbedCopied(false);
                              setShowShareMenu(false);
                            }, 2000);
                          } catch (err) {
                            alert("임베드 코드 복사에 실패했습니다.");
                          }
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-emerald-500/20 transition-colors text-left"
                      >
                        <CodeBracketIcon className="h-5 w-5 text-emerald-400" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-emerald-50">임베드 코드</p>
                          <p className="text-xs text-slate-400">다른 사이트에 삽입</p>
                        </div>
                        {embedCopied && <CheckIcon className="h-5 w-5 text-green-400" />}
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            if (navigator.share) {
                              await navigator.share({
                                title: `${nickname}의 서든어택 전적`,
                                text: `${nickname}님의 서든어택 프로필을 확인해보세요!`,
                                url: window.location.href,
                              });
                              setShowShareMenu(false);
                            } else {
                              // Web Share API 미지원 시 클립보드로 복사
                              await navigator.clipboard.writeText(window.location.href);
                              setShareCopied(true);
                              setTimeout(() => {
                                setShareCopied(false);
                                setShowShareMenu(false);
                              }, 2000);
                            }
                          } catch (err) {
                            // 사용자가 공유 취소한 경우 무시
                          }
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-emerald-500/20 transition-colors text-left"
                      >
                        <PhotoIcon className="h-5 w-5 text-emerald-400" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-emerald-50">네이티브 공유</p>
                          <p className="text-xs text-slate-400">모바일 기본 공유</p>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 상단 티어/계급 */}
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {data?.grade && (
              <div className="card p-4 sm:p-5 bg-slate-900/70 border-white/5 hover:border-emerald-400/40 transition-all duration-500 hover:-translate-y-1 relative">
                <span className="board-pill absolute right-3 top-3 text-[11px]">통합</span>
                <p className="text-xs text-slate-300 mb-2">통합 계급</p>
                <TierIcon code={data.grade} ranking={data?.gradeRanking || undefined} imageUrl={data?.gradeImage?.trim() || undefined} />
                {data?.gradeRanking && (
                  <p className="text-sm text-emerald-200 mt-2">#{data?.gradeRanking.toLocaleString()}</p>
                )}
              </div>
            )}
            {data?.seasonGrade && (
              <div className="card p-4 sm:p-5 bg-slate-900/70 border-white/5 hover:border-emerald-400/40 transition-all duration-500 hover:-translate-y-1 relative">
                <span className="board-pill absolute right-3 top-3 text-[11px]">시즌</span>
                <p className="text-xs text-slate-300 mb-2">시즌 계급</p>
                <TierIcon code={data.seasonGrade} ranking={data?.seasonGradeRanking || undefined} imageUrl={data?.seasonGradeImage?.trim() || undefined} />
                {data?.seasonGradeRanking && (
                  <p className="text-sm text-emerald-200 mt-2">#{data?.seasonGradeRanking.toLocaleString()}</p>
                )}
              </div>
            )}
            {data?.soloTier && (
              <div className="card p-4 sm:p-5 bg-slate-900/70 border-white/5 hover:border-emerald-400/40 transition-all duration-500 hover:-translate-y-1 relative">
                <span className="board-pill absolute right-3 top-3 text-[11px]">솔로</span>
                <p className="text-xs text-slate-300 mb-2">솔로 랭크</p>
                <TierIcon code={data.soloTier} score={data?.soloScore || undefined} ranking={data?.gradeRanking || undefined} imageUrl={data?.soloTierImage?.trim() || undefined} />
                {data?.soloScore && (
                  <p className="text-sm text-emerald-200 mt-2">{data?.soloScore.toLocaleString()} 점</p>
                )}
              </div>
            )}
            {data?.partyTier && (
              <div className="card p-4 sm:p-5 bg-slate-900/70 border-white/5 hover:border-emerald-400/40 transition-all duration-500 hover:-translate-y-1 relative">
                <span className="board-pill absolute right-3 top-3 text-[11px]">파티</span>
                <p className="text-xs text-slate-300 mb-2">파티 랭크</p>
                <TierIcon code={data.partyTier} score={data?.partyScore || undefined} ranking={data?.gradeRanking || undefined} imageUrl={data?.partyTierImage?.trim() || undefined} />
                {data?.partyScore && (
                  <p className="text-sm text-emerald-200 mt-2">{data?.partyScore.toLocaleString()} 점</p>
                )}
              </div>
            )}
          </div>

          {/* 계정 생성 / 칭호 */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-start gap-3 text-sm text-emerald-50/80">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 w-fit">
              <span className="text-emerald-300 font-semibold">계정 생성</span>
              <span className="font-semibold">
                {data?.userDateCreate
                  ? new Date(data.userDateCreate).toLocaleDateString("ko-KR")
                  : "-"}
              </span>
            </div>
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 w-fit">
              <span className="text-emerald-300 font-semibold">칭호</span>
              <span className="font-semibold">{data?.titleName && data?.titleName !== "(Unknown)" ? data?.titleName : "-"}</span>
            </div>
          </div>

          {/* 핵심 통계 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard label="K/D 비율" value={formatNum(data?.recentKd)} badge="숙련" />
            <StatCard label="승률" value={data?.recentWinRate ? `${formatNum(data?.recentWinRate)}%` : "-"} badge="일반" accent="amber" />
            <StatCard label="저격 K/D" value={formatNum(data?.recentSniper)} badge="숙련" accent="emerald" />
            <StatCard label="돌격 K/D" value={formatNum(rifleStat)} badge="숙련" accent="sky" />
          </div>
        </div>
      </div>

      {ouidQuery.isError && (
        <ErrorBox
          message={(ouidQuery.error as { message?: string })?.message || "닉네임으로 OUID를 찾지 못했습니다."}
          action={<button onClick={() => ouidQuery.refetch()}>다시 시도</button>}
        />
      )}
      {!ouid && !ouidQuery.isLoading && !ouidQuery.error && (
        <EmptyState message="닉네임 검색 결과가 없습니다." />
      )}
      {loading && (
        <div className="space-y-6 animate-fade-in">
          <LoadingProgressBar />
          <div className="card p-6 sm:p-8">
            <LoadingSpinnerLarge message="프로필 정보를 불러오는 중입니다..." />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <LoadingCard count={4} />
          </div>
        </div>
      )}
      {error && !ouidQuery.error && (
        <ErrorBox
          message={(error as { message?: string })?.message || "프로필을 불러오는 중 오류가 발생했습니다."}
          action={<button onClick={() => profileQuery.refetch()}>다시 시도</button>}
        />
      )}

      {!loading && !error && data && (
        <>
          {/* 플레이어 통계 요약 */}
          <section 
            ref={(el) => { sectionRefs.current[0] = el; }}
            className={`card p-5 sm:p-7 ${revealed.has(0) ? 'animate-fade-in-up' : 'opacity-0'}`}
          >
            <h3 className="text-base sm:text-lg font-semibold text-emerald-200 mb-3 sm:mb-4">플레이어 통계 요약</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-gradient-to-br from-emerald-500/10 via-slate-900/70 to-slate-900/40 rounded-xl p-4 sm:p-5 transition-all duration-400 hover:scale-[1.03] hover:shadow-lg hover:shadow-emerald-900/30">
                <p className="text-xs text-slate-400 mb-1">K/D 비율</p>
                <p className="text-2xl font-bold text-emerald-300">{formatNum(data.recentKd)}</p>
                <p className="text-xs text-slate-500 mt-1">상위 15%</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-400/10 via-slate-900/70 to-slate-900/40 rounded-xl p-4 sm:p-5 transition-all duration-400 hover:scale-[1.03] hover:shadow-lg hover:shadow-emerald-900/30">
                <p className="text-xs text-slate-400 mb-1">승률</p>
                <p className="text-xl sm:text-2xl font-bold text-emerald-300">
                  {data.recentWinRate ? `${formatNum(data.recentWinRate)}%` : "-"}
                </p>
              </div>
              <div className="bg-gradient-to-br from-emerald-300/10 via-slate-900/70 to-slate-900/40 rounded-xl p-4 sm:p-5 transition-all duration-400 hover:scale-[1.03] hover:shadow-lg hover:shadow-emerald-900/30">
                <p className="text-xs text-slate-400 mb-1">매너 등급</p>
                <p className="text-xl sm:text-2xl font-bold text-emerald-300">{data.mannerGrade || "-"}</p>
              </div>
            </div>
          </section>

          {/* 전투 분석 */}
          <section 
            ref={(el) => { sectionRefs.current[1] = el; }}
            className={`card p-5 sm:p-7 ${revealed.has(1) ? 'animate-fade-in-up' : 'opacity-0'}`}
          >
            <h3 className="text-base sm:text-lg font-semibold text-emerald-200 mb-3 sm:mb-4">전투 분석</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="transition-all duration-300 hover:scale-105">
                <p className="text-xs text-slate-400 mb-1">스나</p>
                <p className="text-xl font-semibold text-slate-200">{formatNum(data.recentSniper)}</p>
                {data.recentSniper && (
                  <p className="text-xs text-slate-500 mt-1">{getWeaponGrade(data.recentSniper, "sniper")}</p>
                )}
              </div>
              <div className="transition-all duration-300 hover:scale-105">
                <p className="text-xs text-slate-400 mb-1">라플</p>
                <p className="text-xl font-semibold text-slate-200">{formatNum(rifleStat)}</p>
                {typeof rifleStat === "number" && (
                  <p className="text-xs text-slate-500 mt-1">{getWeaponGrade(rifleStat, "rifle")}</p>
                )}
              </div>
              <div className="transition-all duration-300 hover:scale-105">
                <p className="text-xs text-slate-400 mb-1">특수</p>
                <p className="text-xl font-semibold text-slate-200">{formatNum(data.recentSpecial)}</p>
                {data.recentSpecial && (
                  <p className="text-xs text-slate-500 mt-1">{getWeaponGrade(data.recentSpecial, "special")}</p>
                )}
              </div>
            </div>
          </section>

          {/* 실력 등급 (랭크/일반 탭) */}
          <section
            ref={(el) => { sectionRefs.current[2] = el; }}
            className={`card p-5 sm:p-7 ${revealed.has(2) ? "animate-fade-in-up" : "opacity-0"}`}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
              <div>
                <p className="text-sm text-emerald-200 font-semibold">실력 등급</p>
                <p className="text-xs text-slate-400">랭크전/일반전 기준을 전환해 확인하세요.</p>
              </div>
              <div className="inline-flex rounded-xl border border-white/10 bg-white/5 p-1 overflow-x-auto max-w-full whitespace-nowrap" style={{ scrollbarWidth: "none" }}>
                <button
                  type="button"
                  onClick={() => {
                    setSkillLoading(true);
                    setSkillTab("normal");
                    setTimeout(() => setSkillLoading(false), 150);
                  }}
                  className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition ${skillTab === "normal" ? "bg-white/20 text-emerald-100" : "text-slate-300 hover:text-emerald-100"}`}
                >
                  일반전 기준
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSkillLoading(true);
                    setSkillTab("ranked");
                    setTimeout(() => setSkillLoading(false), 150);
                  }}
                  className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition ${skillTab === "ranked" ? "bg-emerald-500 text-slate-900" : "text-slate-300 hover:text-emerald-100"}`}
                >
                  랭크전 기준
                </button>
              </div>
            </div>

            {skillTab === "ranked" && (
              <div className="inline-flex rounded-lg border border-white/10 bg-white/5 p-1 mb-4 overflow-x-auto max-w-full whitespace-nowrap" style={{ scrollbarWidth: "none" }}>
                <button
                  type="button"
                  onClick={() => {
                    setSkillLoading(true);
                    setRankQueue("solo");
                    setTimeout(() => setSkillLoading(false), 150);
                  }}
                  className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-md transition ${rankQueue === "solo" ? "bg-emerald-500 text-slate-900" : "text-slate-300 hover:text-emerald-100"}`}
                >
                  랭크전 (솔로)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSkillLoading(true);
                    setRankQueue("party");
                    setTimeout(() => setSkillLoading(false), 150);
                  }}
                  className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-md transition ${rankQueue === "party" ? "bg-emerald-500 text-slate-900" : "text-slate-300 hover:text-emerald-100"}`}
                >
                  랭크전 (파티)
                </button>
              </div>
            )}

            <div className="grid gap-4 lg:grid-cols-3">
              {(() => {
                const rankedData = skillTab === "ranked" 
                  ? rankedQuery.data?.find(r => r.queueType === rankQueue)
                  : null;
                const skillScore = rankedData?.skillScore ?? (skillTab === "ranked" ? 0 : calcSkillScore(data, rifleStat));
                const skillGrade = rankedData?.skillGrade ?? (skillTab === "ranked" ? "분석 중" : getSkillGradeFromScore(calcSkillScore(data, rifleStat)));
                const description = rankedData?.description ?? (skillTab === "ranked" ? "랭크전 데이터를 분석 중입니다..." : "안정적인 일반전 성적을 기반으로 숙련 등급을 산정했어요.");

                return (
                  <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-slate-900/70 to-slate-900/50 p-5 sm:p-6 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-emerald-200 font-semibold">숙련 등급</p>
                        <p className="text-xs text-slate-400">선택한 기준에 따른 점수</p>
                      </div>
                      <span className="rounded-full bg-emerald-500/20 text-emerald-100 text-xs font-semibold px-3 py-1">
                        {skillTab === "ranked" ? (rankQueue === "solo" ? "랭크전 (솔로)" : "랭크전 (파티)") : "일반전"}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div
                        className="relative h-24 w-24 rounded-full flex items-center justify-center text-2xl font-bold text-emerald-100"
                        style={{
                          background: `conic-gradient(rgb(16 185 129) ${skillScore}%, rgba(255,255,255,0.08) ${skillScore}%)`,
                        }}
                      >
                        <div className="absolute inset-2 rounded-full bg-slate-950 flex items-center justify-center">
                          <span>{Math.round(skillScore)}</span>
                        </div>
                      </div>
                      <div className="flex-1 space-y-2">
                        <p className="text-sm text-slate-300 leading-relaxed">
                          {description}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-emerald-500/20 text-emerald-100 text-xs font-semibold px-2 py-1">
                            {skillGrade}
                          </span>
                          {rankedData && (
                            <span className="text-xs text-slate-400">
                              {rankedData.games}경기 분석
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 sm:p-6 space-y-3">
                <p className="text-sm font-semibold text-emerald-200">세부 지표</p>
                {skillLoading || (skillTab === "ranked" && rankedQuery.isLoading) ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                    {[1,2,3].map((i) => (
                      <div key={i} className="rounded-lg border border-white/10 bg-slate-950/60 px-3 py-4 animate-pulse">
                        <div className="h-3 w-16 bg-slate-700/60 rounded mb-3" />
                        <div className="h-5 w-20 bg-slate-600/60 rounded" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                    {(() => {
                      const rankedData = skillTab === "ranked" 
                        ? rankedQuery.data?.find(r => r.queueType === rankQueue)
                        : null;
                      
                      if (skillTab === "ranked" && rankedData) {
                        return (
                          <>
                            <SkillMetric label="KDA" value={formatNum(rankedData.kda)} badge="랭크" />
                            <SkillMetric label="승률" value={formatRate(rankedData.winRate)} badge="랭크" />
                            <SkillMetric label="딜량" value={formatDamage(rankedData.avgDamage)} badge="랭크" />
                          </>
                        );
                      } else {
                        return (
                          <>
                            <SkillMetric label="KDA" value={formatNum(selectRankValue(data, rankQueue, "kda"))} badge="일반" />
                            <SkillMetric label="승률" value={formatRate(selectRankValue(data, rankQueue, "winRate"))} badge="일반" />
                            <SkillMetric label="딜량" value={formatDamage(selectRankValue(data, rankQueue, "damage"))} badge="일반" />
                          </>
                        );
                      }
                    })()}
                  </div>
                )}
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs text-emerald-100 space-y-2">
                  <p className="font-semibold">실력 향상 팁</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>상황 인식과 조준 반응 속도를 높여 보세요.</li>
                    <li>{skillTab === "ranked" ? "랭크전에서 돌격/저격 포지션을 명확히 구분해 연습하세요." : "일반전에서 다양한 무기를 연습해보세요."}</li>
                  </ul>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 sm:p-6 space-y-3">
                <p className="text-sm font-semibold text-emerald-200">등급 체계</p>
                <div className="grid grid-cols-1 gap-2">
                  {skillGradeScale.map((g) => (
                    <div key={g.name} className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${g.dot}`} />
                        <span className="text-sm text-slate-100 font-semibold">{g.name}</span>
                      </div>
                      <span className="text-xs text-slate-300">{g.range}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* 랭크전 솔로/파티 분석 */}
          {rankedQuery.data && rankedQuery.data.length > 0 && (
            <section
              ref={(el) => { sectionRefs.current[3] = el; }}
              className={`card p-5 sm:p-7 space-y-4 ${revealed.has(3) ? "animate-fade-in-up" : "opacity-0"}`}
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🏆</span>
                  <div>
                    <p className="text-base sm:text-lg font-semibold text-emerald-200">랭크전 분석</p>
                    <p className="text-xs text-slate-400">솔로/파티별 통계와 숙련 등급을 확인하세요.</p>
                  </div>
                </div>
                {rankedQuery.isFetching && <span className="text-xs text-emerald-200">새로고침 중...</span>}
              </div>
              {rankedQuery.isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-slate-900/60 to-slate-900/50 p-5 animate-pulse space-y-3 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }}></div>
                      <div className="h-4 w-24 bg-slate-700/60 rounded relative z-10" />
                      <div className="h-8 w-32 bg-slate-600/60 rounded relative z-10" />
                      <div className="h-3 w-16 bg-slate-700/60 rounded relative z-10" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {rankedQuery.data.map((ranked) => (
                    <div key={ranked.queueType} className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-slate-900/70 to-slate-900/50 p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {ranked.queueType === "solo" ? "⚔️" : ranked.queueType === "party" ? "👥" : "🏰"}
                          </span>
                          <span className="text-base font-semibold text-emerald-200">
                            {ranked.queueType === "solo" ? "랭크전 솔로" : ranked.queueType === "party" ? "랭크전 파티" : "클랜전"}
                          </span>
                        </div>
                        <span className="rounded-full bg-emerald-500/20 text-emerald-100 text-xs font-semibold px-3 py-1">
                          {ranked.skillGrade}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div
                          className="relative h-20 w-20 rounded-full flex items-center justify-center text-xl font-bold text-emerald-100"
                          style={{
                            background: `conic-gradient(rgb(16 185 129) ${ranked.skillScore}%, rgba(255,255,255,0.08) ${ranked.skillScore}%)`,
                          }}
                        >
                          <div className="absolute inset-2 rounded-full bg-slate-950 flex items-center justify-center">
                            <span>{Math.round(ranked.skillScore)}</span>
                          </div>
                        </div>
                        <div className="flex-1 space-y-2">
                          <p className="text-sm text-slate-300 leading-relaxed">{ranked.description}</p>
                          <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                            <span className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-emerald-400" />
                              경기 {ranked.games}회
                            </span>
                            <span className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-amber-400" />
                              승률 {formatRate(ranked.winRate)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/10">
                        <div>
                          <p className="text-xs text-slate-400 mb-1">KDA</p>
                          <p className="text-lg font-bold text-emerald-200">{formatNum(ranked.kda)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 mb-1">K/D</p>
                          <p className="text-lg font-bold text-emerald-200">{formatNum(ranked.kd)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 mb-1">평균 딜량</p>
                          <p className="text-lg font-bold text-emerald-200">{formatDamage(ranked.avgDamage)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* 시간대별 패턴 (오전/오후/야간) */}
          <section
            ref={(el) => { sectionRefs.current[rankedQuery.data && rankedQuery.data.length > 0 ? 4 : 3] = el; }}
            className={`card p-5 sm:p-7 space-y-4 ${revealed.has(rankedQuery.data && rankedQuery.data.length > 0 ? 4 : 3) ? "animate-fade-in-up" : "opacity-0"}`}
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">🕑</span>
                <div>
                  <p className="text-base sm:text-lg font-semibold text-emerald-200">접속/플레이 패턴</p>
                  <p className="text-xs text-slate-400">시간대별 승률·K/D·딜량을 분석한 패턴입니다.</p>
                </div>
              </div>
              {timeQuery.isFetching && <span className="text-xs text-emerald-200">새로고침 중...</span>}
            </div>
            {timeQuery.isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-slate-900/60 to-slate-900/50 p-4 animate-pulse space-y-3 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }}></div>
                    <div className="h-4 w-20 bg-slate-700/60 rounded relative z-10" />
                    <div className="h-6 w-24 bg-slate-600/60 rounded relative z-10" />
                    <div className="h-4 w-16 bg-slate-700/60 rounded relative z-10" />
                  </div>
                ))}
              </div>
            ) : timeQuery.data && timeQuery.data.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {aggregateTimeBuckets(timeQuery.data).map((bucket) => {
                    const allBuckets = aggregateTimeBuckets(timeQuery.data);
                    const bestWinRate = allBuckets.reduce((best, b) => 
                      (b.winRate ?? 0) > (best.winRate ?? 0) ? b : best
                    );
                    const bestKd = allBuckets.reduce((best, b) => 
                      (b.kd ?? 0) > (best.kd ?? 0) ? b : best
                    );
                    const bestDamage = allBuckets.reduce((best, b) => 
                      (b.damage ?? 0) > (best.damage ?? 0) ? b : best
                    );
                    const isBestWinRate = bucket.label === bestWinRate.label;
                    const isBestKd = bucket.label === bestKd.label;
                    const isBestDamage = bucket.label === bestDamage.label;
                    const hasBest = isBestWinRate || isBestKd || isBestDamage;
                    
                    // 패턴 분석 텍스트 생성
                    const patternText = getTimePatternText(bucket, allBuckets);
                    
                    return (
                      <div 
                        key={bucket.label} 
                        className={`rounded-2xl border p-5 space-y-3 transition-all hover:scale-[1.02] ${
                          hasBest 
                            ? "border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 via-slate-900/70 to-slate-900/50 shadow-lg shadow-emerald-900/20" 
                            : "border-white/10 bg-slate-900/70"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{bucket.icon}</span>
                            <span className="text-sm font-semibold text-slate-100">{bucket.label}</span>
                            {hasBest && (
                              <span className="rounded-full bg-emerald-500/20 text-emerald-100 text-[10px] font-semibold px-2 py-0.5 animate-pulse">
                                최고
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 font-medium">{bucket.games}경기</span>
                        </div>
                        
                        {patternText && (
                          <div className="rounded-lg bg-slate-800/50 border border-emerald-500/20 p-2">
                            <p className="text-xs text-emerald-100 leading-relaxed">{patternText}</p>
                          </div>
                        )}
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">승률</span>
                            <span className={`font-semibold ${isBestWinRate ? "text-emerald-300" : "text-emerald-200"}`}>
                              {formatRate(bucket.winRate)}
                              {isBestWinRate && <span className="ml-1 text-[10px]">⭐</span>}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">K/D</span>
                            <span className={`font-semibold ${isBestKd ? "text-emerald-300" : "text-emerald-200"}`}>
                              {formatNum(bucket.kd)}
                              {isBestKd && <span className="ml-1 text-[10px]">⭐</span>}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">평균 딜량</span>
                            <span className={`font-semibold ${isBestDamage ? "text-emerald-300" : "text-emerald-200"}`}>
                              {formatDamage(bucket.damage)}
                              {isBestDamage && <span className="ml-1 text-[10px]">⭐</span>}
                            </span>
                          </div>
                        </div>
                        {bucket.games > 0 && (
                          <div className="pt-2 border-t border-white/10">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-400">승리</span>
                              <span className="text-emerald-200 font-semibold">{bucket.wins}승</span>
                            </div>
                            <div className="flex items-center justify-between text-xs mt-1">
                              <span className="text-slate-400">패배</span>
                              <span className="text-red-300 font-semibold">{bucket.games - bucket.wins}패</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* 전체 패턴 요약 */}
                {(() => {
                  const allBuckets = aggregateTimeBuckets(timeQuery.data);
                  const totalGames = allBuckets.reduce((sum, b) => sum + b.games, 0);
                  const avgWinRate = allBuckets.reduce((sum, b) => sum + (b.winRate ?? 0) * b.games, 0) / totalGames;
                  const mostActive = allBuckets.reduce((most, b) => b.games > most.games ? b : most);
                  const summary = getOverallTimePatternSummary(allBuckets, mostActive);
                  
                  return summary ? (
                    <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-slate-900/70 to-slate-900/50 p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">📊</span>
                        <p className="text-sm font-semibold text-emerald-200">플레이 패턴 요약</p>
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed">{summary}</p>
                    </div>
                  ) : null;
                })()}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-sm">
                시간대별 플레이 데이터가 없습니다.
              </div>
            )}
          </section>

          {/* 최근 매치 */}
          <section 
            ref={(el) => { sectionRefs.current[rankedQuery.data && rankedQuery.data.length > 0 ? 5 : 4] = el; }}
            className={`card p-5 sm:p-7 space-y-3 ${revealed.has(rankedQuery.data && rankedQuery.data.length > 0 ? 5 : 4) ? 'animate-fade-in-up' : 'opacity-0'}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-emerald-200">최근 매치</h3>
                <p className="text-sm text-slate-400">최근 경기 요약과 상세 보기 진입</p>
              </div>
              <a
                href={`/matches/${encodeURIComponent(nickname)}`}
                className="rounded-md px-3 py-2 text-sm text-emerald-200 hover:bg-slate-800"
              >
                매치 보러가기
              </a>
            </div>
            <EmptyState message="매치 상세는 매치 페이지에서 확인하세요." />
          </section>

        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  badge,
  accent = "emerald",
}: {
  label: string;
  value: string | number;
  badge?: string;
  accent?: "emerald" | "amber" | "sky";
}) {
  const accentColor =
    accent === "amber"
      ? "from-amber-500/15 to-slate-900/60"
      : accent === "sky"
        ? "from-sky-500/15 to-slate-900/60"
        : "from-emerald-500/15 to-slate-900/60";

  return (
    <div className={`rounded-2xl border border-white/10 bg-gradient-to-br ${accentColor} p-4 sm:p-5 shadow-lg shadow-black/20`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-slate-200">{label}</p>
        {badge && (
          <span className="rounded-full bg-white/10 px-2 py-1 text-[11px] text-emerald-100 font-semibold">
            {badge}
          </span>
        )}
      </div>
      <p className="text-2xl sm:text-3xl font-bold text-white">{value ?? "-"}</p>
    </div>
  );
}

function SkillMetric({ label, value, badge }: { label: string; value: string | number; badge?: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-slate-400">{label}</span>
        {badge && <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-emerald-100">{badge}</span>}
      </div>
      <p className="text-lg font-semibold text-emerald-100">{value ?? "-"}</p>
    </div>
  );
}

function formatNum(n?: number | null) {
  if (n === null || n === undefined) return "-";
  return Number.isInteger(n) ? n : n.toFixed(2);
}

function calcSkillScore(data?: PlayerProfileResponse, rifle?: number | null) {
  if (!data) return 0;
  const kd = data.recentKd ?? 0;
  const win = data.recentWinRate ?? 0;
  const sniper = data.recentSniper ?? 0;
  const rifleKd = rifle ?? 0;
  // 간단한 가중치 기반 점수 (0~100)
  const raw =
    kd * 0.35 +
    win * 0.2 +
    sniper * 0.2 +
    rifleKd * 0.15 +
    (data.recentSpecial ?? 0) * 0.1;
  return Math.max(0, Math.min(100, raw));
}

function getSkillGradeFromScore(score: number): string {
  if (score >= 91) return "전설";
  if (score >= 76) return "장인";
  if (score >= 61) return "고수";
  if (score >= 41) return "숙련";
  if (score >= 21) return "일반";
  return "초보";
}

function getTimePatternText(
  bucket: { label: string; games: number; wins: number; winRate: number | null; kd: number | null; damage: number | null },
  allBuckets: Array<{ label: string; games: number; wins: number; winRate: number | null; kd: number | null; damage: number | null }>
): string | null {
  if (bucket.games === 0) return null;
  
  const totalGames = allBuckets.reduce((sum, b) => sum + b.games, 0);
  if (totalGames === 0) return null;
  
  const avgWinRate = allBuckets.reduce((sum, b) => sum + ((b.winRate ?? 0) * b.games), 0) / totalGames;
  const avgKd = allBuckets.reduce((sum, b) => sum + ((b.kd ?? 0) * b.games), 0) / totalGames;
  const avgDamage = allBuckets.reduce((sum, b) => sum + ((b.damage ?? 0) * b.games), 0) / totalGames;
  
  const winRateDiff = (bucket.winRate ?? 0) - avgWinRate;
  const kdDiff = (bucket.kd ?? 0) - avgKd;
  const damageDiff = (bucket.damage ?? 0) - avgDamage;
  const gameRatio = bucket.games / totalGames;
  
  // 복합 분석
  if (winRateDiff > 15 && kdDiff > 0.5 && damageDiff > 200) {
    return `${bucket.label}에 최고의 성적을 보입니다. 승률 ${Math.round(winRateDiff)}%p, K/D ${kdDiff.toFixed(1)} 높음. 이 시간대 집중 플레이를 권장합니다.`;
  } else if (winRateDiff < -15 && kdDiff < -0.5) {
    return `${bucket.label}에 성적이 크게 낮습니다. 승률 ${Math.round(Math.abs(winRateDiff))}%p, K/D ${Math.abs(kdDiff).toFixed(1)} 낮음. 이 시간대 휴식을 권장합니다.`;
  } else if (winRateDiff > 10 && kdDiff > 0.3) {
    return `${bucket.label}에 좋은 성적을 보입니다. 승률이 평균보다 ${Math.round(winRateDiff)}%p 높고 전투력도 우수합니다.`;
  } else if (winRateDiff > 5 && gameRatio > 0.4) {
    return `${bucket.label}에 전체 플레이의 ${Math.round(gameRatio * 100)}%를 차지하며, 승률도 평균보다 높습니다. 주요 활동 시간대입니다.`;
  } else if (kdDiff > 0.4) {
    return `${bucket.label}에 K/D가 평균보다 ${kdDiff.toFixed(1)} 높습니다. 전투력이 뛰어난 시간대입니다.`;
  } else if (damageDiff > 300) {
    return `${bucket.label}에 평균 딜량이 ${Math.round(damageDiff)} 높습니다. 공격력이 좋은 시간대입니다.`;
  } else if (gameRatio > 0.5) {
    return `${bucket.label}에 가장 많이 플레이했습니다 (${Math.round(gameRatio * 100)}%). 이 시간대가 주요 활동 시간입니다.`;
  } else if (winRateDiff > 5) {
    return `${bucket.label}에 승률이 평균보다 ${Math.round(winRateDiff)}%p 높습니다.`;
  }
  return null;
}

function getOverallTimePatternSummary(
  allBuckets: Array<{ label: string; games: number; wins: number; winRate: number | null; kd: number | null; damage: number | null }>,
  mostActive: { label: string; games: number }
): string | null {
  const totalGames = allBuckets.reduce((sum, b) => sum + b.games, 0);
  if (totalGames === 0) return null;
  
  const bestWinRate = allBuckets.reduce((best, b) => (b.winRate ?? 0) > (best.winRate ?? 0) ? b : best);
  const worstWinRate = allBuckets.reduce((worst, b) => (b.winRate ?? 0) < (worst.winRate ?? 0) ? b : worst);
  const bestKd = allBuckets.reduce((best, b) => (b.kd ?? 0) > (best.kd ?? 0) ? b : best);
  const bestDamage = allBuckets.reduce((best, b) => (b.damage ?? 0) > (best.damage ?? 0) ? b : best);
  
  const patterns: string[] = [];
  
  // 활동 패턴
  if (mostActive.games > totalGames * 0.5) {
    patterns.push(`주요 활동 시간은 ${mostActive.label}로, 전체 플레이의 ${Math.round((mostActive.games / totalGames) * 100)}%를 차지합니다.`);
  }
  
  // 승률 패턴
  if (bestWinRate.winRate && worstWinRate.winRate && (bestWinRate.winRate - worstWinRate.winRate) > 15) {
    patterns.push(`승률은 ${bestWinRate.label}에 ${Math.round(bestWinRate.winRate)}%로 가장 높고, ${worstWinRate.label}에는 ${Math.round(worstWinRate.winRate)}%로 ${Math.round(bestWinRate.winRate - worstWinRate.winRate)}%p 차이가 납니다.`);
  }
  
  // K/D 패턴
  if (bestKd.kd && bestKd.label !== bestWinRate.label) {
    const avgKd = allBuckets.reduce((sum, b) => sum + ((b.kd ?? 0) * b.games), 0) / totalGames;
    if ((bestKd.kd - avgKd) > 0.3) {
      patterns.push(`전투력(K/D)은 ${bestKd.label}에 가장 뛰어납니다.`);
    }
  }
  
  // 딜량 패턴
  if (bestDamage.damage && bestDamage.label !== bestWinRate.label && bestDamage.label !== bestKd.label) {
    const avgDamage = allBuckets.reduce((sum, b) => sum + ((b.damage ?? 0) * b.games), 0) / totalGames;
    if ((bestDamage.damage - avgDamage) > 200) {
      patterns.push(`공격력(딜량)은 ${bestDamage.label}에 가장 높습니다.`);
    }
  }
  
  if (patterns.length === 0) {
    return "시간대별 성적이 고르게 분포되어 있습니다. 어떤 시간대든 안정적인 플레이를 보여줍니다.";
  }
  
  return patterns.join(" ") + " 이러한 패턴을 고려해 플레이 시간을 조절하면 더 나은 성적을 기대할 수 있습니다.";
}

function aggregateTimeBuckets(timeData?: { hourKst: number; games: number; wins: number; winRate: number; kd: number; damage?: number }[]) {
  const presets = [
    { label: "오전 (06~11시)", icon: "🌅", hours: new Set([6,7,8,9,10,11]) },
    { label: "오후 (12~17시)", icon: "🌤️", hours: new Set([12,13,14,15,16,17]) },
    { label: "야간 (18~05시)", icon: "🌙", hours: new Set([18,19,20,21,22,23,0,1,2,3,4,5]) },
  ];

  return presets.map((preset) => {
    if (!timeData || timeData.length === 0) {
      return { ...preset, games: 0, wins: 0, winRate: null, kd: null, damage: null };
    }
    let games = 0;
    let wins = 0;
    let kdSum = 0;
    let kdGames = 0;
    let damageSum = 0;
    let damageGames = 0;

    timeData.forEach((t) => {
      if (preset.hours.has(t.hourKst)) {
        const matchGames = t.games ?? 0;
        games += matchGames;
        wins += t.wins ?? 0;
        if (typeof t.kd === "number" && !isNaN(t.kd)) {
          kdSum += t.kd * matchGames;
          kdGames += matchGames;
        }
        if (typeof t.damage === "number" && !isNaN(t.damage) && t.damage > 0) {
          damageSum += t.damage * matchGames;
          damageGames += matchGames;
        }
      }
    });

    const winRate = games > 0 ? (wins / games) * 100 : null;
    const kd = kdGames > 0 ? kdSum / kdGames : null;
    const damage = damageGames > 0 ? damageSum / damageGames : null;
    return { ...preset, games, wins, winRate, kd, damage };
  });
}

function selectRankValue(
  data: PlayerProfileResponse | undefined,
  queue: "solo" | "party",
  metric: "kda" | "winRate" | "damage"
) {
  if (!data) return null;

  if (metric === "kda") {
    return data.recentKd ?? null;
  }
  if (metric === "winRate") {
    return data.recentWinRate ?? null;
  }
  if (metric === "damage") {
    // PlayerProfileResponse에는 damage 필드가 없으므로 null 반환
    return null;
  }
  return null;
}

function formatRate(value: number | string | null | undefined) {
  if (value === null || value === undefined) return "-";
  const num = Number(value);
  if (Number.isNaN(num)) return "-";
  return `${Number.isInteger(num) ? num : num.toFixed(2)}%`;
}

function formatDamage(value: number | string | null | undefined) {
  if (value === null || value === undefined) return "-";
  const num = Number(value);
  if (Number.isNaN(num)) return "-";
  if (num >= 10000) return `${(num / 1000).toFixed(1)}k`;
  return Number.isInteger(num) ? num : num.toFixed(0);
}

const skillGradeScale = [
  { name: "초보", range: "0점 ~ 20점", dot: "bg-slate-400" },
  { name: "일반", range: "21점 ~ 40점", dot: "bg-blue-400" },
  { name: "숙련", range: "41점 ~ 60점", dot: "bg-emerald-400" },
  { name: "고수", range: "61점 ~ 75점", dot: "bg-purple-400" },
  { name: "장인", range: "76점 ~ 90점", dot: "bg-red-400" },
  { name: "전설", range: "91점 ~ 100점", dot: "bg-amber-400" },
];

function getWeaponGrade(kd: number, weaponType: "sniper" | "rifle" | "special"): string {
  if (weaponType === "sniper") {
    // 스나이퍼: 70% 이상 고수
    if (kd >= 70) return "장인";
    if (kd >= 55) return "고수";
    if (kd >= 40) return "평균";
    if (kd >= 25) return "일반";
    return "초보";
  } else if (weaponType === "rifle") {
    // 라플: 55% 이상 고수
    if (kd >= 70) return "장인";
    if (kd >= 55) return "고수";
    if (kd >= 40) return "평균";
    if (kd >= 25) return "일반";
    return "초보";
  } else {
    // 특수총: 일반 기준
    if (kd >= 60) return "장인";
    if (kd >= 45) return "고수";
    if (kd >= 30) return "평균";
    if (kd >= 15) return "일반";
    return "초보";
  }
}

