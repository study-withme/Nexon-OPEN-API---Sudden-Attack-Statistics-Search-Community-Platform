"use client";

import { useState } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState<"all" | "user" | "post" | "comment" | "report">("all");

  const handleSearch = () => {
    // 검색 로직
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">통합 검색</h1>
        <p className="text-slate-400 mt-1">회원, 게시글, 댓글, 신고 검색</p>
      </div>

      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <div className="flex space-x-4">
          <div className="flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="검색어를 입력하세요..."
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as "all" | "user" | "post" | "comment" | "report")}
              className="px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
            >
            <option value="all">전체</option>
            <option value="user">회원</option>
            <option value="post">게시글</option>
            <option value="comment">댓글</option>
            <option value="report">신고</option>
          </select>
          <button
            onClick={handleSearch}
            className="px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center space-x-2"
          >
            <MagnifyingGlassIcon className="w-5 h-5" />
            <span>검색</span>
          </button>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <h3 className="text-lg font-bold text-white mb-4">인기 검색어</h3>
        <div className="flex flex-wrap gap-2">
          {["랭크전", "대룰", "파티", "듀오", "보급"].map((keyword) => (
            <button
              key={keyword}
              onClick={() => setQuery(keyword)}
              className="px-3 py-1 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
            >
              {keyword}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
