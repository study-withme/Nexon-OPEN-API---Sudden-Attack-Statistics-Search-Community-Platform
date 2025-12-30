"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/admin/DataTable";
import { FilterBar } from "@/components/admin/FilterBar";
import { Modal } from "@/components/admin/Modal";
import {
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import { api } from "@/lib/api";

type BackendStatus = "pending" | "processing" | "resolved" | "rejected";
type BackendTarget = "post" | "comment";

interface ReportListItem {
  id: number;
  targetType: BackendTarget;
  targetId: number;
  targetTitle?: string;
  reporter?: string;
  reportReason?: string;
  reportedAt?: string;
  status: BackendStatus;
  processor?: string;
}

interface ReportDetail extends ReportListItem {
  description?: string;
  adminNotes?: string;
  targetAuthor?: string;
  targetContent?: string;
  processedAt?: string;
}

const statusLabel: Record<BackendStatus, string> = {
  pending: "대기",
  processing: "처리중",
  resolved: "완료",
  rejected: "반려",
};

function toKoreanTarget(target: BackendTarget) {
  return target === "post" ? "게시글" : "댓글";
}

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ko-KR");
}

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportDetail | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<Record<string, string | undefined>>({});
  const [processAction, setProcessAction] = useState<"approve" | "reject">("approve");
  const [processReason, setProcessReason] = useState("");
  const [loading, setLoading] = useState(false);

  const targetFilter: BackendTarget =
    filters.targetType === "댓글" ? "comment" : "post";

  const columns = [
    {
      key: "targetType",
      label: "대상 유형",
      render: (report: ReportListItem) => (
        <div className="flex items-center space-x-2">
          {report.targetType === "post" ? (
            <DocumentTextIcon className="w-5 h-5 text-blue-400" />
          ) : (
            <ChatBubbleLeftRightIcon className="w-5 h-5 text-purple-400" />
          )}
          <span className="text-white">{toKoreanTarget(report.targetType)}</span>
        </div>
      ),
    },
    {
      key: "targetTitle",
      label: "대상",
      render: (report: ReportListItem) => (
        <span className="font-medium text-white">
          {report.targetTitle || "-"}
        </span>
      ),
    },
    {
      key: "reporter",
      label: "신고자",
    },
    {
      key: "reportReason",
      label: "신고 사유",
    },
    {
      key: "reportedAt",
      label: "신고일",
      render: (report: ReportListItem) => formatDate(report.reportedAt),
    },
    {
      key: "status",
      label: "처리 상태",
      render: (report: ReportListItem) => (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            report.status === "pending"
              ? "bg-yellow-500/20 text-yellow-400"
              : report.status === "processing"
              ? "bg-blue-500/20 text-blue-400"
              : report.status === "resolved"
              ? "bg-emerald-500/20 text-emerald-400"
              : "bg-red-500/20 text-red-400"
          }`}
        >
          {statusLabel[report.status]}
        </span>
      ),
    },
  ];

  const filterOptions = [
    {
      key: "targetType",
      label: "대상 유형",
      type: "select" as const,
      options: [
        { label: "게시글", value: "게시글" },
        { label: "댓글", value: "댓글" },
      ],
    },
    {
      key: "status",
      label: "처리 상태",
      type: "select" as const,
      options: [
        { label: "전체", value: "" },
        { label: "대기", value: "pending" },
        { label: "처리중", value: "processing" },
        { label: "완료", value: "resolved" },
        { label: "반려", value: "rejected" },
      ],
    },
    {
      key: "reportedAt",
      label: "신고일",
      type: "dateRange" as const,
    },
    {
      key: "search",
      label: "신고자",
      type: "text" as const,
      placeholder: "신고자 닉네임",
    },
  ];

  const fetchReports = useCallback(async () => {
    setLoading(true);
    const params = {
      reportReason: filters.reason || undefined,
      status: filters.status || undefined,
      search: filters.search || undefined,
      page: page - 1,
      size: 20,
    };
    try {
      const endpoint =
        targetFilter === "comment" ? "/admin/reports/comments" : "/admin/reports/posts";
      const { data } = await api.get(endpoint, { params });
      setReports(data?.content ?? []);
      setTotal(data?.totalElements ?? (data?.content?.length || 0));
    } finally {
      setLoading(false);
    }
  }, [filters.reason, filters.search, filters.status, page, targetFilter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleRowClick = async (report: ReportListItem) => {
    try {
      const { data } = await api.get<ReportDetail>(`/admin/reports/${report.id}`);
      setSelectedReport({
        ...report,
        ...data,
        reportedAt: data.reportedAt,
      });
    } catch {
      setSelectedReport(report as ReportDetail);
    }
    setIsDetailModalOpen(true);
  };

  const handleProcess = () => {
    setIsDetailModalOpen(false);
    setIsProcessModalOpen(true);
    setProcessAction("approve");
    setProcessReason("");
  };

  const processReport = async () => {
    if (!selectedReport) return;
    const url = `/admin/reports/${selectedReport.id}/${processAction === "approve" ? "approve" : "reject"}`;
    await api.post(url, {
      action: processAction,
      reason: processReason,
      adminNotes: processReason,
    });
    setIsProcessModalOpen(false);
    fetchReports();
  };

  const displayedReports = useMemo(
    () =>
      reports.map((r) => ({
        ...r,
        reportedAt: r.reportedAt,
      })),
    [reports]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">신고 관리</h1>
          <p className="text-slate-400 mt-1">게시글/댓글 신고 처리</p>
        </div>
        {loading && <span className="text-sm text-slate-400">불러오는 중...</span>}
      </div>

      <FilterBar
        filters={filterOptions}
        onFilterChange={(next) => {
          setFilters(next);
          setPage(1);
        }}
      />

      <DataTable
        data={displayedReports}
        columns={columns}
        onRowClick={handleRowClick}
        pagination={{
          page,
          pageSize: 20,
          total,
          onPageChange: setPage,
        }}
        searchable
        selectable
      />

      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="신고 상세 정보"
        size="lg"
        footer={
          <>
            {selectedReport?.status === "pending" && (
              <button
                onClick={handleProcess}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
              >
                처리하기
              </button>
            )}
            <button
              onClick={() => setIsDetailModalOpen(false)}
              className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              닫기
            </button>
          </>
        }
      >
        {selectedReport && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-400">대상 유형</label>
                <p className="text-white mt-1">{toKoreanTarget(selectedReport.targetType)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-400">대상</label>
                <p className="text-white mt-1">{selectedReport.targetTitle || "-"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-400">신고자</label>
                <p className="text-white mt-1">{selectedReport.reporter || "-"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-400">신고 사유</label>
                <p className="text-white mt-1">{selectedReport.reportReason || "-"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-400">신고일</label>
                <p className="text-white mt-1">{formatDate(selectedReport.reportedAt)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-400">처리 상태</label>
                <p className="text-white mt-1">{statusLabel[selectedReport.status]}</p>
              </div>
            </div>
            <div className="border-t border-slate-700 pt-4">
              <h3 className="text-lg font-bold text-white mb-4">신고 내용</h3>
              <div className="bg-slate-700 rounded-lg p-4 text-white min-h-[80px]">
                {selectedReport.description || selectedReport.targetContent || "내용이 없습니다."}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isProcessModalOpen}
        onClose={() => setIsProcessModalOpen(false)}
        title="신고 처리"
        footer={
          <>
            <button
              onClick={() => setIsProcessModalOpen(false)}
              className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              취소
            </button>
            <button
              onClick={processReport}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
            >
              처리 완료
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              처리 결과
            </label>
            <select
              value={processAction}
              onChange={(e) => setProcessAction(e.target.value as "approve" | "reject")}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
            >
              <option value="approve">신고 승인</option>
              <option value="reject">신고 반려</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              처리 사유
            </label>
            <textarea
              value={processReason}
              onChange={(e) => setProcessReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
              rows={4}
              placeholder="처리 사유를 입력하세요"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
