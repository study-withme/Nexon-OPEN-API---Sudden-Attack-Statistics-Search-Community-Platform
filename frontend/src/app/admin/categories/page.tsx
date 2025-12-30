"use client";

import { useState } from "react";
import { DataTable } from "@/components/admin/DataTable";
import { Modal } from "@/components/admin/Modal";
import { FolderIcon, PlusIcon, ArrowUpIcon, ArrowDownIcon } from "@heroicons/react/24/outline";

interface Category {
  id: number;
  name: string;
  description: string;
  postCount: number;
  order: number;
  canWrite: boolean;
  canRead: boolean;
}

const mockCategories: Category[] = [
  { id: 1, name: "공지", description: "공지사항", postCount: 12, order: 1, canWrite: false, canRead: true },
  { id: 2, name: "인기", description: "인기 게시글", postCount: 45, order: 2, canWrite: true, canRead: true },
  { id: 3, name: "자유", description: "자유 게시판", postCount: 234, order: 3, canWrite: true, canRead: true },
  { id: 4, name: "랭크전", description: "랭크전 게시판", postCount: 156, order: 4, canWrite: true, canRead: true },
  { id: 5, name: "대룰", description: "대룰 게시판", postCount: 89, order: 5, canWrite: true, canRead: true },
  { id: 6, name: "보급", description: "보급 게시판", postCount: 67, order: 6, canWrite: true, canRead: true },
  { id: 7, name: "듀오", description: "듀오 게시판", postCount: 123, order: 7, canWrite: true, canRead: true },
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>(mockCategories);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const columns = [
    {
      key: "order",
      label: "순서",
      render: (category: Category) => (
        <div className="flex items-center space-x-2">
          <span className="text-slate-400">{category.order}</span>
          <div className="flex flex-col">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleMoveOrder(category.id, "up");
              }}
              className="text-slate-400 hover:text-white"
            >
              <ArrowUpIcon className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleMoveOrder(category.id, "down");
              }}
              className="text-slate-400 hover:text-white"
            >
              <ArrowDownIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      ),
    },
    {
      key: "name",
      label: "카테고리명",
      render: (category: Category) => (
        <div className="flex items-center space-x-2">
          <FolderIcon className="w-5 h-5 text-slate-400" />
          <span className="font-medium text-white">{category.name}</span>
        </div>
      ),
    },
    {
      key: "description",
      label: "설명",
    },
    {
      key: "postCount",
      label: "게시글 수",
    },
    {
      key: "canWrite",
      label: "작성 권한",
      render: (category: Category) => (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            category.canWrite
              ? "bg-emerald-500/20 text-emerald-400"
              : "bg-red-500/20 text-red-400"
          }`}
        >
          {category.canWrite ? "허용" : "제한"}
        </span>
      ),
    },
    {
      key: "canRead",
      label: "조회 권한",
      render: (category: Category) => (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            category.canRead
              ? "bg-emerald-500/20 text-emerald-400"
              : "bg-red-500/20 text-red-400"
          }`}
        >
          {category.canRead ? "허용" : "제한"}
        </span>
      ),
    },
  ];

  const handleMoveOrder = (id: number, direction: "up" | "down") => {
    setCategories((prev) => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const index = sorted.findIndex((c) => c.id === id);
      if (
        (direction === "up" && index === 0) ||
        (direction === "down" && index === sorted.length - 1)
      )
        return prev;

      const newIndex = direction === "up" ? index - 1 : index + 1;
      [sorted[index], sorted[newIndex]] = [sorted[newIndex], sorted[index]];
      sorted[index].order = index + 1;
      sorted[newIndex].order = newIndex + 1;
      return sorted;
    });
  };

  const handleRowClick = (category: Category) => {
    setSelectedCategory(category);
    setIsEditModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedCategory(null);
    setIsAddModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">카테고리 관리</h1>
          <p className="text-slate-400 mt-1">카테고리 설정 및 관리</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center space-x-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          <span>카테고리 추가</span>
        </button>
      </div>

      <DataTable
        data={categories}
        columns={columns}
        onRowClick={handleRowClick}
        searchable
      />

      {/* 수정 모달 */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="카테고리 수정"
        footer={
          <>
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              취소
            </button>
            <button
              onClick={() => {
                // 수정 로직
                setIsEditModalOpen(false);
              }}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
            >
              저장
            </button>
          </>
        }
      >
        {selectedCategory && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                카테고리명
              </label>
              <input
                type="text"
                defaultValue={selectedCategory.name}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                설명
              </label>
              <input
                type="text"
                defaultValue={selectedCategory.description}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    defaultChecked={selectedCategory.canWrite}
                    className="w-4 h-4 text-emerald-600 bg-slate-700 border-slate-600 rounded"
                  />
                  <span className="text-sm text-slate-300">작성 권한</span>
                </label>
              </div>
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    defaultChecked={selectedCategory.canRead}
                    className="w-4 h-4 text-emerald-600 bg-slate-700 border-slate-600 rounded"
                  />
                  <span className="text-sm text-slate-300">조회 권한</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* 추가 모달 */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="카테고리 추가"
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
              카테고리명
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
            <input
              type="text"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 text-emerald-600 bg-slate-700 border-slate-600 rounded"
                />
                <span className="text-sm text-slate-300">작성 권한</span>
              </label>
            </div>
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 text-emerald-600 bg-slate-700 border-slate-600 rounded"
                />
                <span className="text-sm text-slate-300">조회 권한</span>
              </label>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
