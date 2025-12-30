"use client";

import { useState } from "react";
import { ShieldCheckIcon, ClipboardDocumentIcon } from "@heroicons/react/24/outline";

const CLAN_TAGS = ["#에보", "#3보", "#랭크", "#자유", "#친목"];

export default function ClanRegisterPage() {
  const [formData, setFormData] = useState({
    clanName: "",
    barracksAddress: "",
    discordUrl: "",
    discordPermanent: false,
    tags: [] as string[],
    description: "",
    contact: "",
  });
  const [copied, setCopied] = useState(false);

  const handleTagToggle = (tag: string) => {
    setFormData((prev) => {
      const newTags = prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : prev.tags.length < 2
        ? [...prev.tags, tag]
        : prev.tags;
      return { ...prev, tags: newTags };
    });
  };

  const handleCopyDiscordUrl = async () => {
    if (formData.discordUrl) {
      try {
        await navigator.clipboard.writeText(formData.discordUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("복사 실패:", err);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: API 호출 - 관리자 승인 형식으로 신청
    console.log("클랜 신청 (관리자 승인 대기):", formData);
    alert("클랜 신청이 완료되었습니다. 관리자 승인 후 등록됩니다.");
  };

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="card p-6 sm:p-8 border-amber-500/30">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheckIcon className="h-6 w-6 text-amber-400" />
            <h1 className="text-3xl font-semibold text-amber-200">클랜등록</h1>
          </div>
          <p className="text-sm text-slate-400">클랜을 등록하는 페이지입니다. (클랜 마스터 전용)</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-6">
            <h3 className="text-lg font-semibold text-amber-200 mb-4">클랜 정보</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1">클랜명 *</label>
                <input
                  type="text"
                  value={formData.clanName}
                  onChange={(e) => setFormData({ ...formData, clanName: e.target.value })}
                  placeholder="클랜명을 입력하세요"
                  required
                  className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all duration-300"
                />
              </div>
              
              <div>
                <label className="block text-sm text-slate-300 mb-1">클랜병영주소 *</label>
                <input
                  type="text"
                  value={formData.barracksAddress}
                  onChange={(e) => setFormData({ ...formData, barracksAddress: e.target.value })}
                  placeholder="병영수첩 주소를 입력하세요"
                  required
                  className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all duration-300"
                />
              </div>
              
              <div>
                <label className="block text-sm text-slate-300 mb-1">클랜디스코드</label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="discordPermanent"
                      checked={formData.discordPermanent}
                      onChange={(e) => setFormData({ ...formData, discordPermanent: e.target.checked })}
                      className="rounded border-slate-700 bg-slate-950/60 text-amber-500 focus:ring-amber-500"
                    />
                    <label htmlFor="discordPermanent" className="text-sm text-slate-300">
                      영구 또는 만료기간 없음
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.discordUrl}
                      onChange={(e) => setFormData({ ...formData, discordUrl: e.target.value })}
                      placeholder="디스코드 주소를 입력하세요"
                      className="flex-1 rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all duration-300"
                    />
                    <button
                      type="button"
                      onClick={handleCopyDiscordUrl}
                      disabled={!formData.discordUrl}
                      className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-slate-300 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                      title="주소 복사"
                    >
                      <ClipboardDocumentIcon className="h-5 w-5" />
                    </button>
                  </div>
                  {copied && (
                    <p className="text-xs text-amber-400">주소가 복사되었습니다!</p>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-slate-300 mb-1">클랜태그 (최대 2개까지만)</label>
                <div className="flex flex-wrap gap-2">
                  {CLAN_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagToggle(tag)}
                      disabled={!formData.tags.includes(tag) && formData.tags.length >= 2}
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition-all duration-300 ${
                        formData.tags.includes(tag)
                          ? "bg-amber-500 text-slate-900"
                          : "border border-slate-700 bg-slate-950/60 text-slate-300 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                {formData.tags.length > 0 && (
                  <p className="mt-2 text-xs text-slate-400">선택된 태그: {formData.tags.join(", ")}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm text-slate-300 mb-1">클랜설명</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="클랜 설명을 입력하세요"
                  rows={4}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all duration-300"
                />
                <p className="mt-1 text-xs text-slate-400">
                  예시: Joker클랜은 랭크전 친목 클랜으로서 활동중입니다. 가입문의는 오픈카톡으로 문의 부탁드려요
                </p>
              </div>
              
              <div>
                <label className="block text-sm text-slate-300 mb-1">클랜마스터 연락처 *</label>
                <input
                  type="text"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  placeholder="연락처를 입력하세요"
                  required
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
              신청하기
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
