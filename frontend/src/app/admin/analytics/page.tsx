"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ChartBarIcon, UsersIcon, DocumentTextIcon, EyeIcon } from "@heroicons/react/24/outline";

const dauData = [
  { date: "1일", users: 1200 },
  { date: "2일", users: 1350 },
  { date: "3일", users: 1280 },
  { date: "4일", users: 1420 },
  { date: "5일", users: 1380 },
  { date: "6일", users: 1500 },
  { date: "7일", users: 1450 },
];

const retentionData = [
  { period: "1일", rate: 85 },
  { period: "7일", rate: 65 },
  { period: "30일", rate: 45 },
];

const popularPostsData = [
  { title: "랭크전 파티 구합니다", views: 1234, comments: 45, likes: 89 },
  { title: "대룰 게임 하실분?", views: 987, comments: 32, likes: 67 },
  { title: "신규 업데이트 정보", views: 856, comments: 28, likes: 54 },
];

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<"users" | "content" | "performance">("users");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">통계 및 분석</h1>
        <p className="text-slate-400 mt-1">사용자, 콘텐츠, 성능 분석</p>
      </div>

      <div className="bg-slate-800 rounded-lg border border-slate-700">
        <div className="flex border-b border-slate-700">
          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center space-x-2 px-6 py-4 border-b-2 transition-colors ${
              activeTab === "users"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <UsersIcon className="w-5 h-5" />
            <span className="font-medium">사용자 분석</span>
          </button>
          <button
            onClick={() => setActiveTab("content")}
            className={`flex items-center space-x-2 px-6 py-4 border-b-2 transition-colors ${
              activeTab === "content"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <DocumentTextIcon className="w-5 h-5" />
            <span className="font-medium">콘텐츠 분석</span>
          </button>
          <button
            onClick={() => setActiveTab("performance")}
            className={`flex items-center space-x-2 px-6 py-4 border-b-2 transition-colors ${
              activeTab === "performance"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <ChartBarIcon className="w-5 h-5" />
            <span className="font-medium">성능 분석</span>
          </button>
        </div>

        <div className="p-6">
          {activeTab === "users" && <UsersAnalytics />}
          {activeTab === "content" && <ContentAnalytics />}
          {activeTab === "performance" && <PerformanceAnalytics />}
        </div>
      </div>
    </div>
  );
}

function UsersAnalytics() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-700 rounded-lg p-4">
          <label className="text-sm font-medium text-slate-400">DAU (일일 활성 사용자)</label>
          <p className="text-2xl font-bold text-white mt-2">1,450</p>
        </div>
        <div className="bg-slate-700 rounded-lg p-4">
          <label className="text-sm font-medium text-slate-400">MAU (월간 활성 사용자)</label>
          <p className="text-2xl font-bold text-white mt-2">12,345</p>
        </div>
        <div className="bg-slate-700 rounded-lg p-4">
          <label className="text-sm font-medium text-slate-400">평균 유지율</label>
          <p className="text-2xl font-bold text-white mt-2">65%</p>
        </div>
      </div>

      <div className="bg-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">DAU 추이 (7일)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={dauData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "8px",
              }}
            />
            <Area
              type="monotone"
              dataKey="users"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">유지율</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={retentionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="period" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "8px",
              }}
            />
            <Bar dataKey="rate" fill="#10b981" name="유지율 (%)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ContentAnalytics() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-white mb-4">인기 게시글 TOP 10</h3>
        <div className="space-y-2">
          {popularPostsData.map((post, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-slate-700 rounded-lg"
            >
              <div className="flex-1">
                <p className="text-white font-medium">{post.title}</p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-slate-400">
                  <span className="flex items-center space-x-1">
                    <EyeIcon className="w-4 h-4" />
                    <span>{post.views}</span>
                  </span>
                  <span>댓글 {post.comments}</span>
                  <span>좋아요 {post.likes}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PerformanceAnalytics() {
  const performanceData = [
    { page: "메인", loadTime: 1.2, apiTime: 0.8 },
    { page: "게시글 목록", loadTime: 1.5, apiTime: 1.0 },
    { page: "게시글 상세", loadTime: 1.8, apiTime: 1.2 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-white mb-4">페이지별 로딩 시간</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="page" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Bar dataKey="loadTime" fill="#10b981" name="로딩 시간 (초)" />
            <Bar dataKey="apiTime" fill="#3b82f6" name="API 응답 시간 (초)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
