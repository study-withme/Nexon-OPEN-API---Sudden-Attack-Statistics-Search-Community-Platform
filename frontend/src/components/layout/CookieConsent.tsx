"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/hooks/useTheme";
import { clsx } from "clsx";
import { XMarkIcon, InformationCircleIcon } from "@heroicons/react/24/outline";
import { PolicyModal } from "./PolicyModal";

const COOKIE_CONSENT_KEY = "cookie-consent-accepted";

export function CookieConsent() {
  const { theme } = useTheme();
  const [showConsent, setShowConsent] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [policyType, setPolicyType] = useState<"terms" | "privacy" | "community">("terms");

  useEffect(() => {
    // 쿠키 동의 여부 확인
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      setShowConsent(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "true");
    // 쿠키 동의 쿠키 설정 (백엔드에서 확인 가능하도록)
    document.cookie = `${COOKIE_CONSENT_KEY}=true; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    setShowConsent(false);
  };

  const handleOpenPolicy = (type: "terms" | "privacy" | "community") => {
    setPolicyType(type);
    setShowPolicyModal(true);
  };

  if (!showConsent) return null;

  return (
    <>
      <div className={clsx(
        "fixed bottom-0 left-0 right-0 z-[9999] p-4 sm:p-6",
        theme === "light"
          ? "bg-white border-t-2 border-slate-300 shadow-2xl"
          : "bg-slate-900/95 border-t-2 border-slate-800 backdrop-blur-md shadow-2xl"
      )}>
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-start gap-3 flex-1">
              <InformationCircleIcon className={clsx(
                "h-6 w-6 flex-shrink-0 mt-0.5",
                theme === "light" ? "text-blue-600" : "text-emerald-400"
              )} />
              <div className="flex-1">
                <h3 className={clsx(
                  "text-base font-semibold mb-2",
                  theme === "light" ? "text-slate-900" : "text-emerald-200"
                )}>
                  쿠키 수집 및 정보제공 동의
                </h3>
                <p className={clsx(
                  "text-sm leading-relaxed mb-3",
                  theme === "light" ? "text-slate-700" : "text-slate-300"
                )}>
                  본 사이트는 서비스 제공을 위해 쿠키를 사용하며, 개인정보를 수집·이용합니다.
                  <br />
                  <span className="inline-flex items-center gap-2 mt-2">
                    <button
                      onClick={() => handleOpenPolicy("terms")}
                      className={clsx(
                        "text-sm underline hover:no-underline transition-all",
                        theme === "light" ? "text-blue-600 hover:text-blue-700" : "text-emerald-400 hover:text-emerald-300"
                      )}
                    >
                      서비스 이용약관
                    </button>
                    <span className={theme === "light" ? "text-slate-400" : "text-slate-500"}>|</span>
                    <button
                      onClick={() => handleOpenPolicy("privacy")}
                      className={clsx(
                        "text-sm underline hover:no-underline transition-all",
                        theme === "light" ? "text-blue-600 hover:text-blue-700" : "text-emerald-400 hover:text-emerald-300"
                      )}
                    >
                      개인정보 처리방침
                    </button>
                    <span className={theme === "light" ? "text-slate-400" : "text-slate-500"}>|</span>
                    <button
                      onClick={() => handleOpenPolicy("community")}
                      className={clsx(
                        "text-sm underline hover:no-underline transition-all",
                        theme === "light" ? "text-blue-600 hover:text-blue-700" : "text-emerald-400 hover:text-emerald-300"
                      )}
                    >
                      커뮤니티 운영정책
                    </button>
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={handleAccept}
                className={clsx(
                  "px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-105 active:scale-95 whitespace-nowrap",
                  theme === "light"
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-emerald-500 text-slate-900 hover:bg-emerald-400"
                )}
              >
                동의합니다
              </button>
            </div>
          </div>
        </div>
      </div>
      <PolicyModal
        isOpen={showPolicyModal}
        onClose={() => setShowPolicyModal(false)}
        type={policyType}
      />
    </>
  );
}
