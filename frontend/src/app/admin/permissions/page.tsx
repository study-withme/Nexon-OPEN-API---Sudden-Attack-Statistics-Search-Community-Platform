"use client";

import { useState } from "react";
import { DataTable } from "@/components/admin/DataTable";
import { Modal } from "@/components/admin/Modal";
import { PlusIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";

interface Role {
  id: number;
  name: string;
  description: string;
  permissionCount: number;
}

const mockRoles: Role[] = [
  {
    id: 1,
    name: "최고 관리자",
    description: "모든 권한",
    permissionCount: 20,
  },
  {
    id: 2,
    name: "일반 관리자",
    description: "일반 관리 권한",
    permissionCount: 15,
  },
  {
    id: 3,
    name: "모더레이터",
    description: "콘텐츠 관리 권한",
    permissionCount: 10,
  },
];

export default function PermissionsPage() {
  const [roles] = useState<Role[]>(mockRoles);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const columns = [
    {
      key: "name",
      label: "역할명",
      render: (role: Role) => (
        <div className="flex items-center space-x-2">
          <ShieldCheckIcon className="w-5 h-5 text-slate-400" />
          <span className="font-medium text-white">{role.name}</span>
        </div>
      ),
    },
    {
      key: "description",
      label: "설명",
    },
    {
      key: "permissionCount",
      label: "권한 수",
    },
  ];

  const handleRowClick = (role: Role) => {
    setSelectedRole(role);
    setIsDetailModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedRole(null);
    setIsAddModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">권한 관리</h1>
          <p className="text-slate-400 mt-1">역할 및 권한 설정</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center space-x-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          <span>역할 추가</span>
        </button>
      </div>

      <DataTable data={roles} columns={columns} onRowClick={handleRowClick} searchable />

      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="권한 설정"
        size="lg"
        footer={
          <>
            <button
              onClick={() => setIsDetailModalOpen(false)}
              className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              취소
            </button>
            <button
              onClick={() => {
                // 저장 로직
                setIsDetailModalOpen(false);
              }}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
            >
              저장
            </button>
          </>
        }
      >
        {selectedRole && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-400">역할명</label>
              <p className="text-white mt-1">{selectedRole.name}</p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-4">권한 설정</h3>
              <div className="space-y-2">
                {[
                  "회원 관리",
                  "게시글 관리",
                  "신고 관리",
                  "시스템 설정",
                ].map((permission) => (
                  <div
                    key={permission}
                    className="flex items-center justify-between p-3 bg-slate-700 rounded-lg"
                  >
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
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="역할 추가"
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
              역할명
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              설명
            </label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
