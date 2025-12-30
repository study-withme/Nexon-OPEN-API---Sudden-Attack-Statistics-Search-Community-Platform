"use client";

import { useEffect, useState } from "react";

export type Theme = "light" | "sadb";

const THEME_STORAGE_KEY = "sa-db-theme";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "sadb";
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme;
    return stored || "sadb";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("theme-light", "theme-sadb");
    root.classList.add(`theme-${theme}`);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  return {
    theme,
    setTheme,
  };
}
