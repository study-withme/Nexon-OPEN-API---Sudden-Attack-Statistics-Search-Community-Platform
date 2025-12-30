"use client";

import { memo, useCallback } from "react";
import Link from "next/link";
import {
  MegaphoneIcon,
  XMarkIcon,
  UserIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { clsx } from "clsx";
import { CommunityPost } from "@/lib/community";
import { formatNumber, formatDateShort } from "@/lib/utils/formatUtils";
import { useTheme } from "@/hooks/useTheme";

type Props = {
  notices: CommunityPost[];
  selectedTab: string;
  category: string;
  onHideNotice: (postId: number) => void;
  isAuthorAdmin: (post: CommunityPost) => boolean;
};

export const NoticeSection = memo(function NoticeSection({
  notices,
  selectedTab,
  category,
  onHideNotice,
  isAuthorAdmin,
}: Props) {
  const { theme } = useTheme();

  if (notices.length === 0) return null;

  return (
    <div
      className={clsx(
        "board-card border-2 overflow-hidden",
        theme === "light"
          ? "bg-amber-50/50 border-amber-300"
          : "bg-amber-500/10 border-amber-500/40"
      )}
    >
      <div
        className={clsx(
          "flex items-center justify-between px-4 py-3 border-b-2",
          theme === "light"
            ? "bg-amber-100 border-amber-200"
            : "bg-amber-500/20 border-amber-500/30"
        )}
      >
        <div className="flex items-center gap-2">
          <MegaphoneIcon
            className={clsx(
              "h-5 w-5",
              theme === "light" ? "text-amber-700" : "text-amber-300"
            )}
          />
          <h3
            className={clsx(
              "text-base font-bold",
              theme === "light" ? "text-amber-900" : "text-amber-200"
            )}
          >
            게시판 공지
          </h3>
        </div>
      </div>
      <div className="divide-y divide-slate-800/50">
        {notices.map((notice) => (
          <div
            key={notice.id}
            className={clsx(
              "relative p-4 hover:bg-opacity-80 transition-all duration-300",
              theme === "light"
                ? "bg-white hover:bg-amber-50"
                : "bg-slate-950/70 hover:bg-amber-500/5"
            )}
          >
            <button
              onClick={() => onHideNotice(notice.id)}
              className={clsx(
                "absolute top-3 right-3 p-1.5 rounded-lg transition-all duration-300 hover:scale-110",
                theme === "light"
                  ? "hover:bg-amber-100 text-amber-600"
                  : "hover:bg-amber-500/20 text-amber-400"
              )}
              title="공지 숨기기"
              aria-label="공지 숨기기"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
            <Link
              href={`/community/${notice.id}?category=${selectedTab || category}`}
              className="block pr-10"
            >
              <div className="flex items-start gap-3">
                <div
                  className={clsx(
                    "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
                    theme === "light" ? "bg-amber-100" : "bg-amber-500/20"
                  )}
                >
                  <MegaphoneIcon
                    className={clsx(
                      "h-5 w-5",
                      theme === "light" ? "text-amber-700" : "text-amber-300"
                    )}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={clsx(
                        "px-2 py-0.5 rounded text-[10px] font-semibold",
                        theme === "light"
                          ? "bg-amber-500 text-white"
                          : "bg-amber-500/30 text-amber-200"
                      )}
                    >
                      공지
                    </span>
                    <h4
                      className={clsx(
                        "font-semibold text-sm truncate",
                        theme === "light" ? "text-slate-900" : "text-emerald-100"
                      )}
                    >
                      {notice.title}
                    </h4>
                  </div>
                  <div className="flex items-center gap-3 text-xs mt-2">
                    <div className="flex items-center gap-1.5">
                      <UserIcon
                        className={clsx(
                          "h-3.5 w-3.5",
                          theme === "light" ? "text-slate-600" : "text-slate-400"
                        )}
                      />
                      {isAuthorAdmin(notice) ? (
                        <span
                          className={clsx(
                            "font-semibold inline-flex items-center gap-1",
                            theme === "light" ? "text-yellow-600" : "text-yellow-400"
                          )}
                        >
                          <span className="relative">{notice.author || "관리자"}</span>
                          <ShieldCheckIcon
                            className="h-3.5 w-3.5 text-yellow-400"
                            title="운영자"
                          />
                        </span>
                      ) : (
                        <span
                          className={clsx(
                            "font-semibold",
                            theme === "light" ? "text-amber-600" : "text-amber-300"
                          )}
                        >
                          {notice.author || "관리자"}
                        </span>
                      )}
                    </div>
                    <span
                      className={clsx(
                        theme === "light" ? "text-slate-500" : "text-slate-400"
                      )}
                    >
                      {formatDateShort(notice.createdAt)}
                    </span>
                    <span
                      className={clsx(
                        theme === "light" ? "text-slate-500" : "text-slate-400"
                      )}
                    >
                      조회 {formatNumber(notice.views ?? 0)}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
});
