"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/admin/DataTable";
import { FilterBar } from "@/components/admin/FilterBar";
import { Modal } from "@/components/admin/Modal";
import {
  DocumentTextIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon,
  HeartIcon,
  FlagIcon,
} from "@heroicons/react/24/outline";
import { api } from "@/lib/api";

interface Post {
  id: number;
  title: string;
  author: string;
  category: string;
  createdAt: string;
  views: number;
  comments: number;
  likes: number;
  reports: number;
  status: "정상" | "숨김" | "삭제" | "공지";
}

interface PostDetail extends Post {
  content?: string;
  updatedAt?: string;
}

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ko-KR");
}

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [selectedPost, setSelectedPost] = useState<PostDetail | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string | undefined>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params: Record<string, string | number | undefined> = {
      category: filters.category || undefined,
      status: filters.status || undefined,
      search: filters.search || undefined,
      page: page - 1,
      size: 20,
    };
    try {
      const { data } = await api.get("/admin/posts", { params });
      const normalized =
        data?.content?.map((p: Post) => ({
          ...p,
          createdAt: formatDate(p.createdAt),
        })) ?? [];
      setPosts(normalized);
      setTotal(data?.totalElements ?? normalized.length);
    } catch (err) {
      console.error("Failed to fetch posts:", err);
      // ApiError 또는 기타 에러를 문자열로 안전하게 변환
      const message =
        (typeof err === "object" &&
          err !== null &&
          "message" in err &&
          typeof (err as any).message === "string" &&
          (err as any).message) ||
        "게시글 목록을 불러오는데 실패했습니다. 잠시 후 다시 시도해 주세요.";
      setError(message);
      setPosts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [filters.category, filters.search, filters.status, page]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const columns = [
    {
      key: "title",
      label: "제목",
      render: (post: Post) => (
        <div className="flex items-center space-x-2">
          <DocumentTextIcon className="w-5 h-5 text-slate-400" />
          <span className="font-medium text-white">{post.title}</span>
        </div>
      ),
    },
    {
      key: "author",
      label: "작성자",
    },
    {
      key: "category",
      label: "카테고리",
      render: (post: Post) => (
        <span className="px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-400">
          {post.category}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "작성일",
    },
    {
      key: "views",
      label: "조회",
      render: (post: Post) => (
        <div className="flex items-center space-x-1">
          <EyeIcon className="w-4 h-4 text-slate-400" />
          <span>{post.views}</span>
        </div>
      ),
    },
    {
      key: "comments",
      label: "댓글",
      render: (post: Post) => (
        <div className="flex items-center space-x-1">
          <ChatBubbleLeftRightIcon className="w-4 h-4 text-slate-400" />
          <span>{post.comments}</span>
        </div>
      ),
    },
    {
      key: "likes",
      label: "좋아요",
      render: (post: Post) => (
        <div className="flex items-center space-x-1">
          <HeartIcon className="w-4 h-4 text-slate-400" />
          <span>{post.likes}</span>
        </div>
      ),
    },
    {
      key: "reports",
      label: "신고",
      render: (post: Post) => (
        <div className="flex items-center space-x-1">
          <FlagIcon className="w-4 h-4 text-red-400" />
          <span className={post.reports > 0 ? "text-red-400" : ""}>{post.reports}</span>
        </div>
      ),
    },
    {
      key: "status",
      label: "상태",
      render: (post: Post) => (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            post.status === "정상"
              ? "bg-emerald-500/20 text-emerald-400"
              : post.status === "숨김"
              ? "bg-yellow-500/20 text-yellow-400"
              : "bg-red-500/20 text-red-400"
          }`}
        >
          {post.status}
        </span>
      ),
    },
  ];

  const filterOptions = [
    {
      key: "category",
      label: "카테고리",
      type: "select" as const,
      options: [
        { label: "전체", value: "" },
        { label: "공지", value: "공지" },
        { label: "인기", value: "인기" },
        { label: "자유", value: "자유" },
        { label: "랭크전", value: "랭크전" },
        { label: "대룰", value: "대룰" },
        { label: "보급", value: "보급" },
        { label: "듀오", value: "듀오" },
      ],
    },
    {
      key: "status",
      label: "상태",
      type: "select" as const,
      options: [
        { label: "전체", value: "" },
        { label: "정상", value: "정상" },
        { label: "숨김", value: "숨김" },
        { label: "삭제", value: "삭제" },
      ],
    },
    {
      key: "createdAt",
      label: "작성일",
      type: "dateRange" as const,
    },
    {
      key: "search",
      label: "검색",
      type: "text" as const,
      placeholder: "제목, 내용, 작성자 검색",
    },
  ];

  const handleRowClick = async (post: Post) => {
    try {
      const { data } = await api.get<PostDetail>(`/admin/posts/${post.id}`);
      setSelectedPost({
        ...post,
        ...data,
        createdAt: formatDate(data.createdAt || post.createdAt),
        updatedAt: formatDate(data.updatedAt),
      });
    } catch {
      setSelectedPost(post as PostDetail);
    }
    setIsDetailModalOpen(true);
  };

  const handleAction = async (action: "hide" | "delete" | "restore") => {
    if (!selectedPost) return;
    try {
      if (action === "hide") {
        await api.post(`/admin/posts/${selectedPost.id}/hide`);
      } else if (action === "delete") {
        await api.post(`/admin/posts/${selectedPost.id}/delete`, null, {
          params: { reason: "관리자 삭제" },
        });
      } else if (action === "restore") {
        await api.post(`/admin/posts/${selectedPost.id}/restore`);
      }
      setIsDetailModalOpen(false);
      fetchPosts();
    } catch (error) {
      console.error("Failed to perform action:", error);
    }
  };

  const displayedPosts = useMemo(
    () =>
      posts.map((p) => ({
        ...p,
        createdAt: p.createdAt,
      })),
    [posts]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">게시글 관리</h1>
          <p className="text-slate-400 mt-1">게시글 목록 및 관리</p>
        </div>
        <div className="flex items-center space-x-3">
          {error && (
            <span className="text-sm text-red-400 max-w-xs truncate">
              {error}
            </span>
          )}
          {loading && (
            <span className="text-sm text-slate-400">불러오는 중...</span>
          )}
        </div>
      </div>

      <FilterBar
        filters={filterOptions}
        onFilterChange={(next) => {
          setFilters(next);
          setPage(1);
        }}
      />

      <DataTable
        data={displayedPosts}
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

      {/* 게시글 상세 모달 */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="게시글 상세 정보"
        size="lg"
        footer={
          <>
            <button
              onClick={() => handleAction("hide")}
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
            >
              숨김
            </button>
            <button
              onClick={() => handleAction("delete")}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              삭제
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
        {selectedPost && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-400">제목</label>
                <p className="text-white mt-1">{selectedPost.title}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-400">작성자</label>
                <p className="text-white mt-1">{selectedPost.author}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-400">카테고리</label>
                <p className="text-white mt-1">{selectedPost.category}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-400">작성일</label>
                <p className="text-white mt-1">{selectedPost.createdAt}</p>
              </div>
            </div>
            <div className="border-t border-slate-700 pt-4">
              <h3 className="text-lg font-bold text-white mb-4">통계</h3>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-400">조회수</label>
                  <p className="text-2xl font-bold text-white mt-1">{selectedPost.views}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-400">댓글</label>
                  <p className="text-2xl font-bold text-white mt-1">{selectedPost.comments}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-400">좋아요</label>
                  <p className="text-2xl font-bold text-white mt-1">{selectedPost.likes}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-400">신고</label>
                  <p className="text-2xl font-bold text-red-400 mt-1">{selectedPost.reports}</p>
                </div>
              </div>
            </div>
            <div className="border-t border-slate-700 pt-4">
              <h3 className="text-lg font-bold text-white mb-4">내용</h3>
              <div className="bg-slate-700 rounded-lg p-4 text-white min-h-[100px]">
                {selectedPost.content || "내용이 없습니다."}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
