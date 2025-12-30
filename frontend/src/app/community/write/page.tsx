"use client";

import { useState, useCallback, useRef, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "@/hooks/useTheme";
import { clsx } from "clsx";
import {
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
  PhotoIcon,
  LinkIcon,
  VideoCameraIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
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
import DragDropZone from "@/components/DragDropZone";
import ImagePreviewModal from "@/components/ImagePreviewModal";
import { validateImageFile, compressImage, fileToBase64 } from "@/lib/imageUtils";
import { extractYouTubeVideoId, getYouTubeThumbnail, isValidYouTubeUrl } from "@/lib/youtubeUtils";
import { fetchLinkPreview, LinkPreviewData } from "@/lib/linkPreview";
import { saveAutoSaveData, loadAutoSaveData, clearAutoSaveData } from "@/lib/autoSave";
import { BoardRule, createPost, fetchBoardRules, generateAnonymousName } from "@/lib/community";
import { emitToast } from "@/lib/toast";
import { useAuth } from "@/hooks/useAuth";
import { normalizeApiError } from "@/lib/api";

const categoryMap: Record<string, string> = {
  notice: "공지",
  popular: "인기",
  free: "자유",
  ranked: "랭크전",
  custom: "대룰",
  supply: "보급",
  duo: "듀오",
};

function stripHtml(html: string) {
  if (!html) return "";
  const tmp = typeof window !== "undefined" ? document.createElement("div") : null;
  if (!tmp) return html;
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

// 툴바 컴포넌트 (텍스트 포맷팅만)
function Toolbar({ editor, theme }: { editor: Editor | null; theme: string }) {
  if (!editor) return null;

  return (
    <div className={clsx(
      "flex flex-wrap items-center gap-1 p-2 border-b-2",
      theme === "light"
        ? "border-slate-300 bg-slate-100"
        : "border-slate-800 bg-slate-900/80"
    )}>
      {/* 텍스트 스타일 */}
      <div className="flex items-center gap-1 border-r pr-2 mr-2">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={clsx(
            "px-2 py-1 rounded text-sm font-bold transition-all duration-300",
            editor.isActive("bold")
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
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={clsx(
            "px-2 py-1 rounded text-sm italic transition-all duration-300",
            editor.isActive("italic")
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
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          className={clsx(
            "px-2 py-1 rounded text-sm line-through transition-all duration-300",
            editor.isActive("strike")
              ? theme === "light"
                ? "bg-blue-500 text-white"
                : "bg-emerald-500 text-slate-900"
              : theme === "light"
              ? "hover:bg-slate-200 text-slate-700"
              : "hover:bg-slate-800 text-slate-300"
          )}
          title="취소선"
        >
          S
        </button>
      </div>

      {/* 헤더 */}
      <div className="flex items-center gap-1 border-r pr-2 mr-2">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={clsx(
            "px-2 py-1 rounded text-xs font-semibold transition-all duration-300",
            editor.isActive("heading", { level: 1 })
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
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={clsx(
            "px-2 py-1 rounded text-xs font-semibold transition-all duration-300",
            editor.isActive("heading", { level: 2 })
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
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={clsx(
            "px-2 py-1 rounded text-xs font-semibold transition-all duration-300",
            editor.isActive("heading", { level: 3 })
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

      {/* 리스트 */}
      <div className="flex items-center gap-1 border-r pr-2 mr-2">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={clsx(
            "px-2 py-1 rounded text-sm transition-all duration-300",
            editor.isActive("bulletList")
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
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={clsx(
            "px-2 py-1 rounded text-sm transition-all duration-300",
            editor.isActive("orderedList")
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

      {/* 인용구 */}
      <div className="flex items-center gap-1 border-r pr-2 mr-2">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={clsx(
            "px-2 py-1 rounded text-sm transition-all duration-300",
            editor.isActive("blockquote")
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

      {/* 표 */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          className={clsx(
            "px-2 py-1 rounded text-sm transition-all duration-300",
            theme === "light"
              ? "hover:bg-slate-200 text-slate-700"
              : "hover:bg-slate-800 text-slate-300"
          )}
          title="표 삽입"
        >
          ⧉
        </button>
      </div>
    </div>
  );
}

function CommunityWritePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme } = useTheme();
  const [title, setTitle] = useState("");
  const [showGuidance, setShowGuidance] = useState(true);
  const [showLegalWarning, setShowLegalWarning] = useState(true);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [youtubeLinks, setYoutubeLinks] = useState<Array<{ url: string; thumbnail: string; videoId: string }>>([]);
  const [urlLinks, setUrlLinks] = useState<Array<{ url: string; text: string; preview?: LinkPreviewData }>>([]);
  const [imagePreviewIndex, setImagePreviewIndex] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ [key: number]: number }>({});
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(true); // 비로그인 시 기본값 true
  const [titleLength, setTitleLength] = useState(0);
  const [contentLength, setContentLength] = useState(0);
  const [password, setPassword] = useState("");
  const { isAuthed } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rules, setRules] = useState<BoardRule[]>([]);
  const [rulesLoading, setRulesLoading] = useState(true);
  const [rulesError, setRulesError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [contentError, setContentError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  
  
  const categoryParam = searchParams.get("category");
  const category = categoryParam && categoryMap[categoryParam] ? categoryParam : "free";
  const categoryName = categoryMap[category] || "자유";
  const autoSaveKey = `community_write_${category}`;
  const activeRule = useMemo(
    () => rules.find((rule) => rule.category === category.toLowerCase()),
    [rules, category]
  );

  useEffect(() => {
    let mounted = true;
    const loadRules = async () => {
      setRulesLoading(true);
      setRulesError(null);
      try {
        const data = await fetchBoardRules();
        if (mounted) {
          setRules(data);
        }
      } catch (err) {
        const error = normalizeApiError(err);
        if (mounted) {
          setRulesError(error.message || "게시판 규칙을 불러오지 못했습니다.");
        }
      } finally {
        if (mounted) {
          setRulesLoading(false);
        }
      }
    };
    loadRules();
    return () => {
      mounted = false;
    };
  }, []);

  // 비로그인 상태일 때 익명을 기본값으로 설정하고 고정
  useEffect(() => {
    if (!isAuthed) {
      setIsAnonymous(true);
    }
  }, [isAuthed]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
        blockquote: false, // Blockquote는 별도로 추가
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
    onUpdate: ({ editor }) => {
      // 자동 저장
      const content = editor.getHTML();
      setContentLength(stripHtml(content).length);
      saveAutoSaveData(autoSaveKey, {
        title,
        content,
        category,
        images: uploadedImages,
        youtubeLinks: youtubeLinks.map(l => l.url),
        urlLinks,
      });
    },
  });

  // 자동 저장 데이터 불러오기
  useEffect(() => {
    const saved = loadAutoSaveData(autoSaveKey);
    if (saved) {
      if (saved.title) setTitle(saved.title);
      if (saved.content && editor) {
        editor.commands.setContent(saved.content);
        setContentLength(stripHtml(saved.content).length);
      }
      if (saved.images) setUploadedImages(saved.images);
      if (saved.youtubeLinks) {
        const youtubeData = saved.youtubeLinks.map(url => {
          const videoId = extractYouTubeVideoId(url);
          return {
            url,
            thumbnail: videoId ? getYouTubeThumbnail(videoId) : '',
            videoId: videoId || '',
          };
        });
        setYoutubeLinks(youtubeData);
      }
      if (saved.urlLinks) setUrlLinks(saved.urlLinks);
    }
  }, [autoSaveKey, editor]);

  useEffect(() => {
    setTitleLength(title.trim().length);
  }, [title]);

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && editor) {
        switch (e.key) {
          case 'b':
            e.preventDefault();
            editor.chain().focus().toggleBold().run();
            break;
          case 'i':
            e.preventDefault();
            editor.chain().focus().toggleItalic().run();
            break;
          case 'k':
            e.preventDefault();
            const url = window.prompt('링크 URL을 입력하세요:');
            if (url) {
              editor.chain().focus().setLink({ href: url }).run();
            }
            break;
          case 'z':
            if (!e.shiftKey) {
              e.preventDefault();
              editor.chain().focus().undo().run();
            } else {
              e.preventDefault();
              editor.chain().focus().redo().run();
            }
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editor]);

  // 이미지 파일 처리 (검증, 압축, 업로드)
  const handleImageFiles = async (files: File[]) => {
    setIsCompressing(true);
    const maxFiles = activeRule?.maxMediaCount ?? 5;
    const remainingSlots = maxFiles - uploadedImages.length;
    
    if (files.length > remainingSlots) {
      emitToast({
        type: "error",
        message: `이미지는 최대 ${maxFiles}개까지 첨부할 수 있습니다. (현재 ${uploadedImages.length}개)`,
      });
      setIsCompressing(false);
      return;
    }

    const validFiles: File[] = [];
    const errors: string[] = [];

    // 파일 검증
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validation = await validateImageFile(file);
      
      if (!validation.valid) {
        errors.push(`${file.name}: ${validation.error}`);
        continue;
      }
      
      validFiles.push(file);
    }

    if (errors.length > 0) {
      emitToast({
        type: "error",
        message: `다음 파일들을 업로드할 수 없습니다:\n${errors.join("\n")}`,
      });
    }

    // 이미지 압축 및 변환
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      try {
        setUploadProgress(prev => ({ ...prev, [i]: 0 }));
        const compressed = await compressImage(file, {
          maxWidth: 1920,
          maxHeight: 1920,
          quality: 0.8,
          maxSizeMB: 2,
        });
        setUploadProgress(prev => ({ ...prev, [i]: 100 }));
        
        const base64 = await fileToBase64(compressed);
        setUploadedImages(prev => [...prev, base64]);
        
        if (editor) {
          editor.chain().focus().setImage({ src: base64 }).run();
        }
      } catch (error) {
        console.error("이미지 처리 실패:", error);
        emitToast({
          type: "error",
          message: `${file.name} 처리 중 오류가 발생했습니다.`,
        });
      }
    }

    setIsCompressing(false);
    setUploadProgress({});
  };

  // YouTube 링크 추가
  const handleAddYouTube = async () => {
    if (activeRule && !activeRule.allowYoutube) {
      emitToast({
        type: "error",
        message: "해당 게시판에서는 동영상 첨부가 제한됩니다.",
      });
      return;
    }
    const url = window.prompt("YouTube URL을 입력하세요:");
    if (!url) return;
    
    if (!isValidYouTubeUrl(url)) {
      emitToast({ type: "error", message: "올바른 YouTube URL을 입력해주세요." });
      return;
    }

    const videoId = extractYouTubeVideoId(url);
    if (!videoId) {
      emitToast({ type: "error", message: "YouTube 비디오 ID를 추출할 수 없습니다." });
      return;
    }

    const thumbnail = getYouTubeThumbnail(videoId);
    const youtubeData = {
      url,
      thumbnail,
      videoId,
    };

    setYoutubeLinks(prev => [...prev, youtubeData]);
    if (editor) {
      editor.chain().focus().setYoutubeVideo({ src: url }).run();
    }
  };

  // URL 링크 추가
  const handleAddUrl = async () => {
    if (activeRule && !activeRule.allowLinks) {
      emitToast({
        type: "error",
        message: "해당 게시판에서는 링크 첨부가 제한됩니다.",
      });
      return;
    }
    const url = window.prompt("링크 URL을 입력하세요:");
    if (!url) return;
    
    try {
      const preview = await fetchLinkPreview(url);
      const linkData = {
        url,
        text: preview.title || url,
        preview,
      };

      setUrlLinks(prev => [...prev, linkData]);
      if (editor) {
        editor.chain().focus().setLink({ href: url }).run();
      }
    } catch (error) {
      console.error('링크 미리보기 가져오기 실패:', error);
      setUrlLinks(prev => [...prev, { url, text: url }]);
      if (editor) {
        editor.chain().focus().setLink({ href: url }).run();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTitleError(null);
    setContentError(null);
    setPasswordError(null);
    setMediaError(null);
    setRulesError(null);

    if (rulesLoading) {
      setRulesError("게시판 규칙을 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }
    if (!activeRule) {
      setRulesError("유효하지 않은 게시판입니다. 다시 시도해주세요.");
      return;
    }
    const content = editor?.getHTML() || "";
    if (!title.trim()) {
      setTitleError("제목을 입력해주세요.");
    }
    if (!content.trim() || content === "<p></p>") {
      setContentError("내용을 입력해주세요.");
    }
    if (!title.trim() || !content.trim() || content === "<p></p>") {
      return;
    }

    const textLength = stripHtml(content).length;
    if (title.trim().length < activeRule.minTitleLength || title.trim().length > activeRule.maxTitleLength) {
      setTitleError(
        `제목은 ${activeRule.minTitleLength}자 이상 ${activeRule.maxTitleLength}자 이하로 작성해주세요.`
      );
      return;
    }
    if (textLength < activeRule.minContentLength || textLength > activeRule.maxContentLength) {
      setContentError(
        `본문은 ${activeRule.minContentLength}자 이상 ${activeRule.maxContentLength}자 이하로 작성해주세요. (현재 ${textLength}자)`
      );
      return;
    }
    if (uploadedImages.length > activeRule.maxMediaCount) {
      setMediaError(`이미지는 최대 ${activeRule.maxMediaCount}개까지만 첨부할 수 있습니다.`);
      return;
    }

    // 비로그인 사용자는 비밀번호 필수
    if (!isAuthed && (!password || password.length < 4)) {
      setPasswordError("비로그인 게시글 작성 시 비밀번호(4자 이상)를 입력해주세요.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await createPost({
        title: title.trim(),
        content,
        category: category.toLowerCase(),
        anonymous: isAnonymous && activeRule?.allowAnonymous ? true : undefined,
        password: !isAuthed && password ? password : undefined,
      });
      clearAutoSaveData(autoSaveKey);
      emitToast({ type: "success", message: "게시글이 등록되었습니다." });
      router.push(`/community/${category.toLowerCase()}`);
    } catch (error) {
      const normalizedError = normalizeApiError(error);
      const message = normalizedError.message || "게시글 등록에 실패했습니다.";
      emitToast({ type: "error", message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 space-y-4">
      <style jsx global>{`
        .ProseMirror {
          ${theme === "light" 
            ? "color: #000000 !important; background: #ffffff !important;" 
            : "color: #e2e8f0 !important; background: #0f172a !important;"}
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
          ${theme === "light" 
            ? "color: #2563eb !important;" 
            : "color: #60a5fa !important;"}
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
          ${theme === "light" 
            ? "color: #94a3b8;" 
            : "color: #64748b;"}
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
      `}</style>
      
      <div className="board-shell bg-slate-950/85 p-6 sm:p-8 space-y-6 border border-slate-800">
        {/* 헤더 */}
        <div>
          <h1 className={clsx(
            "text-3xl font-semibold mb-2",
            theme === "light" ? "text-slate-900" : "text-emerald-200"
          )}>
            {categoryName} 게시판 글쓰기
          </h1>
          <div className={clsx(
            "flex items-center gap-1 text-sm",
            theme === "light" ? "text-red-600" : "text-red-400"
          )}>
            <ExclamationTriangleIcon className="h-4 w-4" />
            <span>* 커뮤니티 이용규칙에 준수하여 게시글 작성을 해주시기 바랍니다.</span>
          </div>
        </div>

        {/* 안내 탭 */}
        {showGuidance && (
          <div className={clsx(
            "rounded-xl border-2 p-4 relative",
            theme === "light"
              ? "border-blue-200 bg-blue-50"
              : "border-blue-500/30 bg-blue-500/10"
          )}>
            <button
              onClick={() => setShowGuidance(false)}
              className={clsx(
                "absolute top-2 right-2 p-1 rounded-lg transition-all duration-300",
                theme === "light"
                  ? "hover:bg-blue-100 text-blue-700"
                  : "hover:bg-blue-500/20 text-blue-300"
              )}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
            <div className="flex items-start gap-2 mb-3">
              <InformationCircleIcon className={clsx(
                "h-5 w-5 mt-0.5",
                theme === "light" ? "text-blue-600" : "text-blue-400"
              )} />
              <h3 className={clsx(
                "font-semibold text-sm",
                theme === "light" ? "text-blue-900" : "text-blue-200"
              )}>
                커뮤니티 이용규칙
              </h3>
            </div>
            <p className={clsx(
              "text-sm mb-3",
              theme === "light" ? "text-blue-800" : "text-blue-300"
            )}>
              SA DATABASE는 보다 깨끗한 커뮤니티를 위해 커뮤니티 이용규칙을 제정하여 운영하고 있습니다. 이용규칙 위반시 게시글이 삭제되고 서비스 이용이 제한됩니다.
            </p>
            <ul className={clsx(
              "space-y-2 text-sm list-disc list-inside",
              theme === "light" ? "text-blue-800" : "text-blue-300"
            )}>
              <li>불법프로그램을 홍보하는 행위</li>
              <li>불법프로그램을 옹호하거나 불법프로그램 명칭, 단어 언급하는 행위</li>
              <li>불법프로그램 내용으로 유추될 수 있는 비유, 은어 사용 행위</li>
              <li>클리너 프로그램을 홍보하는 행위</li>
              <li>클랜스카웃 및 클랜추천서를 판매하거나 구매하는 행위</li>
              <li>서든어택과 관련없는 광고 및 홍보 행위 (도박사이트, 불법사이트 홍보)</li>
            </ul>
          </div>
        )}

        {/* 법적 책임 안내 */}
        {showLegalWarning && (
          <div className={clsx(
            "rounded-xl border-2 p-4 relative",
            theme === "light"
              ? "border-red-200 bg-red-50"
              : "border-red-500/30 bg-red-500/10"
          )}>
            <button
              onClick={() => setShowLegalWarning(false)}
              className={clsx(
                "absolute top-2 right-2 p-1 rounded-lg transition-all duration-300",
                theme === "light"
                  ? "hover:bg-red-100 text-red-700"
                  : "hover:bg-red-500/20 text-red-300"
              )}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
            <div className="flex items-start gap-2">
              <ExclamationTriangleIcon className={clsx(
                "h-5 w-5 mt-0.5",
                theme === "light" ? "text-red-600" : "text-red-400"
              )} />
              <div>
                <h3 className={clsx(
                  "font-semibold text-sm mb-2",
                  theme === "light" ? "text-red-900" : "text-red-200"
                )}>
                  법적 책임 안내
                </h3>
                <p className={clsx(
                  "text-sm",
                  theme === "light" ? "text-red-800" : "text-red-300"
                )}>
                  게시글 작성 시 게시한 내용에 대한 법적 책임은 <strong>오로지 본인에게</strong> 있습니다. 
                  타인에 대한 명예훼손, 모욕, 허위사실 유포, 저작권 침해 등 불법적인 내용을 게시할 경우 
                  관련 법률에 따라 민형사상의 책임을 질 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 게시판 규칙 요약 */}
        <div className={clsx(
          "rounded-xl border-2 p-4",
          theme === "light"
            ? "border-slate-200 bg-slate-50"
            : "border-slate-800 bg-slate-900/70"
        )}>
          <div className="flex items-center justify-between mb-2">
            <h3 className={clsx(
              "text-sm font-semibold",
              theme === "light" ? "text-slate-900" : "text-emerald-200"
            )}>
              {categoryName} 게시판 규칙
            </h3>
            <span className="text-[11px] text-slate-500">
              글쓰기 제한, 길이, 첨부 규칙을 확인하세요.
            </span>
          </div>
          {rulesLoading && <p className="text-sm text-slate-400">규칙을 불러오는 중...</p>}
          {rulesError && !rulesLoading && (
            <p className="text-sm text-red-400">{rulesError}</p>
          )}
          {!rulesLoading && !rulesError && activeRule && (
            <div className="grid gap-2 text-sm text-slate-200 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-lg bg-slate-900/40 px-3 py-2 text-xs sm:text-sm">
                <span className="text-slate-400">제목 길이</span>
                <span className="font-semibold text-emerald-300">
                  {activeRule.minTitleLength}~{activeRule.maxTitleLength}자
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-900/40 px-3 py-2 text-xs sm:text-sm">
                <span className="text-slate-400">본문 길이</span>
                <span className="font-semibold text-emerald-300">
                  {activeRule.minContentLength}~{activeRule.maxContentLength}자
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-900/40 px-3 py-2 text-xs sm:text-sm">
                <span className="text-slate-400">미디어 첨부</span>
                <span className="font-semibold text-emerald-300">
                  최대 {activeRule.maxMediaCount}개, 링크 {activeRule.allowLinks ? "가능" : "불가"}, 영상 {activeRule.allowYoutube ? "가능" : "불가"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-900/40 px-3 py-2 text-xs sm:text-sm">
                <span className="text-slate-400">익명 작성</span>
                <span className="font-semibold text-emerald-300">
                  {activeRule.allowAnonymous ? "허용" : "제한"}
                </span>
              </div>
              {activeRule.notice && (
                <div className="sm:col-span-2 rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-2 text-xs sm:text-sm text-amber-200">
                  {activeRule.notice}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 제목 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={clsx(
                "block text-sm font-semibold",
                theme === "light" ? "text-slate-900" : "text-slate-200"
              )}>
                제목
              </label>
              {activeRule && (
                <span className={clsx(
                  "text-xs",
                  titleLength >= activeRule.minTitleLength && titleLength <= activeRule.maxTitleLength
                    ? "text-emerald-400"
                    : "text-red-400"
                )}>
                  {titleLength}/{activeRule.maxTitleLength}
                </span>
              )}
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              className={clsx(
                "w-full rounded-xl border-2 px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all duration-300",
                theme === "light"
                  ? titleError
                    ? "border-red-500 bg-white text-black focus:border-red-500 focus:ring-red-500/30"
                    : "border-slate-300 bg-white text-black focus:border-blue-500 focus:ring-blue-500/30"
                  : titleError
                    ? "border-red-500 bg-slate-950/60 text-slate-200 focus:border-red-500 focus:ring-red-500/30 board-focus-ring"
                    : "border-slate-800 bg-slate-950/60 text-slate-200 focus:border-emerald-400 focus:ring-emerald-500/30 board-focus-ring"
              )}
            />
            {titleError && (
              <p className="mt-1 text-xs text-red-400">{titleError}</p>
            )}
          </div>

          {/* 익명 옵션 */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <label className={clsx(
              "inline-flex items-center gap-2 text-sm",
              (!isAuthed || (activeRule && !activeRule.allowAnonymous)) ? "cursor-not-allowed opacity-60" : "cursor-pointer",
              theme === "light" ? "text-slate-800" : "text-slate-200"
            )}>
              <input
                type="checkbox"
                checked={isAnonymous}
                disabled={!isAuthed || (activeRule ? !activeRule.allowAnonymous : false)}
                onChange={(e) => {
                  if (isAuthed) {
                    setIsAnonymous(e.target.checked);
                  }
                }}
                className="h-4 w-4 rounded border-slate-400 text-emerald-500 focus:ring-emerald-500"
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
          
          {/* 비로그인 사용자 비밀번호 입력 */}
          {!isAuthed && activeRule && activeRule.allowAnonymous && (
            <div>
              <label className={clsx(
                "block text-sm font-semibold mb-2",
                theme === "light" ? "text-slate-900" : "text-slate-200"
              )}>
                비밀번호 <span className="text-red-400">*</span>
                <span className={clsx(
                  "text-xs font-normal ml-2",
                  theme === "light" ? "text-slate-600" : "text-slate-400"
                )}>
                  (비로그인 작성/삭제 시 필요, 4자 이상)
                </span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                minLength={4}
                className={clsx(
                  "w-full rounded-xl border-2 px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all duration-300",
                  theme === "light"
                    ? passwordError
                      ? "border-red-500 bg-white text-black focus:border-red-500 focus:ring-red-500/30"
                      : "border-slate-300 bg-white text-black focus:border-blue-500 focus:ring-blue-500/30"
                    : passwordError
                      ? "border-red-500 bg-slate-950/60 text-slate-200 focus:border-red-500 focus:ring-red-500/30 board-focus-ring"
                      : "border-slate-800 bg-slate-950/60 text-slate-200 focus:border-emerald-400 focus:ring-emerald-500/30 board-focus-ring"
                )}
              />
              {passwordError && (
                <p className="mt-1 text-xs text-red-400">{passwordError}</p>
              )}
            </div>
          )}
        </div>

          {/* 카테고리 태그 (자동 설정) */}
          <div>
            <label className={clsx(
              "block text-sm font-semibold mb-2",
              theme === "light" ? "text-slate-900" : "text-slate-200"
            )}>
              카테고리
            </label>
            <div className={clsx(
              "inline-flex items-center gap-2 px-3 py-2 rounded-lg border-2",
              theme === "light"
                ? "border-blue-300 bg-blue-50 text-blue-700"
                : "border-emerald-500/30 bg-emerald-500/20 text-emerald-300"
            )}>
              <span className="text-sm font-medium">{categoryName}</span>
              <span className={clsx(
                "text-xs",
                theme === "light" ? "text-blue-600" : "text-emerald-400"
              )}>
                (자동 설정됨)
              </span>
            </div>
          </div>

          {/* 내용 - Tiptap 에디터 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={clsx(
                "block text-sm font-semibold",
                theme === "light" ? "text-slate-900" : "text-slate-200"
              )}>
                내용
              </label>
              <div className="flex items-center gap-3">
                {activeRule && (
                  <span className={clsx(
                    "text-xs",
                    contentLength >= activeRule.minContentLength && contentLength <= activeRule.maxContentLength
                      ? "text-emerald-400"
                      : "text-red-400"
                  )}>
                    {contentLength}/{activeRule.maxContentLength}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className={clsx(
                    "px-3 py-1 rounded-lg text-xs font-semibold transition-colors",
                    showPreview
                      ? theme === "light"
                        ? "bg-blue-500 text-white"
                        : "bg-emerald-500 text-slate-900"
                      : theme === "light"
                      ? "border border-slate-300 text-slate-700 hover:bg-slate-100"
                      : "border border-slate-700 text-slate-300 hover:bg-slate-800"
                  )}
                >
                  {showPreview ? "편집하기" : "미리보기"}
                </button>
              </div>
            </div>
            
            {!showPreview ? (
              <div className={clsx(
                "rounded-xl border-2 overflow-hidden board-shell bg-transparent",
                theme === "light"
                  ? "border-slate-300 bg-white"
                  : "border-slate-800 bg-slate-950/60"
              )}>
                <Toolbar editor={editor} theme={theme} />
                <EditorContent editor={editor} />
              </div>
            ) : (
              <div className={clsx(
                "rounded-xl border-2 overflow-hidden",
                theme === "light"
                  ? "border-slate-300 bg-white"
                  : "border-slate-800 bg-slate-950/60"
              )}>
                <div className={clsx(
                  "px-4 py-3 border-b-2",
                  theme === "light"
                    ? "border-slate-300 bg-slate-100"
                    : "border-slate-800 bg-slate-900/80"
                )}>
                  <span className="text-sm font-semibold text-slate-400">미리보기</span>
                </div>
                <div
                  className={clsx(
                    "prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none p-6",
                    theme === "light"
                      ? "prose-slate text-black"
                      : "prose-invert text-slate-200"
                  )}
                  dangerouslySetInnerHTML={{ __html: editor?.getHTML() || "" }}
                />
              </div>
            )}
            {contentError && (
              <p className="mt-2 text-xs text-red-400">{contentError}</p>
            )}
            <div className={clsx(
              "mt-2 p-3 rounded-lg",
              theme === "light"
                ? "bg-blue-50 border border-blue-200"
                : "bg-blue-500/10 border border-blue-500/30"
            )}>
              <p className={clsx(
                "text-xs leading-relaxed",
                theme === "light" ? "text-blue-800" : "text-blue-300"
              )}>
                <strong>작성 가이드:</strong> 육하원칙에 의거하여 앞뒤 정황을 충분히 확인할 수 있도록 작성해주세요. 
                허위의 사실이나 증거가 부족한 내용을 기재하면 사이트 관리자에 의해 무통보 삭제되며, 
                삭제된 신고내역은 영구보관됩니다.
              </p>
            </div>
          </div>

          {/* 미디어 추가 카드 */}
          <div>
            <label className={clsx(
              "block text-sm font-semibold mb-3",
              theme === "light" ? "text-slate-900" : "text-slate-200"
            )}>
              미디어 추가
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* 이미지 업로드 카드 */}
              <div className={clsx(
                "rounded-xl border-2 p-4 transition-all duration-300 hover:scale-[1.02] cursor-pointer group",
                theme === "light"
                  ? "border-slate-300 bg-white hover:border-blue-400 hover:shadow-lg"
                  : "border-slate-800 bg-slate-900/70 hover:border-emerald-500/50 hover:shadow-emerald-900/20"
              )}
              onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className={clsx(
                    "p-3 rounded-xl",
                    theme === "light"
                      ? "bg-blue-100 group-hover:bg-blue-200"
                      : "bg-blue-500/20 group-hover:bg-blue-500/30"
                  )}>
                    <PhotoIcon className={clsx(
                      "h-8 w-8",
                      theme === "light" ? "text-blue-600" : "text-blue-400"
                    )} />
                  </div>
                  <div className="text-center">
                    <p className={clsx(
                      "text-sm font-semibold mb-1",
                      theme === "light" ? "text-slate-900" : "text-white"
                    )}>
                      이미지 업로드
                    </p>
                    <p className={clsx(
                      "text-xs",
                      theme === "light" ? "text-slate-500" : "text-slate-400"
                    )}>
                      파일 선택
                    </p>
                  </div>
                </div>
              </div>

              {/* YouTube 링크 카드 */}
              <div className={clsx(
                "rounded-xl border-2 p-4 transition-all duration-300 hover:scale-[1.02] cursor-pointer group",
                theme === "light"
                  ? "border-slate-300 bg-white hover:border-red-400 hover:shadow-lg"
                  : "border-slate-800 bg-slate-900/70 hover:border-red-500/50 hover:shadow-red-900/20"
              )}
              onClick={handleAddYouTube}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className={clsx(
                    "p-3 rounded-xl",
                    theme === "light"
                      ? "bg-red-100 group-hover:bg-red-200"
                      : "bg-red-500/20 group-hover:bg-red-500/30"
                  )}>
                    <VideoCameraIcon className={clsx(
                      "h-8 w-8",
                      theme === "light" ? "text-red-600" : "text-red-400"
                    )} />
                  </div>
                  <div className="text-center">
                    <p className={clsx(
                      "text-sm font-semibold mb-1",
                      theme === "light" ? "text-slate-900" : "text-white"
                    )}>
                      YouTube 동영상
                    </p>
                    <p className={clsx(
                      "text-xs",
                      theme === "light" ? "text-slate-500" : "text-slate-400"
                    )}>
                      링크 추가
                    </p>
                  </div>
                </div>
              </div>

              {/* URL 링크 카드 */}
              <div className={clsx(
                "rounded-xl border-2 p-4 transition-all duration-300 hover:scale-[1.02] cursor-pointer group",
                theme === "light"
                  ? "border-slate-300 bg-white hover:border-purple-400 hover:shadow-lg"
                  : "border-slate-800 bg-slate-900/70 hover:border-purple-500/50 hover:shadow-purple-900/20"
              )}
              onClick={handleAddUrl}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className={clsx(
                    "p-3 rounded-xl",
                    theme === "light"
                      ? "bg-purple-100 group-hover:bg-purple-200"
                      : "bg-purple-500/20 group-hover:bg-purple-500/30"
                  )}>
                    <LinkIcon className={clsx(
                      "h-8 w-8",
                      theme === "light" ? "text-purple-600" : "text-purple-400"
                    )} />
                  </div>
                  <div className="text-center">
                    <p className={clsx(
                      "text-sm font-semibold mb-1",
                      theme === "light" ? "text-slate-900" : "text-white"
                    )}>
                      링크 추가
                    </p>
                    <p className={clsx(
                      "text-xs",
                      theme === "light" ? "text-slate-500" : "text-slate-400"
                    )}>
                      URL 연결
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 드래그 앤 드롭 영역 */}
            <div className="mt-4">
              <DragDropZone
                onFilesSelected={handleImageFiles}
                maxFiles={activeRule?.maxMediaCount ?? 5}
                theme={theme}
                disabled={uploadedImages.length >= (activeRule?.maxMediaCount ?? 5) || isCompressing}
              />
              {isCompressing && (
                <div className={clsx(
                  "mt-2 p-2 rounded-lg",
                  theme === "light" ? "bg-blue-50" : "bg-blue-500/10"
                )}>
                  <p className={clsx(
                    "text-xs",
                    theme === "light" ? "text-blue-800" : "text-blue-300"
                  )}>
                    이미지 압축 중...
                  </p>
                </div>
              )}
            </div>

            {/* 파일 입력 (숨김) */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                if (files.length > 0) {
                  handleImageFiles(files);
                }
              }}
              className="hidden"
            />

            {/* 추가된 미디어 목록 */}
            {(uploadedImages.length > 0 || youtubeLinks.length > 0 || urlLinks.length > 0) && (
              <div className="mt-4 space-y-3">
                {/* 업로드된 이미지 */}
                {uploadedImages.length > 0 && (
                  <div>
                    <p className={clsx(
                      "text-xs font-semibold mb-2",
                      theme === "light" ? "text-slate-600" : "text-slate-400"
                    )}>
                      업로드된 이미지 ({uploadedImages.length}/{activeRule?.maxMediaCount ?? 5})
                    </p>
                    <div className="grid grid-cols-5 gap-2">
                      {uploadedImages.map((img, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={img}
                            alt={`이미지 ${index + 1}`}
                            className="w-full h-20 object-cover rounded-lg border-2 border-slate-800 cursor-pointer"
                            onClick={() => setImagePreviewIndex(index)}
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setUploadedImages(prev => prev.filter((_, i) => i !== index));
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* YouTube 링크 */}
                {youtubeLinks.length > 0 && (
                  <div>
                    <p className={clsx(
                      "text-xs font-semibold mb-2",
                      theme === "light" ? "text-slate-600" : "text-slate-400"
                    )}>
                      YouTube 동영상 ({youtubeLinks.length})
                    </p>
                    <div className="space-y-2">
                      {youtubeLinks.map((link, index) => (
                        <div
                          key={index}
                          className={clsx(
                            "flex items-center gap-3 p-3 rounded-lg border-2",
                            theme === "light"
                              ? "border-slate-200 bg-slate-50"
                              : "border-slate-800 bg-slate-900/50"
                          )}
                        >
                          {link.thumbnail && (
                            <img
                              src={link.thumbnail}
                              alt="YouTube 썸네일"
                              className="w-24 h-16 object-cover rounded"
                            />
                          )}
                          <span className={clsx(
                            "text-sm truncate flex-1",
                            theme === "light" ? "text-slate-700" : "text-slate-300"
                          )}>
                            {link.url}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setYoutubeLinks(prev => prev.filter((_, i) => i !== index));
                            }}
                            className="ml-2 p-1 rounded hover:bg-red-500/20 text-red-400"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* URL 링크 */}
                {urlLinks.length > 0 && (
                  <div>
                    <p className={clsx(
                      "text-xs font-semibold mb-2",
                      theme === "light" ? "text-slate-600" : "text-slate-400"
                    )}>
                      링크 ({urlLinks.length})
                    </p>
                    <div className="space-y-2">
                      {urlLinks.map((link, index) => (
                        <div
                          key={index}
                          className={clsx(
                            "flex items-center gap-3 p-3 rounded-lg border-2",
                            theme === "light"
                              ? "border-slate-200 bg-slate-50"
                              : "border-slate-800 bg-slate-900/50"
                          )}
                        >
                          {link.preview?.image && (
                            <img
                              src={link.preview.image}
                              alt="링크 미리보기"
                              className="w-16 h-16 object-cover rounded"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className={clsx(
                              "text-sm font-semibold truncate",
                              theme === "light" ? "text-slate-900" : "text-white"
                            )}>
                              {link.preview?.title || link.text}
                            </p>
                            {link.preview?.description && (
                              <p className={clsx(
                                "text-xs truncate mt-1",
                                theme === "light" ? "text-slate-600" : "text-slate-400"
                              )}>
                                {link.preview.description}
                              </p>
                            )}
                            <p className={clsx(
                              "text-xs truncate mt-1",
                              theme === "light" ? "text-slate-500" : "text-slate-500"
                            )}>
                              {link.url}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setUrlLinks(prev => prev.filter((_, i) => i !== index));
                            }}
                            className="ml-2 p-1 rounded hover:bg-red-500/20 text-red-400"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {mediaError && (
              <p className="mt-2 text-xs text-red-400">{mediaError}</p>
            )}
          </div>

          {/* 버튼 */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Link
              href={`/community/${category}`}
              className={clsx(
                "px-6 py-2 rounded-xl text-sm font-semibold transition-all duration-300",
                theme === "light"
                  ? "border-2 border-slate-300 text-slate-700 hover:bg-slate-100"
                  : "border-2 border-slate-700 text-slate-300 hover:bg-slate-800"
              )}
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className={clsx(
                "px-6 py-2 rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-105 active:scale-95",
                theme === "light"
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "bg-emerald-500 text-slate-900 hover:bg-emerald-400"
              )}
            >
              {isSubmitting ? "등록 중..." : "등록하기"}
            </button>
          </div>
        </form>
      </div>

      {/* 이미지 미리보기 모달 */}
      {imagePreviewIndex !== null && (
        <ImagePreviewModal
          images={uploadedImages}
          currentIndex={imagePreviewIndex}
          isOpen={imagePreviewIndex !== null}
          onClose={() => setImagePreviewIndex(null)}
          onPrevious={() => setImagePreviewIndex(prev => prev !== null && prev > 0 ? prev - 1 : prev)}
          onNext={() => setImagePreviewIndex(prev => prev !== null && prev < uploadedImages.length - 1 ? prev + 1 : prev)}
          onDelete={(index) => {
            setUploadedImages(prev => prev.filter((_, i) => i !== index));
            if (index >= uploadedImages.length - 1 && index > 0) {
              setImagePreviewIndex(index - 1);
            } else if (uploadedImages.length > 1) {
              setImagePreviewIndex(index);
            } else {
              setImagePreviewIndex(null);
            }
          }}
          theme={theme}
        />
      )}
    </div>
  );
}

export default function CommunityWritePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">로딩 중...</p>
        </div>
      </div>
    }>
      <CommunityWritePageContent />
    </Suspense>
  );
}