"use client";

import { useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import { clsx } from "clsx";
import { PolicyModal } from "./PolicyModal";

export function Footer() {
  const { theme } = useTheme();
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [policyType, setPolicyType] = useState<"terms" | "privacy" | "community">("terms");

  const handleOpenPolicy = (type: "terms" | "privacy" | "community") => {
    setPolicyType(type);
    setShowPolicyModal(true);
  };

  return (
    <>
      <footer className={clsx(
        "mt-12 border-t-2",
        theme === "light"
          ? "border-slate-300 bg-slate-50"
          : "border-slate-800/70 bg-slate-950/70"
      )}>
        <div className={clsx(
          "mx-auto flex max-w-6xl flex-col gap-4 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 text-xs sm:text-sm",
          theme === "light" ? "text-slate-600" : "text-slate-400"
        )}>
          <div className="flex items-center gap-4 mb-2">
            <img 
              src="https://open.api.nexon.com/static/suddenattack/img/473e902819d68aee4fa770977e70bdb9" 
              alt="서든어택 로고" 
              className={clsx(
                "h-6 sm:h-8 w-auto object-contain opacity-50",
                theme === "light" ? "brightness-0 invert-0" : "brightness-0 invert"
              )}
            />
          </div>
          
          {/* 정책 링크 */}
          <div className={clsx(
            "flex flex-wrap items-center gap-2 sm:gap-3",
            theme === "light" ? "text-slate-700" : "text-slate-200"
          )}>
            <button
              onClick={() => handleOpenPolicy("terms")}
              className={clsx(
                "transition-colors duration-300 hover:underline",
                theme === "light"
                  ? "text-blue-600 hover:text-blue-700"
                  : "text-emerald-300 hover:text-emerald-200"
              )}
            >
              서비스 이용약관
            </button>
            <span className={clsx(
              "h-4 w-px",
              theme === "light" ? "bg-slate-300" : "bg-slate-700"
            )} />
            <button
              onClick={() => handleOpenPolicy("privacy")}
              className={clsx(
                "transition-colors duration-300 hover:underline",
                theme === "light"
                  ? "text-blue-600 hover:text-blue-700"
                  : "text-emerald-300 hover:text-emerald-200"
              )}
            >
              개인정보 처리방침
            </button>
            <span className={clsx(
              "h-4 w-px",
              theme === "light" ? "bg-slate-300" : "bg-slate-700"
            )} />
            <button
              onClick={() => handleOpenPolicy("community")}
              className={clsx(
                "transition-colors duration-300 hover:underline",
                theme === "light"
                  ? "text-blue-600 hover:text-blue-700"
                  : "text-emerald-300 hover:text-emerald-200"
              )}
            >
              커뮤니티 운영정책
            </button>
          </div>

          {/* 연락처 정보 */}
          <div className={clsx(
            "flex flex-col gap-1",
            theme === "light" ? "text-slate-600" : "text-slate-400"
          )}>
            <p>대표: 김정욱 (찌잼)</p>
            <p className="text-xs sm:text-sm mt-2">
              이 서비스는 서든어택/넥슨의 공식 서비스가 아니며, 공개 API/데이터를 활용한 팬 메이드 프로젝트입니다.
            </p>
          </div>
        </div>
      </footer>
      <PolicyModal
        isOpen={showPolicyModal}
        onClose={() => setShowPolicyModal(false)}
        type={policyType}
      />
    </>
  );
}

