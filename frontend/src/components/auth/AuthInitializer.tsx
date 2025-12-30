"use client";

import { useEffect } from "react";
import { getStoredToken } from "@/lib/auth";
import { setAuthToken } from "@/lib/api";

/**
 * 앱 초기화 시 localStorage에 저장된 토큰을 자동으로 API 헤더에 설정하는 컴포넌트
 * 서버가 꺼졌다 켜지거나 브라우저를 닫았다 열어도 로그인 상태가 유지되도록 함
 */
export function AuthInitializer() {
  useEffect(() => {
    // 앱 시작 시 localStorage에서 토큰을 읽어서 API 헤더에 설정
    const token = getStoredToken();
    if (token) {
      setAuthToken(token);
    }
  }, []);

  return null; // UI를 렌더링하지 않음
}
