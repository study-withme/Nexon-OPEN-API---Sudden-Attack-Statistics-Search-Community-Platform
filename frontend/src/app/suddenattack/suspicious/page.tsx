"use client";

import { useState, useEffect } from "react";
import { ExclamationTriangleIcon, InformationCircleIcon } from "@heroicons/react/24/solid";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { fetchMe } from "@/lib/auth";
import { fetchBarracksReports, type BarracksReport } from "@/lib/barracks";
import Link from "next/link";
import { clsx } from "clsx";

export default function SuspiciousPage() {
  const { theme } = useTheme();
  const { isAuthed } = useAuth();
  const [posts, setPosts] = useState<BarracksReport[]>([]);
  const [myReportCount, setMyReportCount] = useState<number | null>(null);

  // 내가 접수된 신고 수 조회 (이상탐지도 barracks 신고와 동일한 테이블 사용)
  useEffect(() => {
    if (!isAuthed) {
      setMyReportCount(null);
      return;
    }
    const loadMyReports = async () => {
      try {
        const member = await fetchMe();
        if (member?.nickname) {
          const allReports = await fetchBarracksReports();
          const reportedMe = allReports.filter(
            (r) => r.targetNickname?.toLowerCase() === member.nickname.toLowerCase() &&
                   r.reportType === "troll"
          );
          setMyReportCount(reportedMe.length);
        }
      } catch {
        // ignore errors
      }
    };
    loadMyReports();
  }, [isAuthed]);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
      {/* 내가 접수된 신고 알림 */}
      {isAuthed && myReportCount !== null && myReportCount > 0 && (
        <div
          className={clsx(
            "mb-6 rounded-xl border-2 p-4 flex items-center justify-between",
            theme === "light"
              ? "border-red-300 bg-red-50"
              : "border-red-500/40 bg-red-500/10"
          )}
        >
          <div className="flex items-center gap-3">
            <InformationCircleIcon className={clsx(
              "h-5 w-5",
              theme === "light" ? "text-red-600" : "text-red-400"
            )} />
            <div>
              <p className={clsx(
                "text-sm font-semibold",
                theme === "light" ? "text-red-900" : "text-red-200"
              )}>
                접수된 신고 {myReportCount}건
              </p>
              <p className={clsx(
                "text-xs mt-0.5",
                theme === "light" ? "text-red-700" : "text-red-300"
              )}>
                내가 신고당한 내용을 확인하세요
              </p>
            </div>
          </div>
          <Link
            href="/suddenattack/barracks-report"
            className={clsx(
              "px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300",
              theme === "light"
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-red-500/80 text-white hover:bg-red-500"
            )}
          >
            바로가기
          </Link>
        </div>
      )}
      
      <div className="card p-6 sm:p-8 border-red-500/30">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
            <h1 className="text-3xl font-semibold text-red-400">이상탐지</h1>
          </div>
          <p className="text-sm text-slate-400">
            과거 핵 사용자나 의심스러운 행동을 한 유저들의 병영주소를 등록하는 게시판입니다.
          </p>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-slate-400">
            총 <span className="text-red-400 font-semibold">{posts.length}</span>개의 게시글
          </div>
          <button className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-400 transition-all duration-300">
            글쓰기
          </button>
        </div>

        <div className="space-y-3">
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400">아직 등록된 게시글이 없습니다.</p>
            </div>
          ) : (
            posts.map((post) => (
              <div
                key={post.id}
                className="rounded-xl border border-red-500/30 bg-red-950/20 p-4 hover:border-red-500/50 transition-all duration-300"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                      <h3 className="text-lg font-semibold text-red-300">{post.title}</h3>
                    </div>
                    <p className="text-sm text-slate-300 mb-2">{post.content}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span>작성자: {post.author}</span>
                      <span>{post.createdAt}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
