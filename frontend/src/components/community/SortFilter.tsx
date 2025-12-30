"use client";

import { memo } from "react";
import { clsx } from "clsx";

type SortOption = {
  key: string;
  label: string;
};

type Props = {
  sortKey: string;
  sortOptions: SortOption[];
  onSortChange: (key: string) => void;
};

export const SortFilter = memo(function SortFilter({
  sortKey,
  sortOptions,
  onSortChange,
}: Props) {
  return (
    <div className="flex items-center gap-2 justify-start md:justify-end">
      {sortOptions.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onSortChange(opt.key)}
          className={clsx(
            "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors board-focus-ring",
            sortKey === opt.key
              ? "border-emerald-500/80 bg-emerald-500/15 text-emerald-100"
              : "border-slate-800 bg-slate-900/60 text-slate-300 hover:border-emerald-500/40 hover:text-emerald-200"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
});
