"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LoadingSpinnerLarge } from "@/components/ui/State";
import { useTheme } from "@/hooks/useTheme";
import { clsx } from "clsx";
import { 
  ChartBarIcon, 
  ShieldExclamationIcon, 
  ExclamationTriangleIcon,
  SparklesIcon,
  RocketLaunchIcon
} from "@heroicons/react/24/outline";

const navigationTabs = [
  { 
    href: "/suddenattack/stats", 
    label: "전적조회", 
    icon: ChartBarIcon,
    description: "플레이어 전적 검색"
  },
  { 
    href: "/suddenattack/barracks-report", 
    label: "병영박제", 
    icon: ShieldExclamationIcon,
    description: "비매너 유저 제보"
  },
  { 
    href: "/suddenattack/suspicious", 
    label: "이상탐지", 
    icon: ExclamationTriangleIcon,
    description: "의심스러운 행동 탐지",
    isWarning: true
  },
];

export default function SuddenAttackStatsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme } = useTheme();
  const [searchNickname, setSearchNickname] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedNickname = searchNickname.trim();
    if (trimmedNickname && !isSearching) {
      // 닉네임 최소 길이 검증 (2글자 이상)
      if (trimmedNickname.length < 2) {
        alert("닉네임은 최소 2글자 이상 입력해주세요.");
        return;
      }
      setIsSearching(true);
      // 약간의 딜레이를 주어 로딩 상태를 보여줌
      await new Promise(resolve => setTimeout(resolve, 300));
      router.push(`/profile/${encodeURIComponent(trimmedNickname)}`);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* 네비게이션 탭 */}
      <div className="grid gap-4 md:grid-cols-3">
        {navigationTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={clsx(
                "card p-5 transition-all duration-300 hover:scale-[1.02] group relative overflow-hidden",
                isActive
                  ? theme === "light"
                    ? "border-2 border-blue-500 bg-blue-50 shadow-lg"
                    : "border-2 border-emerald-500 bg-emerald-500/20 shadow-emerald-900/30"
                  : theme === "light"
                  ? "border-2 border-slate-300 hover:border-blue-400 hover:shadow-md"
                  : "border-2 border-slate-800 hover:border-emerald-500/50 hover:shadow-emerald-900/20",
                tab.isWarning && !isActive && theme === "light"
                  ? "hover:border-red-400"
                  : tab.isWarning && !isActive && "hover:border-red-500/50"
              )}
            >
              {theme === "sadb" && isActive && (
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              )}
              <div className="relative z-10">
                <div className={clsx(
                  "inline-flex p-3 rounded-lg mb-3",
                  isActive
                    ? theme === "light"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-emerald-500/30 text-emerald-300"
                    : theme === "light"
                    ? "bg-slate-100 text-slate-700 group-hover:bg-blue-50 group-hover:text-blue-600"
                    : "bg-slate-800 text-slate-400 group-hover:bg-emerald-500/20 group-hover:text-emerald-300",
                  tab.isWarning && !isActive && theme === "light"
                    ? "group-hover:bg-red-50 group-hover:text-red-600"
                    : tab.isWarning && !isActive && "group-hover:bg-red-500/20 group-hover:text-red-400"
                )}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className={clsx(
                  "text-lg font-semibold mb-1",
                  isActive
                    ? theme === "light" ? "text-blue-900" : "text-emerald-200"
                    : theme === "light" ? "text-slate-900" : "text-slate-200"
                )}>
                  {tab.label}
                </h3>
                <p className={clsx(
                  "text-xs",
                  isActive
                    ? theme === "light" ? "text-blue-700" : "text-emerald-300"
                    : theme === "light" ? "text-slate-600" : "text-slate-400"
                )}>
                  {tab.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* 베타 서비스 오픈 카드 */}
      <div className={clsx(
        "card p-6 sm:p-8 relative overflow-hidden",
        theme === "light"
          ? "border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 via-blue-50 to-cyan-50"
          : "border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 via-blue-500/10 to-cyan-500/10"
      )}>
        {theme === "sadb" && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1.5s" }} />
          </div>
        )}
        
        <div className="relative z-10">
          <div className="flex items-start gap-4 mb-4">
            <div className={clsx(
              "p-3 rounded-xl",
              theme === "light"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-emerald-500/30 text-emerald-300"
            )}>
              <RocketLaunchIcon className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h2 className={clsx(
                  "text-2xl sm:text-3xl font-bold",
                  theme === "light" ? "text-slate-900" : "text-emerald-100"
                )}>
                  서든 데이터베이스 베타 서비스 오픈!
                </h2>
                <SparklesIcon className={clsx(
                  "h-6 w-6 animate-pulse",
                  theme === "light" ? "text-amber-500" : "text-amber-400"
                )} />
              </div>
              <div className={clsx(
                "space-y-3 text-sm sm:text-base leading-relaxed",
                theme === "light" ? "text-slate-700" : "text-slate-300"
              )}>
                <p>
                  오랜기간 서든어택을 즐겨했습니다.
                </p>
                <p>
                  친목 랭크전 클랜을 운영하면서 느꼈던 모든 불편한 상황들을 정리하였고 유저님들도 함께 느꼈을 공통된 부분들을 개선하기 위해 베타 서비스를 오픈했습니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 전적 검색 섹션 */}
      <div className="card p-6 sm:p-8">
        <div className="mb-6">
          <h1 className={clsx(
            "text-3xl font-semibold mb-2",
            theme === "light" ? "text-slate-900" : "text-emerald-200"
          )}>
            전적조회
          </h1>
          <p className={clsx(
            "text-sm",
            theme === "light" ? "text-slate-600" : "text-slate-400"
          )}>
            서든어택 플레이어의 전적을 검색하고 확인하세요.
          </p>
        </div>
        
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchNickname}
                onChange={(e) => setSearchNickname(e.target.value)}
                placeholder="닉네임을 입력하세요"
                disabled={isSearching}
                className={clsx(
                  "w-full rounded-xl border-2 px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed",
                  theme === "light"
                    ? "border-slate-300 bg-white focus:border-blue-500 focus:ring-blue-500/30"
                    : "border-slate-800 bg-slate-950/60 focus:border-emerald-400 focus:ring-emerald-500/30"
                )}
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className={clsx(
                    "h-5 w-5 animate-spin rounded-full border-2 border-t-transparent",
                    theme === "light" ? "border-blue-500" : "border-emerald-400"
                  )}></div>
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={isSearching || !searchNickname.trim()}
              className={clsx(
                "rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2 min-w-[80px] justify-center",
                theme === "light"
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "bg-emerald-500 text-slate-900 hover:bg-emerald-400"
              )}
            >
              {isSearching ? (
                <>
                  <div className={clsx(
                    "h-4 w-4 animate-spin rounded-full border-2 border-t-transparent",
                    theme === "light" ? "border-white" : "border-slate-900"
                  )}></div>
                  <span>검색 중...</span>
                </>
              ) : (
                "검색"
              )}
            </button>
          </div>
        </form>

        {isSearching && (
          <div className="mb-8 animate-fade-in">
            <LoadingSpinnerLarge message="전적 정보를 불러오는 중입니다..." />
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className={clsx(
            "rounded-xl border-2 p-4",
            theme === "light"
              ? "border-slate-200 bg-slate-50"
              : "border-slate-800 bg-slate-950/60"
          )}>
            <p className={clsx(
              "text-xs uppercase tracking-wide mb-2",
              theme === "light" ? "text-slate-600" : "text-slate-400"
            )}>
              최근 검색
            </p>
            <p className={clsx(
              "text-sm",
              theme === "light" ? "text-slate-700" : "text-slate-300"
            )}>
              검색 기록이 없습니다.
            </p>
          </div>
          <div className={clsx(
            "rounded-xl border-2 p-4",
            theme === "light"
              ? "border-slate-200 bg-slate-50"
              : "border-slate-800 bg-slate-950/60"
          )}>
            <p className={clsx(
              "text-xs uppercase tracking-wide mb-2",
              theme === "light" ? "text-slate-600" : "text-slate-400"
            )}>
              인기 검색
            </p>
            <p className={clsx(
              "text-sm",
              theme === "light" ? "text-slate-700" : "text-slate-300"
            )}>
              인기 검색어가 없습니다.
            </p>
          </div>
          <div className={clsx(
            "rounded-xl border-2 p-4",
            theme === "light"
              ? "border-slate-200 bg-slate-50"
              : "border-slate-800 bg-slate-950/60"
          )}>
            <p className={clsx(
              "text-xs uppercase tracking-wide mb-2",
              theme === "light" ? "text-slate-600" : "text-slate-400"
            )}>
              랭킹
            </p>
            <p className={clsx(
              "text-sm",
              theme === "light" ? "text-slate-700" : "text-slate-300"
            )}>
              랭킹 정보를 불러오는 중...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
