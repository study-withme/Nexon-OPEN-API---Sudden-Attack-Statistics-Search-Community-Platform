"use client";

import { memo } from "react";
import Link from "next/link";
import { BookmarkIcon, PhotoIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import { clsx } from "clsx";
import { CommunityPost } from "@/lib/community";
import { isPostBookmarked } from "@/lib/community";
import { formatNumber, formatDateShort } from "@/lib/utils/formatUtils";
import { useTheme } from "@/hooks/useTheme";

type Props = {
  post: CommunityPost;
  index: number;
  category: string;
  selectedTab: string;
  isAuthorAdmin: (post: CommunityPost) => boolean;
};

export const PostCard = memo(function PostCard({
  post,
  index,
  category,
  selectedTab,
  isAuthorAdmin,
}: Props) {
  const { theme } = useTheme();
  const isNotice = post.notice;
  const rowBg = index % 2 === 0 ? "bg-slate-950/70" : "bg-slate-950/50";
  const hasImage = !!post.content && post.content.includes("<img");

  return (
    <Link
      href={`/community/${post.id}?category=${selectedTab || category}`}
      className={`grid grid-cols-[80px_1fr_80px_80px_120px_140px] items-center px-4 py-3 text-[13px] text-slate-100 hover:bg-slate-900/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${rowBg}`}
    >
      <div className="text-center text-[12px] text-slate-400 font-semibold">
        {isNotice ? "공지" : post.id}
      </div>
      <div className="flex items-center gap-2 min-w-0">
        {post.notice && (
          <span className="rounded-sm bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-200 shrink-0">
            공지
          </span>
        )}
        {post.pinned && (
          <span className="rounded-sm bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-blue-100 shrink-0">
            상단
          </span>
        )}
        {isPostBookmarked(post.id) && (
          <span className="inline-flex items-center gap-1 rounded-sm bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-200 shrink-0">
            <BookmarkIcon className="h-3 w-3" />
            즐겨찾기
          </span>
        )}
        <span className="truncate font-semibold text-emerald-50 text-[13px]">
          {post.title}
          {hasImage && (
            <PhotoIcon className="inline-block ml-1 h-3.5 w-3.5 text-sky-300 align-text-bottom" />
          )}
          {post.commentCount !== undefined && post.commentCount > 0 && (
            <span className="ml-2 inline-flex items-center gap-1 text-emerald-400 text-[11px] font-normal">
              {hasImage && <PhotoIcon className="h-3 w-3 text-sky-300" />}
              <span>[{post.commentCount}]</span>
            </span>
          )}
        </span>
      </div>
      <div className="text-center text-[12px] text-slate-200 font-semibold">
        {formatNumber(post.views ?? 0)}
      </div>
      <div className="text-center text-[12px] text-emerald-300 font-semibold">
        {formatNumber(post.likes ?? 0)}
      </div>
      <div className="text-center text-[12px] truncate">
        {isAuthorAdmin(post) ? (
          <span
            className={clsx(
              "font-semibold inline-flex items-center gap-1 relative justify-center",
              theme === "light" ? "text-yellow-600" : "text-yellow-400"
            )}
          >
            <span className="relative">{post.author || "관리자"}</span>
            <ShieldCheckIcon
              className="h-3.5 w-3.5 text-yellow-400 flex-shrink-0"
              title="운영자"
            />
          </span>
        ) : (
          <span className={clsx(theme === "light" ? "text-slate-700" : "text-slate-200")}>
            {post.author || "익명"}
          </span>
        )}
      </div>
      <div className="text-center text-[12px] text-slate-400">
        {formatDateShort(post.createdAt)}
      </div>
    </Link>
  );
});
