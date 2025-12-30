"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { ToastProvider } from "@/components/ui/Toast";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { AuthInitializer } from "@/components/auth/AuthInitializer";

type Props = {
  children: React.ReactNode;
};

export function Providers({ children }: Props) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 기본 staleTime: 5분 (5분 동안은 새로운 데이터 fetch를 하지 않음)
            staleTime: 5 * 60 * 1000,
            // 기본 gcTime(이전 cacheTime): 10분 (10분 동안 캐시 유지)
            gcTime: 10 * 60 * 1000,
            // 자동 재시도: 1회 (실패 시 1번만 재시도)
            retry: 1,
            // 에러 발생 시 자동 재페치는 비활성화 (수동으로 refetch)
            refetchOnWindowFocus: false,
            // 네트워크 재연결 시 자동 재페치 활성화
            refetchOnReconnect: true,
            // 마운트 시 자동 재페치 비활성화 (캐시 우선 사용)
            refetchOnMount: false,
          },
          mutations: {
            // Mutation 실패 시 재시도 비활성화
            retry: false,
          },
        },
      })
  );
  return (
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <AuthInitializer />
        <ToastProvider>{children}</ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

