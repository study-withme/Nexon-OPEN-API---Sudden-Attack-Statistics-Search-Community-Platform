"use client";

import { XMarkIcon, ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { clsx } from "clsx";

interface ImagePreviewModalProps {
  images: string[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onDelete?: (index: number) => void;
  theme: string;
}

export default function ImagePreviewModal({
  images,
  currentIndex,
  isOpen,
  onClose,
  onPrevious,
  onNext,
  onDelete,
  theme,
}: ImagePreviewModalProps) {
  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex];

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={clsx(
          "relative max-w-7xl max-h-[90vh] w-full mx-4",
          theme === "light" ? "bg-white" : "bg-slate-900"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className={clsx(
            "absolute top-4 right-4 z-10 p-2 rounded-full transition-all duration-300",
            theme === "light"
              ? "bg-white/90 hover:bg-white text-slate-900"
              : "bg-slate-800/90 hover:bg-slate-800 text-white"
          )}
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        {/* 삭제 버튼 */}
        {onDelete && (
          <button
            onClick={() => {
              onDelete(currentIndex);
              if (currentIndex >= images.length - 1 && currentIndex > 0) {
                onPrevious();
              } else if (images.length > 1) {
                onNext();
              } else {
                onClose();
              }
            }}
            className={clsx(
              "absolute top-4 left-4 z-10 px-4 py-2 rounded-lg transition-all duration-300",
              theme === "light"
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-red-600 hover:bg-red-700 text-white"
            )}
          >
            삭제
          </button>
        )}

        {/* 이미지 */}
        <div className="flex items-center justify-center p-8">
          <img
            src={currentImage}
            alt={`이미지 ${currentIndex + 1}`}
            className="max-w-full max-h-[80vh] object-contain rounded-lg"
            loading="lazy"
            decoding="async"
          />
        </div>

        {/* 네비게이션 버튼 */}
        {images.length > 1 && (
          <>
            <button
              onClick={onPrevious}
              disabled={currentIndex === 0}
              className={clsx(
                "absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full transition-all duration-300 disabled:opacity-30",
                theme === "light"
                  ? "bg-white/90 hover:bg-white text-slate-900"
                  : "bg-slate-800/90 hover:bg-slate-800 text-white"
              )}
            >
              <ArrowLeftIcon className="h-6 w-6" />
            </button>
            <button
              onClick={onNext}
              disabled={currentIndex === images.length - 1}
              className={clsx(
                "absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full transition-all duration-300 disabled:opacity-30",
                theme === "light"
                  ? "bg-white/90 hover:bg-white text-slate-900"
                  : "bg-slate-800/90 hover:bg-slate-800 text-white"
              )}
            >
              <ArrowRightIcon className="h-6 w-6" />
            </button>
          </>
        )}

        {/* 썸네일 갤러리 */}
        {images.length > 1 && (
          <div className={clsx(
            "absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 p-2 rounded-lg max-w-full overflow-x-auto",
            theme === "light" ? "bg-white/90" : "bg-slate-800/90"
          )}>
            {images.map((img, index) => (
              <button
                key={index}
                onClick={() => {
                  // 현재 인덱스 변경은 부모 컴포넌트에서 처리
                }}
                className={clsx(
                  "w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-300 flex-shrink-0",
                  index === currentIndex
                    ? theme === "light"
                      ? "border-blue-500"
                      : "border-emerald-500"
                    : theme === "light"
                    ? "border-slate-300 opacity-60 hover:opacity-100"
                    : "border-slate-600 opacity-60 hover:opacity-100"
                )}
              >
                <img
                  src={img}
                  alt={`썸네일 ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </button>
            ))}
          </div>
        )}

        {/* 인덱스 표시 */}
        <div className={clsx(
          "absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg",
          theme === "light" ? "bg-white/90 text-slate-900" : "bg-slate-800/90 text-white"
        )}>
          {currentIndex + 1} / {images.length}
        </div>
      </div>
    </div>
  );
}
