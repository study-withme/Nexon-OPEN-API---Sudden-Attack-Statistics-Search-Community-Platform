"use client";

import { useTheme, Theme } from "@/hooks/useTheme";
import { SunIcon, StarIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { clsx } from "clsx";

const themes: { value: Theme; label: string; icon: React.ReactNode }[] = [
  { value: "light", label: "라이트", icon: <SunIcon className="h-4 w-4" /> },
  { value: "sadb", label: "SADB", icon: <StarIcon className="h-4 w-4" /> },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all duration-300 theme-toggle-button"
        aria-label="테마 변경"
      >
        {themes.find((t) => t.value === theme)?.icon}
        <span className="hidden sm:inline">{themes.find((t) => t.value === theme)?.label}</span>
      </button>
      
      {open && (
        <>
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setOpen(false)}
          />
          <div className={clsx(
            "absolute top-full right-0 mt-1 w-32 rounded-lg border-2 backdrop-blur-md shadow-xl py-1 z-[9999]",
            theme === "light" ? "border-slate-300 bg-white shadow-slate-300/40" : "border-slate-800 bg-slate-900/95"
          )}>
            {themes.map((t) => (
              <button
                key={t.value}
                onClick={() => {
                  setTheme(t.value);
                  setOpen(false);
                }}
                className={clsx(
                  "w-full flex items-center gap-2 px-4 py-2 text-sm transition-all duration-300 text-left",
                  theme === t.value
                    ? theme === "light"
                      ? "bg-blue-500/30 text-black font-semibold"
                      : "bg-emerald-500/20 text-emerald-200"
                    : theme === "light"
                    ? "hover:bg-slate-100 hover:text-black text-slate-700"
                    : "hover:bg-slate-800 hover:text-emerald-200 text-slate-300"
                )}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
