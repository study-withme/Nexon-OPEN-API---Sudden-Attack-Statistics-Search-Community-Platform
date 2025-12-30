"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "@/hooks/useTheme";
import { clsx } from "clsx";
import { getOuidByNickname, getProfile, PlayerProfileResponse } from "@/lib/playerApi";
import { LoadingSpinner, ErrorBox } from "@/components/ui/State";
import { MagnifyingGlassIcon, XMarkIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import { TierIcon } from "@/components/ui/TierIcon";

export default function ComparePage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [nickname1, setNickname1] = useState("");
  const [nickname2, setNickname2] = useState("");
  const [searchNickname1, setSearchNickname1] = useState("");
  const [searchNickname2, setSearchNickname2] = useState("");

  const ouid1Query = useQuery({
    queryKey: ["ouid", searchNickname1],
    queryFn: () => getOuidByNickname(searchNickname1),
    enabled: !!searchNickname1 && searchNickname1.trim().length > 0,
  });

  const profile1Query = useQuery({
    queryKey: ["profile", ouid1Query.data?.ouid],
    queryFn: () => getProfile(ouid1Query.data!.ouid),
    enabled: !!ouid1Query.data?.ouid,
  });

  const ouid2Query = useQuery({
    queryKey: ["ouid", searchNickname2],
    queryFn: () => getOuidByNickname(searchNickname2),
    enabled: !!searchNickname2 && searchNickname2.trim().length > 0,
  });

  const profile2Query = useQuery({
    queryKey: ["profile", ouid2Query.data?.ouid],
    queryFn: () => getProfile(ouid2Query.data!.ouid),
    enabled: !!ouid2Query.data?.ouid,
  });

  const profile1: PlayerProfileResponse | undefined = profile1Query.data;
  const profile2: PlayerProfileResponse | undefined = profile2Query.data;

  const handleCompare = () => {
    if (!nickname1.trim() || !nickname2.trim()) {
      alert("두 닉네임을 모두 입력해주세요.");
      return;
    }
    setSearchNickname1(nickname1.trim());
    setSearchNickname2(nickname2.trim());
  };

  const handleClear = () => {
    setNickname1("");
    setNickname2("");
    setSearchNickname1("");
    setSearchNickname2("");
  };

  const getComparisonColor = (value1: number, value2: number, higherIsBetter = true) => {
    if (value1 === value2) return theme === "light" ? "text-slate-600" : "text-slate-400";
    const isBetter = higherIsBetter ? value1 > value2 : value1 < value2;
    return isBetter
      ? theme === "light"
        ? "text-green-600"
        : "text-green-400"
      : theme === "light"
      ? "text-red-600"
      : "text-red-400";
  };

  const getComparisonIcon = (value1: number, value2: number, higherIsBetter = true) => {
    if (value1 === value2) return null;
    const isBetter = higherIsBetter ? value1 > value2 : value1 < value2;
    return isBetter ? "↑" : "↓";
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <UserGroupIcon className={clsx("h-8 w-8", theme === "light" ? "text-slate-700" : "text-emerald-400")} />
          <h1 className={clsx("text-4xl font-bold", theme === "light" ? "text-slate-900" : "text-white")}>
            플레이어 비교
          </h1>
        </div>
        <p className={clsx("text-sm", theme === "light" ? "text-slate-600" : "text-slate-400")}>
          두 명의 플레이어 통계를 비교하여 차이점을 확인하세요.
        </p>
      </div>

      {/* 검색 영역 */}
      <div className={clsx(
        "rounded-2xl border-2 p-6 mb-8",
        theme === "light"
          ? "border-slate-300 bg-white"
          : "border-slate-800 bg-slate-900/70"
      )}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className={clsx(
              "block text-sm font-semibold mb-2",
              theme === "light" ? "text-slate-900" : "text-slate-200"
            )}>
              플레이어 1
            </label>
            <div className="relative">
              <input
                type="text"
                value={nickname1}
                onChange={(e) => setNickname1(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleCompare()}
                placeholder="닉네임 입력"
                className={clsx(
                  "w-full rounded-xl border-2 pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all",
                  theme === "light"
                    ? "border-slate-300 bg-white text-black focus:border-blue-500 focus:ring-blue-500/20"
                    : "border-slate-700 bg-slate-950/60 text-slate-200 focus:border-emerald-400 focus:ring-emerald-500/20"
                )}
              />
              <MagnifyingGlassIcon className={clsx(
                "absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5",
                theme === "light" ? "text-slate-400" : "text-slate-500"
              )} />
            </div>
            {profile1Query.isLoading && (
              <div className="mt-2 text-xs text-slate-400">조회 중...</div>
            )}
            {profile1Query.error && (
              <div className="mt-2 text-xs text-red-400">플레이어를 찾을 수 없습니다.</div>
            )}
          </div>

          <div>
            <label className={clsx(
              "block text-sm font-semibold mb-2",
              theme === "light" ? "text-slate-900" : "text-slate-200"
            )}>
              플레이어 2
            </label>
            <div className="relative">
              <input
                type="text"
                value={nickname2}
                onChange={(e) => setNickname2(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleCompare()}
                placeholder="닉네임 입력"
                className={clsx(
                  "w-full rounded-xl border-2 pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all",
                  theme === "light"
                    ? "border-slate-300 bg-white text-black focus:border-blue-500 focus:ring-blue-500/20"
                    : "border-slate-700 bg-slate-950/60 text-slate-200 focus:border-emerald-400 focus:ring-emerald-500/20"
                )}
              />
              <MagnifyingGlassIcon className={clsx(
                "absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5",
                theme === "light" ? "text-slate-400" : "text-slate-500"
              )} />
            </div>
            {profile2Query.isLoading && (
              <div className="mt-2 text-xs text-slate-400">조회 중...</div>
            )}
            {profile2Query.error && (
              <div className="mt-2 text-xs text-red-400">플레이어를 찾을 수 없습니다.</div>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleCompare}
            disabled={!nickname1.trim() || !nickname2.trim()}
            className={clsx(
              "flex-1 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed",
              theme === "light"
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : "bg-emerald-500 text-slate-900 hover:bg-emerald-400"
            )}
          >
            비교하기
          </button>
          {(searchNickname1 || searchNickname2) && (
            <button
              onClick={handleClear}
              className={clsx(
                "px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300",
                theme === "light"
                  ? "border-2 border-slate-300 text-slate-700 hover:bg-slate-100"
                  : "border-2 border-slate-700 text-slate-300 hover:bg-slate-800"
              )}
            >
              초기화
            </button>
          )}
        </div>
      </div>

      {/* 비교 결과 */}
      {profile1 && profile2 && (
        <div className="space-y-6">
          {/* 기본 정보 비교 */}
          <div className={clsx(
            "rounded-2xl border-2 p-6",
            theme === "light"
              ? "border-slate-300 bg-white"
              : "border-slate-800 bg-slate-900/70"
          )}>
            <h2 className={clsx(
              "text-xl font-bold mb-6",
              theme === "light" ? "text-slate-900" : "text-white"
            )}>
              기본 정보
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className={clsx(
                  "text-sm mb-2",
                  theme === "light" ? "text-slate-600" : "text-slate-400"
                )}>
                  닉네임
                </p>
                <p className={clsx(
                  "text-lg font-semibold",
                  theme === "light" ? "text-slate-900" : "text-white"
                )}>
                  {profile1.userName}
                </p>
              </div>
              <div className="text-center">
                <p className={clsx(
                  "text-sm mb-2",
                  theme === "light" ? "text-slate-600" : "text-slate-400"
                )}>
                  VS
                </p>
              </div>
              <div className="text-center">
                <p className={clsx(
                  "text-sm mb-2",
                  theme === "light" ? "text-slate-600" : "text-slate-400"
                )}>
                  닉네임
                </p>
                <p className={clsx(
                  "text-lg font-semibold",
                  theme === "light" ? "text-slate-900" : "text-white"
                )}>
                  {profile2.userName}
                </p>
              </div>
            </div>
          </div>

          {/* 계급/티어 비교 */}
          <div className={clsx(
            "rounded-2xl border-2 p-6",
            theme === "light"
              ? "border-slate-300 bg-white"
              : "border-slate-800 bg-slate-900/70"
          )}>
            <h2 className={clsx(
              "text-xl font-bold mb-6",
              theme === "light" ? "text-slate-900" : "text-white"
            )}>
              계급 및 티어
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className={clsx(
                  "text-sm font-semibold mb-4",
                  theme === "light" ? "text-slate-700" : "text-slate-300"
                )}>
                  {profile1.userName}
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className={clsx(
                      "text-xs mb-2",
                      theme === "light" ? "text-slate-600" : "text-slate-400"
                    )}>
                      통합 계급
                    </p>
                    <TierIcon
                      code={profile1.grade}
                      ranking={profile1.gradeRanking}
                      imageUrl={profile1.gradeImage}
                    />
                    {profile1.gradeRanking && (
                      <p className={clsx(
                        "text-xs mt-1",
                        theme === "light" ? "text-slate-500" : "text-slate-400"
                      )}>
                        #{profile1.gradeRanking.toLocaleString()}위
                      </p>
                    )}
                  </div>
                  <div>
                    <p className={clsx(
                      "text-xs mb-2",
                      theme === "light" ? "text-slate-600" : "text-slate-400"
                    )}>
                      솔로 티어
                    </p>
                    <TierIcon
                      code={profile1.soloTier}
                      score={profile1.soloScore}
                      imageUrl={profile1.soloTierImage}
                    />
                    {profile1.soloScore && (
                      <p className={clsx(
                        "text-xs mt-1",
                        theme === "light" ? "text-slate-500" : "text-slate-400"
                      )}>
                        {profile1.soloScore.toLocaleString()}점
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <h3 className={clsx(
                  "text-sm font-semibold mb-4",
                  theme === "light" ? "text-slate-700" : "text-slate-300"
                )}>
                  {profile2.userName}
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className={clsx(
                      "text-xs mb-2",
                      theme === "light" ? "text-slate-600" : "text-slate-400"
                    )}>
                      통합 계급
                    </p>
                    <TierIcon
                      code={profile2.grade}
                      ranking={profile2.gradeRanking}
                      imageUrl={profile2.gradeImage}
                    />
                    {profile2.gradeRanking && (
                      <p className={clsx(
                        "text-xs mt-1",
                        theme === "light" ? "text-slate-500" : "text-slate-400"
                      )}>
                        #{profile2.gradeRanking.toLocaleString()}위
                      </p>
                    )}
                  </div>
                  <div>
                    <p className={clsx(
                      "text-xs mb-2",
                      theme === "light" ? "text-slate-600" : "text-slate-400"
                    )}>
                      솔로 티어
                    </p>
                    <TierIcon
                      code={profile2.soloTier}
                      score={profile2.partyScore}
                      imageUrl={profile2.soloTierImage}
                    />
                    {profile2.soloScore && (
                      <p className={clsx(
                        "text-xs mt-1",
                        theme === "light" ? "text-slate-500" : "text-slate-400"
                      )}>
                        {profile2.soloScore.toLocaleString()}점
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 통계 비교 */}
          <div className={clsx(
            "rounded-2xl border-2 p-6",
            theme === "light"
              ? "border-slate-300 bg-white"
              : "border-slate-800 bg-slate-900/70"
          )}>
            <h2 className={clsx(
              "text-xl font-bold mb-6",
              theme === "light" ? "text-slate-900" : "text-white"
            )}>
              통계 비교
            </h2>
            <div className="space-y-4">
              {/* 승률 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="text-center">
                  <p className={clsx(
                    "text-2xl font-bold",
                    getComparisonColor(profile1.recentWinRate, profile2.recentWinRate, true)
                  )}>
                    {profile1.recentWinRate.toFixed(2)}%
                    {getComparisonIcon(profile1.recentWinRate, profile2.recentWinRate, true) && (
                      <span className="ml-2 text-lg">
                        {getComparisonIcon(profile1.recentWinRate, profile2.recentWinRate, true)}
                      </span>
                    )}
                  </p>
                  <p className={clsx(
                    "text-xs mt-1",
                    theme === "light" ? "text-slate-600" : "text-slate-400"
                  )}>
                    {profile1.userName}
                  </p>
                </div>
                <div className="text-center">
                  <p className={clsx(
                    "text-sm font-semibold",
                    theme === "light" ? "text-slate-700" : "text-slate-300"
                  )}>
                    최근 승률
                  </p>
                </div>
                <div className="text-center">
                  <p className={clsx(
                    "text-2xl font-bold",
                    getComparisonColor(profile2.recentWinRate, profile1.recentWinRate, true)
                  )}>
                    {profile2.recentWinRate.toFixed(2)}%
                    {getComparisonIcon(profile2.recentWinRate, profile1.recentWinRate, true) && (
                      <span className="ml-2 text-lg">
                        {getComparisonIcon(profile2.recentWinRate, profile1.recentWinRate, true)}
                      </span>
                    )}
                  </p>
                  <p className={clsx(
                    "text-xs mt-1",
                    theme === "light" ? "text-slate-600" : "text-slate-400"
                  )}>
                    {profile2.userName}
                  </p>
                </div>
              </div>

              {/* K/D */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="text-center">
                  <p className={clsx(
                    "text-2xl font-bold",
                    getComparisonColor(profile1.recentKd, profile2.recentKd, true)
                  )}>
                    {profile1.recentKd.toFixed(2)}
                    {getComparisonIcon(profile1.recentKd, profile2.recentKd, true) && (
                      <span className="ml-2 text-lg">
                        {getComparisonIcon(profile1.recentKd, profile2.recentKd, true)}
                      </span>
                    )}
                  </p>
                  <p className={clsx(
                    "text-xs mt-1",
                    theme === "light" ? "text-slate-600" : "text-slate-400"
                  )}>
                    {profile1.userName}
                  </p>
                </div>
                <div className="text-center">
                  <p className={clsx(
                    "text-sm font-semibold",
                    theme === "light" ? "text-slate-700" : "text-slate-300"
                  )}>
                    최근 K/D
                  </p>
                </div>
                <div className="text-center">
                  <p className={clsx(
                    "text-2xl font-bold",
                    getComparisonColor(profile2.recentKd, profile1.recentKd, true)
                  )}>
                    {profile2.recentKd.toFixed(2)}
                    {getComparisonIcon(profile2.recentKd, profile1.recentKd, true) && (
                      <span className="ml-2 text-lg">
                        {getComparisonIcon(profile2.recentKd, profile1.recentKd, true)}
                      </span>
                    )}
                  </p>
                  <p className={clsx(
                    "text-xs mt-1",
                    theme === "light" ? "text-slate-600" : "text-slate-400"
                  )}>
                    {profile2.userName}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {profile1Query.isLoading || profile2Query.isLoading ? <LoadingSpinner /> : null}
    </div>
  );
}
