"use client";

import { useState, useRef, DragEvent } from "react";
import { clsx } from "clsx";
import { PhotoIcon } from "@heroicons/react/24/outline";

interface DragDropZoneProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  theme: string;
  disabled?: boolean;
}

export default function DragDropZone({
  onFilesSelected,
  maxFiles = 5,
  theme,
  disabled = false,
}: DragDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(
      (file) => file.type.startsWith('image/')
    );

    if (imageFiles.length > 0) {
      onFilesSelected(imageFiles);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFilesSelected(files);
    }
  };

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !disabled && fileInputRef.current?.click()}
      className={clsx(
        "rounded-xl border-2 border-dashed p-8 transition-all duration-300 cursor-pointer",
        isDragging
          ? theme === "light"
            ? "border-blue-500 bg-blue-50 scale-105"
            : "border-emerald-500 bg-emerald-500/20 scale-105"
          : theme === "light"
          ? "border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400"
          : "border-slate-700 bg-slate-900/50 hover:bg-slate-900/70 hover:border-slate-600",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        multiple
        onChange={handleFileInput}
        className="hidden"
        disabled={disabled}
      />
      <div className="flex flex-col items-center justify-center gap-3">
        <PhotoIcon
          className={clsx(
            "h-12 w-12 transition-all duration-300",
            isDragging
              ? theme === "light"
                ? "text-blue-600"
                : "text-emerald-400"
              : theme === "light"
              ? "text-slate-400"
              : "text-slate-500"
          )}
        />
        <div className="text-center">
          <p className={clsx(
            "text-sm font-semibold mb-1",
            theme === "light" ? "text-slate-900" : "text-white"
          )}>
            {isDragging ? "여기에 파일을 놓으세요" : "클릭하거나 파일을 드래그하세요"}
          </p>
          <p className={clsx(
            "text-xs",
            theme === "light" ? "text-slate-500" : "text-slate-400"
          )}>
            JPG, PNG, WebP · 최대 {maxFiles}개 · 각 10MB 이하
          </p>
        </div>
      </div>
    </div>
  );
}
