"use client";

import { useState } from "react";
import { DataTable } from "@/components/admin/DataTable";
import { FilterBar } from "@/components/admin/FilterBar";
import { CreditCardIcon, ArrowPathIcon } from "@heroicons/react/24/outline";

interface Payment {
  id: number;
  user: string;
  amount: number;
  date: string;
  status: "완료" | "대기" | "취소" | "환불";
  method: string;
}

const mockPayments: Payment[] = [
  {
    id: 1,
    user: "플레이어1",
    amount: 10000,
    date: "2024-01-20 14:30",
    status: '완료',
    method: '카드',
  },
  {
    id: 2,
    user: '플레이어2',
    amount: 20000,
    date: '2024-01-20 12:15',
    status: '대기',
    method: '계좌이체',
  },
];

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>(mockPayments);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string | undefined>>({});

  const columns = [
    {
      key: "user",
      label: "사용자",
    },
    {
      key: "amount",
      label: "금액",
      render: (payment: Payment) => (
        <span className="font-medium text-white">
          {payment.amount.toLocaleString()}원
        </span>
      ),
    },
    {
      key: "date",
      label: "결제일",
    },
    {
      key: "method",
      label: "결제 방법",
    },
    {
      key: "status",
      label: "상태",
      render: (payment: Payment) => (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            payment.status === "완료"
              ? "bg-emerald-500/20 text-emerald-400"
              : payment.status === "대기"
              ? "bg-yellow-500/20 text-yellow-400"
              : payment.status === "취소"
              ? "bg-red-500/20 text-red-400"
              : "bg-blue-500/20 text-blue-400"
          }`}
        >
          {payment.status}
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
        { label: "완료", value: "완료" },
        { label: "대기", value: "대기" },
        { label: "취소", value: "취소" },
        { label: "환불", value: "환불" },
      ],
    },
    {
      key: "date",
      label: "결제일",
      type: "dateRange" as const,
    },
  ];

  const filteredPayments = payments.filter((payment) => {
    if (filters.status && payment.status !== filters.status) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">결제 관리</h1>
          <p className="text-slate-400 mt-1">결제 내역 및 환불 관리</p>
        </div>
        <div className="flex space-x-2">
          <button className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors">
            엑셀 내보내기
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <label className="text-sm font-medium text-slate-400">오늘 매출</label>
          <p className="text-2xl font-bold text-white mt-2">150,000원</p>
        </div>
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <label className="text-sm font-medium text-slate-400">이번 주 매출</label>
          <p className="text-2xl font-bold text-white mt-2">1,200,000원</p>
        </div>
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <label className="text-sm font-medium text-slate-400">이번 달 매출</label>
          <p className="text-2xl font-bold text-white mt-2">5,500,000원</p>
        </div>
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <label className="text-sm font-medium text-slate-400">총 매출</label>
          <p className="text-2xl font-bold text-white mt-2">25,000,000원</p>
        </div>
      </div>

      <FilterBar filters={filterOptions} onFilterChange={setFilters} />

      <DataTable
        data={filteredPayments}
        columns={columns}
        pagination={{
          page,
          pageSize: 20,
          total: filteredPayments.length,
          onPageChange: setPage,
        }}
        searchable
        selectable
      />
    </div>
  );
}
