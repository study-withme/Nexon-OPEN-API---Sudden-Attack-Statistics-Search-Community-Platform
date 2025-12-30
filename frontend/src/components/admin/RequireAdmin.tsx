"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { fetchMe } from "@/lib/auth";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { isAuthed } = useAuth();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthed) {
      setShowWarning(true);
      setChecking(false);
      // 3초 후 로그인 페이지로 리다이렉트
      setTimeout(() => {
        router.push("/login");
      }, 3000);
      return;
    }
    let cancelled = false;
    fetchMe().then((profile) => {
      if (cancelled) return;
      if (!profile || !(profile.admin || profile.roles?.some((r) => r.toUpperCase() === "ADMIN"))) {
        setShowWarning(true);
        setChecking(false);
        // 3초 후 홈으로 리다이렉트
        setTimeout(() => {
          router.push("/");
        }, 3000);
        return;
      }
      setAllowed(true);
      setChecking(false);
    }).catch(() => {
      if (!cancelled) {
        setShowWarning(true);
        setChecking(false);
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthed, router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-lg">관리자 권한을 확인하는 중입니다...</p>
        </div>
      </div>
    );
  }

  if (showWarning || !allowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="bg-red-500/20 border-2 border-red-500/50 rounded-lg p-6">
            <ExclamationTriangleIcon className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-400 mb-4">접근 권한이 없습니다</h2>
            <p className="text-slate-300 mb-2">
              {!isAuthed 
                ? "이 페이지는 로그인이 필요합니다."
                : "이 페이지는 관리자 권한이 필요합니다."}
            </p>
            <p className="text-slate-400 text-sm">
              잠시 후 자동으로 이동합니다...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
