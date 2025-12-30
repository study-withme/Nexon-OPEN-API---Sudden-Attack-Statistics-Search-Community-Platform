"use client";

import { useState } from "react";
import { DataTable } from "@/components/admin/DataTable";
import { FilterBar } from "@/components/admin/FilterBar";
import { Modal } from "@/components/admin/Modal";
import { BellIcon, PlusIcon, EyeIcon } from "@heroicons/react/24/outline";

interface Notice {
  id: number;
  title: string;
  author: string;
  createdAt: string;
  views: number;
  isVisible: boolean;
  importance: "일반" | "중요" | "긴급";
  startDate?: string;
  endDate?: string;
}

const mockNotices: Notice[] = [
  {
    id: 1,
    title: "서비스 점검 안내",
    author: "관리자",
    createdAt: "2024-01-20",
    views: 1234,
    isVisible: true,
    importance: "중요",
    startDate: "2024-01-20",
    endDate: "2024-01-25",
  },
  {
    id: 2,
    title: "신규 기능 업데이트",
    author: "관리자",
    createdAt: "2024-01-19",
    views: 567,
    isVisible: true,
    importance: "일반",
  },
];

export default function NoticesPage() {
  const [notices] = useState<Notice[]>(mockNotices);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string | undefined>>({});

  const columns = [
    {
      key: "title",
      label: "제목",
      render: (notice: Notice) => (
        <div className="flex items-center space-x-2">
          <BellIcon className="w-5 h-5 text-slate-400" />
          <span className="font-medium text-white">{notice.title}</span>
        </div>
      ),
    },
    {
      key: "author",
      label: "작성자",
    },
    {
      key: "createdAt",
      label: "작성일",
    },
    {
      key: "views",
      label: "조회수",
      render: (notice: Notice) => (
        <div className="flex items-center space-x-1">
          <EyeIcon className="w-4 h-4 text-slate-400" />
          <span>{notice.views}</span>
        </div>
      ),
    },
    {
      key: "importance",
      label: "중요도",
      render: (notice: Notice) => (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            notice.importance === "긴급"
              ? "bg-red-500/20 text-red-400"
              : notice.importance === "중요"
              ? "bg-orange-500/20 text-orange-400"
              : "bg-blue-500/20 text-blue-400"
          }`}
        >
          {notice.importance}
        </span>
      ),
    },
    {
      key: "isVisible",
      label: "노출",
      render: (notice: Notice) => (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            notice.isVisible
              ? "bg-emerald-500/20 text-emerald-400"
              : "bg-slate-500/20 text-slate-400"
          }`}
        >
          {notice.isVisible ? "노출" : "숨김"}
        </span>
      ),
    },
  ];

  const filterOptions = [
    {
      key: "importance",
      label: "중요도",
      type: "select" as const,
      options: [
        { label: "전체", value: "" },
        { label: "일반", value: "일반" },
        { label: "중요", value: "중요" },
        { label: "긴급", value: "긴급" },
      ],
    },
    {
      key: "isVisible",
      label: "노출 여부",
      type: "select" as const,
      options: [
        { label: "전체", value: "" },
        { label: "노출", value: "true" },
        { label: "숨김", value: "false" },
      ],
    },
  ];

  const handleRowClick = (notice: Notice) => {
    setSelectedNotice(notice);
    setIsDetailModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedNotice(null);
    setIsAddModalOpen(true);
  };

  const filteredNotices = notices.filter((notice) => {
    if (filters.importance && notice.importance !== filters.importance) return false;
    if (filters.isVisible !== undefined) {
      const isVisible = String(filters.isVisible) === "true";
      if (notice.isVisible !== isVisible) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">공지사항 관리</h1>
          <p className="text-slate-400 mt-1">공지사항 작성 및 관리</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center space-x-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          <span>공지사항 작성</span>
        </button>
      </div>

      <FilterBar filters={filterOptions} onFilterChange={setFilters} />

      <DataTable
        data={filteredNotices}
        columns={columns}
        onRowClick={handleRowClick}
        pagination={{
          page,
          pageSize: 20,
          total: filteredNotices.length,
          onPageChange: setPage,
        }}
        searchable
        selectable
      />

      {/* 상세 모달 */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="공지사항 상세"
        size="lg"
        footer={
          <>
            <button
              onClick={() => {
                setIsDetailModalOpen(false);
                setIsEditModalOpen(true);
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              수정
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
        {selectedNotice && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-400">제목</label>
                <p className="text-white mt-1">{selectedNotice.title}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-400">작성자</label>
                <p className="text-white mt-1">{selectedNotice.author}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-400">작성일</label>
                <p className="text-white mt-1">{selectedNotice.createdAt}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-400">중요도</label>
                <p className="text-white mt-1">{selectedNotice.importance}</p>
              </div>
            </div>
            <div className="border-t border-slate-700 pt-4">
              <h3 className="text-lg font-bold text-white mb-4">내용</h3>
              <div className="bg-slate-700 rounded-lg p-4 text-white">
                공지사항 내용이 여기에 표시됩니다...
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* 추가/수정 모달 */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
        }}
        title={isAddModalOpen ? "공지사항 작성" : "공지사항 수정"}
        size="lg"
        footer={
          <>
            <button
              onClick={() => {
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
              }}
              className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              취소
            </button>
            <button
              onClick={() => {
                // 저장 로직
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
              }}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
            >
              저장
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              제목
            </label>
            <input
              type="text"
              defaultValue={selectedNotice?.title}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              내용
            </label>
            <textarea
              rows={10}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
              defaultValue={selectedNotice ? "내용..." : ""}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                중요도
              </label>
              <select
                defaultValue={selectedNotice?.importance}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
              >
                <option value="일반">일반</option>
                <option value="중요">중요</option>
                <option value="긴급">긴급</option>
              </select>
            </div>
            <div>
              <label className="flex items-center space-x-2 mt-8">
                <input
                  type="checkbox"
                  defaultChecked={selectedNotice?.isVisible ?? true}
                  className="w-4 h-4 text-emerald-600 bg-slate-700 border-slate-600 rounded"
                />
                <span className="text-sm text-slate-300">노출</span>
              </label>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                노출 시작일
              </label>
              <input
                type="date"
                defaultValue={selectedNotice?.startDate}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                노출 종료일
              </label>
              <input
                type="date"
                defaultValue={selectedNotice?.endDate}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
