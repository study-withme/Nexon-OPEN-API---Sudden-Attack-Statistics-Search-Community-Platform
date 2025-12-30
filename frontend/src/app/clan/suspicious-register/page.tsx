"use client";

import { useState } from "react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

interface SuspiciousPost {
  id: number;
  title: string;
  content: string;
  author: string;
  barracksAddress?: string;
  reason?: string;
  registrar?: string;
  createdAt?: string;
}

export default function ClanSuspiciousRegisterPage() {
  const [posts, setPosts] = useState<SuspiciousPost[]>([]);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="card p-6 sm:p-8 border-amber-500/30">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
            <h1 className="text-3xl font-semibold text-amber-200">이상병영 등록</h1>
          </div>
          <p className="text-sm text-slate-400">
            이상병영을 등록하는 페이지입니다. (클랜 마스터 전용)
          </p>
        </div>

        <div className="mb-6">
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 mb-4">
            <h3 className="text-lg font-semibold text-amber-200 mb-4">이상병영 등록</h3>
            <form className="space-y-3">
              <div>
                <label className="block text-sm text-slate-300 mb-1">병영주소</label>
                <input
                  type="text"
                  placeholder="병영주소를 입력하세요"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all duration-300"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">사유</label>
                <textarea
                  placeholder="이상병영 사유를 입력하세요"
                  rows={4}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all duration-300"
                />
              </div>
              <button
                type="submit"
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-400 transition-all duration-300"
              >
                등록하기
              </button>
            </form>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-slate-400">
            총 <span className="text-amber-300 font-semibold">{posts.length}</span>개의 등록된 이상병영
          </div>
        </div>

        <div className="space-y-3">
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400">아직 등록된 이상병영이 없습니다.</p>
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
                      <h3 className="text-lg font-semibold text-red-300">{post.barracksAddress}</h3>
                    </div>
                    <p className="text-sm text-slate-300 mb-2">{post.reason}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span>등록자: {post.registrar}</span>
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
