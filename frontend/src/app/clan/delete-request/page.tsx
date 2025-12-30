"use client";

import { useState } from "react";
import { TrashIcon } from "@heroicons/react/24/outline";

interface DeleteRequest {
  id: number;
  targetOuid: string;
  reason: string;
  status: string;
  requester?: string;
  createdAt?: string;
}

export default function ClanDeleteRequestPage() {
  const [requests, setRequests] = useState<DeleteRequest[]>([]);
  const [formData, setFormData] = useState({
    targetOuid: "",
    reason: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: API 호출
    console.log("삭제 요청:", formData);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="card p-6 sm:p-8 border-amber-500/30">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <TrashIcon className="h-6 w-6 text-red-400" />
            <h1 className="text-3xl font-semibold text-amber-200">삭제요청</h1>
          </div>
          <p className="text-sm text-slate-400">병영수첩 삭제를 요청하는 페이지입니다. (클랜 마스터 전용)</p>
        </div>

        <div className="mb-6">
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 mb-4">
            <h3 className="text-lg font-semibold text-amber-200 mb-4">삭제 요청</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm text-slate-300 mb-1">병영수첩 주소 *</label>
                <input
                  type="text"
                  value={formData.targetOuid}
                  onChange={(e) => setFormData({ ...formData, targetOuid: e.target.value })}
                  placeholder="삭제할 병영수첩 주소를 입력하세요"
                  required
                  className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all duration-300"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">삭제 사유 *</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="삭제 사유를 입력하세요"
                  rows={4}
                  required
                  className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all duration-300"
                />
              </div>
              <button
                type="submit"
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-400 transition-all duration-300"
              >
                삭제 요청
              </button>
            </form>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-slate-400">
            총 <span className="text-amber-300 font-semibold">{requests.length}</span>개의 삭제 요청
          </div>
        </div>

        <div className="space-y-3">
          {requests.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400">아직 삭제 요청이 없습니다.</p>
            </div>
          ) : (
            requests.map((request) => (
              <div
                key={request.id}
                className="rounded-xl border border-red-500/30 bg-red-950/20 p-4 hover:border-red-500/50 transition-all duration-300"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-red-300 mb-2">{request.targetOuid}</h3>
                    <p className="text-sm text-slate-300 mb-2">{request.reason}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span>요청자: {request.requester}</span>
                      <span>{request.createdAt}</span>
                      <span className={request.status === "pending" ? "text-yellow-400" : request.status === "approved" ? "text-green-400" : "text-red-400"}>
                        상태: {request.status === "pending" ? "대기중" : request.status === "approved" ? "승인됨" : "거부됨"}
                      </span>
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
