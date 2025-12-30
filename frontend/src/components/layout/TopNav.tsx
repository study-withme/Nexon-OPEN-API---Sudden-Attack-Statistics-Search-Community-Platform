"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Bars3Icon, 
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  ShieldExclamationIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline";
import { useState, useRef, useEffect } from "react";
import { clsx } from "clsx";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useTheme } from "@/hooks/useTheme";
import { emitToast } from "@/lib/toast";

const navItems = [
  { href: "/", label: "홈" },
];

const suddenAttackItems = [
  { href: "/suddenattack/stats", label: "전적조회" },
  { href: "/suddenattack/barracks-report", label: "병영박제" },
  { href: "/suddenattack/suspicious", label: "이상탐지", isWarning: true },
];

const communityItems = [
  { href: "/community/notice", label: "공지" },
  { href: "/community/popular", label: "인기" },
  { href: "/community/free", label: "자유" },
  { href: "/community/ranked", label: "랭크전" },
  { href: "/community/custom", label: "대룰" },
  { href: "/community/supply", label: "보급" },
  { href: "/community/duo", label: "듀오" },
];

const marketItems = [
  { href: "/market/fleamarket", label: "플리마켓" },
  { href: "/market/other", label: "기타거래" },
];

const clanMasterItems = [
  { href: "/clan/register", label: "클랜등록" },
  { href: "/clan/verify", label: "병영검증" },
  { href: "/clan/share", label: "정보공유" },
  { href: "/clan/delete-request", label: "삭제요청" },
];

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [suddenAttackOpen, setSuddenAttackOpen] = useState(false);
  const [communityOpen, setCommunityOpen] = useState(false);
  const [marketOpen, setMarketOpen] = useState(false);
  const [clanMasterOpen, setClanMasterOpen] = useState(false);
  const { isAuthed, logout } = useAuth();
  const { theme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    logout();
    emitToast({ message: "로그아웃되었습니다.", type: "info" });
    // 토스트가 표시될 시간을 확보하기 위해 약간의 지연 후 이동
    setTimeout(() => {
      router.push("/");
      router.refresh();
    }, 100);
  };

  const renderDesktopAuth = () => {
    if (!mounted) {
      return <div className="w-32 h-9" aria-hidden />;
    }
    return isAuthed ? (
      <button
        onClick={handleLogout}
        className={clsx(
          "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all duration-300",
          theme === "light"
            ? "border-slate-300 text-black hover:bg-slate-100"
            : "border-slate-700 text-slate-200 hover:bg-slate-800"
        )}
      >
        <ArrowRightOnRectangleIcon className="h-4 w-4" />
        로그아웃
      </button>
    ) : (
      <>
        <Link
          href="/login"
          className={clsx(
            "rounded-lg px-3 py-2 text-sm transition-all duration-300",
            theme === "light" ? "text-black hover:bg-slate-100" : "text-slate-200 hover:bg-slate-800"
          )}
        >
          로그인
        </Link>
        <Link
          href="/register"
          className={clsx(
            "rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-300",
            theme === "light" ? "bg-blue-500 text-white hover:bg-blue-600" : "bg-emerald-500 text-slate-900 hover:bg-emerald-400"
          )}
        >
          회원가입
        </Link>
      </>
    );
  };

  const renderMobileAuth = () => {
    if (!mounted) {
      return <div className="mt-2 h-9" aria-hidden />;
    }
    return isAuthed ? (
      <div className="mt-2 flex gap-2">
        <button
          onClick={() => {
            handleLogout();
            setOpen(false);
          }}
          className="flex-1 rounded-md border border-slate-700 px-3 py-2 text-center text-sm text-slate-200 hover:bg-slate-800 hover:border-emerald-500/50 hover:text-emerald-200 inline-flex items-center justify-center gap-2 transition-all duration-300"
        >
          <ArrowRightOnRectangleIcon className="h-4 w-4" />
          로그아웃
        </button>
      </div>
    ) : (
      <div className="mt-2 flex gap-2">
        <Link
          href="/login"
          className="flex-1 rounded-md px-3 py-2 text-center text-sm text-slate-200 hover:bg-slate-800"
          onClick={() => setOpen(false)}
        >
          로그인
        </Link>
        <Link
          href="/register"
          className="flex-1 rounded-md bg-emerald-500 px-3 py-2 text-center text-sm font-semibold text-slate-900 hover:bg-emerald-400 hover:scale-105 active:scale-95 transition-all duration-300"
          onClick={() => setOpen(false)}
        >
          회원가입
        </Link>
      </div>
    );
  };
  
  const suddenAttackRef = useRef<HTMLDivElement>(null);
  const communityRef = useRef<HTMLDivElement>(null);
  const marketRef = useRef<HTMLDivElement>(null);
  const clanMasterRef = useRef<HTMLDivElement>(null);
  
  // 홈 페이지가 아닐 때만 sticky 적용
  const isSticky = pathname !== "/";
  
  // 드롭다운 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suddenAttackRef.current && !suddenAttackRef.current.contains(event.target as Node)) {
        setSuddenAttackOpen(false);
      }
      if (communityRef.current && !communityRef.current.contains(event.target as Node)) {
        setCommunityOpen(false);
      }
      if (marketRef.current && !marketRef.current.contains(event.target as Node)) {
        setMarketOpen(false);
      }
      if (clanMasterRef.current && !clanMasterRef.current.contains(event.target as Node)) {
        setClanMasterOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className={clsx(
      "border-b-2 backdrop-blur-md transition-all duration-300 relative z-[100]",
      theme === "light" 
        ? "border-slate-300 bg-white supports-[backdrop-filter]:bg-white shadow-md shadow-slate-200/50"
        : "border-slate-800/80 bg-slate-900/75 supports-[backdrop-filter]:bg-slate-900/65 shadow-lg shadow-slate-900/50",
      isSticky && "sticky top-0"
    )}>
      <div className="mx-auto flex h-16 max-w-6xl items-center px-4">
        <div className="flex flex-1 items-center gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <img 
              src="https://open.api.nexon.com/static/suddenattack/img/473e902819d68aee4fa770977e70bdb9" 
              alt="서든어택 로고" 
              className={clsx(
                "h-8 w-auto object-contain transition-transform duration-300 group-hover:scale-110 logo-filter",
                theme === "light" ? "brightness-0 invert-0 opacity-80" : "brightness-0 invert-1 opacity-90"
              )}
            />
            <span className={clsx(
              "text-lg font-semibold display tracking-tight logo-text",
              theme === "light" ? "text-slate-900" : "text-emerald-300"
            )}>
              SA DATABASE
            </span>
          </Link>
          <nav className={clsx(
            "hidden items-center gap-1 text-sm md:flex",
            theme === "light" ? "text-black" : "text-slate-200"
          )}>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "rounded-lg px-3 py-2 transition-all duration-300",
                  pathname === item.href
                    ? theme === "light"
                      ? "bg-blue-500/30 text-blue-900 border-2 border-blue-400 font-semibold"
                      : "bg-emerald-500/20 text-emerald-200"
                    : theme === "light"
                    ? "hover:bg-slate-100 hover:text-black border border-transparent hover:border-slate-300"
                    : "hover:bg-slate-800 hover:text-emerald-200"
                )}
              >
                {item.label}
              </Link>
            ))}
            
            {/* 서든어택 드롭다운 */}
            <div 
              ref={suddenAttackRef} 
              className="relative"
              onMouseEnter={() => setSuddenAttackOpen(true)}
              onMouseLeave={() => setSuddenAttackOpen(false)}
            >
              <button
                className={clsx(
                  "flex items-center gap-1 rounded-lg px-3 py-2 transition-all duration-300",
                  pathname.startsWith("/suddenattack")
                    ? theme === "light"
                      ? "bg-blue-500/30 text-black border-2 border-blue-400 font-semibold"
                      : "bg-emerald-500/20 text-emerald-200"
                    : theme === "light"
                    ? "hover:bg-slate-100 hover:text-black border border-transparent hover:border-slate-300"
                    : "hover:bg-slate-800 hover:text-emerald-200"
                )}
              >
                서든어택
                <ChevronDownIcon className={clsx(
                  "h-4 w-4 transition-transform duration-300",
                  suddenAttackOpen && "rotate-180"
                )} />
              </button>
              {suddenAttackOpen && (
                <div 
                  className="absolute top-full left-0 pt-1 w-48 z-[9999]"
                >
                  <div className={clsx(
                    "rounded-lg border-2 backdrop-blur-md shadow-xl py-1",
                    theme === "light" ? "border-slate-300 bg-white shadow-slate-300/40" : "border-slate-800 bg-slate-900/95"
                  )}>
                    {suddenAttackItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={clsx(
                          "flex items-center gap-2 px-4 py-2 text-sm transition-all duration-300",
                          pathname === item.href
                            ? theme === "light"
                              ? "bg-blue-500/30 text-black border-l-4 border-blue-500"
                              : "bg-emerald-500/20 text-emerald-200"
                            : item.isWarning
                            ? theme === "light"
                              ? "hover:bg-red-100 hover:text-red-700 text-red-600 border-l-4 border-transparent hover:border-red-500"
                              : "hover:bg-red-500/20 hover:text-red-300 text-red-400"
                            : theme === "light"
                            ? "hover:bg-slate-100 hover:text-black text-black border-l-4 border-transparent hover:border-slate-300"
                            : "hover:bg-slate-800 hover:text-emerald-200"
                        )}
                      >
                        {item.isWarning && (
                          <ExclamationTriangleIcon className="h-4 w-4" />
                        )}
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* 커뮤니티 드롭다운 */}
            <div 
              ref={communityRef} 
              className="relative"
              onMouseEnter={() => setCommunityOpen(true)}
              onMouseLeave={() => setCommunityOpen(false)}
            >
              <button
                className={clsx(
                  "flex items-center gap-1 rounded-lg px-3 py-2 transition-all duration-300",
                  pathname.startsWith("/community")
                    ? theme === "light"
                      ? "bg-blue-500/30 text-black border-2 border-blue-400 font-semibold"
                      : "bg-emerald-500/20 text-emerald-200"
                    : theme === "light"
                    ? "hover:bg-slate-100 hover:text-black border border-transparent hover:border-slate-300"
                    : "hover:bg-slate-800 hover:text-emerald-200"
                )}
              >
                커뮤니티
                <ChevronDownIcon className={clsx(
                  "h-4 w-4 transition-transform duration-300",
                  communityOpen && "rotate-180"
                )} />
              </button>
              {communityOpen && (
                <div 
                  className="absolute top-full left-0 pt-1 w-40 z-[9999]"
                >
                  <div className={clsx(
                    "rounded-lg border-2 backdrop-blur-md shadow-xl py-1",
                    theme === "light" ? "border-slate-300 bg-white shadow-slate-300/40" : "border-slate-800 bg-slate-900/95"
                  )}>
                    {communityItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={clsx(
                          "block px-4 py-2 text-sm transition-all duration-300",
                          pathname === item.href
                            ? theme === "light"
                              ? "bg-blue-500/30 text-black border-l-4 border-blue-500"
                              : "bg-emerald-500/20 text-emerald-200"
                            : theme === "light"
                            ? "hover:bg-slate-100 hover:text-black text-black border-l-4 border-transparent hover:border-slate-300"
                            : "hover:bg-slate-800 hover:text-emerald-200"
                        )}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* 마켓 드롭다운 */}
            <div 
              ref={marketRef} 
              className="relative"
              onMouseEnter={() => setMarketOpen(true)}
              onMouseLeave={() => setMarketOpen(false)}
            >
              <button
                className={clsx(
                  "flex items-center gap-1 rounded-lg px-3 py-2 transition-all duration-300",
                  pathname.startsWith("/market")
                    ? theme === "light"
                      ? "bg-blue-500/30 text-black border-2 border-blue-400 font-semibold"
                      : "bg-emerald-500/20 text-emerald-200"
                    : theme === "light"
                    ? "hover:bg-slate-100 hover:text-black border border-transparent hover:border-slate-300"
                    : "hover:bg-slate-800 hover:text-emerald-200"
                )}
              >
                마켓
                <ChevronDownIcon className={clsx(
                  "h-4 w-4 transition-transform duration-300",
                  marketOpen && "rotate-180"
                )} />
              </button>
              {marketOpen && (
                <div 
                  className="absolute top-full left-0 pt-1 w-36 z-[9999]"
                >
                  <div className={clsx(
                    "rounded-lg border-2 backdrop-blur-md shadow-xl py-1",
                    theme === "light" ? "border-slate-300 bg-white shadow-slate-300/40" : "border-slate-800 bg-slate-900/95"
                  )}>
                    {marketItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={clsx(
                          "block px-4 py-2 text-sm transition-all duration-300",
                          pathname === item.href
                            ? theme === "light"
                              ? "bg-blue-500/30 text-black border-l-4 border-blue-500"
                              : "bg-emerald-500/20 text-emerald-200"
                            : theme === "light"
                            ? "hover:bg-slate-100 hover:text-black text-black border-l-4 border-transparent hover:border-slate-300"
                            : "hover:bg-slate-800 hover:text-emerald-200"
                        )}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </nav>
        </div>
        <div className="hidden items-center gap-2 md:flex">
          {/* 클랜 마스터 메뉴 */}
          <div 
            ref={clanMasterRef} 
            className="relative"
            onMouseEnter={() => setClanMasterOpen(true)}
            onMouseLeave={() => setClanMasterOpen(false)}
          >
            <button
              className={clsx(
                "flex items-center gap-1 rounded-lg px-3 py-2 text-sm transition-all duration-300",
                pathname.startsWith("/clan")
                  ? theme === "light"
                    ? "border-2 border-amber-400 bg-amber-500/30 text-black font-semibold"
                    : "border border-amber-500/30 bg-amber-500/20 text-amber-200"
                  : theme === "light"
                  ? "border-2 border-amber-300 bg-amber-500/10 text-black hover:bg-amber-500/20 hover:border-amber-400"
                  : "border border-amber-500/30 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20"
              )}
            >
              <ShieldExclamationIcon className="h-4 w-4" />
              클랜 마스터
              <ChevronDownIcon className={clsx(
                "h-4 w-4 transition-transform duration-300",
                clanMasterOpen && "rotate-180"
              )} />
            </button>
            {clanMasterOpen && (
              <div 
                className="absolute top-full right-0 pt-1 w-40 z-[9999]"
              >
                <div className={clsx(
                  "rounded-lg border-2 backdrop-blur-md shadow-xl py-1",
                  theme === "light" ? "border-amber-400 bg-white shadow-slate-300/40" : "border-amber-500/30 bg-slate-900/95"
                )}>
                  {clanMasterItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={clsx(
                        "block px-4 py-2 text-sm transition-all duration-300",
                        pathname === item.href
                          ? theme === "light"
                            ? "bg-amber-500/30 text-black border-l-4 border-amber-500"
                            : "bg-amber-500/20 text-amber-200"
                          : theme === "light"
                          ? "hover:bg-amber-100 hover:text-black text-black border-l-4 border-transparent hover:border-amber-400"
                          : "hover:bg-amber-500/10 hover:text-amber-200 text-amber-300/80"
                      )}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <ThemeToggle />
          
          {renderDesktopAuth()}
        </div>
        <button
          className="inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-slate-800 md:hidden transition-all duration-300 active:scale-95"
          onClick={() => setOpen((v) => !v)}
          aria-label="메뉴 열기"
        >
          <Bars3Icon className={`h-6 w-6 text-slate-200 transition-transform duration-300 ${open ? 'rotate-90' : ''}`} />
        </button>
      </div>

      <div 
        className={`border-t border-slate-800 bg-slate-900/90 px-4 py-3 md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          open ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className={`flex flex-col gap-2 text-sm text-slate-200 transition-all duration-300 ${
          open ? 'translate-y-0' : '-translate-y-4'
        }`}>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "rounded-md px-3 py-2 transition-all duration-300",
                  pathname === item.href
                    ? "bg-emerald-500/20 text-emerald-200"
                    : "hover:bg-slate-800 hover:text-emerald-200"
                )}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            
            {/* 모바일 서든어택 메뉴 */}
            <div className="border-t border-slate-800 pt-2 mt-2">
              <div className="px-3 py-2 text-xs uppercase text-slate-400 font-semibold">서든어택</div>
              {suddenAttackItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "flex items-center gap-2 rounded-md px-3 py-2 transition-all duration-300",
                    pathname === item.href
                      ? "bg-emerald-500/20 text-emerald-200"
                      : item.isWarning
                      ? "hover:bg-red-500/20 hover:text-red-300 text-red-400"
                      : "hover:bg-slate-800 hover:text-emerald-200"
                  )}
                  onClick={() => setOpen(false)}
                >
                  {item.isWarning && (
                    <ExclamationTriangleIcon className="h-4 w-4" />
                  )}
                  {item.label}
                </Link>
              ))}
            </div>
            
            {/* 모바일 커뮤니티 메뉴 */}
            <div className="border-t border-slate-800 pt-2 mt-2">
              <div className="px-3 py-2 text-xs uppercase text-slate-400 font-semibold">커뮤니티</div>
              {communityItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "block rounded-md px-3 py-2 transition-all duration-300",
                    pathname === item.href
                      ? "bg-emerald-500/20 text-emerald-200"
                      : "hover:bg-slate-800 hover:text-emerald-200"
                  )}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            
            {/* 모바일 마켓 메뉴 */}
            <div className="border-t border-slate-800 pt-2 mt-2">
              <div className="px-3 py-2 text-xs uppercase text-slate-400 font-semibold">마켓</div>
              {marketItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "block rounded-md px-3 py-2 transition-all duration-300",
                    pathname === item.href
                      ? "bg-emerald-500/20 text-emerald-200"
                      : "hover:bg-slate-800 hover:text-emerald-200"
                  )}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            
            {/* 모바일 클랜 마스터 메뉴 */}
            <div className="border-t border-amber-500/30 pt-2 mt-2">
              <div className="flex items-center gap-2 px-3 py-2 text-xs uppercase text-amber-400 font-semibold">
                <ShieldExclamationIcon className="h-4 w-4" />
                클랜 마스터
              </div>
              {clanMasterItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "block rounded-md px-3 py-2 transition-all duration-300",
                    pathname === item.href
                      ? "bg-amber-500/20 text-amber-200"
                      : "hover:bg-amber-500/10 hover:text-amber-200 text-amber-300/80"
                  )}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            {renderMobileAuth()}
        </div>
      </div>
    </header>
  );
}

