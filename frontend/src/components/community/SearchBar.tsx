"use client";

import { memo } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
};

export const SearchBar = memo(function SearchBar({
  search,
  onSearchChange,
  placeholder = "제목, 내용, 작성자로 검색",
}: Props) {
  return (
    <div className="relative">
      <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      <input
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-800 bg-slate-950/70 pl-10 pr-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-colors board-focus-ring"
        aria-label="게시글 검색"
      />
    </div>
  );
});
