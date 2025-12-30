import { api, normalizeApiError } from "@/lib/api";

export type CommunityPost = {
  id: number;
  category: string;
  title: string;
  content: string;
  author?: string;
  authorIsAdmin?: boolean;
  views?: number;
  likes?: number;
  notice?: boolean;
  pinned?: boolean;
  commentCount?: number;
  createdAt?: string;
};

export type BoardRule = {
  category: string;
  name: string;
  description?: string;
  canRead: boolean;
  canWrite: boolean;
  minTitleLength: number;
  maxTitleLength: number;
  minContentLength: number;
  maxContentLength: number;
  maxMediaCount: number;
  allowAnonymous: boolean;
  allowLinks: boolean;
  allowYoutube: boolean;
  allowTable: boolean;
  allowCodeBlock: boolean;
  notice?: string;
};

type CreatePostPayload = {
  category: string;
  title: string;
  content: string;
  anonymous?: boolean;
  password?: string;
};

type CreateCommentPayload = {
  content: string;
  parentId?: number;
  anonymous?: boolean;
  password?: string;
};

type UpdatePostPayload = {
  title: string;
  content: string;
  anonymous?: boolean;
  password?: string;
};

export type Comment = {
  id: number;
  content: string;
  author?: string;
  createdAt?: string;
  deleted?: boolean;
  parentId?: number;
  likes?: number;
  replies?: Comment[];
};

export async function fetchPosts(params?: { category?: string }) {
  const { data } = await api.get<CommunityPost[]>("/posts", { params });
  return data ?? [];
}

export async function fetchPost(id: number) {
  if (!id) throw new Error("게시글 ID가 올바르지 않습니다.");
  const { data } = await api.get<CommunityPost>(`/posts/${id}`);
  return data;
}

export async function fetchBoardRules() {
  const { data } = await api.get<BoardRule[]>("/posts/rules");
  return data ?? [];
}

export async function createPost(payload: CreatePostPayload) {
  try {
    const { data } = await api.post<CommunityPost>("/posts", payload);
    return data;
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export async function createComment(postId: number, payload: CreateCommentPayload) {
  try {
    await api.post(`/posts/${postId}/comments`, payload);
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export async function fetchComments(postId: number) {
  const { data } = await api.get<Comment[]>(`/posts/${postId}/comments`);
  return data ?? [];
}

export async function updatePost(postId: number, payload: UpdatePostPayload) {
  try {
    const { data } = await api.put<CommunityPost>(`/posts/${postId}`, payload);
    return data;
  } catch (error) {
    throw normalizeApiError(error);
  }
}

// 비로그인 익명 게시글 수정용 API (비밀번호 필요)
export async function updatePostAnonymous(postId: number, payload: UpdatePostPayload) {
  try {
    const { data } = await api.put<CommunityPost>(`/posts/${postId}/anonymous`, payload);
    return data;
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export async function deletePost(postId: number, password?: string) {
  try {
    await api.delete(`/posts/${postId}`, password ? { data: { password } } : undefined);
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export async function updateComment(postId: number, commentId: number, payload: { content: string }) {
  try {
    const { data } = await api.put<Comment>(`/posts/${postId}/comments/${commentId}`, payload);
    return data;
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export async function deleteComment(postId: number, commentId: number, password?: string) {
  try {
    await api.delete(`/posts/${postId}/comments/${commentId}`, password ? { data: { password } } : undefined);
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export async function likePost(postId: number) {
  try {
    const { data } = await api.post(`/posts/${postId}/like`);
    return data;
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export async function unlikePost(postId: number) {
  try {
    const { data } = await api.delete(`/posts/${postId}/like`);
    return data;
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export async function likeComment(postId: number, commentId: number) {
  try {
    const { data } = await api.post(`/posts/${postId}/comments/${commentId}/like`);
    return data;
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export async function unlikeComment(postId: number, commentId: number) {
  try {
    const { data } = await api.delete(`/posts/${postId}/comments/${commentId}/like`);
    return data;
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export async function createReply(postId: number, parentCommentId: number, payload: CreateCommentPayload) {
  try {
    await api.post(`/posts/${postId}/comments`, { ...payload, parentId: parentCommentId });
  } catch (error) {
    throw normalizeApiError(error);
  }
}

type ReportPayload = {
  reason: string;
  description?: string;
};

export async function reportPost(postId: number, payload: ReportPayload) {
  try {
    await api.post(`/posts/${postId}/report`, payload);
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export async function reportComment(postId: number, commentId: number, payload: ReportPayload) {
  try {
    await api.post(`/posts/${postId}/comments/${commentId}/report`, payload);
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export function generateAnonymousName() {
  const random = Math.floor(1000 + Math.random() * 9000);
  return `서든러-${random}`;
}

const BOOKMARK_STORAGE_KEY = "community-bookmarks";

function readBookmarkIds(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(BOOKMARK_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((v) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
      })
      .filter((v): v is number => v !== null);
  } catch (err) {
    console.error("즐겨찾기 정보 로드 실패:", err);
    return [];
  }
}

function writeBookmarkIds(ids: number[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      BOOKMARK_STORAGE_KEY,
      JSON.stringify(Array.from(new Set(ids))),
    );
  } catch (err) {
    console.error("즐겨찾기 저장 실패:", err);
    // localStorage 사용 불가 시 조용히 무시 (사용자에게 알릴 필요 없음)
  }
}

export function getBookmarkedPostIds(): Set<number> {
  return new Set(readBookmarkIds());
}

export function isPostBookmarked(postId: number): boolean {
  if (!postId) return false;
  return getBookmarkedPostIds().has(postId);
}

export function togglePostBookmark(postId: number): Set<number> {
  if (!postId) return getBookmarkedPostIds();
  const current = getBookmarkedPostIds();
  if (current.has(postId)) {
    current.delete(postId);
  } else {
    current.add(postId);
  }
  writeBookmarkIds(Array.from(current));
  return current;
}
