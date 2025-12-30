"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/admin/DataTable";
import { FilterBar } from "@/components/admin/FilterBar";
import { Modal } from "@/components/admin/Modal";
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { api } from "@/lib/api";

interface BarracksReport {
  id: number;
  targetNickname: string;
  barracksAddress: string;
  reportType: string;
  reportCount: number;
  reportedAt: string;
  status: string;
  processor?: string;
  processedAt?: string;
}

interface BarracksReportDetail extends BarracksReport {
  title?: string;
  content?: string;
  reporter?: string;
  processReason?: string;
}

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ko-KR");
}

export default function BarracksReportsPage() {
  const [reports, setReports] = useState<BarracksReport[]>([]);
  const [total, setTotal] = useState(0);
  const [selectedReport, setSelectedReport] = useState<BarracksReportDetail | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string | undefined>>({});
  const [processStatus, setProcessStatus] = useState("처리중");
  const [processReason, setProcessReason] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    const params: Record<string, string | number | undefined> = {
      reportType: filters.reportType || undefined,
      status: filters.status || undefined,
      search: filters.search || undefined,
      page: page - 1,
      size: 20,
    };
    try {
      const { data } = await api.get("/admin/barracks-reports", { params });
      const normalized =
        data?.content?.map((r: BarracksReport) => ({
          ...r,
          reportedAt: formatDate(r.reportedAt),
          processedAt: formatDate(r.processedAt),
        })) ?? [];
      setReports(normalized);
      setTotal(data?.totalElements ?? normalized.length);
    } finally {
      setLoading(false);
    }
  }, [filters.reportType, filters.search, filters.status, page]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const columns = [
    {
      key: "targetNickname",
      label: "대상 닉네임",
      render: (report: BarracksReport) => (
        <div className="flex items-center space-x-2">
          <UserIcon className="w-5 h-5 text-slate-400" />
          <span className="font-medium text-white">{report.targetNickname}</span>
        </div>
      ),
    },
    {
      key: "barracksAddress",
      label: "병영주소",
    },
    {
      key: "reportType",
      label: "신고 유형",
      render: (report: BarracksReport) => (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            report.reportType === "비매너"
              ? "bg-red-500/20 text-red-400"
              : report.reportType === "비인가 프로그램"
              ? "bg-orange-500/20 text-orange-400"
              : report.reportType === "어뷰징"
              ? "bg-purple-500/20 text-purple-400"
              : "bg-blue-500/20 text-blue-400"
          }`}
        >
          {report.reportType}
        </span>
      ),
    },
    {
      key: "reportCount",
      label: "신고 횟수",
      render: (report: BarracksReport) => (
        <span className="font-bold text-red-400">{report.reportCount}</span>
      ),
    },
    {
      key: "reportedAt",
      label: "신고일",
    },
    {
      key: "status",
      label: "처리 상태",
      render: (report: BarracksReport) => {
        const statusConfig: Record<string, { icon: typeof ClockIcon; color: string }> = {
          대기: { icon: ClockIcon, color: "yellow" },
          처리중: { icon: ClockIcon, color: "blue" },
          완료: { icon: CheckCircleIcon, color: "emerald" },
          반려: { icon: XCircleIcon, color: "red" },
        };
        const config = statusConfig[report.status] || statusConfig.대기;
        const Icon = config.icon;
        return (
          <div className="flex items-center space-x-2">
            <Icon
              className={`w-5 h-5 ${
                config.color === "yellow"
                  ? "text-yellow-400"
                  : config.color === "blue"
                  ? "text-blue-400"
                  : config.color === "emerald"
                  ? "text-emerald-400"
                  : "text-red-400"
              }`}
            />
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${
                config.color === "yellow"
                  ? "bg-yellow-500/20 text-yellow-400"
                  : config.color === "blue"
                  ? "bg-blue-500/20 text-blue-400"
                  : config.color === "emerald"
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-red-500/20 text-red-400"
              }`}
            >
              {report.status}
            </span>
          </div>
        );
      },
    },
    {
      key: "processor",
      label: "처리자",
      render: (report: BarracksReport) => (
        <span className="text-slate-300">{report.processor || "-"}</span>
      ),
    },
  ];

  const filterOptions = [
    {
      key: "reportType",
      label: "신고 유형",
      type: "select" as const,
      options: [
        { label: "전체", value: "" },
        { label: "비매너", value: "비매너" },
        { label: "비인가 프로그램", value: "비인가 프로그램" },
        { label: "어뷰징", value: "어뷰징" },
        { label: "사기", value: "사기" },
      ],
    },
    {
      key: "status",
      label: "처리 상태",
      type: "select" as const,
      options: [
        { label: "전체", value: "" },
        { label: "대기", value: "대기" },
        { label: "처리중", value: "처리중" },
        { label: "완료", value: "완료" },
        { label: "반려", value: "반려" },
      ],
    },
    {
      key: "reportedAt",
      label: "신고일",
      type: "dateRange" as const,
    },
    {
      key: "search",
      label: "검색",
      type: "text" as const,
      placeholder: "대상 닉네임, 신고자 검색",
    },
  ];

  const handleRowClick = async (report: BarracksReport) => {
    try {
      const { data } = await api.get<BarracksReportDetail>(`/admin/barracks-reports/${report.id}`);
      setSelectedReport({
        ...report,
        ...data,
        reportedAt: formatDate(data.reportedAt || report.reportedAt),
        processedAt: formatDate(data.processedAt || report.processedAt),
      });
    } catch {
      setSelectedReport(report as BarracksReportDetail);
    }
    setIsDetailModalOpen(true);
  };

  const handleProcess = () => {
    setIsDetailModalOpen(false);
    setIsProcessModalOpen(true);
    setProcessStatus("처리중");
    setProcessReason("");
  };

  const processReport = async () => {
    if (!selectedReport) return;
    try {
      await api.post(`/admin/barracks-reports/${selectedReport.id}/process`, {
        status: processStatus,
        reason: processReason,
      });
      setIsProcessModalOpen(false);
      fetchReports();
    } catch (error) {
      console.error("Failed to process report:", error);
    }
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
          <h1 className="text-3xl font-bold text-white">병영신고 관리</h1>
          <p className="text-slate-400 mt-1">병영신고 목록 및 처리</p>
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

      {/* 신고 상세 모달 */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="병영신고 상세 정보"
        size="lg"
        footer={
          <>
            {selectedReport?.status === "대기" && (
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
                <label className="text-sm font-medium text-slate-400">대상 닉네임</label>
                <p className="text-white mt-1">{selectedReport.targetNickname}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-400">병영주소</label>
                <p className="text-white mt-1">{selectedReport.barracksAddress}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-400">신고 유형</label>
                <p className="text-white mt-1">{selectedReport.reportType}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-400">신고 횟수</label>
                <p className="text-white mt-1">{selectedReport.reportCount}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-400">신고일</label>
                <p className="text-white mt-1">{selectedReport.reportedAt}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-400">처리 상태</label>
                <p className="text-white mt-1">{selectedReport.status}</p>
              </div>
            </div>
            <div className="border-t border-slate-700 pt-4">
              <h3 className="text-lg font-bold text-white mb-4">신고 내용</h3>
              <div className="bg-slate-700 rounded-lg p-4 text-white min-h-[100px]">
                {selectedReport.content || selectedReport.title || "내용이 없습니다."}
              </div>
            </div>
            {selectedReport.reporter && (
              <div className="border-t border-slate-700 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">신고자</span>
                  <span className="text-white">{selectedReport.reporter}</span>
                </div>
              </div>
            )}
            {selectedReport.processor && (
              <div className="border-t border-slate-700 pt-4">
                <h3 className="text-lg font-bold text-white mb-4">처리 이력</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">처리자</span>
                    <span className="text-white">{selectedReport.processor}</span>
                  </div>
                  {selectedReport.processedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">처리일</span>
                      <span className="text-white">{selectedReport.processedAt}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* 처리 모달 */}
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
              처리 상태
            </label>
            <select
              value={processStatus}
              onChange={(e) => setProcessStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
            >
              <option value="처리중">처리중</option>
              <option value="완료">완료</option>
              <option value="반려">반려</option>
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
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              대상 회원 조치
            </label>
            <select className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white">
              <option value="none">조치 없음</option>
              <option value="warning">경고</option>
              <option value="suspend">계정 정지</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
