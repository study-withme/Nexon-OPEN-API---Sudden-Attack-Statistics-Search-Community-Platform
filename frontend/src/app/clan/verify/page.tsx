"use client";

import { useState } from "react";
import { ShieldCheckIcon } from "@heroicons/react/24/outline";

interface Verification {
  id: number;
  clanName: string;
  barracksAddress: string;
  status: string;
  createdAt?: string;
}

export default function ClanVerifyPage() {
  const [verifications, setVerifications] = useState<Verification[]>([]);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="card p-6 sm:p-8 border-amber-500/30">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheckIcon className="h-6 w-6 text-amber-400" />
            <h1 className="text-3xl font-semibold text-amber-200">병영검증</h1>
          </div>
          <p className="text-sm text-slate-400">병영주소를 검증하는 페이지입니다. (클랜 마스터 전용)</p>
        </div>

        <div className="mb-6">
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 mb-4">
            <h3 className="text-lg font-semibold text-amber-200 mb-2">검증 요청</h3>
            <form className="space-y-3">
              <div>
                <label className="block text-sm text-slate-300 mb-1">병영주소</label>
                <input
                  type="text"
                  placeholder="병영주소를 입력하세요"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all duration-300"
                />
              </div>
              <button
                type="submit"
                className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-amber-400 transition-all duration-300"
              >
                검증 요청
              </button>
            </form>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-slate-400">
            총 <span className="text-amber-300 font-semibold">{verifications.length}</span>개의 검증 요청
          </div>
        </div>

        <div className="space-y-3">
          {verifications.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400">아직 검증 요청이 없습니다.</p>
            </div>
          ) : (
            verifications.map((verification) => (
              <div
                key={verification.id}
                className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 hover:border-amber-500/50 transition-all duration-300"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-amber-200 mb-2">{verification.barracksAddress}</h3>
                    <p className="text-sm text-slate-300 mb-2">상태: {verification.status}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span>요청일: {verification.createdAt}</span>
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
