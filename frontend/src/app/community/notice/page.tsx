"use client";

import { MegaphoneIcon } from "@heroicons/react/24/outline";
import CommunityListPage from "../CommunityListPage";

export default function CommunityNoticePage() {
  return (
    <CommunityListPage
      category="notice"
      title="공지사항"
      description="커뮤니티 공지사항을 확인하세요."
      icon={<MegaphoneIcon className="h-6 w-6" />}
      accentClassName="text-emerald-400"
    />
  );
}
