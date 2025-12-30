"use client";

import { useState } from "react";
import { ArrowDownTrayIcon, TrashIcon, ChartBarIcon } from "@heroicons/react/24/outline";

export default function DataPage() {
  const [activeTab, setActiveTab] = useState<"backup" | "delete" | "stats">("backup");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">데이터 관리</h1>
        <p className="text-slate-400 mt-1">데이터 백업, 삭제 및 통계</p>
      </div>

      <div className="bg-slate-800 rounded-lg border border-slate-700">
        <div className="flex border-b border-slate-700">
          <button
            onClick={() => setActiveTab("backup")}
            className={`flex items-center space-x-2 px-6 py-4 border-b-2 transition-colors ${
              activeTab === "backup"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            <span className="font-medium">백업</span>
          </button>
          <button
            onClick={() => setActiveTab("delete")}
            className={`flex items-center space-x-2 px-6 py-4 border-b-2 transition-colors ${
              activeTab === "delete"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <TrashIcon className="w-5 h-5" />
            <span className="font-medium">삭제</span>
          </button>
          <button
            onClick={() => setActiveTab("stats")}
            className={`flex items-center space-x-2 px-6 py-4 border-b-2 transition-colors ${
              activeTab === "stats"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <ChartBarIcon className="w-5 h-5" />
            <span className="font-medium">통계</span>
          </button>
        </div>

        <div className="p-6">
          {activeTab === "backup" && <BackupTab />}
          {activeTab === "delete" && <DeleteTab />}
          {activeTab === "stats" && <StatsTab />}
        </div>
      </div>
    </div>
  );
}

function BackupTab() {
  const [backupSchedule, setBackupSchedule] = useState("daily");

  const mockBackups = [
    {
      id: 1,
      date: "2024-01-20 14:30",
      size: "2.5 GB",
      status: "완료",
    },
    {
      id: 2,
      date: "2024-01-19 14:30",
      size: "2.4 GB",
      status: "완료",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-white mb-4">수동 백업</h3>
        <button className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors">
          지금 백업 실행
        </button>
      </div>

      <div>
        <h3 className="text-lg font-bold text-white mb-4">자동 백업 설정</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              백업 주기
            </label>
            <select
              value={backupSchedule}
              onChange={(e) => setBackupSchedule(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
            >
              <option value="daily">매일</option>
              <option value="weekly">매주</option>
              <option value="monthly">매월</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-white mb-4">백업 이력</h3>
        <div className="space-y-2">
          {mockBackups.map((backup) => (
            <div
              key={backup.id}
              className="flex items-center justify-between p-4 bg-slate-700 rounded-lg"
            >
              <div>
                <p className="text-white font-medium">{backup.date}</p>
                <p className="text-sm text-slate-400">{backup.size}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 rounded text-xs font-medium bg-emerald-500/20 text-emerald-400">
                  {backup.status}
                </span>
                <button className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
                  복원
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DeleteTab() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-white mb-4">탈퇴 회원 데이터 삭제</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              보관 기간 (일)
            </label>
            <input
              type="number"
              defaultValue={30}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
            />
          </div>
          <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
            삭제 실행
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-white mb-4">삭제된 게시글 영구 삭제</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              보관 기간 (일)
            </label>
            <input
              type="number"
              defaultValue={90}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
            />
          </div>
          <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
            삭제 실행
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-white mb-4">오래된 로그 삭제</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              보관 기간 (일)
            </label>
            <input
              type="number"
              defaultValue={365}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
            />
          </div>
          <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
            삭제 실행
          </button>
        </div>
      </div>
    </div>
  );
}

function StatsTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-700 rounded-lg p-4">
          <label className="text-sm font-medium text-slate-400">데이터베이스 크기</label>
          <p className="text-2xl font-bold text-white mt-2">15.2 GB</p>
        </div>
        <div className="bg-slate-700 rounded-lg p-4">
          <label className="text-sm font-medium text-slate-400">이미지 저장 공간</label>
          <p className="text-2xl font-bold text-white mt-2">8.5 GB</p>
        </div>
        <div className="bg-slate-700 rounded-lg p-4">
          <label className="text-sm font-medium text-slate-400">총 저장 공간</label>
          <p className="text-2xl font-bold text-white mt-2">23.7 GB</p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-white mb-4">테이블별 크기</h3>
        <div className="space-y-2">
          {[
            { name: "members", size: "2.1 GB" },
            { name: "posts", size: "5.3 GB" },
            { name: "comments", size: "1.8 GB" },
            { name: "reports", size: "0.5 GB" },
          ].map((table) => (
            <div
              key={table.name}
              className="flex items-center justify-between p-4 bg-slate-700 rounded-lg"
            >
              <span className="text-white font-medium">{table.name}</span>
              <span className="text-slate-300">{table.size}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
