"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/hooks/useTheme";
import { clsx } from "clsx";
import {
  XMarkIcon,
  InformationCircleIcon,
  CameraIcon,
  PhotoIcon,
  LinkIcon,
  VideoCameraIcon,
  PlusIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import LinkExtension from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import YouTube from "@tiptap/extension-youtube";
import { getOuidByNickname, getProfile, PlayerProfileResponse } from "@/lib/playerApi";
import { createBarracksReport, resolveBarracksByUrl } from "@/lib/barracks";
import { emitToast } from "@/lib/toast";
import { normalizeApiError } from "@/lib/api";

const reportTypes = [
  { value: "bad-manner", label: "비매너" },
  { value: "suspicious", label: "비인가 프로그램 사용 의심" },
  { value: "abusing", label: "어뷰징" },
  { value: "fraud", label: "사기" },
  { value: "other", label: "기타" },
];

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
      <div className="flex items-center gap-1">
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
        >
          I
        </button>
      </div>
    </div>
  );
}

export default function BarracksReportWritePage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [nickname, setNickname] = useState("");
  const [barracksAddress, setBarracksAddress] = useState("");
  const [isTargetConfirmed, setIsTargetConfirmed] = useState(false);
  const [useDirectInput, setUseDirectInput] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [playerInfo, setPlayerInfo] = useState<PlayerProfileResponse | null>(null);
  const [showBarracksInput, setShowBarracksInput] = useState(false);
  const [reportType, setReportType] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [youtubeLinks, setYoutubeLinks] = useState<string[]>([]);
  const [urlLinks, setUrlLinks] = useState<Array<{ url: string; text: string }>>([]);
  const [showGuidance, setShowGuidance] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
        link: false, // Link는 별도로 추가 (중복 방지)
      }),
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
      Placeholder.configure({
        placeholder: "육하원칙에 의거하여 앞뒤 정황을 충분히 확인할 수 있도록 작성해주세요.",
      }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class: clsx(
          "prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none min-h-[200px] max-w-none p-4",
          theme === "light"
            ? "prose-slate text-black"
            : "prose-invert text-slate-200"
        ),
      },
    },
  });

  // 병영주소 URL에서 숫자 ID 추출
  const extractBarracksId = (url: string): string | null => {
    if (!url) return null;
    const match = url.match(/barracks\.sa\.nexon\.com\/(\d+)/);
    return match ? match[1] : null;
  };

  const handleSearchPlayer = async () => {
    if (!nickname.trim()) {
      alert("닉네임을 입력해주세요.");
      return;
    }

    setIsSearching(true);
    setShowBarracksInput(false);
    try {
      const idResponse = await getOuidByNickname(nickname.trim());
      if (idResponse?.ouid) {
        const profile = await getProfile(idResponse.ouid);
        setPlayerInfo(profile);
        setUseDirectInput(false);
        // ouid는 병영주소가 아니므로 빈 값으로 설정
        // 사용자가 직접 입력해야 함
        setBarracksAddress("");
      } else {
        setPlayerInfo(null);
        setUseDirectInput(true);
        setShowBarracksInput(true);
      }
      // 닉네임/병영주소가 바뀌었으므로 등록 상태 초기화
      setIsTargetConfirmed(false);
    } catch (error) {
      console.error("플레이어 조회 실패:", error);
      setPlayerInfo(null);
      setUseDirectInput(true);
      setShowBarracksInput(true);
    } finally {
      setIsSearching(false);
    }
  };

  const handleNotCorrect = () => {
    setShowBarracksInput(true);
    setPlayerInfo(null);
    setIsTargetConfirmed(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const isValidType = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type);
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
      return isValidType && isValidSize;
    });

    if (validFiles.length + images.length > 5) {
      alert("최대 5개의 이미지만 업로드할 수 있습니다.");
      return;
    }

    setImages(prev => [...prev, ...validFiles]);
    
    // 이미지를 Base64로 변환하여 에디터에 추가
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setUploadedImages(prev => [...prev, base64]);
        if (editor) {
          editor.chain().focus().setImage({ src: base64 }).run();
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddYouTube = () => {
    const url = window.prompt("YouTube URL을 입력하세요:");
    if (!url) return;
    
    // YouTube URL 검증
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    if (!youtubeRegex.test(url)) {
      alert("올바른 YouTube URL을 입력해주세요.");
      return;
    }

    setYoutubeLinks(prev => [...prev, url]);
    if (editor) {
      editor.chain().focus().setYoutubeVideo({ src: url }).run();
    }
  };

  const removeYouTube = (index: number) => {
    setYoutubeLinks(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddUrl = () => {
    const url = window.prompt("링크 URL을 입력하세요:");
    if (!url) return;
    
    setUrlLinks(prev => [...prev, { url, text: url }]);
    if (editor) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const removeUrl = (index: number) => {
    setUrlLinks(prev => prev.filter((_, i) => i !== index));
  };

  const handleConfirmTarget = async () => {
    const hasNickname = (playerInfo?.userName || nickname.trim()).length > 0;
    const hasBarracks = barracksAddress.trim().length > 0;

    if (!hasNickname || !hasBarracks) {
      emitToast({ message: "닉네임과 병영주소를 모두 입력한 후 등록해주세요.", type: "error" });
      return;
    }

    try {
      const resolved = await resolveBarracksByUrl(barracksAddress.trim());

      const expectedNickname = (playerInfo?.userName || nickname.trim()) || null;
      const expectedClan = playerInfo?.clanName || null;
      const expectedOuid = playerInfo?.ouid || null;

      // 병영 페이지에서 정보를 읽지 못한 경우 (Cloudflare 차단 등)
      if (!resolved.nickname) {
        // 스크래핑 실패 시에도, 이미 조회한 playerInfo가 있으면 그 정보로 검증 진행
        if (playerInfo && expectedNickname) {
          // 병영주소 URL 형식만 검증
          const barracksUrlPattern = /https?:\/\/barracks\.sa\.nexon\.com\/.+/;
          if (!barracksUrlPattern.test(barracksAddress.trim())) {
            setIsTargetConfirmed(false);
            emitToast({ 
              message: "올바른 병영수첩 주소 형식이 아닙니다. (예: https://barracks.sa.nexon.com/...)", 
              type: "error" 
            });
            return;
          }
          
          // 형식 검증 통과 시, 이미 조회한 닉네임 정보로 등록 허용
          if (resolved.barracksUrl) {
            setBarracksAddress(resolved.barracksUrl);
          }
          setIsTargetConfirmed(true);
          emitToast({ 
            message: "병영 페이지 자동 검증은 실패했지만, 조회한 닉네임 정보로 등록합니다. 병영주소를 직접 확인해주세요.", 
            type: "warning" 
          });
          return;
        } else {
          setIsTargetConfirmed(false);
          emitToast({ 
            message: "병영수첩 페이지에서 정보를 읽을 수 없습니다. 먼저 닉네임을 조회해주세요.", 
            type: "error" 
          });
          return;
        }
      }

      // 병영 페이지에서 닉네임을 성공적으로 읽은 경우: 정상 검증 진행
      // 닉네임 비교 (둘 다 있으면 대소문자 무시하고 비교)
      if (expectedNickname && resolved.nickname &&
          expectedNickname.toLowerCase() !== resolved.nickname.toLowerCase()) {
        setIsTargetConfirmed(false);
        emitToast({ message: "신고 대상 닉네임과 병영수첩 닉네임이 다릅니다.", type: "error" });
        return;
      }

      // 클랜 비교 (둘 다 값이 있을 때만 비교)
      if (expectedClan && resolved.clanName &&
          expectedClan.toLowerCase() !== resolved.clanName.toLowerCase()) {
        setIsTargetConfirmed(false);
        emitToast({ message: "신고 대상 클랜과 병영수첩 클랜이 다릅니다.", type: "error" });
        return;
      }

      // OUID 비교 (둘 다 있을 때만 비교)
      if (expectedOuid && resolved.ouid && expectedOuid !== resolved.ouid) {
        setIsTargetConfirmed(false);
        emitToast({ message: "신고 대상 계정과 병영수첩 계정이 다릅니다.", type: "error" });
        return;
      }

      // 병영주소를 정규화된 URL로 덮어쓰기
      if (resolved.barracksUrl) {
        setBarracksAddress(resolved.barracksUrl);
      }

      setIsTargetConfirmed(true);
      emitToast({ message: "신고 대상 정보가 검증되었고 등록되었습니다.", type: "success" });
    } catch (error) {
      const normalizedError = normalizeApiError(error);
      const msg = normalizedError.message || "병영수첩 주소 검증에 실패했습니다. 다시 시도해주세요.";
      setIsTargetConfirmed(false);
      emitToast({ message: msg, type: "error" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return; // 중복 제출 방지
    
    const content = editor?.getHTML() || "";

    if (!isTargetConfirmed) {
      emitToast({ message: "먼저 '신고 대상 등록하기' 버튼을 눌러 대상 정보를 등록해주세요.", type: "error" });
      return;
    }

    if (!reportType) {
      emitToast({ message: "신고 유형을 선택해주세요.", type: "error" });
      return;
    }

    if (!playerInfo && !barracksAddress.trim() && !showBarracksInput) {
      emitToast({ message: "플레이어를 조회하거나 병영주소를 입력해주세요.", type: "error" });
      return;
    }

    if (!content.trim() || content === "<p></p>") {
      emitToast({ message: "내용을 입력해주세요.", type: "error" });
      return;
    }

    const targetNickname = playerInfo?.userName || nickname.trim();
    const targetOuid = playerInfo?.ouid || null;
    // showBarracksInput이 true이거나 playerInfo가 없으면 직접 입력한 barracksAddress 사용
    const finalBarracksAddress = (showBarracksInput || !playerInfo) 
      ? barracksAddress.trim() 
      : (playerInfo?.ouid || barracksAddress.trim());

    if (!targetNickname) {
      emitToast({ message: "서든어택 닉네임을 입력해주세요.", type: "error" });
      return;
    }

    if (!finalBarracksAddress) {
      emitToast({ message: "병영주소를 입력해주세요.", type: "error" });
      return;
    }

    setIsSubmitting(true);
    try {
      // 신고 유형에 따른 제목 생성
      const reportTypeLabel = reportTypes.find(t => t.value === reportType)?.label || reportType;
      const title = `병영신고 - ${targetNickname} (${reportTypeLabel})`;

      await createBarracksReport({
        targetNickname: targetNickname,
        targetOuid: targetOuid || undefined,
        barracksAddress: finalBarracksAddress,
        reportType: reportType,
        title: title,
        content: content,
        anonymous: isAnonymous,
      });

      emitToast({ message: "병영신고가 등록되었습니다.", type: "success" });
      setTimeout(() => {
        router.push("/suddenattack/barracks-report");
      }, 1000);
    } catch (error) {
      const normalizedError = normalizeApiError(error);
      console.error("병영신고 등록 실패:", normalizedError);
      const errorMessage = normalizedError.message || "병영신고 등록에 실패했습니다. 다시 시도해주세요.";
      emitToast({ message: errorMessage, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
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

      <div className={clsx(
        "card p-6 sm:p-8 space-y-6",
        theme === "light"
          ? "bg-white border-slate-300"
          : "bg-slate-900/70 border-slate-800"
      )}>
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <h1 className={clsx(
            "text-3xl font-bold",
            theme === "light" ? "text-slate-900" : "text-white"
          )}>
            병영신고하기
          </h1>
          <Link
            href="/suddenattack/barracks-report"
            className={clsx(
              "p-2 rounded-lg transition-all duration-300",
              theme === "light"
                ? "hover:bg-slate-100 text-slate-700"
                : "hover:bg-slate-800 text-slate-400"
            )}
          >
            <XMarkIcon className="h-6 w-6" />
          </Link>
        </div>

        {/* 안내 */}
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
            <div className="flex items-start gap-2">
              <InformationCircleIcon className={clsx(
                "h-5 w-5 mt-0.5",
                theme === "light" ? "text-blue-600" : "text-blue-400"
              )} />
              <p className={clsx(
                "text-sm",
                theme === "light" ? "text-blue-800" : "text-blue-300"
              )}>
                육하원칙에 의거하여 앞뒤 정황을 충분히 확인할 수 있도록 작성해주세요. 
                허위의 사실이나 증거가 부족한 내용을 기재하면 사이트 관리자에 의해 무통보 삭제되며, 
                삭제된 신고내역은 영구보관됩니다.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 서든어택 닉네임 */}
          <div>
            <label className={clsx(
              "block text-sm font-semibold mb-2",
              theme === "light" ? "text-slate-900" : "text-slate-200"
            )}>
              서든어택 닉네임 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="예: 찌잼"
                disabled={useDirectInput && !playerInfo}
                className={clsx(
                  "flex-1 rounded-xl border-2 px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all duration-300",
                  theme === "light"
                    ? "border-slate-300 bg-white text-black focus:border-blue-500 focus:ring-blue-500/30 disabled:bg-slate-100"
                    : "border-slate-800 bg-slate-950/60 text-slate-200 focus:border-emerald-400 focus:ring-emerald-500/30 disabled:bg-slate-900"
                )}
              />
              <button
                type="button"
                onClick={handleSearchPlayer}
                disabled={isSearching || !nickname.trim()}
                className={clsx(
                  "px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 disabled:opacity-50",
                  theme === "light"
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-emerald-500 text-slate-900 hover:bg-emerald-400"
                )}
              >
                {isSearching ? "조회중..." : "조회"}
              </button>
            </div>
            {/* 유저 정보 카드 */}
            {playerInfo && !showBarracksInput && (
              <div className={clsx(
                "mt-4 p-5 rounded-xl border-2",
                theme === "light"
                  ? "bg-gradient-to-br from-emerald-50 to-blue-50 border-emerald-300"
                  : "bg-gradient-to-br from-emerald-500/20 to-blue-500/20 border-emerald-500/40"
              )}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={clsx(
                    "text-lg font-bold",
                    theme === "light" ? "text-slate-900" : "text-emerald-200"
                  )}>
                    조회된 유저 정보
                  </h3>
                  <button
                    type="button"
                    onClick={handleNotCorrect}
                    className={clsx(
                      "px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 hover:scale-105",
                      theme === "light"
                        ? "bg-red-100 text-red-700 hover:bg-red-200"
                        : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                    )}
                  >
                    아닙니다
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className={clsx(
                      "text-xs uppercase tracking-wide mb-1",
                      theme === "light" ? "text-slate-600" : "text-slate-400"
                    )}>
                      닉네임
                    </p>
                    <p className={clsx(
                      "text-base font-semibold",
                      theme === "light" ? "text-slate-900" : "text-emerald-200"
                    )}>
                      {playerInfo.userName}
                    </p>
                  </div>
                  <div>
                    <p className={clsx(
                      "text-xs uppercase tracking-wide mb-1",
                      theme === "light" ? "text-slate-600" : "text-slate-400"
                    )}>
                      클랜
                    </p>
                    <p className={clsx(
                      "text-base font-semibold",
                      theme === "light" ? "text-slate-900" : "text-emerald-200"
                    )}>
                      {playerInfo.clanName || "클랜 없음"}
                    </p>
                  </div>
                  <div>
                    <p className={clsx(
                      "text-xs uppercase tracking-wide mb-1",
                      theme === "light" ? "text-slate-600" : "text-slate-400"
                    )}>
                      킬뎃 (K/D)
                    </p>
                    <p className={clsx(
                      "text-base font-semibold",
                      theme === "light" ? "text-slate-900" : "text-emerald-200"
                    )}>
                      {playerInfo.recentKd?.toFixed(2) || "0.00"}
                    </p>
                  </div>
                  <div className="col-span-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className={clsx(
                        "text-xs uppercase tracking-wide",
                        theme === "light" ? "text-slate-600" : "text-slate-400"
                      )}>
                        병영주소 (실제)
                      </p>
                      {barracksAddress.trim() && (
                        <a
                          href={barracksAddress.trim()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={clsx(
                            "text-xs font-semibold underline",
                            theme === "light" ? "text-blue-600" : "text-emerald-300"
                          )}
                        >
                          해당 유저 병영수첩 바로가기
                        </a>
                      )}
                    </div>
                    <p className={clsx(
                      "text-sm",
                      theme === "light" ? "text-slate-500" : "text-slate-400"
                    )}>
                      닉네임으로 조회한 경우 병영주소를 직접 입력해주세요.
                    </p>
                    <input
                      type="text"
                      value={barracksAddress}
                      onChange={(e) => {
                        setBarracksAddress(e.target.value);
                        setIsTargetConfirmed(false);
                      }}
                      placeholder="예: https://barracks.sa.nexon.com/822744563/match"
                      className={clsx(
                        "w-full rounded-xl border-2 px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all duration-300",
                        theme === "light"
                          ? "border-slate-300 bg-white text-black focus:border-blue-500 focus:ring-blue-500/30"
                          : "border-slate-800 bg-slate-950/60 text-slate-200 focus:border-emerald-400 focus:ring-emerald-500/30"
                      )}
                    />
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleConfirmTarget}
                      className={clsx(
                        "px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-300",
                        isTargetConfirmed
                          ? theme === "light"
                            ? "bg-emerald-500 text-white hover:bg-emerald-600"
                            : "bg-emerald-400 text-slate-900 hover:bg-emerald-300"
                          : theme === "light"
                            ? "bg-slate-800 text-white hover:bg-slate-900"
                            : "bg-slate-700 text-slate-100 hover:bg-slate-600"
                      )}
                    >
                      {isTargetConfirmed ? "신고 대상 등록 완료" : "신고 대상 등록하기"}
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* 병영주소 직접 입력 */}
            {(showBarracksInput || (useDirectInput && !playerInfo)) && (
              <div className="mt-4">
                <label className={clsx(
                  "block text-sm font-semibold mb-2",
                  theme === "light" ? "text-slate-900" : "text-slate-200"
                )}>
                  병영주소 직접 입력 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={barracksAddress}
                  onChange={(e) => setBarracksAddress(e.target.value)}
                  placeholder="예: https://barracks.sa.nexon.com/822744563/match"
                  className={clsx(
                    "w-full rounded-xl border-2 px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all duration-300",
                    theme === "light"
                      ? "border-slate-300 bg-white text-black focus:border-blue-500 focus:ring-blue-500/30"
                      : "border-slate-800 bg-slate-950/60 text-slate-200 focus:border-emerald-400 focus:ring-emerald-500/30"
                  )}
                />
                <p className={clsx(
                  "mt-2 text-xs",
                  theme === "light" ? "text-slate-500" : "text-slate-400"
                )}>
                  병영 페이지의 전체 URL을 입력해주세요.
                </p>
              </div>
            )}
          </div>

          {/* 익명 게시 */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="anonymous"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            <label
              htmlFor="anonymous"
              className={clsx(
                "text-sm flex items-center gap-1",
                theme === "light" ? "text-slate-700" : "text-slate-300"
              )}
            >
              익명으로 게시하기
              <InformationCircleIcon className="h-4 w-4" />
            </label>
          </div>

          {/* 신고 유형 */}
          <div>
            <label className={clsx(
              "block text-sm font-semibold mb-2",
              theme === "light" ? "text-slate-900" : "text-slate-200"
            )}>
              신고 유형 <span className="text-red-500">*</span>
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className={clsx(
                "w-full rounded-xl border-2 px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all duration-300",
                theme === "light"
                  ? "border-slate-300 bg-white text-black focus:border-blue-500 focus:ring-blue-500/30"
                  : "border-slate-800 bg-slate-950/60 text-slate-200 focus:border-emerald-400 focus:ring-emerald-500/30"
              )}
            >
              <option value="">신고 유형 선택</option>
              {reportTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* 내용 */}
          <div>
            <label className={clsx(
              "block text-sm font-semibold mb-2",
              theme === "light" ? "text-slate-900" : "text-slate-200"
            )}>
              내용
            </label>
            <div className={clsx(
              "rounded-xl border-2 overflow-hidden",
              theme === "light"
                ? "border-slate-300 bg-white"
                : "border-slate-800 bg-slate-950/60"
            )}>
              <Toolbar editor={editor} theme={theme} />
              <EditorContent editor={editor} />
            </div>
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
                      업로드된 이미지 ({uploadedImages.length})
                    </p>
                    <div className="grid grid-cols-5 gap-2">
                      {uploadedImages.map((img, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={img}
                            alt={`이미지 ${index + 1}`}
                            className="w-full h-20 object-cover rounded-lg border-2 border-slate-800"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
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
                            "flex items-center justify-between p-3 rounded-lg border-2",
                            theme === "light"
                              ? "border-slate-200 bg-slate-50"
                              : "border-slate-800 bg-slate-900/50"
                          )}
                        >
                          <span className={clsx(
                            "text-sm truncate flex-1",
                            theme === "light" ? "text-slate-700" : "text-slate-300"
                          )}>
                            {link}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeYouTube(index)}
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
                            "flex items-center justify-between p-3 rounded-lg border-2",
                            theme === "light"
                              ? "border-slate-200 bg-slate-50"
                              : "border-slate-800 bg-slate-900/50"
                          )}
                        >
                          <span className={clsx(
                            "text-sm truncate flex-1",
                            theme === "light" ? "text-slate-700" : "text-slate-300"
                          )}>
                            {link.text}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeUrl(index)}
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
          </div>

          {/* 증거 자료 안내 */}
          <div className={clsx(
            "rounded-xl border-2 p-4",
            theme === "light"
              ? "border-amber-200 bg-amber-50"
              : "border-amber-500/30 bg-amber-500/10"
          )}>
            <div className="flex items-start gap-2 mb-2">
              <InformationCircleIcon className={clsx(
                "h-5 w-5 mt-0.5 flex-shrink-0",
                theme === "light" ? "text-amber-600" : "text-amber-400"
              )} />
              <div className="flex-1">
                <h4 className={clsx(
                  "font-semibold text-sm mb-1",
                  theme === "light" ? "text-amber-900" : "text-amber-200"
                )}>
                  사진 및 동영상 자료 안내
                </h4>
                <p className={clsx(
                  "text-sm mb-2",
                  theme === "light" ? "text-amber-800" : "text-amber-300"
                )}>
                  <strong>사진 및 동영상 자료는 반드시 명확해야 합니다.</strong> 
                  흐릿하거나 확인이 어려운 자료는 신고 처리에 반영되지 않을 수 있습니다.
                </p>
                <p className={clsx(
                  "text-sm",
                  theme === "light" ? "text-amber-800" : "text-amber-300"
                )}>
                  <strong>권장사항:</strong> 웬만하면 직접 업로드 대신{" "}
                  <span className={clsx(
                    "font-semibold underline",
                    theme === "light" ? "text-amber-900" : "text-amber-200"
                  )}>
                    YouTube에 업로드 후 영상 공유 링크를 삽입
                  </span>
                  하는 방식을 권장합니다. 
                  이렇게 하면 영상 품질이 유지되고 관리가 용이합니다.
                </p>
              </div>
            </div>
          </div>


          {/* 버튼 */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Link
              href="/suddenattack/barracks-report"
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
                "px-6 py-2 rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2",
                theme === "light"
                  ? "bg-blue-500 text-white hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
                  : "bg-emerald-500 text-slate-900 hover:bg-emerald-400 disabled:bg-emerald-700 disabled:text-slate-500 disabled:cursor-not-allowed"
              )}
            >
              {isSubmitting && (
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
              )}
              {isSubmitting ? "등록 중..." : "신고하기"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
