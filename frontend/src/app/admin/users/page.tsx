"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/admin/DataTable";
import { FilterBar } from "@/components/admin/FilterBar";
import { Modal } from "@/components/admin/Modal";
import {
  UserCircleIcon,
  ShieldExclamationIcon,
} from "@heroicons/react/24/outline";
import { api } from "@/lib/api";

type UserStatus = "ACTIVE" | "SUSPENDED" | "DELETED";

interface UserRow {
  id: number;
  nickname: string;
  email: string;
  joinDate?: string;
  lastAccess?: string;
  status: UserStatus | string;
  grade?: string;
  postCount?: number;
  commentCount?: number;
  reportCount?: number;
}

interface UserDetail extends UserRow {
  roles?: string[];
  stats?: {
    postCount?: number;
    commentCount?: number;
    reportCount?: number;
    likes?: number;
    reportedCount?: number;
  };
}

const statusLabel: Record<string, string> = {
  ACTIVE: "정상",
  SUSPENDED: "정지",
  DELETED: "탈퇴",
};

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ko-KR");
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<"suspend" | "release" | "changeGrade" | null>(null);
  const [actionPeriod, setActionPeriod] = useState("7일");
  const [actionReason, setActionReason] = useState("");
  const [actionGrade, setActionGrade] = useState("USER");
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string | undefined>>({});
  const [loading, setLoading] = useState(false);

  const columns = [
    {
      key: "nickname",
      label: "닉네임",
      render: (user: UserRow) => (
        <div className="flex items-center space-x-2">
          <UserCircleIcon className="w-5 h-5 text-slate-400" />
          <span className="font-medium text-white">{user.nickname}</span>
        </div>
      ),
    },
    {
      key: "email",
      label: "이메일",
    },
    {
      key: "joinDate",
      label: "가입일",
      render: (user: UserRow) => formatDate(user.joinDate),
    },
    {
      key: "lastAccess",
      label: "최근 접속",
      render: (user: UserRow) => formatDate(user.lastAccess),
    },
    {
      key: "status",
      label: "상태",
      render: (user: UserRow) => {
        const label = statusLabel[user.status] || user.status;
        const tone =
          user.status === "ACTIVE"
            ? "bg-emerald-500/20 text-emerald-400"
            : user.status === "SUSPENDED"
            ? "bg-yellow-500/20 text-yellow-400"
            : "bg-red-500/20 text-red-400";
        return <span className={`px-2 py-1 rounded text-xs font-medium ${tone}`}>{label}</span>;
      },
    },
    {
      key: "grade",
      label: "등급",
      render: (user: UserRow) => (
        <span className="px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-400">
          {user.grade || "-"}
        </span>
      ),
    },
    {
      key: "postCount",
      label: "게시글",
      render: (user: UserRow) => user.postCount ?? 0,
    },
    {
      key: "commentCount",
      label: "댓글",
      render: (user: UserRow) => user.commentCount ?? 0,
    },
    {
      key: "reportCount",
      label: "신고",
      render: (user: UserRow) => user.reportCount ?? 0,
    },
  ];

  const filterOptions = [
    {
      key: "status",
      label: "상태",
      type: "select" as const,
      options: [
        { label: "전체", value: "" },
        { label: "정상", value: "ACTIVE" },
        { label: "정지", value: "SUSPENDED" },
        { label: "탈퇴", value: "DELETED" },
      ],
    },
    {
      key: "grade",
      label: "등급",
      type: "select" as const,
      options: [
        { label: "전체", value: "" },
        { label: "USER", value: "USER" },
        { label: "PREMIUM", value: "PREMIUM" },
        { label: "ADMIN", value: "ADMIN" },
      ],
    },
    {
      key: "joinDate",
      label: "가입일",
      type: "dateRange" as const,
    },
    {
      key: "search",
      label: "검색",
      type: "text" as const,
      placeholder: "닉네임, 이메일 검색",
    },
  ];

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const params: Record<string, string | number | undefined> = {
      status: filters.status || undefined,
      grade: filters.grade || undefined,
      search: filters.search || undefined,
      page: page - 1,
      size: 20,
    };
    if (filters.joinDate_start) params.joinDateFrom = `${filters.joinDate_start}T00:00:00`;
    if (filters.joinDate_end) params.joinDateTo = `${filters.joinDate_end}T23:59:59`;
    try {
      const { data } = await api.get("/admin/users", { params });
      const normalized =
        data?.content?.map((u: UserRow) => ({
          ...u,
          status: (u.status || "ACTIVE").toString().toUpperCase(),
          grade: u.grade ? u.grade.toString().toUpperCase() : undefined,
        })) ?? [];
      setUsers(normalized);
      setTotal(data?.totalElements ?? normalized.length);
    } finally {
      setLoading(false);
    }
  }, [filters.grade, filters.joinDate_end, filters.joinDate_start, filters.search, filters.status, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRowClick = async (user: UserRow) => {
    try {
      const { data } = await api.get<UserDetail>(`/admin/users/${user.id}`);
      setSelectedUser({
        ...user,
        ...data,
        status: (data.status || user.status).toString().toUpperCase(),
        grade: data.grade ? data.grade.toString().toUpperCase() : user.grade,
        postCount: data.stats?.postCount ?? user.postCount,
        commentCount: data.stats?.commentCount ?? user.commentCount,
        reportCount: data.stats?.reportCount ?? user.reportCount,
      });
    } catch {
      setSelectedUser(user as UserDetail);
    }
    setIsDetailModalOpen(true);
  };

  const handleAction = (type: "suspend" | "release" | "changeGrade") => {
    setActionType(type);
    setIsActionModalOpen(true);
  };

  const runAction = async () => {
    if (!selectedUser || !actionType) return;
    if (actionType === "suspend") {
      await api.post(`/admin/users/${selectedUser.id}/suspend`, {
        period: actionPeriod,
        reason: actionReason,
      });
    } else if (actionType === "release") {
      await api.post(`/admin/users/${selectedUser.id}/release`, null, {
        params: { reason: actionReason },
      });
    } else if (actionType === "changeGrade") {
      await api.post(
        `/admin/users/${selectedUser.id}/change-grade`,
        null,
        { params: { grade: actionGrade } }
      );
    }
    setIsActionModalOpen(false);
    fetchUsers();
    if (selectedUser) {
      handleRowClick(selectedUser);
    }
  };

  const displayedUsers = useMemo(
    () =>
      users.map((u) => ({
        ...u,
        joinDate: u.joinDate,
        lastAccess: u.lastAccess,
      })),
    [users]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">회원 관리</h1>
          <p className="text-slate-400 mt-1">회원 목록 및 관리</p>
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
        data={displayedUsers}
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

      {/* 회원 상세 모달 */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="회원 상세 정보"
        size="lg"
        footer={
          <>
            <button
              onClick={() => {
                setIsDetailModalOpen(false);
                handleAction("suspend");
              }}
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
            >
              계정 정지
            </button>
            <button
              onClick={() => {
                setIsDetailModalOpen(false);
                handleAction("changeGrade");
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              등급 변경
            </button>
            <button
              onClick={() => {
                setIsDetailModalOpen(false);
                handleAction("release");
              }}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              계정 해제
            </button>
          </>
        }
      >
        {selectedUser && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-400">닉네임</label>
                <p className="text-white mt-1">{selectedUser.nickname}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-400">이메일</label>
                <p className="text-white mt-1">{selectedUser.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-400">가입일</label>
                <p className="text-white mt-1">{formatDate(selectedUser.joinDate)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-400">최근 접속</label>
                <p className="text-white mt-1">{formatDate(selectedUser.lastAccess)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-400">상태</label>
                <p className="text-white mt-1">
                  {statusLabel[selectedUser.status] || selectedUser.status}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-400">등급</label>
                <p className="text-white mt-1">{selectedUser.grade || "-"}</p>
              </div>
            </div>
            <div className="border-t border-slate-700 pt-4">
              <h3 className="text-lg font-bold text-white mb-4">활동 통계</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-400">게시글</label>
                  <p className="text-2xl font-bold text-white mt-1">
                    {selectedUser.stats?.postCount ?? selectedUser.postCount ?? 0}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-400">댓글</label>
                  <p className="text-2xl font-bold text-white mt-1">
                    {selectedUser.stats?.commentCount ?? selectedUser.commentCount ?? 0}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-400">신고</label>
                  <p className="text-2xl font-bold text-white mt-1">
                    {selectedUser.stats?.reportCount ?? selectedUser.reportCount ?? 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* 조치 모달 */}
      <Modal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        title={
          actionType === "suspend"
            ? "계정 정지"
            : actionType === "release"
            ? "계정 해제"
            : "등급 변경"
        }
        footer={
          <>
            <button
              onClick={() => setIsActionModalOpen(false)}
              className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              취소
            </button>
            <button
              onClick={runAction}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
            >
              확인
            </button>
          </>
        }
      >
        {actionType === "suspend" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                정지 기간
              </label>
              <select
                value={actionPeriod}
                onChange={(e) => setActionPeriod(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
              >
                <option value="1일">1일</option>
                <option value="3일">3일</option>
                <option value="7일">7일</option>
                <option value="30일">30일</option>
                <option value="영구">영구</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                사유
              </label>
              <textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                rows={4}
                placeholder="정지 사유를 입력하세요"
              />
            </div>
          </div>
        )}
        {actionType === "changeGrade" && (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              등급 선택
            </label>
            <select
              value={actionGrade}
              onChange={(e) => setActionGrade(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
            >
              <option value="USER">USER</option>
              <option value="PREMIUM">PREMIUM</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>
        )}
        {actionType === "release" && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-sm text-slate-300">
              <ShieldExclamationIcon className="w-5 h-5" />
              <span>계정 정지를 해제하고 상태를 정상으로 변경합니다.</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                사유 (선택)
              </label>
              <textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                rows={3}
                placeholder="해제 사유를 입력하세요"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
