"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { clsx } from "clsx";
import { fetchBlacklist, addToBlacklist, removeFromBlacklist, type BlacklistEntry } from "@/lib/blacklist";
import { getOuidByNickname } from "@/lib/playerApi";
import { normalizeApiError } from "@/lib/api";
import {
  ShieldExclamationIcon,
  XMarkIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ko-KR");
}

export default function BlacklistPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const { isAuthed } = useAuth();
  const [entries, setEntries] = useState<BlacklistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [nickname, setNickname] = useState("");
  const [reason, setReason] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const loadBlacklist = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBlacklist();
      setEntries(data);
    } catch (err) {
      const error = normalizeApiError(err);
      setError(error.message || "블랙리스트를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthed) {
      loadBlacklist();
    }
  }, [isAuthed, loadBlacklist]);

  const handleAdd = async () => {
    if (!nickname.trim() || !reason.trim()) {
      alert("닉네임과 사유를 모두 입력해주세요.");
      return;
    }

    try {
      const ouidResponse = await getOuidByNickname(nickname.trim());
      await addToBlacklist({
        targetNickname: nickname.trim(),
        targetOuid: ouidResponse?.ouid,
        reason: reason.trim(),
      });
      setShowAddModal(false);
      setNickname("");
      setReason("");
      loadBlacklist();
    } catch (err) {
      const error = normalizeApiError(err);
      alert(error.message || "블랙리스트 추가에 실패했습니다.");
    }
  };

  const handleRemove = async (id: number) => {
    if (!confirm("정말 블랙리스트에서 제거하시겠습니까?")) return;

    try {
      await removeFromBlacklist(id);
      loadBlacklist();
    } catch (err) {
      const error = normalizeApiError(err);
      alert(error.message || "블랙리스트 제거에 실패했습니다.");
    }
  };

  const filteredEntries = entries.filter((entry) =>
    entry.targetNickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.reason.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isAuthed) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <div className={clsx(
          "rounded-2xl border-2 p-8 text-center",
          theme === "light"
            ? "border-slate-300 bg-white"
            : "border-slate-800 bg-slate-900/70"
        )}>
          <ShieldExclamationIcon className={clsx(
            "h-16 w-16 mx-auto mb-4",
            theme === "light" ? "text-slate-400" : "text-slate-500"
          )} />
          <p className={clsx(
            "text-lg font-semibold mb-2",
            theme === "light" ? "text-slate-900" : "text-white"
          )}>
            로그인이 필요합니다
          </p>
          <p className={clsx(
            "text-sm",
            theme === "light" ? "text-slate-600" : "text-slate-400"
          )}>
            블랙리스트를 사용하려면 로그인해주세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <ShieldExclamationIcon className={clsx("h-8 w-8", theme === "light" ? "text-red-600" : "text-red-400")} />
            <h1 className={clsx("text-4xl font-bold", theme === "light" ? "text-slate-900" : "text-white")}>
              블랙리스트
            </h1>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className={clsx(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300",
              theme === "light"
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-red-500/80 text-white hover:bg-red-500"
            )}
          >
            <PlusIcon className="h-5 w-5" />
            추가
          </button>
        </div>
        <p className={clsx("text-sm", theme === "light" ? "text-slate-600" : "text-slate-400")}>
          문제가 있는 플레이어를 블랙리스트에 추가하여 관리하세요.
        </p>
      </div>

      {/* 검색 */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="닉네임 또는 사유로 검색"
            className={clsx(
              "w-full rounded-xl border-2 pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all",
              theme === "light"
                ? "border-slate-300 bg-white text-black focus:border-blue-500 focus:ring-blue-500/20"
                : "border-slate-700 bg-slate-950/60 text-slate-200 focus:border-emerald-400 focus:ring-emerald-500/20"
            )}
          />
          <MagnifyingGlassIcon className={clsx(
            "absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5",
            theme === "light" ? "text-slate-400" : "text-slate-500"
          )} />
        </div>
      </div>

      {error && (
        <div className={clsx(
          "mb-6 rounded-xl border-2 p-4",
          theme === "light"
            ? "border-red-200 bg-red-50 text-red-700"
            : "border-red-500/40 bg-red-500/10 text-red-200"
        )}>
          {error}
        </div>
      )}

      {loading && (
        <div className={clsx(
          "text-center py-12",
          theme === "light" ? "text-slate-400" : "text-slate-500"
        )}>
          불러오는 중...
        </div>
      )}

      {!loading && filteredEntries.length === 0 && (
        <div className={clsx(
          "rounded-2xl border-2 p-8 text-center",
          theme === "light"
            ? "border-slate-300 bg-white"
            : "border-slate-800 bg-slate-900/70"
        )}>
          <p className={clsx(
            theme === "light" ? "text-slate-500" : "text-slate-400"
          )}>
            블랙리스트가 비어있습니다.
          </p>
        </div>
      )}

      {!loading && filteredEntries.length > 0 && (
        <div className="space-y-3">
          {filteredEntries.map((entry) => (
            <div
              key={entry.id}
              className={clsx(
                "rounded-xl border-2 p-4",
                theme === "light"
                  ? "border-slate-300 bg-white"
                  : "border-slate-800 bg-slate-900/70"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className={clsx(
                      "text-lg font-semibold",
                      theme === "light" ? "text-slate-900" : "text-white"
                    )}>
                      {entry.targetNickname}
                    </h3>
                    {entry.warningCount && entry.warningCount > 0 && (
                      <span className={clsx(
                        "px-2 py-1 rounded text-xs font-semibold",
                        theme === "light"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-orange-500/20 text-orange-300"
                      )}>
                        경고 {entry.warningCount}회
                      </span>
                    )}
                  </div>
                  <p className={clsx(
                    "text-sm mb-2",
                    theme === "light" ? "text-slate-600" : "text-slate-400"
                  )}>
                    {entry.reason}
                  </p>
                  <div className="flex items-center gap-4 text-xs">
                    <span className={clsx(
                      theme === "light" ? "text-slate-500" : "text-slate-500"
                    )}>
                      등록: {formatDate(entry.createdAt)}
                    </span>
                    {entry.createdBy && (
                      <span className={clsx(
                        theme === "light" ? "text-slate-500" : "text-slate-500"
                      )}>
                        등록자: {entry.createdBy}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(entry.id)}
                  className={clsx(
                    "p-2 rounded-lg transition-all duration-300",
                    theme === "light"
                      ? "hover:bg-red-100 text-red-600"
                      : "hover:bg-red-500/20 text-red-400"
                  )}
                  title="블랙리스트에서 제거"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={clsx(
            "rounded-2xl border-2 p-6 max-w-md w-full",
            theme === "light"
              ? "border-slate-300 bg-white"
              : "border-slate-800 bg-slate-900"
          )}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={clsx(
                "text-xl font-bold",
                theme === "light" ? "text-slate-900" : "text-white"
              )}>
                블랙리스트 추가
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className={clsx(
                  "p-1 rounded-lg",
                  theme === "light"
                    ? "hover:bg-slate-100 text-slate-600"
                    : "hover:bg-slate-800 text-slate-400"
                )}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className={clsx(
                  "block text-sm font-semibold mb-2",
                  theme === "light" ? "text-slate-900" : "text-slate-200"
                )}>
                  닉네임
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="서든어택 닉네임"
                  className={clsx(
                    "w-full rounded-xl border-2 px-4 py-2 text-sm focus:outline-none focus:ring-2",
                    theme === "light"
                      ? "border-slate-300 bg-white text-black focus:border-blue-500"
                      : "border-slate-700 bg-slate-950/60 text-slate-200 focus:border-emerald-400"
                  )}
                />
              </div>
              <div>
                <label className={clsx(
                  "block text-sm font-semibold mb-2",
                  theme === "light" ? "text-slate-900" : "text-slate-200"
                )}>
                  사유
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="블랙리스트 추가 사유"
                  rows={4}
                  className={clsx(
                    "w-full rounded-xl border-2 px-4 py-2 text-sm focus:outline-none focus:ring-2",
                    theme === "light"
                      ? "border-slate-300 bg-white text-black focus:border-blue-500"
                      : "border-slate-700 bg-slate-950/60 text-slate-200 focus:border-emerald-400"
                  )}
                />
              </div>
              <div className={clsx(
                "flex items-start gap-2 p-3 rounded-lg text-xs",
                theme === "light"
                  ? "bg-amber-50 text-amber-800"
                  : "bg-amber-500/10 text-amber-300"
              )}>
                <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <p>
                  블랙리스트에 추가된 플레이어는 매칭 경고를 받게 됩니다. 
                  신중하게 추가해주세요.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className={clsx(
                    "flex-1 px-4 py-2 rounded-xl text-sm font-semibold",
                    theme === "light"
                      ? "border-2 border-slate-300 text-slate-700 hover:bg-slate-100"
                      : "border-2 border-slate-700 text-slate-300 hover:bg-slate-800"
                  )}
                >
                  취소
                </button>
                <button
                  onClick={handleAdd}
                  className={clsx(
                    "flex-1 px-4 py-2 rounded-xl text-sm font-semibold",
                    theme === "light"
                      ? "bg-red-500 text-white hover:bg-red-600"
                      : "bg-red-500/80 text-white hover:bg-red-500"
                  )}
                >
                  추가
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
