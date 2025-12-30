"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowPathIcon,
  ChatBubbleBottomCenterTextIcon,
  ClockIcon,
  EyeIcon,
  MegaphoneIcon,
  ShieldCheckIcon,
  SparklesIcon,
  StarIcon,
  BookmarkIcon,
} from "@heroicons/react/24/outline";
import { useTheme } from "@/hooks/useTheme";
import {
  CommunityPost,
  fetchPosts,
  getBookmarkedPostIds,
} from "@/lib/community";
import { useAuth } from "@/hooks/useAuth";
import { fetchMe, type MemberResponse } from "@/lib/auth";
import { normalizeApiError } from "@/lib/api";
import { emitToast } from "@/lib/toast";
import { formatNumber, formatDateShort, stripHtml } from "@/lib/utils/formatUtils";
import { PostCard } from "@/components/community/PostCard";
import { SortFilter } from "@/components/community/SortFilter";
import { SearchBar } from "@/components/community/SearchBar";
import { NoticeSection } from "@/components/community/NoticeSection";

type Props = {
  category: string;
  title: string;
  description: string;
  icon: ReactNode;
  accentClassName?: string;
};

const sortOptions = [
  { key: "recent", label: "최신" },
  { key: "comments", label: "댓글" },
  { key: "views", label: "조회" },
  { key: "likes", label: "공감" },
];

const categoryTabs = [
  { key: "popular", label: "인기" },
  { key: "free", label: "자유" },
  { key: "ranked", label: "랭크전" },
  { key: "custom", label: "대룰" },
  { key: "supply", label: "보급" },
  { key: "duo", label: "듀오" },
];

export default function CommunityListPage({
  category,
  title,
  description,
  icon,
  accentClassName = "text-emerald-400",
}: Props) {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<string>("recent");
  const [selectedTab, setSelectedTab] = useState<string>(category.toLowerCase());
  const [search, setSearch] = useState("");
  const { isAuthed } = useAuth();
  const [currentUser, setCurrentUser] = useState<MemberResponse | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const { theme } = useTheme();
  const [noticesHidden, setNoticesHidden] = useState<Set<number>>(new Set());
  const normalizedInitialCategory = category.toLowerCase();
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<number>>(new Set());
  const [showOnlyBookmarked, setShowOnlyBookmarked] = useState(false);

  // 사용자 정보 로드 (에러 처리 개선)
  useEffect(() => {
    if (isAuthed) {
      fetchMe()
        .then((user) => {
          setCurrentUser(user);
          setUserLoading(false);
        })
        .catch((err) => {
          const error = normalizeApiError(err);
          console.error("사용자 정보 로드 실패:", error);
          emitToast({
            type: "error",
            message: "사용자 정보를 불러오는 중 오류가 발생했습니다.",
          });
          setUserLoading(false);
        });
    } else {
      setUserLoading(false);
    }
  }, [isAuthed]);

  // 즐겨찾기(북마크) 초기 로드
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      setBookmarkedIds(getBookmarkedPostIds());
    } catch (err) {
      console.error("즐겨찾기 로드 실패:", err);
    }
  }, []);

  // localStorage에서 숨김 처리된 공지 불러오기 (에러 처리 개선)
  useEffect(() => {
    try {
      const hidden = localStorage.getItem(`notices-hidden-${selectedTab || category}`);
      if (hidden) {
        const hiddenIds = JSON.parse(hidden);
        setNoticesHidden(new Set(hiddenIds));
      }
    } catch (err) {
      console.error("공지 숨김 정보 로드 실패:", err);
      setNoticesHidden(new Set());
    }
  }, [selectedTab, category]);

  const isAdmin = useMemo(
    () => currentUser?.admin === true || currentUser?.roles?.includes("ADMIN") || false,
    [currentUser]
  );
  const isNoticeCategory = useMemo(
    () => selectedTab === "notice" || category === "notice",
    [selectedTab, category]
  );
  const showWriteButton = useMemo(
    () => !isNoticeCategory || isAdmin,
    [isNoticeCategory, isAdmin]
  );

  const effectiveCategoryForFetch = useCallback(
    (tab: string) => {
      const key = tab.toLowerCase();
      return key === "popular" ? undefined : { category: key };
    },
    []
  );

  // 공지 게시글 필터링
  const noticePosts = useMemo(() => {
    const normalizedCategory = (selectedTab || category).toLowerCase();
    const notices = posts
      .filter((post) => {
        const matchesCategory =
          normalizedCategory === "popular"
            ? true
            : post.category?.toLowerCase() === normalizedCategory;
        return post.notice && matchesCategory && !noticesHidden.has(post.id);
      })
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 5);
    return notices;
  }, [posts, selectedTab, category, noticesHidden]);

  const handleHideNotice = useCallback(
    (postId: number) => {
      try {
        const newHidden = new Set(noticesHidden);
        newHidden.add(postId);
        setNoticesHidden(newHidden);
        localStorage.setItem(
          `notices-hidden-${selectedTab || category}`,
          JSON.stringify(Array.from(newHidden))
        );
      } catch (err) {
        console.error("공지 숨김 저장 실패:", err);
        emitToast({
          type: "error",
          message: "공지 숨김 설정을 저장하는 중 오류가 발생했습니다.",
        });
      }
    },
    [noticesHidden, selectedTab, category]
  );

  // 게시글 로드 (에러 처리 개선)
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchPosts(
          effectiveCategoryForFetch(selectedTab || normalizedInitialCategory)
        );
        if (!mounted) return;
        setPosts(data);
      } catch (err) {
        if (!mounted) return;
        const error = normalizeApiError(err);
        const errorMessage = error.message || "게시글을 불러오지 못했습니다.";
        setError(errorMessage);
        emitToast({
          type: "error",
          message: errorMessage,
        });
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [category, selectedTab, normalizedInitialCategory, effectiveCategoryForFetch]);

  const filteredPosts = useMemo(() => {
    const normalizedCategory = (selectedTab || category).toLowerCase();
    let base =
      normalizedCategory === "popular"
        ? [...posts]
        : posts.filter((post) => post.category?.toLowerCase() === normalizedCategory);

    // 공지 게시글은 제외 (상단에 별도 표시)
    base = base.filter((post) => !post.notice || noticesHidden.has(post.id));

    base = base.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      switch (sortKey) {
        case "views":
          return (b.views ?? 0) - (a.views ?? 0);
        case "likes":
          return (b.likes ?? 0) - (a.likes ?? 0);
        case "comments":
          return (b.commentCount ?? 0) - (a.commentCount ?? 0);
        case "recent":
        default:
          return Number(b.pinned) - Number(a.pinned) || dateB - dateA;
      }
    });

    // 즐겨찾기 필터
    if (showOnlyBookmarked && bookmarkedIds.size > 0) {
      base = base.filter((post) => bookmarkedIds.has(post.id));
    } else if (showOnlyBookmarked && bookmarkedIds.size === 0) {
      base = [];
    }

    const query = search.trim().toLowerCase();
    if (query) {
      base = base.filter(
        (post) =>
          post.title?.toLowerCase().includes(query) ||
          stripHtml(post.content || "").toLowerCase().includes(query) ||
          post.author?.toLowerCase().includes(query)
      );
    }
    return base;
  }, [
    category,
    posts,
    selectedTab,
    sortKey,
    search,
    noticesHidden,
    showOnlyBookmarked,
    bookmarkedIds,
  ]);

  const weeklyByComments = useMemo(() => {
    return [...posts]
      .filter((p) => p.commentCount)
      .sort((a, b) => (b.commentCount ?? 0) - (a.commentCount ?? 0))
      .slice(0, 6);
  }, [posts]);

  const weeklyByViews = useMemo(() => {
    return [...posts]
      .filter((p) => p.views)
      .sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
      .slice(0, 6);
  }, [posts]);

  const dailyHot = useMemo(() => {
    return [...posts]
      .filter((p) => p.createdAt)
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 6);
  }, [posts]);

  const certified = useMemo(() => {
    return [...posts]
      .filter((p) => p.notice || p.pinned || (p.likes ?? 0) >= 10)
      .sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0))
      .slice(0, 6);
  }, [posts]);

  const skeletons = Array.from({ length: 8 }, (_, i) => i);
  const visiblePosts = filteredPosts.slice(0, 30);

  // 관리자 여부 확인
  const isAuthorAdmin = useCallback(
    (post: CommunityPost) => {
      return post.authorIsAdmin === true;
    },
    []
  );

  // 핸들러들 (useCallback으로 메모이제이션)
  const handleSortChange = useCallback((key: string) => {
    setSortKey(key);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
  }, []);

  const handleTabChange = useCallback((tab: string) => {
    setSelectedTab(tab);
  }, []);

  const handleRefresh = useCallback(async () => {
    setSortKey("recent");
    setError(null);
    setLoading(true);
    try {
      const data = await fetchPosts(
        effectiveCategoryForFetch(selectedTab || normalizedInitialCategory)
      );
      setPosts(data);
    } catch (err) {
      const error = normalizeApiError(err);
      const errorMessage = error.message || "게시글을 불러오지 못했습니다.";
      setError(errorMessage);
      emitToast({
        type: "error",
        message: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  }, [selectedTab, normalizedInitialCategory, effectiveCategoryForFetch]);

  const handleBookmarkToggle = useCallback(() => {
    setShowOnlyBookmarked((prev) => !prev);
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-3 sm:px-4 lg:px-6 py-8 space-y-6">
      <NoticeSection
        notices={noticePosts}
        selectedTab={selectedTab}
        category={category}
        onHideNotice={handleHideNotice}
        isAuthorAdmin={isAuthorAdmin}
      />

      <div className="relative overflow-hidden board-shell">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/15 via-slate-900/50 to-indigo-500/15 pointer-events-none" />
        <div className="relative flex flex-col gap-6 p-5 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900/70 border border-slate-800 text-xl shadow-inner">
                <span className={accentClassName}>{icon}</span>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-semibold text-emerald-100 leading-tight">
                  {title}
                </h1>
                <p className="text-sm text-slate-400">{description}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleRefresh}
                className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs sm:text-sm text-slate-200 hover:border-emerald-500/60 hover:text-emerald-200 transition-colors board-focus-ring"
                aria-label="게시글 새로고침"
              >
                <ArrowPathIcon className="h-4 w-4" />
                새로고침
              </button>
              {showWriteButton && (
                <Link
                  href={`/community/write?category=${selectedTab || category}`}
                  className={`h-10 rounded-lg px-4 text-sm font-semibold shadow transition-colors inline-flex items-center justify-center board-focus-ring ${
                    isNoticeCategory
                      ? "bg-amber-500 text-slate-900 hover:bg-amber-400"
                      : "bg-emerald-500 text-slate-900 hover:bg-emerald-400"
                  }`}
                >
                  {isNoticeCategory ? "공지 작성" : "글쓰기"}
                </Link>
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-2">
            <div className="board-card bg-slate-950/80 border-slate-800 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-emerald-200">주간 화제 (댓글)</span>
                <ChatBubbleBottomCenterTextIcon className="h-4 w-4" />
              </div>
              <div className="space-y-2 text-sm text-slate-200">
                {weeklyByComments.map((p) => (
                  <Link
                    key={p.id}
                    href={`/community/${p.id}?category=${selectedTab || category}`}
                    className="flex items-center gap-2 truncate hover:text-emerald-200 transition-colors"
                  >
                    <span className="text-emerald-300 text-[12px]">[{p.category}]</span>
                    <span className="truncate">{p.title}</span>
                    <span className="text-[11px] text-emerald-200">
                      [{p.commentCount ?? 0}]
                    </span>
                  </Link>
                ))}
                {weeklyByComments.length === 0 && (
                  <p className="text-slate-500 text-xs">데이터 없음</p>
                )}
              </div>
            </div>
            <div className="board-card bg-slate-950/80 border-slate-800 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-emerald-200">주간 화제 (조회수)</span>
                <EyeIcon className="h-4 w-4" />
              </div>
              <div className="space-y-2 text-sm text-slate-200">
                {weeklyByViews.map((p) => (
                  <Link
                    key={p.id}
                    href={`/community/${p.id}?category=${selectedTab || category}`}
                    className="flex items-center gap-2 truncate hover:text-emerald-200 transition-colors"
                  >
                    <span className="text-emerald-300 text-[12px]">[{p.category}]</span>
                    <span className="truncate">{p.title}</span>
                    <span className="text-[11px] text-emerald-200">
                      [{formatNumber(p.views)}]
                    </span>
                  </Link>
                ))}
                {weeklyByViews.length === 0 && (
                  <p className="text-slate-500 text-xs">데이터 없음</p>
                )}
              </div>
            </div>
            <div className="board-card bg-slate-950/80 border-slate-800 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-emerald-200">일일 화제</span>
                <ClockIcon className="h-4 w-4" />
              </div>
              <div className="space-y-2 text-sm text-slate-200">
                {dailyHot.map((p) => (
                  <Link
                    key={p.id}
                    href={`/community/${p.id}?category=${selectedTab || category}`}
                    className="flex items-center gap-2 truncate hover:text-emerald-200 transition-colors"
                  >
                    <span className="text-emerald-300 text-[12px]">[{p.category}]</span>
                    <span className="truncate">{p.title}</span>
                    <span className="text-[11px] text-emerald-200">
                      {formatDateShort(p.createdAt)}
                    </span>
                  </Link>
                ))}
                {dailyHot.length === 0 && (
                  <p className="text-slate-500 text-xs">데이터 없음</p>
                )}
              </div>
            </div>
            <div className="board-card bg-slate-950/80 border-slate-800 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-emerald-200">인증 게시물 모음</span>
                <ShieldCheckIcon className="h-4 w-4" />
              </div>
              <div className="space-y-2 text-sm text-slate-200">
                {certified.map((p) => (
                  <Link
                    key={p.id}
                    href={`/community/${p.id}?category=${selectedTab || category}`}
                    className="flex items-center gap-2 truncate hover:text-emerald-200 transition-colors"
                  >
                    <StarIcon className="h-4 w-4 text-amber-300 shrink-0" />
                    <span className="truncate">{p.title}</span>
                    <span className="text-[11px] text-emerald-200">[{p.likes ?? 0}]</span>
                  </Link>
                ))}
                {certified.length === 0 && (
                  <p className="text-slate-500 text-xs">데이터 없음</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {categoryTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={`rounded-full border px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors board-focus-ring ${
                    selectedTab === tab.key
                      ? "border-emerald-500/80 bg-emerald-500/15 text-emerald-100 shadow-inner"
                      : "border-slate-800 bg-slate-900/60 text-slate-300 hover:border-emerald-500/40 hover:text-emerald-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="grid gap-2 md:grid-cols-[1fr,auto,auto] items-center">
              <SearchBar search={search} onSearchChange={handleSearchChange} />
              <SortFilter
                sortKey={sortKey}
                sortOptions={sortOptions}
                onSortChange={handleSortChange}
              />
              <div className="flex items-center gap-2 text-xs text-slate-400 justify-end">
                <span className="board-badge">
                  <SparklesIcon className="h-4 w-4 text-emerald-300" />
                  {loading ? "불러오는 중" : `${visiblePosts.length}개 표시`}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
              <div className="inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-slate-200">
                <MegaphoneIcon className="h-4 w-4 text-emerald-300" />
                <span>카테고리</span>
              </div>
              <button className="inline-flex items-center gap-1 rounded-md border border-amber-500/50 bg-amber-500/10 px-3 py-1 text-amber-100 board-focus-ring">
                <ShieldCheckIcon className="h-4 w-4" />
                인증글
              </button>
              <button className="inline-flex items-center gap-1 rounded-md border border-emerald-500/50 bg-emerald-500/10 px-3 py-1 text-emerald-100 board-focus-ring">
                <StarIcon className="h-4 w-4" />
                10추글
              </button>
              <button
                type="button"
                onClick={handleBookmarkToggle}
                className={`inline-flex items-center gap-1 rounded-md px-3 py-1 text-xs sm:text-sm board-focus-ring transition-colors ${
                  showOnlyBookmarked
                    ? "border-amber-400 bg-amber-500/20 text-amber-100"
                    : "border-blue-500/50 bg-blue-500/10 text-blue-100"
                }`}
              >
                <BookmarkIcon
                  className={`h-4 w-4 ${
                    showOnlyBookmarked ? "text-amber-200" : "text-blue-200"
                  }`}
                />
                {showOnlyBookmarked ? "즐겨찾기만 보기" : "즐겨찾기"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3" aria-live="polite">
        {loading && (
          <div className="board-card bg-slate-950/80 border-slate-800 overflow-hidden">
            <div className="grid grid-cols-[80px_1fr_80px_80px_120px_140px] items-center bg-slate-900/80 px-4 py-2 text-[11px] uppercase tracking-tight text-slate-400">
              <span className="text-center">번호</span>
              <span>제목</span>
              <span className="text-center">조회</span>
              <span className="text-center">추천</span>
              <span className="text-center">작성자</span>
              <span className="text-center">작성시간</span>
            </div>
            <div className="divide-y divide-slate-900/60 animate-pulse">
              {skeletons.map((i) => (
                <div
                  key={i}
                  className="grid grid-cols-[80px_1fr_80px_80px_120px_140px] items-center px-4 py-3 text-[13px] text-slate-100 bg-slate-950/60"
                >
                  <div className="h-4 w-8 rounded bg-slate-800 mx-auto" />
                  <div className="h-4 w-3/4 rounded bg-slate-800" />
                  <div className="h-4 w-10 rounded bg-slate-800 mx-auto" />
                  <div className="h-4 w-10 rounded bg-slate-800 mx-auto" />
                  <div className="h-4 w-20 rounded bg-slate-800 mx-auto" />
                  <div className="h-4 w-16 rounded bg-slate-800 mx-auto" />
                </div>
              ))}
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="board-card p-6 text-center text-red-300 border-red-700/50 bg-red-900/20">
            {error}
          </div>
        )}

        {!loading && !error && filteredPosts.length === 0 && (
          <div className="board-card p-8 text-center text-slate-400">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-800/70">
              <ShieldCheckIcon className="h-6 w-6 text-emerald-300" />
            </div>
            아직 등록된 게시글이 없습니다.
          </div>
        )}

        {!loading && !error && filteredPosts.length > 0 && (
          <div className="board-card bg-slate-950/80 border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between bg-slate-900/85 px-4 py-3 text-[12px] text-slate-200">
              <div className="flex items-center gap-2">
                <MegaphoneIcon className="h-4 w-4 text-emerald-300" />
                <span className="font-semibold">게시글 목록</span>
              </div>
              <span className="text-xs text-slate-400">{visiblePosts.length}건</span>
            </div>
            <div className="grid grid-cols-[80px_1fr_80px_80px_120px_140px] items-center bg-slate-900/80 px-4 py-2 text-[11px] uppercase tracking-tight text-slate-400">
              <span className="text-center">번호</span>
              <span>제목</span>
              <span className="text-center">조회</span>
              <span className="text-center">추천</span>
              <span className="text-center">작성자</span>
              <span className="text-center">작성시간</span>
            </div>
            <div className="divide-y divide-slate-900/60">
              {visiblePosts.map((post, idx) => (
                <PostCard
                  key={post.id}
                  post={post}
                  index={idx}
                  category={category}
                  selectedTab={selectedTab}
                  isAuthorAdmin={isAuthorAdmin}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
