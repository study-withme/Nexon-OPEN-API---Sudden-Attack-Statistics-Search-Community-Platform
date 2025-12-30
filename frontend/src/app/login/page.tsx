"use client";

import { FormEvent, useEffect, useMemo, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { login } from "@/lib/auth";
import { emitToast } from "@/lib/toast";
import { useAuth } from "@/hooks/useAuth";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthed } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasRedirectedRef = useRef(false);
  const loginSuccessRef = useRef(false);

  const nextPath = useMemo(() => {
    const fromQuery = searchParams.get("next");
    if (fromQuery && fromQuery.startsWith("/")) return fromQuery;
    return "/";
  }, [searchParams]);

  // 이미 로그인 상태라면 바로 홈으로 보내고 토스트 노출 (한 번만 실행)
  // 단, 로그인 성공으로 인한 인증 상태 변경은 제외
  useEffect(() => {
    if (isAuthed && !hasRedirectedRef.current && !loginSuccessRef.current) {
      hasRedirectedRef.current = true;
      emitToast({ message: "이미 로그인된 상태입니다.", type: "info" });
      router.replace(nextPath);
    }
  }, [isAuthed, router, nextPath]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError("이메일과 비밀번호를 입력하세요.");
      return;
    }
    setLoading(true);
    try {
      await login({ email, password });
      loginSuccessRef.current = true;
      emitToast({ message: "로그인되었습니다.", type: "success" });
      router.replace(nextPath || "/");
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
        (err as { message?: string })?.message ||
        "로그인 중 오류가 발생했습니다.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 pb-16 pt-12 space-y-6">
      <div className="space-y-2 text-center">
        <p className="text-sm text-emerald-300">로그인</p>
        <h1 className="text-3xl font-semibold text-emerald-100">SA DATABASE</h1>
        <p className="text-sm text-slate-400">
          토큰 인증을 위해 아이디/비밀번호를 입력하세요.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div className="space-y-2">
          <label className="text-sm text-slate-200">이메일</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일"
            className="w-full rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-slate-200">비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호"
            className="w-full rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-emerald-400 disabled:opacity-60"
        >
          {loading ? "로그인 중..." : "로그인"}
        </button>
      </form>

      <p className="text-center text-sm text-slate-400">
        아직 계정이 없다면{" "}
        <a href="/register" className="text-emerald-300 hover:text-emerald-200">
          회원가입
        </a>
        .
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">로딩 중...</p>
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
