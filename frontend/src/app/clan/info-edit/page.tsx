"use client";

import { useState } from "react";
import { PencilIcon } from "@heroicons/react/24/outline";

export default function ClanInfoEditPage() {
  const [formData, setFormData] = useState({
    clanName: "",
    description: "",
    contact: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: API 호출
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="card p-6 sm:p-8 border-amber-500/30">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <PencilIcon className="h-6 w-6 text-amber-400" />
            <h1 className="text-3xl font-semibold text-amber-200">정보수정</h1>
          </div>
          <p className="text-sm text-slate-400">클랜 정보를 수정하는 페이지입니다. (클랜 마스터 전용)</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-6">
            <h3 className="text-lg font-semibold text-amber-200 mb-4">클랜 정보</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1">클랜명</label>
                <input
                  type="text"
                  value={formData.clanName}
                  onChange={(e) => setFormData({ ...formData, clanName: e.target.value })}
                  placeholder="클랜명을 입력하세요"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all duration-300"
                />
              </div>
              
              <div>
                <label className="block text-sm text-slate-300 mb-1">설명</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="클랜 설명을 입력하세요"
                  rows={4}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all duration-300"
                />
              </div>
              
              <div>
                <label className="block text-sm text-slate-300 mb-1">연락처</label>
                <input
                  type="text"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  placeholder="연락처를 입력하세요"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all duration-300"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="rounded-lg bg-amber-500 px-6 py-2 text-sm font-semibold text-slate-900 hover:bg-amber-400 transition-all duration-300"
            >
              저장하기
            </button>
            <button
              type="button"
              className="rounded-lg border border-slate-700 px-6 py-2 text-sm text-slate-200 hover:bg-slate-800 transition-all duration-300"
            >
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
