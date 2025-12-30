"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  HomeIcon,
  UsersIcon,
  DocumentTextIcon,
  ShieldExclamationIcon,
  FlagIcon,
  UserGroupIcon,
  FolderIcon,
  BellIcon,
  Cog6ToothIcon,
  ClipboardDocumentListIcon,
  ServerIcon,
  UserCircleIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  KeyIcon,
  DevicePhoneMobileIcon,
  CreditCardIcon,
  QuestionMarkCircleIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { RequireAdmin } from "@/components/admin/RequireAdmin";

const navigation = [
  { name: "대시보드 홈", href: "/admin", icon: HomeIcon },
  { name: "회원 관리", href: "/admin/users", icon: UsersIcon },
  { name: "게시글 관리", href: "/admin/posts", icon: DocumentTextIcon },
  { name: "병영신고 관리", href: "/admin/barracks-reports", icon: ShieldExclamationIcon },
  { name: "신고 관리", href: "/admin/reports", icon: FlagIcon },
  { name: "클랜 관리", href: "/admin/clans", icon: UserGroupIcon },
  { name: "카테고리 관리", href: "/admin/categories", icon: FolderIcon },
  { name: "공지사항 관리", href: "/admin/notices", icon: BellIcon },
  { name: "시스템 설정", href: "/admin/settings", icon: Cog6ToothIcon },
  { name: "로그 관리", href: "/admin/logs", icon: ClipboardDocumentListIcon },
  { name: "데이터 관리", href: "/admin/data", icon: ServerIcon },
  { name: "관리자 계정", href: "/admin/admins", icon: UserCircleIcon },
  { name: "통계 및 분석", href: "/admin/analytics", icon: ChartBarIcon },
  { name: "검색", href: "/admin/search", icon: MagnifyingGlassIcon },
  { name: "권한 관리", href: "/admin/permissions", icon: KeyIcon },
  { name: "모바일 관리", href: "/admin/mobile", icon: DevicePhoneMobileIcon },
  { name: "결제 관리", href: "/admin/payments", icon: CreditCardIcon },
  { name: "고객 지원", href: "/admin/support", icon: QuestionMarkCircleIcon },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const pathname = usePathname();
  const router = useRouter();

  // 전역 단축키: / 로 검색창 포커스, g + u/p/r/... 로 주요 페이지 빠른 이동
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 입력 중인 인풋/텍스트에어리어에서는 단축키 동작하지 않도록
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }

      // / → 검색창 포커스
      if (event.key === "/") {
        event.preventDefault();
        const searchInput = document.getElementById("admin-global-search-input") as HTMLInputElement | null;
        searchInput?.focus();
        searchInput?.select();
        return;
      }

      // g + ? 조합 (GitHub-style)
      if (event.key.toLowerCase() === "g") {
        let handled = false;
        const handleSecondKey = (e: KeyboardEvent) => {
          const key = e.key.toLowerCase();
          if (key === "u") {
            router.push("/admin/users");
            handled = true;
          } else if (key === "p") {
            router.push("/admin/posts");
            handled = true;
          } else if (key === "r") {
            router.push("/admin/reports");
            handled = true;
          } else if (key === "d") {
            router.push("/admin");
            handled = true;
          } else if (key === "s") {
            router.push("/admin/search");
            handled = true;
          }
          window.removeEventListener("keydown", handleSecondKey);
        };

        window.addEventListener("keydown", handleSecondKey);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [router]);

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    // 검색 페이지로 이동 (검색어는 쿼리스트링으로 전달)
    router.push(`/admin/search?q=${encodeURIComponent(q)}`);
  };

  useEffect(() => {
    // 클라이언트 사이드에서만 시간 업데이트
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleString("ko-KR"));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-900">
      {/* 모바일 사이드바 오버레이 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 사이드바 */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-slate-800 border-r border-slate-700 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* 로고 및 헤더 */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-slate-700">
            <Link href="/admin" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <Cog6ToothIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-emerald-400">관리자</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* 네비게이션 메뉴 */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "text-slate-300 hover:bg-slate-700 hover:text-white"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

        </div>
      </aside>

      {/* 메인 컨텐츠 */}
      <div className="lg:pl-64">
        {/* 상단 헤더 */}
        <header className="sticky top-0 z-30 bg-slate-800/80 backdrop-blur-sm border-b border-slate-700">
          <div className="flex items-center justify-between h-16 px-4 lg:px-6 gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-400 hover:text-white"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>
            {/* 전역 검색바 */}
            <form
              onSubmit={handleSearchSubmit}
              className="flex-1 max-w-xl mx-auto hidden md:flex items-center space-x-2"
            >
              <div className="relative flex-1">
                <input
                  id="admin-global-search-input"
                  type="search"
                  placeholder="전체 검색 (회원, 게시글, 신고 등) / 로 포커스"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-10 pr-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <MagnifyingGlassIcon className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </form>
            <div className="flex items-center space-x-4">
              <span className="hidden md:inline-flex text-xs text-slate-500">
                g u: 회원 · g p: 게시글 · g r: 신고
              </span>
              <span className="text-sm text-slate-400">
                {currentTime || "로딩 중..."}
              </span>
            </div>
          </div>
        </header>

        {/* 페이지 컨텐츠 */}
        <main className="p-4 lg:p-6">
          <RequireAdmin>{children}</RequireAdmin>
        </main>
      </div>
    </div>
  );
}
