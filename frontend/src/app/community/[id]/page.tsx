"use client";

import { useEffect, useMemo, useState, Suspense, useRef } from "react";

// Tiptap 에디터 스타일
const editorStyles = `
  .ProseMirror {
    color: #e2e8f0 !important;
    background: #0f172a !important;
  }
  .ProseMirror:focus {
    outline: none;
  }
  .ProseMirror img {
    max-width: 100%;
    height: auto;
    border-radius: 0.5rem;
    margin: 1rem 0;
  }
  .ProseMirror a {
    color: #60a5fa !important;
    text-decoration: underline;
  }
  .ProseMirror iframe {
    border-radius: 0.5rem;
    margin: 1rem 0;
  }
  .ProseMirror ul, .ProseMirror ol {
    padding-left: 1.5rem;
  }
  .ProseMirror h1, .ProseMirror h2, .ProseMirror h3 {
    font-weight: 700;
    margin-top: 1rem;
    margin-bottom: 0.5rem;
  }
  .ProseMirror h1 {
    font-size: 2rem;
  }
  .ProseMirror h2 {
    font-size: 1.5rem;
  }
  .ProseMirror h3 {
    font-size: 1.25rem;
  }
  .ProseMirror p.is-editor-empty:first-child::before {
    color: #64748b;
    content: attr(data-placeholder);
    float: left;
    height: 0;
    pointer-events: none;
  }
`;
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  ArrowLeftIcon,
  BookmarkIcon,
  ChatBubbleBottomCenterTextIcon,
  ClockIcon,
  EyeIcon,
  FlagIcon,
  HeartIcon,
  ShareIcon,
  UserIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  ArrowUturnLeftIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  PencilIcon,
  TrashIcon,
  ShieldExclamationIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import {
  CommunityPost,
  Comment,
  BoardRule,
  createComment,
  createReply,
  updatePost,
  updatePostAnonymous,
  deletePost,
  updateComment,
  deleteComment,
  fetchComments,
  fetchPost,
  fetchBoardRules,
  generateAnonymousName,
  likePost,
  unlikePost,
  likeComment,
  unlikeComment,
  reportPost,
  reportComment,
  isPostBookmarked,
  togglePostBookmark,
} from "@/lib/community";
import { emitToast } from "@/lib/toast";
import { normalizeApiError } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { fetchMe, type MemberResponse } from "@/lib/auth";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import LinkExtension from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import YouTube from "@tiptap/extension-youtube";
import Blockquote from "@tiptap/extension-blockquote";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import { useTheme } from "@/hooks/useTheme";
import { clsx } from "clsx";

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ko-KR");
}

function CommunityDetailPageContent() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const { isAuthed } = useAuth();
  const { theme } = useTheme();
  const [currentUser, setCurrentUser] = useState<MemberResponse | null>(null);
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false); // 중복 요청 방지
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [editPostTitle, setEditPostTitle] = useState("");
  const [editPostPassword, setEditPostPassword] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editCommentContent, setEditCommentContent] = useState("");
  const [comment, setComment] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(true); // 비로그인 시 기본값 true
  const [commentPassword, setCommentPassword] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState<{ [key: number]: string }>({});
  const [replyAnonymous, setReplyAnonymous] = useState<{ [key: number]: boolean }>({});
  const [replyPassword, setReplyPassword] = useState<{ [key: number]: string }>({});
  const [replyErrors, setReplyErrors] = useState<{ [key: number]: string | undefined }>({});
  const [expandedReplies, setExpandedReplies] = useState<Set<number>>(new Set());
  const [commentLikes, setCommentLikes] = useState<{ [key: number]: { liked: boolean; count: number } }>({});
  const [showReportModal, setShowReportModal] = useState<{ type: "post" | "comment"; id?: number } | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [boardRules, setBoardRules] = useState<BoardRule[]>([]);
  const [showPasswordModal, setShowPasswordModal] = useState<{ type: "post" | "comment"; id?: number } | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const commentRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const [highlightedCommentId, setHighlightedCommentId] = useState<number | null>(null);

  const reportReasons = [
    "스팸 또는 광고",
    "욕설 또는 비방",
    "음란물 또는 부적절한 내용",
    "저작권 침해",
    "개인정보 유출",
    "기타",
  ];

  const category = useMemo(() => {
    const value = searchParams.get("category") || post?.category || "free";
    return value.toString().toLowerCase();
  }, [post?.category, searchParams]);

  const activeRule = useMemo(() => {
    return boardRules.find((rule) => rule.category === category);
  }, [boardRules, category]);

  // 관리자 여부 확인
  const isAuthorAdmin = (post: CommunityPost | null) => {
    return post?.authorIsAdmin === true;
  };

  useEffect(() => {
    const loadRules = async () => {
      try {
        const rules = await fetchBoardRules();
        setBoardRules(rules);
      } catch (err) {
        const error = normalizeApiError(err);
        console.error("게시판 규칙 로드 실패:", error.message);
      }
    };
    loadRules();
  }, []);

  useEffect(() => {
    if (isAuthed) {
      fetchMe().then(setCurrentUser).catch(() => setCurrentUser(null));
    } else {
      setCurrentUser(null);
    }
  }, [isAuthed]);

  // 비로그인 상태일 때 익명을 기본값으로 설정하고 고정
  useEffect(() => {
    if (!isAuthed) {
      setIsAnonymous(true);
    }
  }, [isAuthed]);

  // 게시글 수정용 Tiptap 에디터
  const editEditor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
        blockquote: false,
        link: false, // Link는 별도로 추가 (중복 방지)
      }),
      Blockquote,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-500 hover:underline",
        },
      }),
      YouTube.configure({
        width: 640,
        height: 480,
        controls: true,
      }),
      Color,
      TextStyle,
      Placeholder.configure({
        placeholder: "내용을 입력하세요. YouTube URL을 입력하면 자동으로 동영상이 삽입됩니다.",
      }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class: clsx(
          "prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none min-h-[300px] max-w-none p-4",
          theme === "light"
            ? "prose-slate text-black"
            : "prose-invert text-slate-200"
        ),
      },
    },
  });

  // 게시글 수정 에디터에 내용 설정
  useEffect(() => {
    if (editEditor && post && isEditingPost) {
      editEditor.commands.setContent(post.content || "");
    }
  }, [editEditor, post, isEditingPost]);

  useEffect(() => {
    const id = Number(params?.id);
    if (!id) {
      setError("유효하지 않은 게시글입니다.");
      setLoading(false);
      return;
    }
    
    // 중복 요청 방지
    if (loadingRef.current) {
      return;
    }
    
    let mounted = true;
    loadingRef.current = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchPost(id);
        if (mounted) {
          setPost(data);
          setLikesCount(data.likes ?? 0);
          setIsBookmarked(isPostBookmarked(data.id));
          setEditPostTitle(data.title);
          if (editEditor) {
            editEditor.commands.setContent(data.content || "");
          }
        }
      } catch (err) {
        const error = normalizeApiError(err);
        if (mounted) setError(error.message || "게시글을 불러오지 못했습니다.");
      } finally {
        if (mounted) setLoading(false);
        loadingRef.current = false;
      }
    };
    load();
    return () => {
      mounted = false;
      loadingRef.current = false;
    };
  }, [params?.id]);

  const scrollToComment = (id: number) => {
    const el = commentRefs.current[id];
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightedCommentId(id);
    window.setTimeout(() => {
      setHighlightedCommentId((prev) => (prev === id ? null : prev));
    }, 2000);
  };

  useEffect(() => {
    const id = Number(params?.id);
    if (!id) return;
    let mounted = true;
    const loadComments = async () => {
      setCommentsLoading(true);
      setCommentsError(null);
      try {
        const data = await fetchComments(id);
        if (mounted) {
          // 백엔드에서 이미 replies가 포함된 구조로 반환하므로 그대로 사용
          // 단, 백엔드가 평면 배열로 반환하는 경우를 대비해 구조화 로직 유지
          let organized: Comment[] = [];
          
          if (data && data.length > 0) {
            // 첫 번째 댓글에 replies 필드가 있으면 이미 구조화된 데이터
            const hasRepliesStructure = data[0]?.replies !== undefined;
            
            if (hasRepliesStructure) {
              // 이미 구조화된 데이터 사용
              organized = data;
            } else {
              // 평면 배열인 경우 구조화
              const parentComments = data.filter(c => !c.parentId);
              const repliesMap = new Map<number, Comment[]>();
              
              data.forEach(c => {
                if (c.parentId) {
                  if (!repliesMap.has(c.parentId)) {
                    repliesMap.set(c.parentId, []);
                  }
                  repliesMap.get(c.parentId)!.push(c);
                }
              });
              
              organized = parentComments.map(parent => ({
                ...parent,
                replies: repliesMap.get(parent.id) || [],
              }));
            }
          }
          
          setComments(organized);
          
          // 댓글 좋아요 상태 초기화 (모든 댓글과 답글 포함)
          const likesState: { [key: number]: { liked: boolean; count: number } } = {};
          const expandedSet = new Set<number>();
          const collectComments = (comments: Comment[]) => {
            comments.forEach(c => {
              likesState[c.id] = { liked: false, count: c.likes ?? 0 };
              // 답글이 있는 댓글은 기본적으로 펼쳐져 있도록 설정
              if (c.replies && c.replies.length > 0) {
                expandedSet.add(c.id);
                collectComments(c.replies);
              }
            });
          };
          collectComments(organized);
          setCommentLikes(likesState);
          setExpandedReplies(expandedSet);
        }
      } catch (err) {
        const error = normalizeApiError(err);
        if (mounted) setCommentsError(error.message || "댓글을 불러오지 못했습니다.");
      } finally {
        if (mounted) setCommentsLoading(false);
      }
    };
    loadComments();
    return () => {
      mounted = false;
    };
  }, [params?.id]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post?.id) return;
    setCommentError(null);
    if (!comment.trim()) {
      setCommentError("댓글 내용을 입력해주세요.");
      return;
    }
    setCommentLoading(true);
    try {
      await createComment(post.id, {
        content: comment.trim(),
        anonymous: isAnonymous && activeRule?.allowAnonymous ? true : undefined,
        password: !isAuthed && commentPassword && commentPassword.length >= 4 ? commentPassword : undefined,
      });
      setComment("");
      setCommentPassword("");
      setCommentError(null);
      emitToast({ type: "success", message: "댓글이 등록되었습니다." });
      const refreshed = await fetchComments(post.id);
      // 백엔드에서 이미 replies가 포함된 구조로 반환하므로 그대로 사용
      let organized: Comment[] = [];
      
      if (refreshed && refreshed.length > 0) {
        const hasRepliesStructure = refreshed[0]?.replies !== undefined;
        
        if (hasRepliesStructure) {
          organized = refreshed;
        } else {
          const parentComments = refreshed.filter(c => !c.parentId);
          const repliesMap = new Map<number, Comment[]>();
          
          refreshed.forEach(c => {
            if (c.parentId) {
              if (!repliesMap.has(c.parentId)) {
                repliesMap.set(c.parentId, []);
              }
              repliesMap.get(c.parentId)!.push(c);
            }
          });
          
          organized = parentComments.map(parent => ({
            ...parent,
            replies: repliesMap.get(parent.id) || [],
          }));
        }
      }
      
      setComments(organized);
      
      // 댓글 좋아요 상태 업데이트 및 답글 기본 펼침 상태 설정
      const likesState: { [key: number]: { liked: boolean; count: number } } = {};
      const expandedSet = new Set(expandedReplies); // 기존 펼침 상태 유지
      const collectComments = (comments: Comment[]) => {
        comments.forEach(c => {
          likesState[c.id] = { liked: false, count: c.likes ?? 0 };
          // 답글이 있는 댓글은 기본적으로 펼쳐져 있도록 설정
          if (c.replies && c.replies.length > 0) {
            expandedSet.add(c.id);
            collectComments(c.replies);
          }
        });
      };
      collectComments(organized);
      setCommentLikes(likesState);
      setExpandedReplies(expandedSet);
      // 방금 작성한 댓글 위치로 스크롤 & 하이라이트
      const lastComment = organized[organized.length - 1];
      if (lastComment) {
        window.setTimeout(() => {
          scrollToComment(lastComment.id);
        }, 50);
      }
    } catch (err) {
      const error = normalizeApiError(err);
      emitToast({ type: "error", message: error.message || "댓글 등록에 실패했습니다." });
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDeletePost = async () => {
    if (!post?.id || !showPasswordModal) return;
    try {
      await deletePost(post.id, deletePassword);
      emitToast({ type: "success", message: "게시글이 삭제되었습니다." });
      window.location.href = `/community/${category}`;
    } catch (err) {
      const error = normalizeApiError(err);
      emitToast({ type: "error", message: error.message || "게시글 삭제에 실패했습니다." });
      setDeletePassword("");
    }
  };

  const handleDeleteComment = async (commentId: number, password?: string) => {
    if (!post?.id) return;
    try {
      await deleteComment(post.id, commentId, password);
      // 댓글 삭제 후 다시 로드하여 답글은 유지되도록 함
      const refreshed = await fetchComments(post.id);
      let organized: Comment[] = [];
      if (refreshed && refreshed.length > 0) {
        const hasRepliesStructure = refreshed[0]?.replies !== undefined;
        if (hasRepliesStructure) {
          organized = refreshed;
        } else {
          const parentComments = refreshed.filter(c => !c.parentId);
          const repliesMap = new Map<number, Comment[]>();
          refreshed.forEach(c => {
            if (c.parentId) {
              if (!repliesMap.has(c.parentId)) {
                repliesMap.set(c.parentId, []);
              }
              repliesMap.get(c.parentId)!.push(c);
            }
          });
          organized = parentComments.map(parent => ({
            ...parent,
            replies: repliesMap.get(parent.id) || [],
          }));
        }
      }
      setComments(organized);
      emitToast({ type: "success", message: "댓글이 삭제되었습니다." });
      setShowPasswordModal(null);
      setDeletePassword("");
    } catch (err) {
      const error = normalizeApiError(err);
      emitToast({ type: "error", message: error.message || "댓글 삭제에 실패했습니다." });
      setDeletePassword("");
    }
  };

  const handleLikePost = async () => {
    if (!post?.id) return;
    if (!isAuthed) {
      emitToast({ type: "info", message: "로그인이 필요합니다." });
      return;
    }
    try {
      if (isLiked) {
        await unlikePost(post.id);
        setIsLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
      } else {
        await likePost(post.id);
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
      }
    } catch (err) {
      const error = normalizeApiError(err);
      emitToast({ type: "error", message: error.message || "추천 처리에 실패했습니다." });
    }
  };

  const handleLikeComment = async (commentId: number) => {
    if (!post?.id) return;
    if (!isAuthed) {
      emitToast({ type: "info", message: "로그인이 필요합니다." });
      return;
    }
    try {
      const currentState = commentLikes[commentId] || { liked: false, count: 0 };
      if (currentState.liked) {
        await unlikeComment(post.id, commentId);
        setCommentLikes(prev => ({
          ...prev,
          [commentId]: { liked: false, count: Math.max(0, prev[commentId]?.count - 1 || 0) }
        }));
      } else {
        await likeComment(post.id, commentId);
        setCommentLikes(prev => ({
          ...prev,
          [commentId]: { liked: true, count: (prev[commentId]?.count || 0) + 1 }
        }));
      }
    } catch (err) {
      const error = normalizeApiError(err);
      emitToast({ type: "error", message: error.message || "추천 처리에 실패했습니다." });
    }
  };

  const handleReply = async (parentId: number) => {
    if (!post?.id) return;
    const content = replyContent[parentId]?.trim();
    if (!content) {
      setReplyErrors((prev) => ({ ...prev, [parentId]: "답글 내용을 입력해주세요." }));
      return;
    }
    // 비로그인 사용자는 비밀번호 필수
    if (!isAuthed && (!replyPassword[parentId] || replyPassword[parentId].length < 4)) {
      setReplyErrors((prev) => ({ ...prev, [parentId]: "비로그인 답글 작성 시 비밀번호(4자 이상)를 입력해주세요." }));
      return;
    }
    setCommentLoading(true);
    try {
      const replyIsAnonymous = replyAnonymous[parentId] ?? isAnonymous;
      await createReply(post.id, parentId, { 
        content,
        anonymous: replyIsAnonymous && activeRule?.allowAnonymous ? true : undefined,
        password: !isAuthed && replyPassword[parentId] && replyPassword[parentId].length >= 4 ? replyPassword[parentId] : undefined,
      });
      setReplyContent(prev => ({ ...prev, [parentId]: "" }));
      setReplyPassword(prev => {
        const next = { ...prev };
        delete next[parentId];
        return next;
      });
      setReplyingTo(null);
      setReplyErrors((prev) => {
        const next = { ...prev };
        delete next[parentId];
        return next;
      });
      emitToast({ type: "success", message: "답글이 등록되었습니다." });
      const refreshed = await fetchComments(post.id);
      // 백엔드에서 이미 replies가 포함된 구조로 반환하므로 그대로 사용
      let organized: Comment[] = [];
      
      if (refreshed && refreshed.length > 0) {
        const hasRepliesStructure = refreshed[0]?.replies !== undefined;
        
        if (hasRepliesStructure) {
          organized = refreshed;
        } else {
          const parentComments = refreshed.filter(c => !c.parentId);
          const repliesMap = new Map<number, Comment[]>();
          
          refreshed.forEach(c => {
            if (c.parentId) {
              if (!repliesMap.has(c.parentId)) {
                repliesMap.set(c.parentId, []);
              }
              repliesMap.get(c.parentId)!.push(c);
            }
          });
          
          organized = parentComments.map(parent => ({
            ...parent,
            replies: repliesMap.get(parent.id) || [],
          }));
        }
      }
      
      setComments(organized);
      
      // 댓글 좋아요 상태 업데이트 및 답글 기본 펼침 상태 설정
      const likesState: { [key: number]: { liked: boolean; count: number } } = {};
      const expandedSet = new Set(expandedReplies); // 기존 펼침 상태 유지
      const collectComments = (comments: Comment[]) => {
        comments.forEach(c => {
          likesState[c.id] = { liked: false, count: c.likes ?? 0 };
          // 답글이 있는 댓글은 기본적으로 펼쳐져 있도록 설정
          if (c.replies && c.replies.length > 0) {
            expandedSet.add(c.id);
            collectComments(c.replies);
          }
        });
      };
      collectComments(organized);
      setCommentLikes(likesState);
      setExpandedReplies(expandedSet);
      // 방금 작성한 답글 위치로 스크롤 & 하이라이트
      const parent = organized.find((c) => c.id === parentId);
      const latestReply = parent?.replies && parent.replies[parent.replies.length - 1];
      const targetId = latestReply?.id ?? parentId;
      if (targetId) {
        window.setTimeout(() => {
          scrollToComment(targetId);
        }, 50);
      }
    } catch (err) {
      const error = normalizeApiError(err);
      emitToast({ type: "error", message: error.message || "답글 등록에 실패했습니다." });
    } finally {
      setCommentLoading(false);
    }
  };

  const handleReport = async () => {
    if (!post?.id || !showReportModal) return;
    if (!reportReason.trim()) {
      emitToast({ type: "error", message: "신고 사유를 선택해주세요." });
      return;
    }
    if (!isAuthed) {
      emitToast({ type: "info", message: "로그인이 필요합니다." });
      return;
    }

    setReportLoading(true);
    try {
      const payload = {
        reason: reportReason,
        description: reportDescription.trim() || undefined,
      };

      if (showReportModal.type === "post") {
        await reportPost(post.id, payload);
        emitToast({ type: "success", message: "게시글이 신고되었습니다." });
      } else if (showReportModal.type === "comment" && showReportModal.id) {
        await reportComment(post.id, showReportModal.id, payload);
        emitToast({ type: "success", message: "댓글이 신고되었습니다." });
      }

      setShowReportModal(null);
      setReportReason("");
      setReportDescription("");
    } catch (err) {
      const error = normalizeApiError(err);
      emitToast({ type: "error", message: error.message || "신고 처리에 실패했습니다." });
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <>
      <style jsx global>{editorStyles}</style>
      <div className="mx-auto max-w-5xl px-3 sm:px-4 lg:px-5 py-8 space-y-4">
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <ArrowLeftIcon className="h-4 w-4" />
        <Link href={`/community/${category}`} className="hover:text-emerald-300 transition-colors">
          {category} 게시판으로 돌아가기
        </Link>
      </div>

      <div className="board-shell p-0 overflow-hidden">
        {loading && <div className="text-center text-slate-400 py-12">불러오는 중...</div>}

        {error && !loading && <div className="text-center text-red-400 py-12">{error}</div>}

        {!loading && !error && post && (
          <div className="divide-y divide-slate-800/70">
            <header className="relative bg-gradient-to-br from-slate-900/80 via-slate-950 to-slate-900/70 px-4 sm:px-6 py-5 space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-300">
                <span className="board-badge uppercase">{post.category}</span>
                {post.notice && (
                  <span className="board-pill bg-amber-500/20 text-amber-200 border-amber-400/40">
                    공지
                  </span>
                )}
                {post.pinned && (
                  <span className="board-pill bg-blue-500/20 text-blue-100 border-blue-400/40">
                    상단 고정
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-emerald-50 leading-tight">
                {post.title}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-300">
                <span className="board-meta">
                  <UserIcon className="h-4 w-4" />
                  {isAuthorAdmin(post) ? (
                    <span className={clsx(
                      "font-semibold inline-flex items-center gap-1",
                      theme === "light"
                        ? "text-yellow-600"
                        : "text-yellow-400"
                    )}>
                      <span>{post.author || "관리자"}</span>
                      <ShieldCheckIcon className="h-4 w-4 text-yellow-400" title="운영자" />
                    </span>
                  ) : (
                    <span>{post.author || "익명"}</span>
                  )}
                </span>
                <span className="board-meta">
                  <ClockIcon className="h-4 w-4" />
                  {formatDate(post.createdAt)}
                </span>
                <span className="board-meta">
                  <EyeIcon className="h-4 w-4" />
                  {post.views ?? 0}
                </span>
                <span className="board-meta">
                  <ChatBubbleBottomCenterTextIcon className="h-4 w-4" />
                  {comments?.length ?? 0}
                </span>
                <span className="board-meta">
                  <HeartIcon className="h-4 w-4" />
                  {likesCount}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-200">
                <button
                  type="button"
                  onClick={handleLikePost}
                  className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 font-semibold transition-all duration-200 ${
                    isLiked
                      ? "border-emerald-500 bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30"
                      : "border-slate-800 bg-slate-900/70 text-slate-300 hover:border-emerald-500/50 hover:text-emerald-200"
                  } board-focus-ring`}
                >
                  <HandThumbUpIcon className="h-5 w-5" />
                  추천 {likesCount > 0 && `(${likesCount})`}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.href || "");
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-1.5 hover:border-emerald-500/50 hover:text-emerald-200 transition-colors board-focus-ring"
                >
                  <ShareIcon className="h-4 w-4" />
                  {copied ? "복사됨" : "링크 공유"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!post?.id) return;
                    const nextSet = togglePostBookmark(post.id);
                    const next = nextSet.has(post.id);
                    setIsBookmarked(next);
                    emitToast({
                      type: "success",
                      message: next ? "즐겨찾기에 추가되었습니다." : "즐겨찾기에서 제거되었습니다.",
                    });
                  }}
                  className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 transition-colors board-focus-ring ${
                    isBookmarked
                      ? "border-amber-400 bg-amber-500/15 text-amber-100 hover:bg-amber-500/25"
                      : "border-slate-800 bg-slate-900/70 text-slate-200 hover:border-emerald-500/50 hover:text-emerald-200"
                  }`}
                >
                  <BookmarkIcon
                    className={`h-4 w-4 ${
                      isBookmarked ? "text-amber-300" : "text-slate-300"
                    }`}
                  />
                  {isBookmarked ? "즐겨찾기 해제" : "즐겨찾기에 추가"}
                </button>
                {/* 로그인 사용자: 본인 게시글만 수정/삭제 가능 */}
                {currentUser && post && !post.author?.includes("익명") && currentUser.nickname === post.author && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingPost(true);
                        setEditPostPassword("");
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-1.5 hover:border-blue-500/40 hover:text-blue-200 transition-colors board-focus-ring"
                    >
                      <PencilIcon className="h-4 w-4" />
                      수정
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!window.confirm("게시글을 삭제하시겠습니까?")) return;
                        try {
                          await deletePost(post.id);
                          emitToast({ type: "success", message: "게시글이 삭제되었습니다." });
                          window.location.href = `/community/${category}`;
                        } catch (err) {
                          const error = normalizeApiError(err);
                          emitToast({ type: "error", message: error.message || "게시글 삭제에 실패했습니다." });
                        }
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-1.5 hover:border-red-500/40 hover:text-red-200 transition-colors board-focus-ring"
                    >
                      <TrashIcon className="h-4 w-4" />
                      삭제
                    </button>
                  </>
                )}
                {/* 익명 게시글 수정/삭제 버튼 (비밀번호 기반) */}
                {post && post.author?.includes("익명") && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingPost(true);
                        setEditPostPassword("");
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-1.5 hover:border-blue-500/40 hover:text-blue-200 transition-colors board-focus-ring"
                    >
                      <PencilIcon className="h-4 w-4" />
                      수정
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordModal({ type: "post" });
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-1.5 hover:border-red-500/40 hover:text-red-200 transition-colors board-focus-ring"
                    >
                      <TrashIcon className="h-4 w-4" />
                      삭제
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setShowReportModal({ type: "post" })}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-1.5 hover:border-red-500/40 hover:text-red-200 transition-colors board-focus-ring"
                >
                  <FlagIcon className="h-4 w-4" />
                  신고
                </button>
                <Link
                  href={`/community/${category}`}
                  className="ml-auto inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-1.5 text-slate-200 hover:border-emerald-500/40 hover:text-emerald-200 transition-colors board-focus-ring"
                >
                  목록으로
                </Link>
              </div>
            </header>

            {isEditingPost ? (
              <div className="bg-slate-950/70 px-4 sm:px-6 py-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-2">제목</label>
                  <input
                    type="text"
                    value={editPostTitle}
                    onChange={(e) => setEditPostTitle(e.target.value)}
                    className="w-full rounded-lg border-2 border-slate-800 bg-slate-950/60 text-slate-100 px-4 py-2 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                {/* 익명 게시글 수정 시 비밀번호 입력 (비로그인 사용자인 경우) */}
                {post?.author?.includes("익명") && !isAuthed && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-200 mb-2">
                      비밀번호 <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="password"
                      value={editPostPassword}
                      onChange={(e) => setEditPostPassword(e.target.value)}
                      placeholder="게시글 작성 시 설정한 비밀번호"
                      className="w-full rounded-lg border-2 border-slate-800 bg-slate-950/60 text-slate-100 px-4 py-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <p className="mt-1 text-xs text-slate-400">
                      비로그인 상태에서 작성한 익명 글을 수정하려면 작성 시 입력한 비밀번호가 필요합니다.
                    </p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-2">내용</label>
                  <div className={clsx(
                    "rounded-xl border-2 overflow-hidden board-shell bg-transparent",
                    theme === "light"
                      ? "border-slate-300 bg-white"
                      : "border-slate-800 bg-slate-950/60"
                  )}>
                    {editEditor && (
                      <>
                        <div className={clsx(
                          "flex flex-wrap items-center gap-1 p-2 border-b-2",
                          theme === "light"
                            ? "border-slate-300 bg-slate-100"
                            : "border-slate-800 bg-slate-900/80"
                        )}>
                          <div className="flex items-center gap-1 border-r pr-2 mr-2">
                            <button
                              type="button"
                              onClick={() => editEditor.chain().focus().toggleBold().run()}
                              disabled={!editEditor.can().chain().focus().toggleBold().run()}
                              className={clsx(
                                "px-2 py-1 rounded text-sm font-bold transition-all duration-300",
                                editEditor.isActive("bold")
                                  ? theme === "light"
                                    ? "bg-blue-500 text-white"
                                    : "bg-emerald-500 text-slate-900"
                                  : theme === "light"
                                  ? "hover:bg-slate-200 text-slate-700"
                                  : "hover:bg-slate-800 text-slate-300"
                              )}
                              title="굵게"
                            >
                              B
                            </button>
                            <button
                              type="button"
                              onClick={() => editEditor.chain().focus().toggleItalic().run()}
                              disabled={!editEditor.can().chain().focus().toggleItalic().run()}
                              className={clsx(
                                "px-2 py-1 rounded text-sm italic transition-all duration-300",
                                editEditor.isActive("italic")
                                  ? theme === "light"
                                    ? "bg-blue-500 text-white"
                                    : "bg-emerald-500 text-slate-900"
                                  : theme === "light"
                                  ? "hover:bg-slate-200 text-slate-700"
                                  : "hover:bg-slate-800 text-slate-300"
                              )}
                              title="기울임"
                            >
                              I
                            </button>
                          </div>
                          <div className="flex items-center gap-1 border-r pr-2 mr-2">
                            <button
                              type="button"
                              onClick={() => editEditor.chain().focus().toggleHeading({ level: 1 }).run()}
                              className={clsx(
                                "px-2 py-1 rounded text-xs font-semibold transition-all duration-300",
                                editEditor.isActive("heading", { level: 1 })
                                  ? theme === "light"
                                    ? "bg-blue-500 text-white"
                                    : "bg-emerald-500 text-slate-900"
                                  : theme === "light"
                                  ? "hover:bg-slate-200 text-slate-700"
                                  : "hover:bg-slate-800 text-slate-300"
                              )}
                              title="제목 1"
                            >
                              H1
                            </button>
                            <button
                              type="button"
                              onClick={() => editEditor.chain().focus().toggleHeading({ level: 2 }).run()}
                              className={clsx(
                                "px-2 py-1 rounded text-xs font-semibold transition-all duration-300",
                                editEditor.isActive("heading", { level: 2 })
                                  ? theme === "light"
                                    ? "bg-blue-500 text-white"
                                    : "bg-emerald-500 text-slate-900"
                                  : theme === "light"
                                  ? "hover:bg-slate-200 text-slate-700"
                                  : "hover:bg-slate-800 text-slate-300"
                              )}
                              title="제목 2"
                            >
                              H2
                            </button>
                            <button
                              type="button"
                              onClick={() => editEditor.chain().focus().toggleHeading({ level: 3 }).run()}
                              className={clsx(
                                "px-2 py-1 rounded text-xs font-semibold transition-all duration-300",
                                editEditor.isActive("heading", { level: 3 })
                                  ? theme === "light"
                                    ? "bg-blue-500 text-white"
                                    : "bg-emerald-500 text-slate-900"
                                  : theme === "light"
                                  ? "hover:bg-slate-200 text-slate-700"
                                  : "hover:bg-slate-800 text-slate-300"
                              )}
                              title="제목 3"
                            >
                              H3
                            </button>
                          </div>
                          <div className="flex items-center gap-1 border-r pr-2 mr-2">
                            <button
                              type="button"
                              onClick={() => editEditor.chain().focus().toggleBulletList().run()}
                              className={clsx(
                                "px-2 py-1 rounded text-sm transition-all duration-300",
                                editEditor.isActive("bulletList")
                                  ? theme === "light"
                                    ? "bg-blue-500 text-white"
                                    : "bg-emerald-500 text-slate-900"
                                  : theme === "light"
                                  ? "hover:bg-slate-200 text-slate-700"
                                  : "hover:bg-slate-800 text-slate-300"
                              )}
                              title="불릿 리스트"
                            >
                              •
                            </button>
                            <button
                              type="button"
                              onClick={() => editEditor.chain().focus().toggleOrderedList().run()}
                              className={clsx(
                                "px-2 py-1 rounded text-sm transition-all duration-300",
                                editEditor.isActive("orderedList")
                                  ? theme === "light"
                                    ? "bg-blue-500 text-white"
                                    : "bg-emerald-500 text-slate-900"
                                  : theme === "light"
                                  ? "hover:bg-slate-200 text-slate-700"
                                  : "hover:bg-slate-800 text-slate-300"
                              )}
                              title="번호 리스트"
                            >
                              1.
                            </button>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => editEditor.chain().focus().toggleBlockquote().run()}
                              className={clsx(
                                "px-2 py-1 rounded text-sm transition-all duration-300",
                                editEditor.isActive("blockquote")
                                  ? theme === "light"
                                    ? "bg-blue-500 text-white"
                                    : "bg-emerald-500 text-slate-900"
                                  : theme === "light"
                                  ? "hover:bg-slate-200 text-slate-700"
                                  : "hover:bg-slate-800 text-slate-300"
                              )}
                              title="인용구"
                            >
                              "
                            </button>
                          </div>
                        </div>
                        <EditorContent editor={editEditor} />
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingPost(false);
                      setEditPostTitle(post.title);
                      if (editEditor) {
                        editEditor.commands.setContent(post.content || "");
                      }
                      setEditPostPassword("");
                    }}
                    className="px-4 py-2 rounded-lg border border-slate-700 text-slate-200 hover:bg-slate-800 text-sm transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!editPostTitle.trim()) {
                        emitToast({ type: "error", message: "제목을 입력해주세요." });
                        return;
                      }
                      const content = editEditor?.getHTML() || "";
                      if (!content.trim() || content === "<p></p>") {
                        emitToast({ type: "error", message: "내용을 입력해주세요." });
                        return;
                      }
                      try {
                        let updated: CommunityPost;
                        const isAnonymousPost = post.author?.includes("익명");

                        if (isAnonymousPost && !isAuthed) {
                          if (!editPostPassword || editPostPassword.length < 4) {
                            emitToast({
                              type: "error",
                              message: "비밀번호(4자 이상)를 입력해주세요.",
                            });
                            return;
                          }
                          updated = await updatePostAnonymous(post.id, {
                            title: editPostTitle.trim(),
                            content,
                            anonymous: true,
                            password: editPostPassword,
                          });
                        } else {
                          updated = await updatePost(post.id, {
                            title: editPostTitle.trim(),
                            content,
                          });
                        }

                        setPost(updated);
                        setIsEditingPost(false);
                        setEditPostPassword("");
                        emitToast({ type: "success", message: "게시글이 수정되었습니다." });
                      } catch (err) {
                        const error = normalizeApiError(err);
                        emitToast({ type: "error", message: error.message || "게시글 수정에 실패했습니다." });
                      }
                    }}
                    className="px-4 py-2 rounded-lg bg-emerald-500 text-slate-900 text-sm font-semibold hover:bg-emerald-400 transition-colors"
                  >
                    저장
                  </button>
                </div>
              </div>
            ) : (
              <article
                className="prose prose-invert max-w-none bg-slate-950/70 px-4 sm:px-6 py-6 leading-relaxed text-slate-100"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            )}

            <section className="px-4 sm:px-6 py-6 space-y-4 bg-slate-950/80">
              <div className="flex items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-emerald-100">
                  <ChatBubbleBottomCenterTextIcon className="h-5 w-5" />
                  댓글
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-200">
                    {comments?.length ?? 0}
                  </span>
                </h2>
                <span className="text-xs text-slate-500">
                  로그인 또는 비밀번호 설정 시 이후 수정/삭제 가능
                </span>
              </div>

              <div className="space-y-3">
                {commentsLoading && (
                  <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-slate-400">
                    댓글을 불러오는 중...
                  </div>
                )}
                {commentsError && !commentsLoading && (
                  <div className="rounded-lg border border-red-700/50 bg-red-900/30 p-4 text-red-300">
                    {commentsError}
                  </div>
                )}
                {!commentsLoading && !commentsError && comments.length === 0 && (
                  <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 text-slate-400">
                    아직 댓글이 없습니다. 첫 댓글을 남겨보세요.
                  </div>
                )}
                {!commentsLoading &&
                  !commentsError &&
                  comments.map((c) => {
                    const commentLikeState = commentLikes[c.id] || { liked: false, count: c.likes ?? 0 };
                    const hasReplies = c.replies && c.replies.length > 0;
                    const isExpanded = expandedReplies.has(c.id);
                    
                    return (
                      <div
                        key={c.id}
                        ref={(el) => {
                          if (el) commentRefs.current[c.id] = el;
                        }}
                        className="space-y-3"
                      >
                        <div
                          className={`rounded-lg border ${
                            c.deleted
                              ? "border-slate-900 bg-slate-950/50 opacity-60"
                              : "border-slate-800 bg-slate-950/70 hover:border-emerald-600/40"
                          } p-3 sm:p-4 transition-colors ${
                            highlightedCommentId === c.id ? "ring-2 ring-emerald-500/70" : ""
                          }`}
                        >
                          {c.deleted ? (
                            <div className="space-y-3">
                              <div className="text-sm text-slate-500 italic">삭제된 댓글입니다.</div>
                              {/* 삭제된 댓글에 답글이 있는 경우 답글 표시 */}
                              {hasReplies && (
                                <div className="mt-3 pt-3 border-t border-slate-800/50">
                                  <div className="space-y-2 pl-4 border-l-2 border-slate-800/50">
                                    {c.replies?.map((reply) => {
                                      const replyLikeState = commentLikes[reply.id] || { liked: false, count: reply.likes ?? 0 };
                                      return (
                                        <div
                                          key={reply.id}
                                          className={`rounded-lg border p-3 ${
                                            reply.deleted
                                              ? "border-slate-900 bg-slate-950/50 opacity-60"
                                              : "border-slate-800/50 bg-slate-900/40"
                                          }`}
                                        >
                                          {reply.deleted ? (
                                            <div className="text-xs text-slate-500 italic">삭제된 답글입니다.</div>
                                          ) : (
                                            <>
                                                <div className="flex items-center gap-2 mb-2">
                                                  <UserIcon className="h-3.5 w-3.5 text-emerald-400" />
                                                  {post.notice && reply.author === post.author ? (
                                                    <span className="text-xs font-semibold inline-flex items-center gap-1 relative text-amber-300">
                                                      <span className="relative">
                                                        {reply.author || "관리자"}
                                                        <span className="absolute inset-0 blur-sm opacity-60 animate-pulse bg-amber-500" />
                                                      </span>
                                                      <ShieldExclamationIcon className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
                                                    </span>
                                                  ) : (
                                                    <span className="text-xs font-semibold text-emerald-100">{reply.author || "익명"}</span>
                                                  )}
                                                <span
                                                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                                                    (reply.author || "").includes("익명")
                                                      ? "bg-slate-800 text-slate-200"
                                                      : "bg-emerald-500/15 text-emerald-100 border border-emerald-400/40"
                                                  }`}
                                                >
                                                  {(reply.author || "").includes("익명") 
                                                    ? (reply.author || "").includes("로그인") ? "익명" : "비로그인"
                                                    : "로그인"}
                                                </span>
                                                <span className="text-[10px] text-slate-500">{formatDate(reply.createdAt)}</span>
                                              </div>
                                              {editingCommentId === reply.id ? (
                                                <div className="space-y-2 mb-2">
                                                  <textarea
                                                    value={editCommentContent}
                                                    onChange={(e) => setEditCommentContent(e.target.value)}
                                                    rows={3}
                                                    className="w-full rounded-lg border-2 border-slate-800 bg-slate-950/60 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                      onKeyDown={(e) => {
                                        if (e.key === "Escape") {
                                          e.preventDefault();
                                          setEditingCommentId(null);
                                          setEditCommentContent("");
                                        }
                                      }}
                                                  />
                                                  <div className="flex items-center justify-end gap-2">
                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        setEditingCommentId(null);
                                                        setEditCommentContent("");
                                                      }}
                                                      className="px-2 py-1 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs transition-colors"
                                                    >
                                                      취소
                                                    </button>
                                                    <button
                                                      type="button"
                                                      onClick={async () => {
                                                        if (!editCommentContent.trim()) {
                                                          emitToast({ type: "error", message: "답글 내용을 입력해주세요." });
                                                          return;
                                                        }
                                                        try {
                                                          await updateComment(post.id, reply.id, { content: editCommentContent.trim() });
                                                          const refreshed = await fetchComments(post.id);
                                                          let organized: Comment[] = [];
                                                          if (refreshed && refreshed.length > 0) {
                                                            const hasRepliesStructure = refreshed[0]?.replies !== undefined;
                                                            if (hasRepliesStructure) {
                                                              organized = refreshed;
                                                            } else {
                                                              const parentComments = refreshed.filter(c => !c.parentId);
                                                              const repliesMap = new Map<number, Comment[]>();
                                                              refreshed.forEach(c => {
                                                                if (c.parentId) {
                                                                  if (!repliesMap.has(c.parentId)) {
                                                                    repliesMap.set(c.parentId, []);
                                                                  }
                                                                  repliesMap.get(c.parentId)!.push(c);
                                                                }
                                                              });
                                                              organized = parentComments.map(parent => ({
                                                                ...parent,
                                                                replies: repliesMap.get(parent.id) || [],
                                                              }));
                                                            }
                                                          }
                                                          setComments(organized);
                                                          setEditingCommentId(null);
                                                          setEditCommentContent("");
                                                          emitToast({ type: "success", message: "답글이 수정되었습니다." });
                                                        } catch (err) {
                                                          const error = normalizeApiError(err);
                                                          emitToast({ type: "error", message: error.message || "답글 수정에 실패했습니다." });
                                                        }
                                                      }}
                                                      className="px-3 py-1 rounded-lg bg-emerald-500 text-slate-900 text-xs font-semibold hover:bg-emerald-400 transition-colors"
                                                    >
                                                      저장
                                                    </button>
                                                  </div>
                                                </div>
                                              ) : (
                                                <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere word-break-break-word mb-2">
                                                  {reply.content}
                                                </div>
                                              )}
                                              <div className="flex items-center gap-2">
                                                <button
                                                  type="button"
                                                  onClick={() => handleLikeComment(reply.id)}
                                                  className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] transition-colors ${
                                                    replyLikeState.liked
                                                      ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-200"
                                                      : "border-slate-700 text-slate-400 hover:border-blue-500/50 hover:text-blue-200"
                                                  }`}
                                                >
                                                  <HandThumbUpIcon className="h-3 w-3" />
                                                  {replyLikeState.count}
                                                </button>
                                                {/* 답글 수정/삭제 버튼 */}
                                                {editingCommentId !== reply.id && (
                                                  <>
                                                    {/* 로그인 사용자: 본인 답글만 수정 가능 */}
                                                    {currentUser && reply.author && !reply.author.includes("익명") && currentUser.nickname === reply.author && (
                                                      <button
                                                        type="button"
                                                        onClick={() => {
                                                          setEditingCommentId(reply.id);
                                                          setEditCommentContent(reply.content);
                                                        }}
                                                        className="rounded-md border border-slate-700 px-2 py-1 text-[11px] text-blue-300 hover:border-blue-500/70 hover:text-blue-200 transition-colors"
                                                      >
                                                        수정
                                                      </button>
                                                    )}
                                                    {/* 답글 삭제 버튼: 로그인 사용자 본인 답글이거나 익명 답글인 경우 */}
                                                    {((currentUser && reply.author && !reply.author.includes("익명") && currentUser.nickname === reply.author) ||
                                                      (!reply.author || reply.author.includes("익명"))) && (
                                                      <button
                                                        type="button"
                                                        onClick={async () => {
                                                          // 비로그인 답글이거나 익명 답글인 경우 비밀번호 확인
                                                          if (!reply.author || reply.author.includes("익명")) {
                                                            setShowPasswordModal({ type: "comment", id: reply.id });
                                                            return;
                                                          }
                                                          if (!window.confirm("답글을 삭제하시겠습니까?")) return;
                                                          handleDeleteComment(reply.id);
                                                        }}
                                                        className="rounded-md border border-slate-700 px-2 py-1 text-[11px] text-red-300 hover:border-red-500/70 hover:text-red-200 transition-colors"
                                                      >
                                                        삭제
                                                      </button>
                                                    )}
                                                  </>
                                                )}
                                              </div>
                                            </>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <>
                              <div className="grid gap-3 sm:grid-cols-[180px,1fr,auto] items-start">
                                <div className="flex items-center gap-2 text-sm text-emerald-100">
                                  <UserIcon className="h-4 w-4 text-emerald-400" />
                                  {post.notice && c.author === post.author ? (
                                    <span className="font-semibold truncate inline-flex items-center gap-1 relative text-amber-300">
                                      <span className="relative">
                                        {c.author || "관리자"}
                                        <span className="absolute inset-0 blur-sm opacity-60 animate-pulse bg-amber-500" />
                                      </span>
                                      <ShieldExclamationIcon className="h-4 w-4 text-amber-400 flex-shrink-0" />
                                    </span>
                                  ) : (
                                    <span className="font-semibold truncate">{c.author || "익명"}</span>
                                  )}
                                  <span
                                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                      (c.author || "").includes("익명")
                                        ? "bg-slate-800 text-slate-200"
                                        : "bg-emerald-500/15 text-emerald-100 border border-emerald-400/40"
                                    }`}
                                  >
                                    {(c.author || "").includes("익명") 
                                      ? (c.author || "").includes("로그인") ? "익명" : "비로그인"
                                      : "로그인"}
                                  </span>
                                  {post.author && c.author === post.author && (
                                    <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold bg-blue-500/20 text-blue-100 border border-blue-400/40">
                                      작성자
                                    </span>
                                  )}
                                </div>

                                {editingCommentId === c.id ? (
                                  <div className="space-y-2">
                                    <textarea
                                      value={editCommentContent}
                                      onChange={(e) => setEditCommentContent(e.target.value)}
                                      rows={4}
                                      className="w-full rounded-lg border-2 border-slate-800 bg-slate-950/60 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                      onKeyDown={(e) => {
                                        if (e.key === "Escape") {
                                          e.preventDefault();
                                          setEditingCommentId(null);
                                          setEditCommentContent("");
                                        }
                                      }}
                                    />
                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingCommentId(null);
                                          setEditCommentContent("");
                                        }}
                                        className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm transition-colors"
                                      >
                                        취소
                                      </button>
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          if (!editCommentContent.trim()) {
                                            emitToast({ type: "error", message: "댓글 내용을 입력해주세요." });
                                            return;
                                          }
                                          try {
                                            await updateComment(post.id, c.id, { content: editCommentContent.trim() });
                                            const refreshed = await fetchComments(post.id);
                                            let organized: Comment[] = [];
                                            if (refreshed && refreshed.length > 0) {
                                              const hasRepliesStructure = refreshed[0]?.replies !== undefined;
                                              if (hasRepliesStructure) {
                                                organized = refreshed;
                                              } else {
                                                const parentComments = refreshed.filter(c => !c.parentId);
                                                const repliesMap = new Map<number, Comment[]>();
                                                refreshed.forEach(c => {
                                                  if (c.parentId) {
                                                    if (!repliesMap.has(c.parentId)) {
                                                      repliesMap.set(c.parentId, []);
                                                    }
                                                    repliesMap.get(c.parentId)!.push(c);
                                                  }
                                                });
                                                organized = parentComments.map(parent => ({
                                                  ...parent,
                                                  replies: repliesMap.get(parent.id) || [],
                                                }));
                                              }
                                            }
                                            setComments(organized);
                                            setEditingCommentId(null);
                                            setEditCommentContent("");
                                            emitToast({ type: "success", message: "댓글이 수정되었습니다." });
                                          } catch (err) {
                                            const error = normalizeApiError(err);
                                            emitToast({ type: "error", message: error.message || "댓글 수정에 실패했습니다." });
                                          }
                                        }}
                                        className="px-4 py-1.5 rounded-lg bg-emerald-500 text-slate-900 text-sm font-semibold hover:bg-emerald-400 transition-colors"
                                      >
                                        저장
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere word-break-break-word">
                                    {c.content}
                                  </div>
                                )}

                                <div className="flex flex-wrap items-center gap-2 justify-end text-xs text-slate-300">
                                  <span className="inline-flex items-center gap-1 text-slate-400">
                                    <ClockIcon className="h-4 w-4" />
                                    {formatDate(c.createdAt)}
                                  </span>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-800/50">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = replyingTo === c.id ? null : c.id;
                                    setReplyingTo(next);
                                    if (next !== null) {
                                      window.setTimeout(() => {
                                        scrollToComment(c.id);
                                      }, 50);
                                    }
                                  }}
                                  className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-3 py-1.5 text-slate-300 hover:border-emerald-500/50 hover:text-emerald-200 transition-colors board-focus-ring"
                                >
                                  <ArrowUturnLeftIcon className="h-4 w-4" />
                                  답글 {hasReplies && `(${c.replies?.length || 0})`}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleLikeComment(c.id)}
                                  className={`inline-flex items-center gap-1 rounded-md border px-3 py-1.5 transition-colors board-focus-ring ${
                                    commentLikeState.liked
                                      ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-200"
                                      : "border-slate-700 text-slate-300 hover:border-blue-500/50 hover:text-blue-200"
                                  }`}
                                >
                                  <HandThumbUpIcon className="h-4 w-4" />
                                  추천 {commentLikeState.count > 0 && `(${commentLikeState.count})`}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setShowReportModal({ type: "comment", id: c.id })}
                                  className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-3 py-1.5 text-slate-300 hover:border-red-500/50 hover:text-red-200 transition-colors board-focus-ring"
                                >
                                  <FlagIcon className="h-4 w-4" />
                                  신고
                                </button>
                                {/* 댓글 수정/삭제 버튼 */}
                                {editingCommentId !== c.id && (
                                  <>
                                    {/* 로그인 사용자: 본인 댓글만 수정 가능 */}
                                    {currentUser && c.author && !c.author.includes("익명") && currentUser.nickname === c.author && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingCommentId(c.id);
                                          setEditCommentContent(c.content);
                                        }}
                                        className="rounded-md border border-slate-700 px-3 py-1.5 text-blue-300 hover:border-blue-500/70 hover:text-blue-200 transition-colors board-focus-ring"
                                      >
                                        수정
                                      </button>
                                    )}
                                    {/* 삭제 버튼: 로그인 사용자 본인 댓글이거나 익명 댓글인 경우 */}
                                    {(currentUser && c.author && !c.author.includes("익명") && currentUser.nickname === c.author) || 
                                     (!c.author || c.author.includes("익명")) ? (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          // 비로그인 댓글이거나 익명 댓글인 경우 비밀번호 확인
                                          if (!c.author || c.author.includes("익명")) {
                                            setShowPasswordModal({ type: "comment", id: c.id });
                                            return;
                                          }
                                          if (!window.confirm("댓글을 삭제하시겠습니까?")) return;
                                          handleDeleteComment(c.id);
                                        }}
                                        className="rounded-md border border-slate-700 px-3 py-1.5 text-red-300 hover:border-red-500/70 hover:text-red-200 transition-colors board-focus-ring"
                                      >
                                        삭제
                                      </button>
                                    ) : null}
                                  </>
                                )}
                              </div>

                              {/* 답글 작성 폼 */}
                              {replyingTo === c.id && (
                                <div className="mt-3 pt-3 border-t border-slate-800/50 space-y-2">
                                  <div className="flex items-center gap-2 text-xs text-slate-400">
                                    <label className={`inline-flex items-center gap-1 ${!isAuthed ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}>
                                      <input
                                        type="checkbox"
                                        checked={replyAnonymous[c.id] ?? isAnonymous}
                                        disabled={!isAuthed || (activeRule ? !activeRule.allowAnonymous : false)}
                                        onChange={(e) => {
                                          if (isAuthed) {
                                            setReplyAnonymous(prev => ({ ...prev, [c.id]: e.target.checked }));
                                          }
                                        }}
                                        className="h-3 w-3 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                                      />
                                      익명으로 작성
                                      {!isAuthed && (
                                        <span className="text-[10px] text-slate-500">(비로그인은 자동 익명)</span>
                                      )}
                                    </label>
                                    {activeRule && !activeRule.allowAnonymous && (
                                      <span className="text-[10px] text-red-400">
                                        익명 작성 불가
                                      </span>
                                    )}
                                  </div>
                                  <textarea
                                    value={replyContent[c.id] || ""}
                                    onChange={(e) => setReplyContent(prev => ({ ...prev, [c.id]: e.target.value }))}
                                    rows={3}
                                    placeholder="답글을 입력하세요..."
                                    className={`w-full rounded-lg border-2 bg-slate-950/60 text-slate-100 px-3 py-2 text-sm focus:outline-none ${
                                      replyErrors[c.id]
                                        ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                                        : "border-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                    }`}
                                    onKeyDown={(e) => {
                                      if (e.key === "Escape") {
                                        e.preventDefault();
                                        setReplyingTo(null);
                                        setReplyContent(prev => ({ ...prev, [c.id]: "" }));
                                        setReplyAnonymous(prev => ({ ...prev, [c.id]: isAnonymous }));
                                        setReplyPassword(prev => {
                                          const next = { ...prev };
                                          delete next[c.id];
                                          return next;
                                        });
                                        setReplyErrors(prev => {
                                          const next = { ...prev };
                                          delete next[c.id];
                                          return next;
                                        });
                                      }
                                    }}
                                  />
                                  {/* 비로그인 사용자: 답글 작성 시 비밀번호 입력 */}
                                  {!isAuthed && (
                                    <div>
                                      <label className="block text-xs font-semibold text-slate-200 mb-1">
                                        비밀번호 <span className="text-red-400">*</span>
                                        <span className="text-slate-500 font-normal ml-1">(삭제 시 필요, 4자 이상)</span>
                                      </label>
                                      <input
                                        type="password"
                                        value={replyPassword[c.id] || ""}
                                        onChange={(e) => setReplyPassword(prev => ({ ...prev, [c.id]: e.target.value }))}
                                        placeholder="비밀번호를 입력하세요 (4자 이상)"
                                        className="w-full rounded-lg border-2 border-slate-800 bg-slate-950/60 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                      />
                                    </div>
                                  )}
                                  {replyErrors[c.id] && (
                                    <p className="mt-1 text-xs text-red-400">{replyErrors[c.id]}</p>
                                  )}
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setReplyingTo(null);
                                        setReplyContent(prev => ({ ...prev, [c.id]: "" }));
                                        setReplyAnonymous(prev => ({ ...prev, [c.id]: isAnonymous }));
                                        setReplyPassword(prev => {
                                          const next = { ...prev };
                                          delete next[c.id];
                                          return next;
                                        });
                                      }}
                                      className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm transition-colors"
                                    >
                                      취소
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleReply(c.id)}
                                      disabled={commentLoading}
                                      className="px-4 py-1.5 rounded-lg bg-emerald-500 text-slate-900 text-sm font-semibold hover:bg-emerald-400 transition-colors disabled:opacity-60"
                                    >
                                      {commentLoading ? "등록 중..." : "답글 등록"}
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* 답글 목록 */}
                              {hasReplies && (
                                <div className="mt-3 pt-3 border-t border-slate-800/50">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newExpanded = new Set(expandedReplies);
                                      if (isExpanded) {
                                        newExpanded.delete(c.id);
                                      } else {
                                        newExpanded.add(c.id);
                                      }
                                      setExpandedReplies(newExpanded);
                                    }}
                                    className="flex items-center gap-2 text-xs text-slate-400 hover:text-emerald-300 transition-colors mb-2"
                                  >
                                    {isExpanded ? (
                                      <ChevronUpIcon className="h-4 w-4" />
                                    ) : (
                                      <ChevronDownIcon className="h-4 w-4" />
                                    )}
                                    답글 {c.replies?.length || 0}개 {isExpanded ? "접기" : "펼치기"}
                                  </button>
                                  
                                  {isExpanded && (
                                    <div className="space-y-2 pl-4 border-l-2 border-slate-800/50">
                                      {c.replies?.map((reply) => {
                                        const replyLikeState = commentLikes[reply.id] || { liked: false, count: reply.likes ?? 0 };
                                        return (
                                          <div
                                            key={reply.id}
                                          className={`rounded-lg border p-3 ${
                                              reply.deleted
                                                ? "border-slate-900 bg-slate-950/50 opacity-60"
                                                : "border-slate-800/50 bg-slate-900/40"
                                            } ${highlightedCommentId === reply.id ? "ring-2 ring-emerald-500/70" : ""}`}
                                          >
                                            {reply.deleted ? (
                                              <div className="text-xs text-slate-500 italic">삭제된 답글입니다.</div>
                                            ) : (
                                              <>
                                                <div className="flex items-center gap-2 mb-2">
                                                  <UserIcon className="h-3.5 w-3.5 text-emerald-400" />
                                                  {post.notice && reply.author === post.author ? (
                                                    <span className="text-xs font-semibold inline-flex items-center gap-1 relative text-amber-300">
                                                      <span className="relative">
                                                        {reply.author || "관리자"}
                                                        <span className="absolute inset-0 blur-sm opacity-60 animate-pulse bg-amber-500" />
                                                      </span>
                                                      <ShieldExclamationIcon className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
                                                    </span>
                                                  ) : (
                                                    <span className="text-xs font-semibold text-emerald-100">{reply.author || "익명"}</span>
                                                  )}
                                                  <span
                                                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                                                      (reply.author || "").includes("익명")
                                                        ? "bg-slate-800 text-slate-200"
                                                        : "bg-emerald-500/15 text-emerald-100 border border-emerald-400/40"
                                                    }`}
                                                  >
                                                    {(reply.author || "").includes("익명") 
                                                      ? (reply.author || "").includes("로그인") ? "익명" : "비로그인"
                                                      : "로그인"}
                                                  </span>
                                                  <span className="text-[10px] text-slate-500">{formatDate(reply.createdAt)}</span>
                                                </div>
                                                <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap break-words mb-2">
                                                  {reply.content}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                  <button
                                                    type="button"
                                                    onClick={() => handleLikeComment(reply.id)}
                                                    className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] transition-colors ${
                                                      replyLikeState.liked
                                                        ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-200"
                                                        : "border-slate-700 text-slate-400 hover:border-blue-500/50 hover:text-blue-200"
                                                    }`}
                                                  >
                                                    <HandThumbUpIcon className="h-3 w-3" />
                                                    {replyLikeState.count}
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={() => setShowReportModal({ type: "comment", id: reply.id })}
                                                    className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-2 py-1 text-[11px] text-slate-300 hover:border-red-500/50 hover:text-red-200 transition-colors"
                                                  >
                                                    <FlagIcon className="h-3 w-3" />
                                                    신고
                                                  </button>
                                                    <button
                                                      type="button"
                                                      onClick={async () => {
                                                        // 비로그인 답글이거나 익명 답글인 경우 비밀번호 확인
                                                        if (!reply.author || reply.author.includes("익명")) {
                                                          setShowPasswordModal({ type: "comment", id: reply.id });
                                                          return;
                                                        }
                                                        if (!window.confirm("답글을 삭제하시겠습니까?")) return;
                                                        handleDeleteComment(reply.id);
                                                      }}
                                                      className="rounded-md border border-slate-700 px-2 py-1 text-[11px] text-red-300 hover:border-red-500/70 hover:text-red-200 transition-colors"
                                                    >
                                                      삭제
                                                    </button>
                                                </div>
                                              </>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                <h3 className="flex items-center gap-2 text-base font-semibold text-emerald-100">
                  댓글 작성
                </h3>
                <form onSubmit={handleCommentSubmit} className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
                      <label className={`inline-flex items-center gap-2 ${!isAuthed ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}>
                        <input
                          type="checkbox"
                          checked={isAnonymous}
                          disabled={!isAuthed || (activeRule ? !activeRule.allowAnonymous : false)}
                          onChange={(e) => {
                            if (isAuthed) {
                              setIsAnonymous(e.target.checked);
                            }
                          }}
                          className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 disabled:opacity-50"
                        />
                        익명으로 작성
                        {!isAuthed && (
                          <span className="text-xs text-slate-500">(비로그인은 자동 익명)</span>
                        )}
                      </label>
                      {activeRule && !activeRule.allowAnonymous && (
                        <span className="text-xs text-red-400">
                          이 게시판은 익명 작성이 제한됩니다.
                        </span>
                      )}
                    </div>
                    {/* 비로그인 사용자 비밀번호 입력 (선택사항) */}
                    {!isAuthed && activeRule && activeRule.allowAnonymous && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          비밀번호 (선택)
                          <span className="text-slate-500 font-normal ml-1">(삭제 시 필요, 4자 이상)</span>
                        </label>
                        <input
                          type="password"
                          value={commentPassword}
                          onChange={(e) => setCommentPassword(e.target.value)}
                          placeholder="비밀번호를 입력하세요 (선택사항)"
                          minLength={4}
                          className="w-full rounded-lg border-2 border-slate-800 bg-slate-950/60 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>
                    )}
                  </div>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    placeholder="댓글을 입력하세요."
                    className={`w-full rounded-lg border-2 bg-slate-950/60 text-slate-100 px-4 py-3 focus:outline-none ${
                      commentError
                        ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                        : "border-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    }`}
                    onChangeCapture={() => {
                      if (commentError) {
                        setCommentError(null);
                      }
                    }}
                  />
                  {commentError && (
                    <p className="text-xs text-red-400 mt-1">{commentError}</p>
                  )}
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/community/${category}`}
                      className="px-4 py-2 rounded-lg border border-slate-700 text-slate-200 hover:bg-slate-800 transition-colors text-sm board-focus-ring"
                    >
                      목록으로
                    </Link>
                    <button
                      type="submit"
                      disabled={commentLoading}
                      className="px-5 py-2 rounded-lg bg-emerald-500 text-slate-900 text-sm font-semibold hover:bg-emerald-400 transition-colors disabled:opacity-60 board-focus-ring"
                    >
                      {commentLoading ? "등록 중..." : "댓글 등록"}
                    </button>
                  </div>
                </form>
              </div>
            </section>
          </div>
        )}
      </div>

      {/* 신고 모달 */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                <h3 className="text-lg font-semibold text-emerald-100">
                  {showReportModal.type === "post" ? "게시글 신고" : "댓글 신고"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowReportModal(null);
                  setReportReason("");
                  setReportDescription("");
                }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-2">
                  신고 사유 <span className="text-red-400">*</span>
                </label>
                <div className="space-y-2">
                  {reportReasons.map((reason) => (
                    <label
                      key={reason}
                      className="flex items-center gap-2 p-2 rounded-lg border border-slate-800 bg-slate-900/50 cursor-pointer hover:bg-slate-900/70 transition-colors"
                    >
                      <input
                        type="radio"
                        name="reportReason"
                        value={reason}
                        checked={reportReason === reason}
                        onChange={(e) => setReportReason(e.target.value)}
                        className="h-4 w-4 text-red-500 focus:ring-red-500 focus:ring-offset-slate-900"
                      />
                      <span className="text-sm text-slate-300">{reason}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-2">
                  상세 설명 (선택)
                </label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  rows={4}
                  placeholder="신고 사유에 대한 추가 설명을 입력해주세요."
                  className="w-full rounded-lg border-2 border-slate-800 bg-slate-900/60 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowReportModal(null);
                    setReportReason("");
                    setReportDescription("");
                  }}
                  className="flex-1 px-4 py-2 rounded-lg border border-slate-700 bg-slate-900/70 text-slate-200 hover:bg-slate-800 transition-colors text-sm font-semibold"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleReport}
                  disabled={reportLoading || !reportReason.trim()}
                  className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
                >
                  {reportLoading ? "신고 중..." : "신고하기"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 비밀번호 입력 모달 */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-emerald-100">
                비밀번호 입력
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordModal(null);
                  setDeletePassword("");
                }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-2">
                  비밀번호 <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  className="w-full rounded-lg border-2 border-slate-800 bg-slate-900/60 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      if (showPasswordModal.type === "post") {
                        handleDeletePost();
                      } else if (showPasswordModal.type === "comment" && showPasswordModal.id) {
                        handleDeleteComment(showPasswordModal.id, deletePassword);
                      }
                    }
                  }}
                  autoFocus
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(null);
                    setDeletePassword("");
                  }}
                  className="flex-1 px-4 py-2 rounded-lg border border-slate-700 bg-slate-900/70 text-slate-200 hover:bg-slate-800 transition-colors text-sm font-semibold"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (showPasswordModal.type === "post") {
                      handleDeletePost();
                    } else if (showPasswordModal.type === "comment" && showPasswordModal.id) {
                      handleDeleteComment(showPasswordModal.id, deletePassword);
                    }
                  }}
                  disabled={!deletePassword.trim()}
                  className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}


export default function CommunityDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">로딩 중...</p>
        </div>
      </div>
    }>
      <CommunityDetailPageContent />
    </Suspense>
  );
}
