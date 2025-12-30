"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/hooks/useTheme";
import { clsx } from "clsx";
import {
  XMarkIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  UserIcon,
  ClockIcon,
  PhotoIcon,
  VideoCameraIcon,
} from "@heroicons/react/24/outline";

// 임시 데이터
const mockReportDetail = {
  id: 1,
  nickname: "Shy",
  clan: "seren1ty",
  reportType: "어뷰징",
  reportCount: 1,
  reports: [
    {
      id: 1,
      author: "익명의 신고자",
      date: "2025년 12월 10일 06:49",
      type: "어뷰징",
      title: "킬어뷰징",
      content: `어뷰징 신고한다해도 신고해라 패드립치면서 자기는 정지안먹는다등등 C-3보급창고일반매치 2025.12.10 (05:20 부터 06-28분 현재 킬 어뷰 진행중 계속 할것으로 보임 아무리 31등 이고 돈을 많이 질렀다한들 킬 어뷰징이 맞나여? 경험치 회수하고 정신좀 차리게 병영 들어가서 신고한번씩 해주세요 응빙공주<- 등등 킬먹하는애들끼리 팀먹고 게임하는사람들 브리핑 및 지네 죽이면 비매팅한다고 협박.`,
      images: [
        "https://via.placeholder.com/200x150?text=Evidence+1",
        "https://via.placeholder.com/200x150?text=Evidence+2",
        "https://via.placeholder.com/200x150?text=Evidence+3",
        "https://via.placeholder.com/200x150?text=Evidence+4",
        "https://via.placeholder.com/200x150?text=Evidence+5",
      ],
    },
  ],
  nicknameHistory: [],
};

const reportTypeColors: Record<string, { bg: string; text: string; border: string }> = {
  "비매너": { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/30" },
  "어뷰징": { bg: "bg-orange-500/20", text: "text-orange-400", border: "border-orange-500/30" },
  "비인가 프로그램 사용 의심": { bg: "bg-purple-500/20", text: "text-purple-400", border: "border-purple-500/30" },
  "사기": { bg: "bg-yellow-500/20", text: "text-yellow-400", border: "border-yellow-500/30" },
  "기타": { bg: "bg-gray-500/20", text: "text-gray-400", border: "border-gray-500/30" },
};

export default function BarracksReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { theme } = useTheme();
  const report = mockReportDetail;
  const currentReport = report.reports[0];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 좌측 사이드바 */}
        <div className="lg:col-span-1 space-y-6">
          {/* 제보 대상 정보 */}
          <div className={clsx(
            "rounded-2xl border-2 p-6 space-y-4 shadow-xl backdrop-blur-md",
            theme === "light"
              ? "bg-gradient-to-br from-white to-slate-50 border-slate-300 shadow-slate-200"
              : "bg-gradient-to-br from-slate-900/90 to-slate-950/90 border-slate-800 shadow-slate-900"
          )}>
            <div className="flex items-center justify-between">
              <h2 className={clsx(
                "text-lg font-bold",
                theme === "light" ? "text-slate-900" : "text-white"
              )}>
                제보 대상
              </h2>
              <button className={clsx(
                "p-2 rounded-lg transition-all duration-300",
                theme === "light"
                  ? "hover:bg-slate-100 text-slate-600"
                  : "hover:bg-slate-800 text-slate-400"
              )}>
                <ArrowPathIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className={clsx(
                  "text-xs font-semibold uppercase tracking-wide",
                  theme === "light" ? "text-slate-500" : "text-slate-400"
                )}>
                  닉네임
                </label>
                <p className={clsx(
                  "text-lg font-bold mt-1",
                  theme === "light" ? "text-slate-900" : "text-white"
                )}>
                  {report.nickname}
                </p>
              </div>
              <div>
                <label className={clsx(
                  "text-xs font-semibold uppercase tracking-wide",
                  theme === "light" ? "text-slate-500" : "text-slate-400"
                )}>
                  클랜명
                </label>
                <p className={clsx(
                  "text-lg font-semibold mt-1",
                  theme === "light" ? "text-slate-700" : "text-slate-300"
                )}>
                  {report.clan}
                </p>
              </div>
            </div>
            <button className={clsx(
              "w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02]",
              theme === "light"
                ? "bg-gradient-to-r from-slate-900 to-slate-800 text-white hover:from-slate-800 hover:to-slate-700 shadow-slate-300"
                : "bg-gradient-to-r from-slate-800 to-slate-700 text-white hover:from-slate-700 hover:to-slate-600 shadow-slate-900"
            )}>
              병영수첩 보기
            </button>
          </div>

          {/* 제보 요약 */}
          <div className={clsx(
            "rounded-2xl border-2 p-6 space-y-4 shadow-xl backdrop-blur-md",
            theme === "light"
              ? "bg-gradient-to-br from-white to-slate-50 border-slate-300 shadow-slate-200"
              : "bg-gradient-to-br from-slate-900/90 to-slate-950/90 border-slate-800 shadow-slate-900"
          )}>
            <h3 className={clsx(
              "text-xl font-extrabold",
              theme === "light" ? "text-slate-900" : "text-white"
            )}>
              총 {report.reportCount}건의 제보
            </h3>
            <div className="space-y-2">
              <div className={clsx(
                "flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-300",
                theme === "light"
                  ? "bg-gradient-to-r from-slate-100 to-slate-50 border-slate-300"
                  : "bg-gradient-to-r from-slate-900/80 to-slate-950/80 border-slate-800"
              )}>
                <span className={clsx(
                  "text-sm font-bold px-3 py-1.5 rounded-full border-2",
                  reportTypeColors[report.reportType]?.bg || "bg-gray-500/10",
                  reportTypeColors[report.reportType]?.text || "text-gray-400",
                  reportTypeColors[report.reportType]?.border || "border-gray-500/30"
                )}>
                  {report.reportType}
                </span>
                <span className={clsx(
                  "text-lg font-extrabold",
                  theme === "light" ? "text-slate-900" : "text-white"
                )}>
                  {report.reportCount}건
                </span>
              </div>
            </div>
          </div>

          {/* 닉네임 사용 이력 */}
          <div className={clsx(
            "rounded-2xl border-2 p-6 shadow-xl backdrop-blur-md",
            theme === "light"
              ? "bg-gradient-to-br from-white to-slate-50 border-slate-300 shadow-slate-200"
              : "bg-gradient-to-br from-slate-900/90 to-slate-950/90 border-slate-800 shadow-slate-900"
          )}>
            <h3 className={clsx(
              "text-lg font-extrabold mb-4",
              theme === "light" ? "text-slate-900" : "text-white"
            )}>
              닉네임 사용 이력
            </h3>
            <p className={clsx(
              "text-sm font-medium",
              theme === "light" ? "text-slate-500" : "text-slate-400"
            )}>
              과거 닉네임을 찾을 수 없습니다
            </p>
          </div>
        </div>

        {/* 우측 메인 콘텐츠 */}
        <div className="lg:col-span-2">
          <div className={clsx(
            "rounded-2xl border-2 p-6 sm:p-8 space-y-6 shadow-xl backdrop-blur-md",
            theme === "light"
              ? "bg-gradient-to-br from-white to-slate-50 border-slate-300 shadow-slate-200"
              : "bg-gradient-to-br from-slate-900/90 to-slate-950/90 border-slate-800 shadow-slate-900"
          )}>
            {/* 헤더 */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className={clsx(
                  "w-12 h-12 rounded-full flex items-center justify-center",
                  theme === "light"
                    ? "bg-slate-200"
                    : "bg-slate-800"
                )}>
                  <UserIcon className={clsx(
                    "h-6 w-6",
                    theme === "light" ? "text-slate-600" : "text-slate-400"
                  )} />
                </div>
                <div>
                  <h3 className={clsx(
                    "text-lg font-bold",
                    theme === "light" ? "text-slate-900" : "text-white"
                  )}>
                    {currentReport.author}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <ClockIcon className={clsx(
                      "h-4 w-4",
                      theme === "light" ? "text-slate-500" : "text-slate-400"
                    )} />
                    <span className={clsx(
                      "text-sm",
                      theme === "light" ? "text-slate-500" : "text-slate-400"
                    )}>
                      {currentReport.date}
                    </span>
                  </div>
                </div>
              </div>
              <Link
                href="/suddenattack/barracks-report"
                className={clsx(
                  "p-2 rounded-lg transition-all duration-300",
                  theme === "light"
                    ? "hover:bg-slate-100 text-slate-600"
                    : "hover:bg-slate-800 text-slate-400"
                )}
              >
                <XMarkIcon className="h-6 w-6" />
              </Link>
            </div>

            {/* 신고 유형 태그 */}
            <div className="flex items-center gap-3">
              <span className={clsx(
                "px-4 py-2 rounded-full text-sm font-bold border-2",
                reportTypeColors[currentReport.type]?.bg || "bg-gray-500/10",
                reportTypeColors[currentReport.type]?.text || "text-gray-400",
                reportTypeColors[currentReport.type]?.border || "border-gray-500/30"
              )}>
                {currentReport.type}
              </span>
              <ExclamationTriangleIcon className={clsx(
                "h-6 w-6",
                theme === "light" ? "text-amber-500" : "text-amber-400"
              )} />
            </div>

            {/* 제목 */}
            <h2 className={clsx(
              "text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r",
              theme === "light"
                ? "from-slate-900 via-blue-900 to-purple-900"
                : "from-white via-emerald-300 to-cyan-300"
            )}>
              {currentReport.title}
            </h2>

            {/* 내용 */}
            <div className={clsx(
              "prose prose-sm max-w-none",
              theme === "light"
                ? "prose-slate text-slate-700"
                : "prose-invert text-slate-300"
            )}>
              <p className="whitespace-pre-wrap leading-relaxed">
                {currentReport.content}
              </p>
            </div>

            {/* 증거 이미지 */}
            {currentReport.images && currentReport.images.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <PhotoIcon className={clsx(
                    "h-5 w-5",
                    theme === "light" ? "text-slate-600" : "text-slate-400"
                  )} />
                  <h4 className={clsx(
                    "font-semibold",
                    theme === "light" ? "text-slate-900" : "text-white"
                  )}>
                    증거 이미지 ({currentReport.images.length}개)
                  </h4>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {currentReport.images.map((img, index) => (
                    <div
                      key={index}
                      className="relative group cursor-pointer"
                      onClick={() => {
                        // TODO: 이미지 확대 모달
                      }}
                    >
                      <img
                        src={img}
                        alt={`증거 ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border-2 border-slate-800 hover:border-emerald-500/50 transition-all duration-300"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-lg transition-all duration-300" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
