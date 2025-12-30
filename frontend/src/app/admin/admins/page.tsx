"use client";

import { useState } from "react";
import { DataTable } from "@/components/admin/DataTable";
import { Modal } from "@/components/admin/Modal";
import { UserCircleIcon, PlusIcon } from "@heroicons/react/24/outline";

interface Admin {
  id: number;
  name: string;
  email: string;
  role: "최고 관리자" | "일반 관리자" | "모더레이터";
  lastAccess: string;
  status: "활성" | "비활성";
}

const mockAdmins: Admin[] = [
  {
    id: 1,
    name: "관리자1",
    email: "admin1@example.com",
    role: "최고 관리자",
    lastAccess: "2024-01-20 14:30",
    status: "활성",
  },
  {
    id: 2,
    name: "관리자2",
    email: "admin2@example.com",
    role: "일반 관리자",
    lastAccess: "2024-01-20 12:15",
    status: "활성",
  },
];

export default function AdminsPage() {
  const [admins] = useState<Admin[]>(mockAdmins);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);

  const columns = [
    {
      key: "name",
      label: "이름",
      render: (admin: Admin) => (
        <div className="flex items-center space-x-2">
          <UserCircleIcon className="w-5 h-5 text-slate-400" />
          <span className="font-medium text-white">{admin.name}</span>
        </div>
      ),
    },
    {
      key: "email",
      label: "이메일",
    },
    {
      key: "role",
      label: "역할",
      render: (admin: Admin) => (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            admin.role === "최고 관리자"
              ? "bg-red-500/20 text-red-400"
              : admin.role === "일반 관리자"
              ? "bg-blue-500/20 text-blue-400"
              : "bg-purple-500/20 text-purple-400"
          }`}
        >
          {admin.role}
        </span>
      ),
    },
    {
      key: "lastAccess",
      label: "최근 접속",
    },
    {
      key: "status",
      label: "상태",
      render: (admin: Admin) => (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            admin.status === "활성"
              ? "bg-emerald-500/20 text-emerald-400"
              : "bg-slate-500/20 text-slate-400"
          }`}
        >
          {admin.status}
        </span>
      ),
    },
  ];

  const handleRowClick = (admin: Admin) => {
    setSelectedAdmin(admin);
    setIsDetailModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedAdmin(null);
    setIsAddModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">관리자 계정 관리</h1>
          <p className="text-slate-400 mt-1">관리자 계정 및 권한 관리</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center space-x-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          <span>관리자 추가</span>
        </button>
      </div>

      <DataTable data={admins} columns={columns} onRowClick={handleRowClick} searchable />

      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="관리자 상세 정보"
        size="lg"
        footer={
          <>
            <button
              onClick={() => {
                setIsDetailModalOpen(false);
                setIsPermissionModalOpen(true);
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              권한 설정
            </button>
            <button
              onClick={() => setIsDetailModalOpen(false)}
              className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              닫기
            </button>
          </>
        }
      >
        {selectedAdmin && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-400">이름</label>
                <p className="text-white mt-1">{selectedAdmin.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-400">이메일</label>
                <p className="text-white mt-1">{selectedAdmin.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-400">역할</label>
                <p className="text-white mt-1">{selectedAdmin.role}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-400">최근 접속</label>
                <p className="text-white mt-1">{selectedAdmin.lastAccess}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="관리자 추가"
        footer={
          <>
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              취소
            </button>
            <button
              onClick={() => {
                // 추가 로직
                setIsAddModalOpen(false);
              }}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
            >
              추가
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              이름
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              이메일
            </label>
            <input
              type="email"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              비밀번호
            </label>
            <input
              type="password"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              역할
            </label>
            <select className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white">
              <option value="모더레이터">모더레이터</option>
              <option value="일반 관리자">일반 관리자</option>
              <option value="최고 관리자">최고 관리자</option>
            </select>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isPermissionModalOpen}
        onClose={() => setIsPermissionModalOpen(false)}
        title="권한 설정"
        size="lg"
        footer={
          <>
            <button
              onClick={() => setIsPermissionModalOpen(false)}
              className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              취소
            </button>
            <button
              onClick={() => {
                // 권한 저장 로직
                setIsPermissionModalOpen(false);
              }}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
            >
              저장
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {[
            "회원 관리",
            "게시글 관리",
            "신고 관리",
            "시스템 설정",
            "로그 관리",
          ].map((permission) => (
            <div key={permission} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
              <span className="text-white">{permission}</span>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-emerald-600 bg-slate-700 border-slate-600 rounded"
                  />
                  <span className="text-sm text-slate-300">읽기</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-emerald-600 bg-slate-700 border-slate-600 rounded"
                  />
                  <span className="text-sm text-slate-300">쓰기</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-emerald-600 bg-slate-700 border-slate-600 rounded"
                  />
                  <span className="text-sm text-slate-300">삭제</span>
                </label>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
