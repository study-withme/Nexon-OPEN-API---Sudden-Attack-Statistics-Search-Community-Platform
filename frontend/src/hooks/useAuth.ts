"use client";

import { useEffect, useState } from "react";
import { clearToken, getStoredToken, persistToken } from "@/lib/auth";
import { setAuthToken } from "@/lib/api";

export function useAuth() {
  const [token, setToken] = useState<string | null>(() => getStoredToken());

  useEffect(() => {
    const handler = () => {
      const current = getStoredToken();
      setToken(current);
      setAuthToken(current || undefined);
    };
    // 초기 마운트 시 한 번 동기화
    handler();

    window.addEventListener("storage", handler);
    window.addEventListener("auth-change", handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener("auth-change", handler);
    };
  }, []);

  const loginSet = (newToken: string) => {
    persistToken(newToken);
    setToken(newToken);
  };

  const logout = () => {
    clearToken();
    setToken(null);
  };

  return {
    token,
    isAuthed: !!token,
    setToken: loginSet,
    logout,
  };
}
