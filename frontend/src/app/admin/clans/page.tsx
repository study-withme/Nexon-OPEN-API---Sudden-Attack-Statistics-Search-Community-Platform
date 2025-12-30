"use client";

import { useState } from "react";
import { DataTable } from "@/components/admin/DataTable";
import { FilterBar } from "@/components/admin/FilterBar";
import { Modal } from "@/components/admin/Modal";
import { UserGroupIcon, UserIcon } from "@heroicons/react/24/outline";

interface Clan {
  id: number;
  name: string;
  master: string;
  memberCount: number;
  createdAt: string;
  status: "정상" | "정지" | "삭제";
}

const mockClans: Clan[] = [
  {
    id: 1,
    name: "엘리트 클랜",
    master: "플레이어1",
    memberCount: 25,
    createdAt: "2024-01-15",
    status: "정상",
  },
  {
    id: 2,
    name: "프로 클랜",
    master: "플레이어2",
    memberCount: 30,
    createdAt: "2024-01-10",
    status: "정상",
  },
];

export default function ClansPage() {
  const [clans] = useState<Clan[]>(mockClans);
  const [selectedClan, setSelectedClan] = useState<Clan | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string | undefined>>({});

  const columns = [
    {
      key: "name",
      label: "클랜명",
      render: (clan: Clan) => (
        <div className="flex items-center space-x-2">
          <UserGroupIcon className="w-5 h-5 text-slate-400" />
          <span className="font-medium text-white">{clan.name}</span>
        </div>
      ),
    },
    {
      key: "master",
      label: "클랜 마스터",
      render: (clan: Clan) => (
        <div className="flex items-center space-x-2">
          <UserIcon className="w-4 h-4 text-slate-400" />
          <span>{clan.master}</span>
        </div>
      ),
    },
    {
      key: "memberCount",
      label: "회원 수",
    },
    {
      key: "createdAt",
      label: "등록일",
    },
    {
      key: "status",
      label: "상태",
      render: (clan: Clan) => (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            clan.status === "정상"
              ? "bg-emerald-500/20 text-emerald-400"
              : clan.status === "정지"
              ? "bg-yellow-500/20 text-yellow-400"
              : "bg-red-500/20 text-red-400"
          }`}
        >
          {clan.status}
        </span>
      ),
    },
  ];

  const filterOptions = [
    {
      key: "status",
      label: "상태",
      type: "select" as const,
      options: [
        { label: "전체", value: "" },
        { label: "정상", value: "정상" },
        { label: "정지", value: "정지" },
        { label: "삭제", value: "삭제" },
      ],
    },
    {
      key: "createdAt",
      label: "등록일",
      type: "dateRange" as const,
    },
    {
      key: "search",
      label: "검색",
      type: "text" as const,
      placeholder: "클랜명, 클랜 마스터 검색",
    },
  ];

  const handleRowClick = (clan: Clan) => {
    setSelectedClan(clan);
    setIsDetailModalOpen(true);
  };

  const filteredClans = clans.filter((clan) => {
    if (filters.status && clan.status !== filters.status) return false;
    if (filters.search) {
      const query = String(filters.search).toLowerCase();
      if (
        !clan.name.toLowerCase().includes(query) &&
        !clan.master.toLowerCase().includes(query)
      )
        return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">클랜 관리</h1>
          <p className="text-slate-400 mt-1">클랜 목록 및 관리</p>
        </div>
      </div>

      <FilterBar filters={filterOptions} onFilterChange={setFilters} />

      <DataTable
        data={filteredClans}
        columns={columns}
        onRowClick={handleRowClick}
        pagination={{
          page,
          pageSize: 20,
          total: filteredClans.length,
          onPageChange: setPage,
        }}
        searchable
        selectable
      />

      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="클랜 상세 정보"
        size="lg"
      >
        {selectedClan && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-400">클랜명</label>
                <p className="text-white mt-1">{selectedClan.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-400">클랜 마스터</label>
                <p className="text-white mt-1">{selectedClan.master}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-400">회원 수</label>
                <p className="text-white mt-1">{selectedClan.memberCount}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-400">등록일</label>
                <p className="text-white mt-1">{selectedClan.createdAt}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
