"use client";

import { useEffect, useState } from "react";
import { CurrencyDollarIcon, ClockIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { useTheme } from "@/hooks/useTheme";
import { clsx } from "clsx";

export default function MarketOtherPage() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className={clsx(
        "card p-8 sm:p-12 relative overflow-hidden",
        theme === "light" 
          ? "border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50" 
          : "border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-emerald-500/10 to-cyan-500/10"
      )}>
        {/* 배경 장식 */}
        {theme === "sadb" && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
          </div>
        )}

        <div className="relative z-10 flex flex-col items-center text-center space-y-6">
          {/* 아이콘 */}
          <div className={clsx(
            "relative inline-flex items-center justify-center",
            mounted && "animate-bounce"
          )}>
            <div className={clsx(
              "absolute inset-0 rounded-full blur-xl",
              theme === "light" 
                ? "bg-amber-400/40" 
                : "bg-amber-500/30"
            )} />
            <div className={clsx(
              "relative p-6 rounded-full border-2",
              theme === "light"
                ? "bg-amber-100 border-amber-300"
                : "bg-amber-500/20 border-amber-500/50"
            )}>
              <CurrencyDollarIcon className={clsx(
                "h-12 w-12 sm:h-16 sm:w-16",
                theme === "light" ? "text-amber-600" : "text-amber-400"
              )} />
            </div>
          </div>

          {/* 준비중 배지 */}
          <div className={clsx(
            "inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 font-semibold text-sm sm:text-base",
            theme === "light"
              ? "bg-amber-500/20 border-amber-400 text-amber-700"
              : "bg-amber-500/20 border-amber-500/50 text-amber-300"
          )}>
            <ClockIcon className="h-5 w-5 animate-spin" style={{ animationDuration: "3s" }} />
            <span>준비중</span>
          </div>

          {/* 메인 타이틀 */}
          <div className="space-y-3">
            <h1 className={clsx(
              "text-3xl sm:text-4xl lg:text-5xl font-bold",
              theme === "light" ? "text-slate-900" : "text-emerald-100"
            )}>
              기타거래
            </h1>
            <p className={clsx(
              "text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed",
              theme === "light" ? "text-slate-700" : "text-slate-300"
            )}>
              조만간 빠르게 서비스 할 수 있도록<br />
              준비하겠습니다
            </p>
          </div>

          {/* 장식 요소 */}
          <div className="flex items-center gap-2 pt-4">
            {[0, 1, 2].map((i) => (
              <SparklesIcon
                key={i}
                className={clsx(
                  "h-5 w-5 animate-pulse",
                  theme === "light" ? "text-amber-400" : "text-amber-500",
                  i === 1 && "delay-300",
                  i === 2 && "delay-700"
                )}
              />
            ))}
          </div>

          {/* 추가 메시지 */}
          <div className={clsx(
            "mt-8 p-4 rounded-xl border-2 max-w-md",
            theme === "light"
              ? "bg-white/60 border-amber-200/50"
              : "bg-slate-900/40 border-amber-500/20"
          )}>
            <p className={clsx(
              "text-sm sm:text-base",
              theme === "light" ? "text-slate-600" : "text-slate-400"
            )}>
              더 나은 서비스를 위해 열심히 준비하고 있습니다.<br />
              곧 만나요! 🚀
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
