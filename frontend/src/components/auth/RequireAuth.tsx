"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/ui/State";

type Props = {
  children: React.ReactNode;
  redirectTo?: string;
};

export function RequireAuth({ children, redirectTo = "/login" }: Props) {
  const router = useRouter();
  const { isAuthed, token } = useAuth();

  useEffect(() => {
    if (!token) {
      router.replace(redirectTo);
    }
  }, [token, router, redirectTo]);

  if (!isAuthed) {
    return (
      <div className="mx-auto max-w-2xl px-4 pt-16">
        <LoadingSpinner message="인증 상태 확인 중..." />
      </div>
    );
  }

  return <>{children}</>;
}
