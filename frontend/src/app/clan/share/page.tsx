"use client";

import { useState } from "react";
import { ShareIcon } from "@heroicons/react/24/outline";

interface SharePost {
  id: number;
  title: string;
  content: string;
  author: string;
  views?: number;
  createdAt?: string;
}

export default function ClanSharePage() {
  const [posts, setPosts] = useState<SharePost[]>([]);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="card p-6 sm:p-8 border-amber-500/30">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <ShareIcon className="h-6 w-6 text-amber-400" />
            <h1 className="text-3xl font-semibold text-amber-200">정보공유</h1>
          </div>
          <p className="text-sm text-slate-400">클랜 관련 정보를 공유하는 게시판입니다. (클랜 마스터 전용)</p>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-slate-400">
            총 <span className="text-amber-300 font-semibold">{posts.length}</span>개의 게시글
          </div>
          <button className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-amber-400 transition-all duration-300">
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
                className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 hover:border-amber-500/50 transition-all duration-300"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-amber-200 mb-2">{post.title}</h3>
                    <p className="text-sm text-slate-300 mb-2">{post.content}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span>작성자: {post.author}</span>
                      <span>{post.createdAt}</span>
                      <span>조회수: {post.views}</span>
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
