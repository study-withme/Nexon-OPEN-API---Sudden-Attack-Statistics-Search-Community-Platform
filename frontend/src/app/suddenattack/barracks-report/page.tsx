"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTheme } from "@/hooks/useTheme";
import { clsx } from "clsx";
import {
  MagnifyingGlassIcon,
  Squares2X2Icon,
  ListBulletIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { BarracksReport, fetchBarracksReports } from "@/lib/barracks";
import { useAuth } from "@/hooks/useAuth";
import { fetchMe } from "@/lib/auth";
import { normalizeApiError } from "@/lib/api";

const reportTypeColors: Record<string, { bg: string; text: string; border: string }> = {
  "비매너": { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30" },
  "어뷰징": { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/30" },
  "비인가 프로그램 사용 의심": { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/30" },
  "사기": { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/30" },
  "기타": { bg: "bg-gray-500/10", text: "text-gray-400", border: "border-gray-500/30" },
};

function formatDate(value?: string) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("ko-KR");
}

export default function BarracksReportPage() {
  const { theme } = useTheme();
  const { isAuthed } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [reports, setReports] = useState<BarracksReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myReportCount, setMyReportCount] = useState<number | null>(null);
  const [showGuideline, setShowGuideline] = useState(false);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBarracksReports();
      setReports(data);
    } catch (err) {
      const error = normalizeApiError(err);
      setError(error.message || "병영 제보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // 내가 접수된 신고 수 조회
  useEffect(() => {
    if (!isAuthed) {
      setMyReportCount(null);
      return;
    }
    const loadMyReports = async () => {
      try {
        const member = await fetchMe();
        if (member?.nickname) {
          // TODO: 백엔드에 내가 신고당한 목록 API 추가 후 연결
          // const { data } = await api.get(`/barracks/reported?targetNickname=${encodeURIComponent(member.nickname)}`);
          // setMyReportCount(data.count);
          
          // 임시: 전체 신고 목록에서 필터링
          const allReports = await fetchBarracksReports();
          const reportedMe = allReports.filter(
            (r) => r.targetNickname?.toLowerCase() === member.nickname.toLowerCase()
          );
          setMyReportCount(reportedMe.length);
        }
      } catch {
        // ignore errors
      }
    };
    loadMyReports();
  }, [isAuthed]);

  const filteredReports = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();

    const filtered = reports.filter((report) => {
      const matchesType = filterType === "all" || report.reportType === filterType;
      const matchesKeyword =
        !keyword ||
        report.title?.toLowerCase().includes(keyword) ||
        report.targetNickname?.toLowerCase().includes(keyword) ||
        report.barracksAddress?.toLowerCase().includes(keyword);

      return matchesType && matchesKeyword;
    });

    return filtered.sort((a, b) => {
      if (sortBy === "reports") {
        return (b.reportCount ?? 0) - (a.reportCount ?? 0);
      }
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [filterType, reports, searchQuery, sortBy]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
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
            href={`/suddenattack/barracks-report?search=${encodeURIComponent(myReportCount > 0 ? "내신고" : "")}`}
            className={clsx(
              "px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300",
              theme === "light"
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-red-500/80 text-white hover:bg-red-500"
            )}
            onClick={(e) => {
              e.preventDefault();
              setSearchQuery("내신고");
            }}
          >
            바로가기
          </Link>
        </div>
      )}

      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1
              className={clsx(
                "text-5xl font-extrabold mb-3 bg-clip-text text-transparent bg-gradient-to-r",
                theme === "light"
                  ? "from-slate-900 via-blue-900 to-purple-900"
                  : "from-white via-emerald-300 to-cyan-300"
              )}
            >
              병영신고
            </h1>
            <div
              className={clsx(
                "space-y-1.5 text-sm",
                theme === "light" ? "text-slate-600" : "text-slate-400"
              )}
            >
              <p className="font-medium">게임 내 트롤, 버그 악용 등을 제보해주세요</p>
              <p>
                이용 전 반드시{" "}
                <button
                  type="button"
                  onClick={() => setShowGuideline(true)}
                  className={clsx(
                    "font-semibold underline underline-offset-2 hover:underline-offset-4 transition-all duration-300",
                    theme === "light"
                      ? "text-blue-600 hover:text-blue-700"
                      : "text-blue-400 hover:text-blue-300"
                  )}
                >
                  가이드라인
                </button>
                을 읽어주세요
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link
              href="/suddenattack/barracks-report/my"
              className={clsx(
                "px-5 py-2.5 rounded-xl border-2 text-sm font-bold transition-all duration-300 shadow-md hover:shadow-lg",
                theme === "light"
                  ? "border-slate-300 bg-white text-slate-900 hover:bg-slate-50 hover:border-slate-400 shadow-slate-200"
                  : "border-slate-700 bg-slate-900/50 text-white hover:bg-slate-800 hover:border-slate-600 shadow-slate-900"
              )}
            >
              내 글 보기
            </Link>
            <Link
              href="/suddenattack/barracks-report/write"
              className={clsx(
                "px-5 py-2.5 rounded-xl border-2 text-sm font-bold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105",
                theme === "light"
                  ? "border-blue-500 bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-blue-200"
                  : "border-emerald-500 bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-900 hover:from-emerald-400 hover:to-emerald-500 shadow-emerald-900/50"
              )}
            >
              + 병영신고하기
            </Link>
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="space-y-4">
          {/* 검색 바 */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="닉네임 / 병영주소 / 제목으로 검색"
              className={clsx(
                "w-full rounded-2xl border-2 pl-14 pr-24 py-4 text-sm font-medium focus:outline-none focus:ring-4 transition-all duration-300 shadow-lg",
                theme === "light"
                  ? "border-slate-300 bg-white text-black focus:border-blue-500 focus:ring-blue-500/20 shadow-slate-200"
                  : "border-slate-700 bg-slate-900/70 text-slate-200 focus:border-emerald-400 focus:ring-emerald-500/20 shadow-slate-900"
              )}
            />
            <MagnifyingGlassIcon
              className={clsx(
                "absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5",
                theme === "light" ? "text-slate-400" : "text-slate-500"
              )}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <button
                onClick={() => setViewMode("grid")}
                className={clsx(
                  "p-2 rounded-lg transition-all duration-300",
                  viewMode === "grid"
                    ? theme === "light"
                      ? "bg-blue-500 text-white"
                      : "bg-emerald-500 text-slate-900"
                    : theme === "light"
                    ? "hover:bg-slate-100 text-slate-600"
                    : "hover:bg-slate-800 text-slate-400"
                )}
              >
                <Squares2X2Icon className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={clsx(
                  "p-2 rounded-lg transition-all duration-300",
                  viewMode === "list"
                    ? theme === "light"
                      ? "bg-blue-500 text-white"
                      : "bg-emerald-500 text-slate-900"
                    : theme === "light"
                    ? "hover:bg-slate-100 text-slate-600"
                    : "hover:bg-slate-800 text-slate-400"
                )}
              >
                <ListBulletIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* 필터 */}
          <div className="flex items-center gap-3">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={clsx(
                "px-5 py-2.5 rounded-xl border-2 text-sm font-semibold focus:outline-none focus:ring-2 transition-all duration-300 shadow-md",
                theme === "light"
                  ? "border-slate-300 bg-white text-slate-900 focus:border-blue-500 focus:ring-blue-500/20 shadow-slate-200"
                  : "border-slate-700 bg-slate-900/70 text-slate-200 focus:border-emerald-400 focus:ring-emerald-500/20 shadow-slate-900"
              )}
            >
              <option value="all">유형별</option>
              <option value="bad-manner">비매너</option>
              <option value="suspicious">비인가 프로그램 사용 의심</option>
              <option value="abusing">어뷰징</option>
              <option value="fraud">사기</option>
              <option value="other">기타</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={clsx(
                "px-5 py-2.5 rounded-xl border-2 text-sm font-semibold focus:outline-none focus:ring-2 transition-all duration-300 shadow-md",
                theme === "light"
                  ? "border-slate-300 bg-white text-slate-900 focus:border-blue-500 focus:ring-blue-500/20 shadow-slate-200"
                  : "border-slate-700 bg-slate-900/70 text-slate-200 focus:border-emerald-400 focus:ring-emerald-500/20 shadow-slate-900"
              )}
            >
              <option value="recent">최근순</option>
              <option value="reports">제보순</option>
            </select>
          </div>
        </div>
      </div>

      {/* 가이드라인 큰 카드 */}
      {showGuideline && (
        <div className="mb-8">
          <div
            className={clsx(
              "relative overflow-hidden rounded-2xl border-2 p-6 sm:p-8 shadow-2xl",
              "bg-gradient-to-br",
              theme === "light"
                ? "from-slate-50 via-white to-blue-50 border-slate-200 shadow-blue-100/60"
                : "from-slate-950 via-slate-900 to-emerald-950 border-slate-800 shadow-emerald-900/40"
            )}
          >
            <button
              type="button"
              onClick={() => setShowGuideline(false)}
              className={clsx(
                "absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-semibold border transition-all duration-200",
                theme === "light"
                  ? "border-slate-300 bg-white/80 text-slate-600 hover:bg-slate-100"
                  : "border-slate-700 bg-slate-900/80 text-slate-300 hover:bg-slate-800"
              )}
            >
              닫기
            </button>

            <div className="mb-4">
              <p
                className={clsx(
                  "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border",
                  theme === "light"
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                )}
              >
                병영신고 게시판 이용 가이드라인
              </p>
            </div>

            <h2
              className={clsx(
                "text-2xl sm:text-3xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r",
                theme === "light"
                  ? "from-slate-900 via-blue-800 to-purple-800"
                  : "from-emerald-300 via-cyan-300 to-sky-300"
              )}
            >
              신고 전 반드시 아래 내용을 확인해주세요.
            </h2>

            <div
              className={clsx(
                "space-y-4 text-sm sm:text-[0.9rem] leading-relaxed",
                theme === "light" ? "text-slate-700" : "text-slate-300"
              )}
            >
              <section>
                <h3
                  className={clsx(
                    "text-base font-bold mb-1.5",
                    theme === "light" ? "text-slate-900" : "text-slate-100"
                  )}
                >
                  1. 법적 책임에 대한 안내
                </h3>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>이 게시판에 작성되는 모든 내용에 대한 법적 책임은 전적으로 작성자 본인에게 있습니다.</li>
                  <li>
                    실제로 행하지 않은 일을 사실인 것처럼 작성하거나, 확인되지 않은 루머를 퍼뜨려 특정 유저의 명예를
                    훼손하는 경우 정보통신망법, 형법상 명예훼손 등으로 민·형사상 책임을 질 수 있습니다.
                  </li>
                  <li>
                    성적인 발언, 가족을 비하하는 표현(성드립, 패드립 등) 및 모욕적인 표현은 모욕죄 등으로 처벌 대상이 될
                    수 있으므로 각별히 주의해 주세요.
                  </li>
                </ul>
              </section>

              <section>
                <h3
                  className={clsx(
                    "text-base font-bold mb-1.5",
                    theme === "light" ? "text-slate-900" : "text-slate-100"
                  )}
                >
                  2. 게시판의 설립 목적
                </h3>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>
                    이 게시판은 성드립, 패드립, 지속적인 욕설, 고의 트롤링, 비인가 프로그램 사용 의심 등 심각한 비매너
                    행위를 반복하는 유저들을 제재·차단하기 위해 만들어졌습니다.
                  </li>
                  <li>특정인을 이유 없이 공격하거나 개인적인 감정싸움을 키우기 위한 공간이 아닙니다.</li>
                  <li>
                    모두가 안심하고 플레이할 수 있도록 공공의 이익을 우선하는 신고 문화를 지향하며, 올바른 게임 문화와
                    건강한 인터넷 문화를 함께 만들어가는 것을 목표로 합니다.
                  </li>
                </ul>
              </section>

              <section>
                <h3
                  className={clsx(
                    "text-base font-bold mb-1.5",
                    theme === "light" ? "text-slate-900" : "text-slate-100"
                  )}
                >
                  3. 신고 작성 시 유의사항
                </h3>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>가능한 한 스크린샷, 리플레이, 채팅 로그 등 객관적인 증거를 함께 첨부해 주세요.</li>
                  <li>언제, 어디서, 어떤 발언·행동이 있었는지 최대한 구체적으로 작성해 주세요.</li>
                  <li>욕설, 비속어, 인신공격 표현은 자제하고 상황 설명 위주로 작성해 주세요.</li>
                  <li>허위 또는 악의적인 신고가 반복될 경우 게시판 이용 제한 및 별도의 조치가 취해질 수 있습니다.</li>
                </ul>
              </section>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div
          className={clsx(
            "mb-6 flex items-start justify-between gap-4 rounded-xl border-2 p-4",
            theme === "light"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-red-500/40 bg-red-500/10 text-red-200"
          )}
        >
          <div className="flex items-start gap-2">
            <InformationCircleIcon className="h-5 w-5 mt-0.5" />
            <div>
              <p className="text-sm font-semibold">불러오기 실패</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
          <button
            onClick={loadReports}
            className={clsx(
              "px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-300",
              theme === "light"
                ? "bg-red-100 text-red-700 hover:bg-red-200"
                : "bg-red-500/20 text-red-100 hover:bg-red-500/30"
            )}
          >
            다시 시도
          </button>
        </div>
      )}

      {loading && (
        <div className="text-center py-12 text-slate-400">불러오는 중...</div>
      )}

      {!loading && !error && filteredReports.length === 0 && (
        <div
          className={clsx(
            "text-center py-12 rounded-xl border-2",
            theme === "light"
              ? "border-slate-200 bg-white text-slate-500"
              : "border-slate-800 bg-slate-900/60 text-slate-400"
          )}
        >
          아직 등록된 신고가 없습니다.
        </div>
      )}

      {!loading && !error && filteredReports.length > 0 && (
        <>
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredReports.map((report) => (
                <Link
                  key={report.id}
                  href={`/suddenattack/barracks-report/${report.id}`}
                  className={clsx(
                    "block rounded-2xl border-2 p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl cursor-pointer group",
                    theme === "light"
                      ? "border-slate-200 bg-gradient-to-br from-white to-slate-50 hover:border-blue-400 hover:shadow-blue-200/50"
                      : "border-slate-800 bg-gradient-to-br from-slate-900/90 to-slate-950/90 hover:border-emerald-500/60 hover:shadow-emerald-900/30"
                  )}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={clsx(
                          "px-3 py-1.5 rounded-full text-xs font-bold border-2",
                          reportTypeColors[report.reportType]?.bg || reportTypeColors["기타"].bg,
                          reportTypeColors[report.reportType]?.text || reportTypeColors["기타"].text,
                          reportTypeColors[report.reportType]?.border || reportTypeColors["기타"].border
                        )}
                      >
                        {report.reportType}
                      </span>
                      {report.banStatus && (
                        <span
                          className={clsx(
                            "px-3 py-1.5 rounded-full text-xs font-bold border-2",
                            report.banStatus === "permanent"
                              ? theme === "light"
                                ? "bg-red-100 text-red-700 border-red-300"
                                : "bg-red-500/20 text-red-300 border-red-500/40"
                              : report.banStatus === "temporary"
                              ? theme === "light"
                                ? "bg-orange-100 text-orange-700 border-orange-300"
                                : "bg-orange-500/20 text-orange-300 border-orange-500/40"
                              : report.banStatus === "active"
                              ? theme === "light"
                                ? "bg-green-100 text-green-700 border-green-300"
                                : "bg-green-500/20 text-green-300 border-green-500/40"
                              : theme === "light"
                              ? "bg-slate-100 text-slate-700 border-slate-300"
                              : "bg-slate-800 text-slate-200 border-slate-700"
                          )}
                        >
                          {report.banStatus === "permanent"
                            ? "영구정지"
                            : report.banStatus === "temporary"
                            ? "임시정지"
                            : report.banStatus === "active"
                            ? "활동중"
                            : "미확인"}
                        </span>
                      )}
                    </div>
                    {report.status && (
                      <span
                        className={clsx(
                          "text-xs font-semibold px-3 py-1 rounded-full",
                          theme === "light"
                            ? "bg-slate-100 text-slate-700"
                            : "bg-slate-800 text-slate-200"
                        )}
                      >
                        {report.status}
                      </span>
                    )}
                  </div>
                  <h3
                    className={clsx(
                      "text-2xl font-extrabold mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r transition-all duration-300",
                      theme === "light"
                        ? "text-slate-900 group-hover:from-blue-600 group-hover:to-purple-600"
                        : "text-white group-hover:from-emerald-400 group-hover:to-cyan-400"
                    )}
                  >
                    {report.title}
                  </h3>
                  <p
                    className={clsx(
                      "text-sm mb-2 font-medium",
                      theme === "light" ? "text-slate-700" : "text-slate-300"
                    )}
                  >
                    제보 대상: {report.targetNickname}
                  </p>
                  <p
                    className={clsx(
                      "text-xs mb-4",
                      theme === "light" ? "text-slate-500" : "text-slate-400"
                    )}
                  >
                    병영주소: {report.barracksAddress}
                  </p>
                  <div className="space-y-3 pt-4 border-t-2 border-slate-800">
                    <div className="flex items-center justify-between">
                      <div
                        className={clsx(
                          "px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 shadow-lg",
                          theme === "light"
                            ? "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-red-200"
                            : "bg-gradient-to-r from-red-500/90 to-red-600/90 text-white hover:from-red-500 hover:to-red-600 shadow-red-900/50"
                        )}
                      >
                        제보 횟수
                        <span className="ml-2 text-xl">{report.totalReportCount ?? report.reportCount ?? 1}건</span>
                      </div>
                      {report.trustScore !== undefined && report.trustScore !== null && (
                        <div
                          className={clsx(
                            "px-3 py-1.5 rounded-lg text-xs font-semibold border-2",
                            report.trustScore >= 70
                              ? theme === "light"
                                ? "bg-green-50 border-green-300 text-green-700"
                                : "bg-green-500/20 border-green-500/40 text-green-300"
                              : report.trustScore >= 40
                              ? theme === "light"
                                ? "bg-yellow-50 border-yellow-300 text-yellow-700"
                                : "bg-yellow-500/20 border-yellow-500/40 text-yellow-300"
                              : theme === "light"
                              ? "bg-red-50 border-red-300 text-red-700"
                              : "bg-red-500/20 border-red-500/40 text-red-300"
                          )}
                        >
                          신뢰도: {report.trustScore}점
                        </div>
                      )}
                    </div>
                    {report.evidenceUrls && report.evidenceUrls.length > 0 && (
                      <div className={clsx(
                        "px-3 py-2 rounded-lg text-xs",
                        theme === "light"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-blue-500/10 text-blue-300"
                      )}>
                        증빙 자료: {report.evidenceUrls.length}개
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <p
                        className={clsx(
                          "text-xs",
                          theme === "light" ? "text-slate-500" : "text-slate-500"
                        )}
                      >
                        등록: {formatDate(report.createdAt)}
                      </p>
                      {report.processedAt && (
                        <p
                          className={clsx(
                            "text-xs",
                            theme === "light" ? "text-slate-500" : "text-slate-500"
                          )}
                        >
                          처리: {formatDate(report.processedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReports.map((report) => (
                <Link
                  key={report.id}
                  href={`/suddenattack/barracks-report/${report.id}`}
                  className={clsx(
                    "block rounded-xl border-2 p-4 transition-all duration-300 hover:scale-[1.01] hover:shadow-lg cursor-pointer",
                    theme === "light"
                      ? "border-slate-200 bg-white hover:border-blue-400 hover:shadow-blue-200/30"
                      : "border-slate-800 bg-slate-900/70 hover:border-emerald-500/50 hover:shadow-emerald-900/20"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <span
                        className={clsx(
                          "px-3 py-1.5 rounded-full text-xs font-bold border-2",
                          reportTypeColors[report.reportType]?.bg || reportTypeColors["기타"].bg,
                          reportTypeColors[report.reportType]?.text || reportTypeColors["기타"].text,
                          reportTypeColors[report.reportType]?.border || reportTypeColors["기타"].border
                        )}
                      >
                        {report.reportType}
                      </span>
                      <div>
                        <h3
                          className={clsx(
                            "text-lg font-extrabold group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r transition-all duration-300",
                            theme === "light"
                              ? "text-slate-900 group-hover:from-blue-600 group-hover:to-purple-600"
                              : "text-white group-hover:from-emerald-400 group-hover:to-cyan-400"
                          )}
                        >
                          {report.title}
                        </h3>
                        <p
                          className={clsx(
                            "text-sm font-medium",
                            theme === "light" ? "text-slate-600" : "text-slate-400"
                          )}
                        >
                          제보 대상: {report.targetNickname}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {report.banStatus && (
                          <span
                            className={clsx(
                              "px-3 py-1.5 rounded-full text-xs font-bold border-2",
                              report.banStatus === "permanent"
                                ? theme === "light"
                                  ? "bg-red-100 text-red-700 border-red-300"
                                  : "bg-red-500/20 text-red-300 border-red-500/40"
                                : report.banStatus === "temporary"
                                ? theme === "light"
                                  ? "bg-orange-100 text-orange-700 border-orange-300"
                                  : "bg-orange-500/20 text-orange-300 border-orange-500/40"
                                : report.banStatus === "active"
                                ? theme === "light"
                                  ? "bg-green-100 text-green-700 border-green-300"
                                  : "bg-green-500/20 text-green-300 border-green-500/40"
                                : theme === "light"
                                ? "bg-slate-100 text-slate-700 border-slate-300"
                                : "bg-slate-800 text-slate-200 border-slate-700"
                            )}
                          >
                            {report.banStatus === "permanent"
                              ? "영구정지"
                              : report.banStatus === "temporary"
                              ? "임시정지"
                              : report.banStatus === "active"
                              ? "활동중"
                              : "미확인"}
                          </span>
                        )}
                        <div
                          className={clsx(
                            "px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 shadow-lg",
                            theme === "light"
                              ? "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-red-200"
                              : "bg-gradient-to-r from-red-500/90 to-red-600/90 text-white hover:from-red-500 hover:to-red-600 shadow-red-900/50"
                          )}
                        >
                          제보 횟수 {report.totalReportCount ?? report.reportCount ?? 1}건
                        </div>
                      </div>
                      <p
                        className={clsx(
                          "text-xs font-medium",
                          theme === "light" ? "text-slate-500" : "text-slate-500"
                        )}
                      >
                        등록: {formatDate(report.createdAt)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
