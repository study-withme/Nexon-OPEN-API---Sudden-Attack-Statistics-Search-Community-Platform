"use client";

import { useState } from "react";
import { Cog6ToothIcon, ShieldCheckIcon, BellIcon, ServerIcon } from "@heroicons/react/24/outline";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("basic");

  const tabs = [
    { id: "basic", name: "기본 설정", icon: Cog6ToothIcon },
    { id: "member", name: "회원 설정", icon: ShieldCheckIcon },
    { id: "post", name: "게시글 설정", icon: Cog6ToothIcon },
    { id: "report", name: "신고 설정", icon: ShieldCheckIcon },
    { id: "security", name: "보안 설정", icon: ShieldCheckIcon },
    { id: "notification", name: "알림 설정", icon: BellIcon },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">시스템 설정</h1>
        <p className="text-slate-400 mt-1">시스템 전반의 설정을 관리합니다</p>
      </div>

      <div className="bg-slate-800 rounded-lg border border-slate-700">
        <div className="flex border-b border-slate-700">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-4 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-emerald-500 text-emerald-400"
                    : "border-transparent text-slate-400 hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{tab.name}</span>
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {activeTab === "basic" && <BasicSettings />}
          {activeTab === "member" && <MemberSettings />}
          {activeTab === "post" && <PostSettings />}
          {activeTab === "report" && <ReportSettings />}
          {activeTab === "security" && <SecuritySettings />}
          {activeTab === "notification" && <NotificationSettings />}
        </div>
      </div>
    </div>
  );
}

function BasicSettings() {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          사이트 이름
        </label>
        <input
          type="text"
          defaultValue="SA DATABASE"
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          사이트 설명
        </label>
        <textarea
          rows={3}
          defaultValue="Sudden Attack stats & community"
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          기본 테마
        </label>
        <select className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white">
          <option value="dark">다크 모드</option>
          <option value="light">라이트 모드</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          시간대
        </label>
        <select className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white">
          <option value="Asia/Seoul">Asia/Seoul (KST)</option>
        </select>
      </div>
      <button className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors">
        저장
      </button>
    </div>
  );
}

function MemberSettings() {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          가입 승인 방식
        </label>
        <select className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white">
          <option value="auto">자동</option>
          <option value="manual">수동</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            닉네임 최소 길이
          </label>
          <input
            type="number"
            defaultValue={2}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            닉네임 최대 길이
          </label>
          <input
            type="number"
            defaultValue={20}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          비밀번호 최소 길이
        </label>
        <input
          type="number"
          defaultValue={8}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
        />
      </div>
      <div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            defaultChecked
            className="w-4 h-4 text-emerald-600 bg-slate-700 border-slate-600 rounded"
          />
          <span className="text-sm text-slate-300">이메일 인증 필수</span>
        </label>
      </div>
      <div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            defaultChecked
            className="w-4 h-4 text-emerald-600 bg-slate-700 border-slate-600 rounded"
          />
          <span className="text-sm text-slate-300">병영주소 등록 필수</span>
        </label>
      </div>
      <button className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors">
        저장
      </button>
    </div>
  );
}

function PostSettings() {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          게시글 작성 권한
        </label>
        <select className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white">
          <option value="member">회원만</option>
          <option value="all">전체</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          댓글 작성 권한
        </label>
        <select className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white">
          <option value="member">회원만</option>
          <option value="all">전체</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          이미지 최대 개수
        </label>
        <input
          type="number"
          defaultValue={10}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          이미지 최대 크기 (MB)
        </label>
        <input
          type="number"
          defaultValue={5}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
        />
      </div>
      <button className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors">
        저장
      </button>
    </div>
  );
}

function ReportSettings() {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          기본 처리 기한 (일)
        </label>
        <input
          type="number"
          defaultValue={7}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
        />
      </div>
      <div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            defaultChecked
            className="w-4 h-4 text-emerald-600 bg-slate-700 border-slate-600 rounded"
          />
          <span className="text-sm text-slate-300">처리 대기 알림 활성화</span>
        </label>
      </div>
      <button className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors">
        저장
      </button>
    </div>
  );
}

function SecuritySettings() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-white mb-4">IP 차단 목록</h3>
        <div className="bg-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white">192.168.1.100</span>
            <button className="text-red-400 hover:text-red-300">삭제</button>
          </div>
        </div>
        <button className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
          IP 추가
        </button>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          동일 IP 최대 접속 수
        </label>
        <input
          type="number"
          defaultValue={10}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
        />
      </div>
      <button className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors">
        저장
      </button>
    </div>
  );
}

function NotificationSettings() {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          관리자 이메일
        </label>
        <input
          type="email"
          defaultValue="admin@example.com"
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
        />
      </div>
      <div>
        <h3 className="text-lg font-bold text-white mb-4">알림 종류</h3>
        <div className="space-y-2">
          {["신고 접수", "신고 처리 완료", "시스템 에러", "비정상 접속"].map((type) => (
            <label key={type} className="flex items-center space-x-2">
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 text-emerald-600 bg-slate-700 border-slate-600 rounded"
              />
              <span className="text-sm text-slate-300">{type}</span>
            </label>
          ))}
        </div>
      </div>
      <button className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors">
        저장
      </button>
    </div>
  );
}
