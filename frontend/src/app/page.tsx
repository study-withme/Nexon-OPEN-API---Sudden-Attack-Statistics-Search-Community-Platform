"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { clsx } from "clsx";
import { fetchMe, type MemberResponse } from "@/lib/auth";
import { getProfile, type PlayerProfileResponse } from "@/lib/playerApi";
import { fetchPosts, type CommunityPost } from "@/lib/community";
import { api, normalizeApiError } from "@/lib/api";
import { fetchBarracksReports, getReportCounts, type BarracksReport } from "@/lib/barracks";
import {
  ChartBarIcon,
  UserGroupIcon,
  ShoppingBagIcon,
  ShieldCheckIcon,
  FireIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowRightIcon,
  ArrowPathIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ArrowTopRightOnSquareIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ShareIcon,
  PhotoIcon,
  CodeBracketIcon,
} from "@heroicons/react/24/outline";

const highlights = [
  { title: "전적조회", desc: "서든어택 플레이어의 상세 전적과 통계를 한눈에 확인" },
  { title: "병영박제", desc: "비매너 유저 및 문제 병영주소 제보 게시판" },
  { title: "이상탐지", desc: "의심스러운 행동을 한 유저들의 정보 공유" },
  { title: "커뮤니티", desc: "공지, 인기글, 자유게시판, 랭크전, 대룰, 보급, 듀오 파티" },
  { title: "플리마켓", desc: "중고 거래 및 기타 거래 게시판" },
  { title: "클랜 관리", desc: "클랜등록, 병영검증, 정보공유, 삭제요청" },
];

const quickLinks = [
  { label: "전적조회", href: "/suddenattack/stats" },
  { label: "커뮤니티", href: "/community/free" },
  { label: "마켓", href: "/market/fleamarket" },
];

// 임시 데이터 (백엔드 API 연결 전 기본값)
const defaultStatsData = {
  todaySignups: 0,
  todayVisits: 0,
  totalVisits: 0,
  trollReports: 0,
};

const categoryCards = [
  {
    title: "서든어택",
    desc: "전적조회, 병영박제, 이상탐지",
    href: "/suddenattack/stats",
    icon: ChartBarIcon,
    color: "emerald",
  },
  {
    title: "커뮤니티",
    desc: "공지, 인기, 자유, 랭크전, 대룰, 보급, 듀오",
    href: "/community/free",
    icon: UserGroupIcon,
    color: "blue",
  },
  {
    title: "마켓",
    desc: "플리마켓, 기타거래",
    href: "/market/fleamarket",
    icon: ShoppingBagIcon,
    color: "amber",
  },
  {
    title: "클랜 마스터",
    desc: "클랜등록, 병영검증, 정보공유, 삭제요청",
    href: "/clan/register",
    icon: ShieldCheckIcon,
    color: "purple",
  },
];


const recentActivities = [
  { id: 1, type: "post", content: "새 게시글이 등록되었습니다: '랭크전 파티 구함'", time: "5분 전" },
  { id: 2, type: "report", content: "병영주소 제보가 등록되었습니다", time: "12분 전" },
  { id: 3, type: "market", content: "플리마켓에 새 거래글이 등록되었습니다", time: "18분 전" },
  { id: 4, type: "clan", content: "새 클랜이 등록되었습니다", time: "25분 전" },
  { id: 5, type: "post", content: "인기 게시글이 업데이트되었습니다", time: "32분 전" },
];

const guideSteps = [
  { step: 1, title: "닉네임 검색", desc: "검색창에 플레이어 닉네임을 입력하세요" },
  { step: 2, title: "전적 확인", desc: "상세한 전적과 통계를 확인하세요" },
  { step: 3, title: "커뮤니티 참여", desc: "게시판에서 정보를 공유하고 소통하세요" },
  { step: 4, title: "마켓 이용", desc: "안전하게 거래하고 필요한 아이템을 구매하세요" },
];

export default function Home() {
  const router = useRouter();
  const { theme } = useTheme();
  const { isAuthed } = useAuth();
  const [searchNickname, setSearchNickname] = useState("");
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const [announcementIndex, setAnnouncementIndex] = useState(0);
  const [announcementClosed, setAnnouncementClosed] = useState(false);
  const [stats, setStats] = useState(defaultStatsData);
  const [member, setMember] = useState<MemberResponse | null>(null);
  const [profile, setProfile] = useState<PlayerProfileResponse | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [popularPosts, setPopularPosts] = useState<CommunityPost[]>([]);
  const [announcements, setAnnouncements] = useState<CommunityPost[]>([]);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [tierMode, setTierMode] = useState<"solo" | "party">("solo");
  const [expandedDetails, setExpandedDetails] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [summaryPage, setSummaryPage] = useState(0);
  const [barracksReportCount, setBarracksReportCount] = useState<number | null>(null);
  const [trollReportCount, setTrollReportCount] = useState<number | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedNickname = searchNickname.trim();
    if (trimmedNickname) {
      // 닉네임 최소 길이 검증 (2글자 이상)
      if (trimmedNickname.length < 2) {
        alert("닉네임은 최소 2글자 이상 입력해주세요.");
        return;
      }
      router.push(`/profile/${encodeURIComponent(trimmedNickname)}`);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
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
  }, []);

  // 공지사항 자동 슬라이드
  useEffect(() => {
    if (announcementClosed || announcements.length === 0) return;
    const interval = setInterval(() => {
      setAnnouncementIndex((prev) => (prev + 1) % announcements.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [announcementClosed, announcements.length]);


  // 프로필 새로고침 함수
  const refreshProfile = useCallback(async () => {
    if (!isAuthed) return;
    setRefreshing(true);
    try {
      const data = await fetchMe();
      if (data?.ouid) {
        const profileData = await getProfile(data.ouid);
        setMember(data);
        setProfile(profileData);
        setLastRefresh(new Date());
      }
    } catch {
      // ignore errors
    } finally {
      setRefreshing(false);
    }
  }, [isAuthed]);

  // 로그인 사용자 정보 불러오기
  useEffect(() => {
    let cancelled = false;
    if (!isAuthed) {
      setMember(null);
      setProfile(null);
      setProfileLoading(false);
      return;
    }
    setProfileLoading(true);
    fetchMe()
      .then(async (data) => {
        if (cancelled) return;
        setMember(data);
        if (data?.ouid) {
          try {
            const profileData = await getProfile(data.ouid);
            if (!cancelled) {
              setProfile(profileData);
              setLastRefresh(new Date());
            }
          } catch (err) {
            console.error("프로필 정보 로드 실패:", err);
            // 프로필 로드 실패는 치명적이지 않으므로 조용히 처리
          }
        }
      })
      .finally(() => {
        if (!cancelled) {
          setProfileLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthed]);

  // 자동 새로고침 제거 - 새로고침 버튼을 눌렀을 때만 갱신되도록 변경
  // (5분마다 자동 갱신으로 인한 트래픽 문제 해결)

  // 병영제보/이상탐지 신고 접수 건수 조회 (최적화: 전체 제보 대신 건수만 조회)
  useEffect(() => {
    if (!isAuthed || !profile?.userName) {
      setBarracksReportCount(null);
      setTrollReportCount(null);
      return;
    }
    const loadReportCounts = async () => {
      try {
        const counts = await getReportCounts(profile.userName);
        setBarracksReportCount(counts.barracksCount);
        setTrollReportCount(counts.trollCount);
      } catch (err) {
        console.error("신고 건수 조회 실패:", err);
        // 신고 건수 조회 실패는 치명적이지 않으므로 조용히 처리
        setBarracksReportCount(null);
        setTrollReportCount(null);
      }
    };
    loadReportCounts();
  }, [isAuthed, profile?.userName]);

  // 인기 게시글 및 공지사항 불러오기
  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      try {
        // 인기 게시글 (좋아요 기준 상위 5개)
        const allPosts = await fetchPosts();
        const popular = [...allPosts]
          .filter((p) => !p.notice && !p.pinned)
          .sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0))
          .slice(0, 5);
        if (!cancelled) setPopularPosts(popular);

        // 공지사항
        const notices = await fetchPosts({ category: "notice" });
        const sortedNotices = [...notices]
          .sort((a, b) => {
            if (a.notice !== b.notice) return Number(b.notice) - Number(a.notice);
            const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return bTime - aTime;
          });
        if (!cancelled) setAnnouncements(sortedNotices.slice(0, 3));
      } catch {
        // ignore errors
      }
    };
    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  // 통계 데이터 불러오기
  useEffect(() => {
    let cancelled = false;
    const loadStats = async () => {
      try {
        const { data } = await api.get("/stats/public");
        if (!cancelled && data) {
          setStats({
            todaySignups: data.todaySignups || 0,
            todayVisits: data.todayVisits || 0,
            totalVisits: data.totalVisits || 0,
            trollReports: data.trollReports || 0,
          });
        }
      } catch (error) {
        // 네트워크 에러나 백엔드 중지 시 조용히 처리 (콘솔 에러 로깅 안 함)
        const normalizedError = normalizeApiError(error);
        // 404, 500, 네트워크 에러(ECONNREFUSED, ERR_NETWORK 등)는 조용히 처리
        if (normalizedError.status === 404 || 
            normalizedError.status === 500 ||
            normalizedError.status === 503 || 
            normalizedError.status === undefined ||
            normalizedError.message?.includes("연결할 수 없습니다")) {
          // 백엔드가 중지되었거나 오류가 발생한 경우 조용히 처리
          // 기본값 유지 (이미 defaultStatsData로 초기화되어 있음)
        } else {
          // 기타 에러는 개발 환경에서만 로깅
          if (process.env.NODE_ENV === "development") {
            console.warn("통계 데이터 로드 실패:", normalizedError.message);
          }
        }
        // 기본값 유지 (이미 defaultStatsData로 초기화되어 있음)
      }
    };
    loadStats();
    return () => {
      cancelled = true;
    };
  }, []);

  // 검색 자동완성
  useEffect(() => {
    if (!searchNickname.trim() || searchNickname.length < 2) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        // 검색 제안 API 사용 (더 효율적)
        const { data } = await api.get(`/player/search/suggestions?q=${encodeURIComponent(searchNickname.trim())}&limit=5`);
        if (Array.isArray(data) && data.length > 0) {
          setSearchSuggestions(data);
          setShowSuggestions(true);
        } else {
          setSearchSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (error) {
        // 네트워크 에러나 백엔드 중지 시 조용히 처리 (콘솔 에러 로깅 안 함)
        const normalizedError = normalizeApiError(error);
        // 404나 네트워크 에러(ECONNREFUSED, ERR_NETWORK 등)는 조용히 처리
        if (normalizedError.status === 404 || 
            normalizedError.status === 503 || 
            normalizedError.status === undefined ||
            normalizedError.message?.includes("연결할 수 없습니다")) {
          // 백엔드가 중지되었거나 엔드포인트가 없는 경우 조용히 처리
          setSearchSuggestions([]);
          setShowSuggestions(false);
        } else {
          // 기타 에러는 개발 환경에서만 로깅
          if (process.env.NODE_ENV === "development") {
            console.warn("검색 자동완성 실패:", normalizedError.message);
          }
          setSearchSuggestions([]);
          setShowSuggestions(false);
        }
      }
    }, 500); // 디바운스 시간을 500ms로 증가하여 요청 수 감소

    return () => clearTimeout(timeoutId);
  }, [searchNickname]);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-18 pt-8 sm:pt-12 space-y-8 sm:space-y-12">
      {/* 공지사항 슬라이더 */}
      {!announcementClosed && announcements.length > 0 && (
        <section className="relative">
          <div className={clsx(
            "card p-4 pr-12 relative overflow-hidden",
            theme === "light" ? "border-blue-200 bg-blue-50" : "border-emerald-500/30 bg-emerald-500/10"
          )}>
            <button
              onClick={() => setAnnouncementClosed(true)}
              className={clsx(
                "absolute top-2 right-2 p-1 rounded-lg transition-all duration-300",
                theme === "light"
                  ? "hover:bg-blue-100 text-blue-700"
                  : "hover:bg-emerald-500/20 text-emerald-300"
              )}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
            <Link
              href={`/community/${announcements[announcementIndex]?.id}?category=notice`}
              className="flex items-center gap-3"
            >
              <div className={clsx(
                "px-2 py-1 rounded text-xs font-semibold",
                theme === "light" ? "bg-blue-500 text-white" : "bg-emerald-500 text-slate-900"
              )}>
                공지
              </div>
              <div className="flex-1">
                <h3 className={clsx(
                  "font-semibold text-sm",
                  theme === "light" ? "text-blue-900" : "text-emerald-200"
                )}>
                  {announcements[announcementIndex]?.title || "공지사항"}
                </h3>
                <p className={clsx(
                  "text-xs mt-1 line-clamp-1",
                  theme === "light" ? "text-blue-700" : "text-emerald-300"
                )}>
                  {announcements[announcementIndex]?.content ? 
                    announcements[announcementIndex].content.replace(/<[^>]*>/g, '').slice(0, 100) : 
                    "공지사항 내용"}
                </p>
              </div>
              <div className="flex gap-1">
                {announcements.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setAnnouncementIndex(idx);
                    }}
                    className={clsx(
                      "w-2 h-2 rounded-full transition-all duration-300",
                      idx === announcementIndex
                        ? theme === "light" ? "bg-blue-500" : "bg-emerald-400"
                        : theme === "light" ? "bg-blue-300" : "bg-emerald-500/30"
                    )}
                  />
                ))}
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* 히어로 섹션 */}
      <section 
        ref={(el) => { sectionRefs.current[0] = el; }}
        className={`card overflow-hidden p-4 sm:p-6 lg:p-10 ${revealed.has(0) ? 'animate-fade-in-up' : 'opacity-0'}`}
      >
        <div className="grid gap-6 sm:gap-8 lg:grid-cols-[1.2fr_1fr] items-center">
          <div className="space-y-5">
            <div className={clsx(
              "inline-flex items-center gap-2 rounded-full border-2 px-3 py-1 text-xs font-semibold uppercase animate-fade-in",
              theme === "light"
                ? "border-blue-500/30 bg-blue-500/10 text-blue-700"
                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
            )}>
              Sudden Attack 데이터 허브
            </div>
            <div className="flex items-center gap-4 mb-4 animate-fade-in animate-delay-50">
              <img 
                src="https://open.api.nexon.com/static/suddenattack/img/473e902819d68aee4fa770977e70bdb9" 
                alt="서든어택 로고" 
                className="h-12 sm:h-16 w-auto object-contain brightness-0 invert opacity-80"
              />
            </div>
            <div className="space-y-2">
              <h1 className="display text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight animate-fade-in animate-delay-100">
                서든어택 전적 · 인사이트 · 커뮤니티를 한 화면에
            </h1>
            <p className={clsx(
              "text-sm sm:text-base animate-fade-in animate-delay-200",
              theme === "light" ? "text-slate-700" : "text-slate-300"
            )}>
                전적 조회부터 커뮤니티, 마켓, 클랜 관리까지 서든어택 게이머를 위한
                통합 플랫폼입니다.
            </p>
            </div>
            <form onSubmit={handleSearch} className="relative grid gap-3 sm:grid-cols-[1.2fr_auto] sm:items-center animate-fade-in animate-delay-300">
              <div className="relative">
                <input
                  type="text"
                  value={searchNickname}
                  onChange={(e) => setSearchNickname(e.target.value)}
                  onFocus={() => {
                    if (searchSuggestions.length > 0) setShowSuggestions(true);
                  }}
                  onBlur={() => {
                    setTimeout(() => setShowSuggestions(false), 200);
                  }}
                  placeholder="닉네임으로 검색"
                  className={clsx(
                    "w-full rounded-xl border-2 px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all duration-300",
                    theme === "light"
                      ? "border-slate-300 bg-white text-black focus:border-blue-500 focus:ring-blue-500/30"
                      : "border-slate-800 bg-slate-950/60 text-slate-200 focus:border-emerald-400 focus:ring-emerald-500/30"
                  )}
                />
                {showSuggestions && searchSuggestions.length > 0 && (
                  <div
                    className={clsx(
                      "absolute top-full left-0 right-0 mt-1 rounded-lg border-2 shadow-xl z-50",
                      theme === "light"
                        ? "border-slate-300 bg-white"
                        : "border-slate-800 bg-slate-900"
                    )}
                  >
                    {searchSuggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSearchNickname(suggestion);
                          setShowSuggestions(false);
                          router.push(`/profile/${encodeURIComponent(suggestion)}`);
                        }}
                        className={clsx(
                          "w-full px-4 py-2 text-left text-sm hover:bg-opacity-50 transition-colors",
                          theme === "light"
                            ? "hover:bg-blue-50 text-slate-900"
                            : "hover:bg-slate-800 text-slate-200",
                          idx === 0 && "rounded-t-lg",
                          idx === searchSuggestions.length - 1 && "rounded-b-lg"
                        )}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="submit"
                className={clsx(
                  "inline-flex justify-center rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-300 hover:scale-105 active:scale-95",
                  theme === "light"
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-emerald-500 text-slate-900 hover:bg-emerald-400"
                )}
              >
                전적 검색
              </button>
            </form>
            <div className={clsx(
              "flex flex-wrap gap-2 text-xs",
              theme === "light" ? "text-slate-600" : "text-slate-400"
            )}>
              {quickLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "rounded-full border-2 px-3 py-1 transition-all duration-300",
                    theme === "light"
                      ? "border-slate-300 text-slate-700 hover:border-blue-500 hover:text-blue-700 hover:bg-blue-50"
                      : "border-slate-800 text-slate-400 hover:border-emerald-500/50 hover:text-emerald-200"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="relative animate-fade-in animate-delay-400 mt-6 lg:mt-0">
            {theme === "sadb" && (
              <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-emerald-500/10 via-cyan-500/10 to-transparent blur-3xl animate-pulse-glow" />
            )}
            {mounted && !isAuthed && (
              <div className={clsx(
                "absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-2xl sm:rounded-3xl border-2 text-center px-4",
                theme === "light"
                  ? "border-slate-300 bg-white/70 backdrop-blur-sm"
                  : "border-slate-800 bg-slate-900/70 backdrop-blur-sm"
              )}>
                <p className={clsx(
                  "text-sm font-semibold",
                  theme === "light" ? "text-slate-800" : "text-slate-100"
                )}>
                  로그인하면 당신의 정보가 메인화면에 뜹니다.
                </p>
                <div className="flex gap-2">
                  <Link
                    href="/login"
                    className={clsx(
                      "rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300",
                      theme === "light"
                        ? "bg-blue-500 text-white hover:bg-blue-600"
                        : "bg-emerald-500 text-slate-900 hover:bg-emerald-400"
                    )}
                  >
                    로그인
                  </Link>
                  <Link
                    href="/register"
                    className={clsx(
                      "rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300",
                      theme === "light"
                        ? "border-2 border-slate-300 text-slate-800 hover:border-blue-500 hover:text-blue-700"
                        : "border-2 border-slate-800 text-slate-200 hover:border-emerald-500/50 hover:text-emerald-200"
                    )}
                  >
                    회원가입
                  </Link>
                </div>
              </div>
            )}
            {/* 서든어택 계정 미연동 회원: 메인 인사이트 블러 + 연동 CTA */}
            {mounted && isAuthed && member && !member.ouid && (
              <div className={clsx(
                "absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-2xl sm:rounded-3xl border-2 text-center px-4",
                theme === "light"
                  ? "border-slate-300 bg-white/80 backdrop-blur-md"
                  : "border-slate-800 bg-slate-950/80 backdrop-blur-md"
              )}>
                <p className={clsx(
                  "text-sm font-semibold",
                  theme === "light" ? "text-slate-800" : "text-slate-100"
                )}>
                  서든어택 계정을 연동하면 내 전적 인사이트가 메인 화면에 표시됩니다.
                </p>
                <p className={clsx(
                  "text-xs",
                  theme === "light" ? "text-slate-600" : "text-slate-400"
                )}>
                  마이페이지에서 계정을 연동한 뒤 다시 확인해 주세요.
                </p>
                <div className="flex gap-2">
                  <Link
                    href="/profile/[nickname]"
                    as={`/profile/${encodeURIComponent(member.nickname)}`}
                    className={clsx(
                      "rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300",
                      theme === "light"
                        ? "bg-blue-500 text-white hover:bg-blue-600"
                        : "bg-emerald-500 text-slate-900 hover:bg-emerald-400"
                    )}
                  >
                    서든어택 계정 연동하기
                  </Link>
                </div>
              </div>
            )}
            <div className={clsx(
              (mounted && isAuthed && member && !member.ouid) && "blur-sm pointer-events-none select-none"
            )}>
              {profileLoading && !profile ? (
                <RankSummarySkeleton theme={theme} />
              ) : (
                <RankSummarySlider
                  profile={profile}
                  member={member}
                  isAuthed={isAuthed}
                  mounted={mounted}
                  theme={theme}
                  tierMode={tierMode}
                  setTierMode={setTierMode}
                  expandedDetails={expandedDetails}
                  setExpandedDetails={setExpandedDetails}
                  refreshing={refreshing}
                  onRefresh={refreshProfile}
                  lastRefresh={lastRefresh}
                  currentPage={summaryPage}
                  setCurrentPage={setSummaryPage}
                  barracksReportCount={barracksReportCount}
                  trollReportCount={trollReportCount}
                  onCardClick={() => {
                    if (profile?.userName || member?.nickname) {
                      router.push(`/profile/${encodeURIComponent(profile?.userName || member?.nickname || "")}`);
                    }
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 카테고리별 큰 아이콘 카드 */}
      <section 
        ref={(el) => { sectionRefs.current[1] = el; }}
        className={`space-y-4 ${revealed.has(1) ? 'animate-fade-in-up' : 'opacity-0'}`}
      >
        <div className="flex flex-col gap-2">
          <p className={clsx(
            "text-xs uppercase",
            theme === "light" ? "text-blue-600" : "text-emerald-300"
          )}>카테고리</p>
          <h2 className={clsx(
            "text-2xl font-semibold",
            theme === "light" ? "text-slate-900" : "text-emerald-100"
          )}>
            주요 서비스
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {categoryCards.map((category, index) => {
            const Icon = category.icon;
            return (
              <Link
                key={category.title}
                href={category.href}
                className={clsx(
                  "card p-6 transition-all duration-300 hover:scale-[1.03] group relative overflow-hidden",
                  theme === "light"
                    ? "hover:border-slate-400 hover:shadow-xl"
                    : "hover:border-emerald-500/40 hover:shadow-emerald-900/30"
                )}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {theme === "sadb" && (
                  <div className={clsx(
                    "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                    category.color === "emerald" && "bg-gradient-to-br from-emerald-500/10 to-transparent",
                    category.color === "blue" && "bg-gradient-to-br from-blue-500/10 to-transparent",
                    category.color === "amber" && "bg-gradient-to-br from-amber-500/10 to-transparent",
                    category.color === "purple" && "bg-gradient-to-br from-purple-500/10 to-transparent"
                  )} />
                )}
                <div className="relative z-10">
                  <div className={clsx(
                    "inline-flex p-3 rounded-xl mb-4",
                    category.color === "emerald" && theme === "light"
                      ? "bg-emerald-100 text-emerald-700"
                      : category.color === "emerald" && "bg-emerald-500/20 text-emerald-300",
                    category.color === "blue" && theme === "light"
                      ? "bg-blue-100 text-blue-700"
                      : category.color === "blue" && "bg-blue-500/20 text-blue-300",
                    category.color === "amber" && theme === "light"
                      ? "bg-amber-100 text-amber-700"
                      : category.color === "amber" && "bg-amber-500/20 text-amber-300",
                    category.color === "purple" && theme === "light"
                      ? "bg-purple-100 text-purple-700"
                      : category.color === "purple" && "bg-purple-500/20 text-purple-300"
                  )}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className={clsx(
                    "text-lg font-semibold mb-2",
                    theme === "light" ? "text-slate-900" : "text-emerald-200"
                  )}>
                    {category.title}
                  </h3>
                  <p className={clsx(
                    "text-sm",
                    theme === "light" ? "text-slate-600" : "text-slate-400"
                  )}>
                    {category.desc}
                  </p>
                  <div className="mt-4 flex items-center gap-1">
                    <span className={clsx(
                      "text-xs font-medium",
                      theme === "light" ? "text-blue-600" : "text-emerald-400"
                    )}>
                      자세히 보기
                    </span>
                    <ArrowRightIcon className={clsx(
                      "h-4 w-4 transition-transform duration-300 group-hover:translate-x-1",
                      theme === "light" ? "text-blue-600" : "text-emerald-400"
                    )} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section 
        ref={(el) => { sectionRefs.current[2] = el; }}
        className={`space-y-4 ${revealed.has(2) ? 'animate-fade-in-up' : 'opacity-0'}`}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className={clsx(
              "text-xs uppercase",
              theme === "light" ? "text-blue-600" : "text-emerald-300"
            )}>Features</p>
            <h2 className={clsx(
              "text-2xl font-semibold",
              theme === "light" ? "text-slate-900" : "text-emerald-100"
            )}>
              서든어택 게이머를 위한 통합 플랫폼
            </h2>
            <p className={clsx(
              "text-sm",
              theme === "light" ? "text-slate-600" : "text-slate-400"
            )}>
              전적 조회, 커뮤니티, 마켓, 클랜 관리까지 모든 기능을 한 곳에서
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href="/suddenattack/stats"
              className={clsx(
                "rounded-lg border-2 px-3 py-2 text-sm transition-all duration-300 hover:scale-105",
                theme === "light"
                  ? "border-slate-300 text-slate-800 hover:border-blue-500 hover:text-blue-700 hover:bg-blue-50"
                  : "border-slate-800 text-slate-200 hover:border-emerald-500/50 hover:text-emerald-200"
              )}
            >
              전적조회
            </a>
            <a
              href="/community/free"
              className={clsx(
                "rounded-lg border-2 px-3 py-2 text-sm transition-all duration-300 hover:scale-105",
                theme === "light"
                  ? "border-slate-300 text-slate-800 hover:border-blue-500 hover:text-blue-700 hover:bg-blue-50"
                  : "border-slate-800 text-slate-200 hover:border-emerald-500/50 hover:text-emerald-200"
              )}
            >
              커뮤니티
            </a>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {highlights.map((item, index) => (
            <div 
              key={item.title} 
              className={clsx(
                "card p-5 transition-all duration-300 hover:scale-[1.02]",
                theme === "light" ? "hover:border-slate-400" : "hover:border-emerald-500/40"
              )}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
            <h3 className={clsx(
              "text-lg font-semibold",
              theme === "light" ? "text-slate-900" : "text-emerald-200"
            )}>{item.title}</h3>
            <p className={clsx(
              "mt-2 text-sm",
              theme === "light" ? "text-slate-700" : "text-slate-300"
            )}>{item.desc}</p>
          </div>
        ))}
        </div>
      </section>

      {/* 인기 게시글 미리보기 */}
      <section 
        ref={(el) => { sectionRefs.current[3] = el; }}
        className={`card p-6 sm:p-8 space-y-4 ${revealed.has(3) ? 'animate-fade-in-up' : 'opacity-0'}`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FireIcon className={clsx(
              "h-5 w-5",
              theme === "light" ? "text-orange-500" : "text-orange-400"
            )} />
            <h2 className={clsx(
              "text-xl font-semibold",
              theme === "light" ? "text-slate-900" : "text-emerald-100"
            )}>
              인기 게시글
            </h2>
          </div>
          <Link
            href="/community/popular"
            className={clsx(
              "text-sm flex items-center gap-1 transition-all duration-300",
              theme === "light"
                ? "text-blue-600 hover:text-blue-700"
                : "text-emerald-400 hover:text-emerald-300"
            )}
          >
            더보기
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
        <div className="space-y-2">
          {popularPosts.length > 0 ? (
            popularPosts.map((post) => (
              <Link
                key={post.id}
                href={`/community/${post.id}?category=${post.category || "popular"}`}
                className={clsx(
                  "flex items-center gap-3 p-3 rounded-lg border-2 transition-all duration-300 hover:scale-[1.01] group",
                  theme === "light"
                    ? "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100"
                    : "border-slate-800 bg-slate-900/70 hover:border-emerald-500/40 hover:bg-slate-900/90"
                )}
              >
                <span className={clsx(
                  "text-xs px-2 py-1 rounded-full whitespace-nowrap",
                  theme === "light" ? "bg-blue-100 text-blue-700" : "bg-emerald-500/20 text-emerald-300"
                )}>
                  {post.category || "기타"}
                </span>
                <h3 className={clsx(
                  "font-semibold text-sm flex-1 truncate",
                  theme === "light" ? "text-slate-900" : "text-slate-200"
                )}>
                  {post.title}
                </h3>
                <div className="flex items-center gap-3 text-xs whitespace-nowrap">
                  <span className={clsx(
                    theme === "light" ? "text-slate-600" : "text-slate-400"
                  )}>
                    {post.author || "익명"}
                  </span>
                  <span className={clsx(
                    theme === "light" ? "text-slate-500" : "text-slate-500"
                  )}>
                    조회 {post.views ?? 0}
                  </span>
                  <span className={clsx(
                    theme === "light" ? "text-slate-500" : "text-slate-500"
                  )}>
                    댓글 {post.commentCount ?? 0}
                  </span>
                </div>
              </Link>
            ))
          ) : (
            <div className={clsx(
              "text-center py-8 text-sm",
              theme === "light" ? "text-slate-600" : "text-slate-400"
            )}>
              인기 게시글이 없습니다.
            </div>
          )}
        </div>
      </section>

      {/* 서비스 소개 섹션 */}
      <section 
        ref={(el) => { sectionRefs.current[4] = el; }}
        className={`card p-6 sm:p-8 space-y-6 ${revealed.has(4) ? 'animate-fade-in-up' : 'opacity-0'}`}
      >
        <div className="flex flex-col gap-1">
          <p className={clsx(
            "text-xs uppercase",
            theme === "light" ? "text-blue-600" : "text-emerald-300"
          )}>가이드</p>
          <h2 className={clsx(
            "text-2xl font-semibold",
            theme === "light" ? "text-slate-900" : "text-emerald-100"
          )}>
            시작하기
          </h2>
          <p className={clsx(
            "text-sm",
            theme === "light" ? "text-slate-600" : "text-slate-400"
          )}>
            서비스 이용 방법을 단계별로 안내합니다.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {guideSteps.map((step, index) => (
            <div
              key={step.step}
              className={clsx(
                "relative p-5 rounded-xl border-2 transition-all duration-300 hover:scale-[1.02]",
                theme === "light"
                  ? "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100"
                  : "border-slate-800 bg-slate-900/70 hover:border-emerald-500/40 hover:bg-slate-900/90"
              )}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={clsx(
                "absolute -top-3 -left-3 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                theme === "light" ? "bg-blue-500 text-white" : "bg-emerald-500 text-slate-900"
              )}>
                {step.step}
              </div>
              <h3 className={clsx(
                "text-lg font-semibold mb-2",
                theme === "light" ? "text-slate-900" : "text-emerald-200"
              )}>
                {step.title}
              </h3>
              <p className={clsx(
                "text-sm",
                theme === "light" ? "text-slate-600" : "text-slate-400"
              )}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
        <div className="flex justify-center pt-4">
          <Link
            href="/suddenattack/stats"
            className={clsx(
              "inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105",
              theme === "light"
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : "bg-emerald-500 text-slate-900 hover:bg-emerald-400"
            )}
          >
            지금 시작하기
            <ArrowRightIcon className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* 기존 주요 기능 섹션 */}
      <section 
        ref={(el) => { sectionRefs.current[5] = el; }}
        className={`card p-6 sm:p-8 space-y-4 ${revealed.has(5) ? 'animate-fade-in-up' : 'opacity-0'}`}
      >
          <div className="flex flex-col gap-1">
            <p className={clsx(
              "text-xs uppercase",
              theme === "light" ? "text-blue-600" : "text-emerald-300"
            )}>커뮤니티</p>
            <h2 className={clsx(
              "text-xl font-semibold",
              theme === "light" ? "text-slate-900" : "text-emerald-100"
            )}>주요 기능</h2>
            <p className={clsx(
              "text-sm",
              theme === "light" ? "text-slate-600" : "text-slate-400"
            )}>
              전적 조회부터 커뮤니티 활동, 거래, 클랜 관리까지 모든 기능을 제공합니다.
            </p>
          </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { step: "서든어택", desc: "전적조회, 병영박제, 이상탐지" },
            { step: "커뮤니티", desc: "공지, 인기, 자유, 랭크전, 대룰, 보급, 듀오" },
            { step: "마켓", desc: "플리마켓, 기타거래" },
            { step: "클랜 마스터", desc: "클랜등록, 병영검증, 정보공유, 삭제요청" },
          ].map((item, index) => (
            <div 
              key={item.step}
              className={clsx(
                "rounded-xl border-2 p-4 transition-all duration-300 hover:scale-[1.02]",
                theme === "light"
                  ? "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100"
                  : "border-slate-800 bg-slate-900/70 hover:border-emerald-500/40 hover:bg-slate-900/90"
              )}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <p className={clsx(
                "text-xs",
                theme === "light" ? "text-slate-600" : "text-slate-400"
              )}>{item.step}</p>
              <p className={clsx(
                "mt-1 font-semibold",
                theme === "light" ? "text-blue-700" : "text-emerald-200"
              )}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 실시간 통계 대시보드 */}
      <section 
        ref={(el) => { sectionRefs.current[6] = el; }}
        className={`${revealed.has(6) ? 'animate-fade-in-up' : 'opacity-0'}`}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={clsx(
            "card p-4 transition-all duration-300 hover:scale-[1.02]",
            theme === "light" ? "hover:border-slate-400" : "hover:border-emerald-500/40"
          )}>
            <p className={clsx(
              "text-xs uppercase tracking-wide mb-1",
              theme === "light" ? "text-slate-600" : "text-slate-400"
            )}>오늘 가입자</p>
            <p className={clsx(
              "text-2xl font-bold",
              theme === "light" ? "text-blue-700" : "text-emerald-300"
            )}>{stats.todaySignups.toLocaleString()}</p>
          </div>
          <div className={clsx(
            "card p-4 transition-all duration-300 hover:scale-[1.02]",
            theme === "light" ? "hover:border-slate-400" : "hover:border-emerald-500/40"
          )}>
            <p className={clsx(
              "text-xs uppercase tracking-wide mb-1",
              theme === "light" ? "text-slate-600" : "text-slate-400"
            )}>오늘 방문수</p>
            <p className={clsx(
              "text-2xl font-bold",
              theme === "light" ? "text-blue-700" : "text-emerald-300"
            )}>{stats.todayVisits.toLocaleString()}</p>
          </div>
          <div className={clsx(
            "card p-4 transition-all duration-300 hover:scale-[1.02]",
            theme === "light" ? "hover:border-slate-400" : "hover:border-emerald-500/40"
          )}>
            <p className={clsx(
              "text-xs uppercase tracking-wide mb-1",
              theme === "light" ? "text-slate-600" : "text-slate-400"
            )}>총 방문수</p>
            <p className={clsx(
              "text-xs text-slate-500 mb-1",
              theme === "light" ? "text-slate-500" : "text-slate-400"
            )}>(누적)</p>
            <p className={clsx(
              "text-2xl font-bold",
              theme === "light" ? "text-blue-700" : "text-emerald-300"
            )}>{stats.totalVisits.toLocaleString()}</p>
          </div>
          <div className={clsx(
            "card p-4 transition-all duration-300 hover:scale-[1.02]",
            theme === "light" ? "hover:border-slate-400" : "hover:border-emerald-500/40"
          )}>
            <p className={clsx(
              "text-xs uppercase tracking-wide mb-1",
              theme === "light" ? "text-slate-600" : "text-slate-400"
            )}>이상탐지</p>
            <p className={clsx(
              "text-2xl font-bold",
              theme === "light" ? "text-blue-700" : "text-emerald-300"
            )}>{stats.trollReports.toLocaleString()}</p>
          </div>
        </div>
      </section>
    </div>
  );
}

type InfoItemProps = {
  label: string;
  value: string;
};

function InfoItem({ label, value }: InfoItemProps) {
  const { theme } = useTheme();
  return (
    <div className={clsx(
      "rounded-xl border-2 p-4 min-h-[80px] flex flex-col justify-between",
      theme === "light"
        ? "border-slate-200 bg-slate-50"
        : "border-slate-800 bg-slate-950/60"
    )}>
      <p className={clsx(
        "text-[10px] uppercase tracking-wide mb-2",
        theme === "light" ? "text-slate-600" : "text-slate-400"
      )}>{label}</p>
      <p className={clsx(
        "text-xl font-semibold leading-tight break-words",
        theme === "light" ? "text-blue-700" : "text-emerald-200"
      )}>{value}</p>
    </div>
  );
}



function BadgeIcon({ label }: { label: string }) {
  return (
    <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-600 flex items-center justify-center text-xs font-semibold text-emerald-200 shadow-inner">
      {label}
    </div>
  );
}

// 서든어택 메타 이미지 매핑 (공식 static 경로)
const SA_META_BASE = "https://open.api.nexon.com/static/suddenattack/meta";
const DEFAULT_SA_IMAGE = "https://open.api.nexon.com/static/suddenattack/img/473e902819d68aee4fa770977e70bdb9";

function getRankImage(rankImage?: string | null, rankName?: string | null) {
  if (rankImage && rankImage.trim().length > 0) return rankImage;
  return buildMetaImage("tier", rankName) ?? DEFAULT_SA_IMAGE;
}

function getUnifiedImage(gradeImage?: string | null, gradeName?: string | null) {
  if (gradeImage && gradeImage.trim().length > 0) return gradeImage;
  return buildMetaImage("grade", gradeName) ?? DEFAULT_SA_IMAGE;
}

function getMannerImage(mannerName?: string | null) {
  return buildMetaImage("grade", mannerName) ?? DEFAULT_SA_IMAGE;
}

function buildMetaImage(type: "grade" | "tier", key?: string | null) {
  if (!key) return undefined;
  const safeKey = encodeURIComponent(key.trim());
  return `${SA_META_BASE}/${type}/${safeKey}.png`;
}

// 랭크 요약 슬라이더 컴포넌트
type RankSummarySliderProps = {
  profile: PlayerProfileResponse | null;
  member: MemberResponse | null;
  isAuthed: boolean;
  mounted: boolean;
  theme: string;
  tierMode: "solo" | "party";
  setTierMode: (mode: "solo" | "party") => void;
  expandedDetails: boolean;
  setExpandedDetails: (expanded: boolean) => void;
  refreshing: boolean;
  onRefresh: () => void;
  lastRefresh: Date | null;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  barracksReportCount: number | null;
  trollReportCount: number | null;
  onCardClick: () => void;
};

function RankSummarySlider({
  profile,
  member,
  isAuthed,
  mounted,
  theme,
  tierMode,
  setTierMode,
  expandedDetails,
  setExpandedDetails,
  refreshing,
  onRefresh,
  lastRefresh,
  currentPage,
  setCurrentPage,
  barracksReportCount,
  trollReportCount,
  onCardClick,
}: RankSummarySliderProps) {
  const totalPages = 3;

  return (
    <div className="relative">
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentPage * 100}%)` }}
        >
          <div className="min-w-full flex-shrink-0">
            <RankSummaryPage1
              profile={profile}
              member={member}
              isAuthed={isAuthed}
              mounted={mounted}
              theme={theme}
              tierMode={tierMode}
              setTierMode={setTierMode}
              refreshing={refreshing}
              onRefresh={onRefresh}
              lastRefresh={lastRefresh}
              onCardClick={onCardClick}
            />
          </div>
          <div className="min-w-full flex-shrink-0">
            <RankSummaryPage2
              profile={profile}
              theme={theme}
              onCardClick={onCardClick}
            />
          </div>
          <div className="min-w-full flex-shrink-0">
          <RankSummaryPage3
            profile={profile}
            member={member}
            isAuthed={isAuthed}
            mounted={mounted}
            theme={theme}
            expandedDetails={expandedDetails}
            setExpandedDetails={setExpandedDetails}
            barracksReportCount={barracksReportCount}
            trollReportCount={trollReportCount}
            onCardClick={onCardClick}
          />
          </div>
        </div>
      </div>
      
      {/* 페이지 네비게이션 */}
      <div className="flex items-center justify-center gap-2 mt-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setCurrentPage(Math.max(0, currentPage - 1));
          }}
          disabled={currentPage === 0}
          className={clsx(
            "p-2 rounded-lg transition-all",
            theme === "light"
              ? "hover:bg-slate-100 text-slate-600 disabled:text-slate-300 disabled:cursor-not-allowed"
              : "hover:bg-slate-800 text-slate-400 disabled:text-slate-500 disabled:cursor-not-allowed"
          )}
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <div className="flex gap-1">
          {Array.from({ length: totalPages }).map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentPage(idx);
              }}
              className={clsx(
                "h-2 rounded-full transition-all",
                currentPage === idx
                  ? theme === "light"
                    ? "w-6 bg-blue-500"
                    : "w-6 bg-emerald-500"
                  : theme === "light"
                  ? "w-2 bg-slate-300"
                  : "w-2 bg-slate-600"
              )}
            />
          ))}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setCurrentPage(Math.min(totalPages - 1, currentPage + 1));
          }}
          disabled={currentPage === totalPages - 1}
          className={clsx(
            "p-2 rounded-lg transition-all",
            theme === "light"
              ? "hover:bg-slate-100 text-slate-600 disabled:text-slate-300 disabled:cursor-not-allowed"
              : "hover:bg-slate-800 text-slate-400 disabled:text-slate-500 disabled:cursor-not-allowed"
          )}
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

// 페이지 1: 기본 정보 및 티어
type RankSummaryPageProps = {
  profile: PlayerProfileResponse | null;
  member: MemberResponse | null;
  isAuthed: boolean;
  mounted: boolean;
  theme: string;
  tierMode: "solo" | "party";
  setTierMode: (mode: "solo" | "party") => void;
  refreshing: boolean;
  onRefresh: () => void;
  lastRefresh: Date | null;
  onCardClick: () => void;
};

function RankSummaryPage1({
  profile,
  member,
  isAuthed,
  mounted,
  theme,
  tierMode,
  setTierMode,
  refreshing,
  onRefresh,
  lastRefresh,
  onCardClick,
}: RankSummaryPageProps) {
  const currentTier = tierMode === "solo" ? profile?.soloTier : profile?.partyTier;
  const currentScore = tierMode === "solo" ? profile?.soloScore : profile?.partyScore;
  const currentTierImage = tierMode === "solo" ? profile?.soloTierImage : profile?.partyTierImage;

  return (
    <div
      className={clsx(
        "relative grid gap-3 rounded-2xl sm:rounded-3xl border-2 p-4 sm:p-5 shadow-2xl transition-all duration-300 cursor-pointer group",
        mounted && !isAuthed && "blur-sm pointer-events-none select-none",
        theme === "light"
          ? "border-slate-300 bg-white shadow-slate-300/40 hover:shadow-slate-400/50"
          : "border-slate-800/80 bg-slate-900/70 shadow-emerald-900/30 hover:shadow-emerald-900/50"
      )}
      onClick={mounted && isAuthed ? onCardClick : undefined}
    >
      {/* 헤더 */}
      <div className={clsx("flex items-center justify-between text-xs")}>
        <div className="flex items-center gap-2">
          <span className={clsx(theme === "light" ? "text-slate-600" : "text-slate-400")}>랭크 요약</span>
          {lastRefresh && (
            <span className={clsx("text-[10px]", theme === "light" ? "text-slate-400" : "text-slate-500")}>
              {new Date(lastRefresh).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {mounted && isAuthed && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRefresh();
              }}
              disabled={refreshing}
              className={clsx(
                "p-1.5 rounded-lg transition-all",
                theme === "light"
                  ? "hover:bg-slate-100 text-slate-600"
                  : "hover:bg-slate-800 text-slate-400",
                refreshing && "animate-spin"
              )}
              title="새로고침"
            >
              <ArrowPathIcon className="h-4 w-4" />
            </button>
          )}
          <span
            className={clsx(
              "rounded-full px-2 py-0.5",
              theme === "light"
                ? "bg-blue-500/15 text-blue-700"
                : "bg-emerald-500/15 text-emerald-200"
            )}
          >
            {mounted && isAuthed && member?.nickname ? `${member.nickname}님` : "KR 서버"}
          </span>
        </div>
      </div>

      {/* 기본 정보 */}
      <div className="grid gap-3 sm:grid-cols-2">
        <EnhancedInfoItem
          label="닉네임"
          value={profile?.userName || member?.nickname || "연동된 닉네임 없음"}
          loading={false}
          theme={theme}
        />
        <EnhancedInfoItem
          label="클랜"
          value={profile?.clanName || "클랜 미등록"}
          loading={false}
          theme={theme}
        />
        <EnhancedInfoItem
          label="통합계급"
          value={profile?.grade || "계급 정보 없음"}
          subValue={profile?.gradeRanking ? `전체 ${profile.gradeRanking.toLocaleString()}위` : undefined}
          loading={false}
          theme={theme}
        />
        <EnhancedInfoItem
          label="시즌계급"
          value={profile?.seasonGrade || "시즌 계급 없음"}
          subValue={profile?.seasonGradeRanking ? `시즌 ${profile.seasonGradeRanking.toLocaleString()}위` : undefined}
          loading={false}
          theme={theme}
        />
      </div>

      {/* 티어 정보 (솔로/파티 토글) */}
      <div className={clsx("rounded-xl border-2 p-4", theme === "light" ? "border-slate-200 bg-slate-50" : "border-slate-800 bg-slate-950/60")}>
        <div className="flex items-center justify-between mb-3">
          <span className={clsx("text-xs font-semibold", theme === "light" ? "text-slate-600" : "text-slate-400")}>
            랭크전 티어
          </span>
          <div className="flex gap-1 rounded-lg border-2 p-0.5" style={{ borderColor: theme === "light" ? "#e2e8f0" : "#1e293b" }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setTierMode("solo");
              }}
              className={clsx(
                "px-2 py-1 rounded text-[10px] font-semibold transition-all",
                tierMode === "solo"
                  ? theme === "light"
                    ? "bg-blue-500 text-white"
                    : "bg-emerald-500 text-slate-900"
                  : theme === "light"
                  ? "text-slate-600 hover:bg-slate-100"
                  : "text-slate-400 hover:bg-slate-800"
              )}
            >
              솔로
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setTierMode("party");
              }}
              className={clsx(
                "px-2 py-1 rounded text-[10px] font-semibold transition-all",
                tierMode === "party"
                  ? theme === "light"
                    ? "bg-blue-500 text-white"
                    : "bg-emerald-500 text-slate-900"
                  : theme === "light"
                  ? "text-slate-600 hover:bg-slate-100"
                  : "text-slate-400 hover:bg-slate-800"
              )}
            >
              파티
            </button>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <ImageStatCard
            label={`${tierMode === "solo" ? "솔로" : "파티"} 티어`}
            value={currentTier || "티어 정보 없음"}
            subValue={currentScore ? `${currentScore.toLocaleString()}점` : undefined}
            imageUrl={getRankImage(currentTierImage, currentTier)}
            hideText
            theme={theme}
          />
          <ImageStatCard
            label="통합계급"
            value={profile?.grade || "계급 정보 없음"}
            subValue={profile?.gradeRanking ? `전체 ${profile.gradeRanking.toLocaleString()}위` : undefined}
            imageUrl={getUnifiedImage(profile?.gradeImage, profile?.grade)}
            hideText
            theme={theme}
          />
        </div>
      </div>

    </div>
  );
}

// 페이지 2: 승률/K/D 및 무기 통계
type RankSummaryPage2Props = {
  profile: PlayerProfileResponse | null;
  theme: string;
  onCardClick: () => void;
};

function RankSummaryPage2({ profile, theme, onCardClick }: RankSummaryPage2Props) {
  const winRate = profile?.recentWinRate ?? 0;
  const kd = profile?.recentKd ?? 0;
  
  // 무기 사용률 계산
  const totalWeapon = (profile?.recentAssault ?? 0) + (profile?.recentSniper ?? 0) + (profile?.recentSpecial ?? 0);
  const assaultRate = totalWeapon > 0 ? ((profile?.recentAssault ?? 0) / totalWeapon) * 100 : 0;
  const sniperRate = totalWeapon > 0 ? ((profile?.recentSniper ?? 0) / totalWeapon) * 100 : 0;
  const specialRate = totalWeapon > 0 ? ((profile?.recentSpecial ?? 0) / totalWeapon) * 100 : 0;

  return (
    <div
      className={clsx(
        "relative grid gap-3 rounded-2xl sm:rounded-3xl border-2 p-4 sm:p-5 shadow-2xl transition-all duration-300 cursor-pointer group",
        theme === "light"
          ? "border-slate-300 bg-white shadow-slate-300/40 hover:shadow-slate-400/50"
          : "border-slate-800/80 bg-slate-900/70 shadow-emerald-900/30 hover:shadow-emerald-900/50"
      )}
      onClick={onCardClick}
    >
      <div className={clsx("flex items-center justify-between text-xs")}>
        <span className={clsx(theme === "light" ? "text-slate-600" : "text-slate-400")}>전적 통계</span>
      </div>

      {/* 승률/K/D 시각화 */}
      <div className="grid gap-3 sm:grid-cols-2">
        <StatGaugeCardWithTrend
          label="최근 승률"
          value={winRate}
          max={100}
          suffix="%"
          theme={theme}
          color="emerald"
          previousValue={profile?.previousWinRate}
        />
        <StatGaugeCardWithTrend
          label="최근 K/D"
          value={kd}
          max={3}
          theme={theme}
          color="blue"
          previousValue={profile?.previousKd}
        />
      </div>

      {/* 무기별 통계 */}
      {totalWeapon > 0 && (
        <WeaponStatsCard
          assaultRate={assaultRate}
          sniperRate={sniperRate}
          specialRate={specialRate}
          theme={theme}
        />
      )}

      {totalWeapon === 0 && (
        <div className={clsx("rounded-xl border-2 p-4 text-center", theme === "light" ? "border-slate-200 bg-slate-50" : "border-slate-800 bg-slate-950/60")}>
          <p className={clsx("text-sm", theme === "light" ? "text-slate-500" : "text-slate-400")}>
            무기 사용 통계 데이터가 없습니다.
          </p>
        </div>
      )}
    </div>
  );
}

// 페이지 3: 매너등급, 신고 접수, 최근 강조 포인트
type RankSummaryPage3Props = {
  profile: PlayerProfileResponse | null;
  member: MemberResponse | null;
  isAuthed: boolean;
  mounted: boolean;
  theme: string;
  expandedDetails: boolean;
  setExpandedDetails: (expanded: boolean) => void;
  barracksReportCount: number | null;
  trollReportCount: number | null;
  onCardClick: () => void;
};

function RankSummaryPage3({
  profile,
  member,
  isAuthed,
  mounted,
  theme,
  expandedDetails,
  setExpandedDetails,
  barracksReportCount,
  trollReportCount,
  onCardClick,
}: RankSummaryPage3Props) {
  return (
    <div
      className={clsx(
        "relative grid gap-3 rounded-2xl sm:rounded-3xl border-2 p-4 sm:p-5 shadow-2xl transition-all duration-300 cursor-pointer group",
        theme === "light"
          ? "border-slate-300 bg-white shadow-slate-300/40 hover:shadow-slate-400/50"
          : "border-slate-800/80 bg-slate-900/70 shadow-emerald-900/30 hover:shadow-emerald-900/50"
      )}
      onClick={onCardClick}
    >
      <div className={clsx("flex items-center justify-between text-xs")}>
        <span className={clsx(theme === "light" ? "text-slate-600" : "text-slate-400")}>활동 정보</span>
      </div>

      {/* 매너등급 */}
      <div className="grid gap-3">
        <EnhancedInfoItem
          label="매너등급"
          value={profile?.mannerGrade || "정보 없음"}
          loading={false}
          theme={theme}
        />
      </div>

      {/* 신고 접수 건수 */}
      {mounted && isAuthed && (barracksReportCount !== null || trollReportCount !== null) && (
        <div className="space-y-2">
          <div
            className={clsx(
              "block rounded-xl border-2 p-3 transition-all",
              barracksReportCount !== null && barracksReportCount > 0
                ? theme === "light"
                  ? "border-red-300 bg-red-50 hover:border-red-400 hover:scale-[1.02] cursor-pointer"
                  : "border-red-500/40 bg-red-500/10 hover:border-red-500/60 hover:scale-[1.02] cursor-pointer"
                : theme === "light"
                ? "border-slate-300 bg-slate-50"
                : "border-slate-700 bg-slate-950/60"
            )}
            onClick={
              barracksReportCount !== null && barracksReportCount > 0
                ? (e) => {
                    e.stopPropagation();
                    window.location.href = "/suddenattack/barracks-report";
                  }
                : undefined
            }
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={clsx("text-xs font-semibold mb-1", theme === "light" ? "text-slate-600" : "text-slate-400")}>
                  병영제보 접수
                </p>
                <p
                  className={clsx(
                    "text-lg font-bold",
                    barracksReportCount !== null && barracksReportCount > 0
                      ? theme === "light"
                        ? "text-red-700"
                        : "text-red-300"
                      : theme === "light"
                      ? "text-slate-500"
                      : "text-slate-500"
                  )}
                >
                  {barracksReportCount !== null && barracksReportCount > 0 ? `${barracksReportCount}건` : "-"}
                </p>
              </div>
              {barracksReportCount !== null && barracksReportCount > 0 && (
                <ArrowTopRightOnSquareIcon className={clsx("h-5 w-5", theme === "light" ? "text-red-600" : "text-red-400")} />
              )}
            </div>
          </div>
          <div
            className={clsx(
              "block rounded-xl border-2 p-3 transition-all",
              trollReportCount !== null && trollReportCount > 0
                ? theme === "light"
                  ? "border-orange-300 bg-orange-50 hover:border-orange-400 hover:scale-[1.02] cursor-pointer"
                  : "border-orange-500/40 bg-orange-500/10 hover:border-orange-500/60 hover:scale-[1.02] cursor-pointer"
                : theme === "light"
                ? "border-slate-300 bg-slate-50"
                : "border-slate-700 bg-slate-950/60"
            )}
            onClick={
              trollReportCount !== null && trollReportCount > 0
                ? (e) => {
                    e.stopPropagation();
                    window.location.href = "/suddenattack/suspicious";
                  }
                : undefined
            }
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={clsx("text-xs font-semibold mb-1", theme === "light" ? "text-slate-600" : "text-slate-400")}>
                  이상탐지 접수
                </p>
                <p
                  className={clsx(
                    "text-lg font-bold",
                    trollReportCount !== null && trollReportCount > 0
                      ? theme === "light"
                        ? "text-orange-700"
                        : "text-orange-300"
                      : theme === "light"
                      ? "text-slate-500"
                      : "text-slate-500"
                  )}
                >
                  {trollReportCount !== null && trollReportCount > 0 ? `${trollReportCount}건` : "-"}
                </p>
              </div>
              {trollReportCount !== null && trollReportCount > 0 && (
                <ArrowTopRightOnSquareIcon className={clsx("h-5 w-5", theme === "light" ? "text-orange-600" : "text-orange-400")} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* 최근 강조 포인트 */}
      <div
        className={clsx(
          "rounded-xl border-2 p-4",
          theme === "light" ? "border-slate-200 bg-slate-50" : "border-slate-800 bg-slate-950/60"
        )}
      >
        <div className="flex items-center justify-between mb-2">
          <p className={clsx("text-xs font-semibold", theme === "light" ? "text-slate-600" : "text-slate-400")}>
            최근 강조 포인트
          </p>
          {mounted && isAuthed && profile && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpandedDetails(!expandedDetails);
              }}
              className={clsx(
                "p-1 rounded transition-all",
                theme === "light" ? "hover:bg-slate-200 text-slate-600" : "hover:bg-slate-800 text-slate-400"
              )}
            >
              {expandedDetails ? (
                <ChevronUpIcon className="h-4 w-4" />
              ) : (
                <ChevronDownIcon className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
        <p className={clsx("text-sm", theme === "light" ? "text-slate-800" : "text-slate-200")}>
          {mounted && isAuthed && profile
            ? `${profile.userName || member?.nickname || "게이머"}님, 전적과 커뮤니티 활동 정보를 한눈에 모았어요.`
            : "실시간 전적 데이터와 커뮤니티 활동을 통해 더 나은 게임 경험을 제공합니다."}
        </p>
        {profile?.titleName && (
          <p className={clsx("mt-2 text-xs", theme === "light" ? "text-blue-700" : "text-emerald-300")}>
            대표 칭호: {profile.titleName}
          </p>
        )}
        {expandedDetails && profile && (
          <div className="mt-3 space-y-2 pt-3 border-t border-slate-800">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className={clsx(theme === "light" ? "text-slate-600" : "text-slate-400")}>솔로 티어: </span>
                <span className={clsx(theme === "light" ? "text-blue-700" : "text-emerald-300")}>
                  {profile.soloTier} ({profile.soloScore?.toLocaleString()}점)
                </span>
              </div>
              <div>
                <span className={clsx(theme === "light" ? "text-slate-600" : "text-slate-400")}>파티 티어: </span>
                <span className={clsx(theme === "light" ? "text-blue-700" : "text-emerald-300")}>
                  {profile.partyTier} ({profile.partyScore?.toLocaleString()}점)
                </span>
              </div>
            </div>
            {mounted && isAuthed && (profile.userName || member?.nickname) && (
              <Link
                href={`/profile/${encodeURIComponent(profile.userName || member?.nickname || "")}`}
                onClick={(e) => e.stopPropagation()}
                className={clsx(
                  "inline-flex items-center gap-1 text-xs font-semibold mt-2 transition-all",
                  theme === "light"
                    ? "text-blue-600 hover:text-blue-700"
                    : "text-emerald-400 hover:text-emerald-300"
                )}
              >
                상세 정보 보기
                <ArrowTopRightOnSquareIcon className="h-3 w-3" />
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// 스켈레톤 UI
function RankSummarySkeleton({ theme }: { theme: string }) {
  return (
    <div
      className={clsx(
        "relative grid gap-3 rounded-2xl sm:rounded-3xl border-2 p-4 sm:p-5 shadow-2xl animate-pulse",
        theme === "light"
          ? "border-slate-300 bg-white"
          : "border-slate-800/80 bg-slate-900/70"
      )}
    >
      <div className="h-4 w-32 bg-slate-300 rounded" />
      <div className="grid gap-3 sm:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={clsx("h-20 rounded-xl", theme === "light" ? "bg-slate-100" : "bg-slate-800")} />
        ))}
      </div>
      <div className={clsx("h-32 rounded-xl", theme === "light" ? "bg-slate-100" : "bg-slate-800")} />
    </div>
  );
}

// 향상된 InfoItem 컴포넌트
type EnhancedInfoItemProps = {
  label: string;
  value: string;
  subValue?: string;
  loading?: boolean;
  theme: string;
};

function EnhancedInfoItem({ label, value, subValue, loading, theme }: EnhancedInfoItemProps) {
  return (
    <div
      className={clsx(
        "rounded-xl border-2 p-4 min-h-[80px] flex flex-col justify-between transition-all duration-300",
        theme === "light" ? "border-slate-200 bg-slate-50" : "border-slate-800 bg-slate-950/60"
      )}
    >
      <p className={clsx("text-[10px] uppercase tracking-wide mb-2", theme === "light" ? "text-slate-600" : "text-slate-400")}>
        {label}
      </p>
      {loading ? (
        <div className={clsx("h-6 w-24 rounded bg-slate-300 animate-pulse", theme === "light" ? "bg-slate-300" : "bg-slate-700")} />
      ) : (
        <>
          <p className={clsx("text-xl font-semibold leading-tight break-words", theme === "light" ? "text-blue-700" : "text-emerald-200")}>
            {value}
          </p>
          {subValue && (
            <p className={clsx("text-xs mt-1", theme === "light" ? "text-slate-500" : "text-slate-400")}>{subValue}</p>
          )}
        </>
      )}
    </div>
  );
}

// 통계 게이지 카드
type StatGaugeCardProps = {
  label: string;
  value: number;
  max: number;
  suffix?: string;
  theme: string;
  color: "emerald" | "blue" | "purple";
};

function StatGaugeCard({ label, value, max, suffix = "", theme, color }: StatGaugeCardProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const colorClasses = {
    emerald: theme === "light" ? "bg-emerald-500" : "bg-emerald-400",
    blue: theme === "light" ? "bg-blue-500" : "bg-blue-400",
    purple: theme === "light" ? "bg-purple-500" : "bg-purple-400",
  };

  return (
    <div
      className={clsx(
        "rounded-xl border-2 p-4",
        theme === "light" ? "border-slate-200 bg-slate-50" : "border-slate-800 bg-slate-950/60"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <p className={clsx("text-[10px] uppercase tracking-wide", theme === "light" ? "text-slate-600" : "text-slate-400")}>
          {label}
        </p>
        <p className={clsx("text-lg font-bold", theme === "light" ? "text-blue-700" : "text-emerald-300")}>
          {value.toFixed(2)}{suffix}
        </p>
      </div>
      <div className={clsx("h-2 w-full rounded-full overflow-hidden", theme === "light" ? "bg-slate-200" : "bg-slate-800")}>
        <div
          className={clsx("h-full transition-all duration-1000 ease-out", colorClasses[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// 전일 대비 증감이 표시되는 StatGaugeCard
type StatGaugeCardWithTrendProps = {
  label: string;
  value: number;
  max: number;
  suffix?: string;
  theme: string;
  color: "emerald" | "blue" | "purple";
  previousValue?: number | null;
};

function StatGaugeCardWithTrend({ label, value, max, suffix = "", theme, color, previousValue }: StatGaugeCardWithTrendProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const colorClasses = {
    emerald: theme === "light" ? "bg-emerald-500" : "bg-emerald-400",
    blue: theme === "light" ? "bg-blue-500" : "bg-blue-400",
    purple: theme === "light" ? "bg-purple-500" : "bg-purple-400",
  };

  const diff = previousValue !== null && previousValue !== undefined ? value - previousValue : null;
  const diffPercent = diff !== null && previousValue !== null && previousValue !== undefined && previousValue !== 0 ? ((diff / previousValue) * 100) : null;
  const isPositive = diff !== null ? diff > 0 : null;
  const isNegative = diff !== null ? diff < 0 : null;

  return (
    <div
      className={clsx(
        "rounded-xl border-2 p-4",
        theme === "light" ? "border-slate-200 bg-slate-50" : "border-slate-800 bg-slate-950/60"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <p className={clsx("text-[10px] uppercase tracking-wide", theme === "light" ? "text-slate-600" : "text-slate-400")}>
          {label}
        </p>
        <div className="flex items-center gap-2">
          {diff !== null && (
            <div className={clsx(
              "flex items-center gap-1 text-xs font-semibold",
              isPositive 
                ? theme === "light" ? "text-green-600" : "text-green-400"
                : isNegative
                ? theme === "light" ? "text-red-600" : "text-red-400"
                : theme === "light" ? "text-slate-500" : "text-slate-400"
            )}>
              {isPositive ? (
                <ArrowTrendingUpIcon className="h-3 w-3" />
              ) : isNegative ? (
                <ArrowTrendingDownIcon className="h-3 w-3" />
              ) : null}
              {diff > 0 ? "+" : ""}{diff.toFixed(2)}{suffix}
            </div>
          )}
          <p className={clsx("text-lg font-bold", theme === "light" ? "text-blue-700" : "text-emerald-300")}>
            {value.toFixed(2)}{suffix}
          </p>
        </div>
      </div>
      <div className={clsx("h-2 w-full rounded-full overflow-hidden", theme === "light" ? "bg-slate-200" : "bg-slate-800")}>
        <div
          className={clsx("h-full transition-all duration-1000 ease-out", colorClasses[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// 무기 통계 카드
type WeaponStatsCardProps = {
  assaultRate: number;
  sniperRate: number;
  specialRate: number;
  theme: string;
};

function WeaponStatsCard({ assaultRate, sniperRate, specialRate, theme }: WeaponStatsCardProps) {
  return (
    <div
      className={clsx(
        "rounded-xl border-2 p-4",
        theme === "light" ? "border-slate-200 bg-slate-50" : "border-slate-800 bg-slate-950/60"
      )}
    >
      <p className={clsx("text-[10px] uppercase tracking-wide mb-3", theme === "light" ? "text-slate-600" : "text-slate-400")}>
        무기 사용률
      </p>
      <div className="space-y-2">
        <WeaponBar label="돌격소총" value={assaultRate} color="red" theme={theme} />
        <WeaponBar label="저격소총" value={sniperRate} color="blue" theme={theme} />
        <WeaponBar label="특수무기" value={specialRate} color="green" theme={theme} />
      </div>
    </div>
  );
}

function WeaponBar({ label, value, color, theme }: { label: string; value: number; color: string; theme: string }) {
  const colorClasses = {
    red: "bg-red-500",
    blue: "bg-blue-500",
    green: "bg-green-500",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className={clsx("text-xs", theme === "light" ? "text-slate-700" : "text-slate-300")}>{label}</span>
        <span className={clsx("text-xs font-semibold", theme === "light" ? "text-slate-600" : "text-slate-400")}>
          {value.toFixed(1)}%
        </span>
      </div>
      <div className={clsx("h-2 w-full rounded-full overflow-hidden", theme === "light" ? "bg-slate-200" : "bg-slate-800")}>
        <div className={clsx("h-full transition-all duration-1000 ease-out", colorClasses[color as keyof typeof colorClasses])} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

// ImageStatCard 타입 정의
type ImageStatCardProps = {
  label: string;
  value: string;
  subValue?: string;
  imageUrl?: string;
  hideText?: boolean;
  customContent?: React.ReactNode;
  theme: string;
};

// ImageStatCard 컴포넌트
function ImageStatCard({ label, value, subValue, imageUrl, hideText = false, customContent, theme }: ImageStatCardProps) {
  return (
    <div
      className={clsx(
        "rounded-xl border-2 p-3 flex items-center gap-4 min-h-[82px]",
        theme === "light" ? "border-slate-200 bg-slate-50" : "border-slate-800 bg-slate-950/60"
      )}
    >
      <div className="flex-shrink-0 w-[64px] h-[64px] overflow-hidden rounded-xl border border-slate-700/40 bg-slate-900/50 flex items-center justify-center">
        {imageUrl ? (
          <img src={imageUrl} alt={label} className="h-full w-full object-contain p-1.5" />
        ) : (
          <div className={clsx("flex h-full w-full items-center justify-center text-[10px]", theme === "light" ? "text-slate-500 bg-slate-100" : "text-slate-400 bg-slate-800")}>
            이미지 없음
          </div>
        )}
      </div>
      <div className="flex-1 flex flex-col justify-center min-w-0">
        {customContent ? (
          customContent
        ) : hideText ? null : (
          <>
            <p className={clsx("text-[11px] uppercase tracking-wide mb-1 whitespace-nowrap", theme === "light" ? "text-slate-600" : "text-slate-400")}>
              {label}
            </p>
            <p className={clsx("text-base sm:text-lg font-semibold leading-tight truncate", theme === "light" ? "text-slate-900" : "text-emerald-100")}>
              {value}
            </p>
            {subValue && (
              <p className={clsx("text-xs mt-0.5", theme === "light" ? "text-slate-500" : "text-slate-400")}>{subValue}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
