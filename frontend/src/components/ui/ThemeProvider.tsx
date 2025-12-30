"use client";

import { useEffect } from "react";
import { useTheme } from "@/hooks/useTheme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("theme-light", "theme-sadb");
    root.classList.add(`theme-${theme}`);
  }, [theme]);

  return <>{children}</>;
}
