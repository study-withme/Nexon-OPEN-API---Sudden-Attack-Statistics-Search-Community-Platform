"use client";

import { FireIcon } from "@heroicons/react/24/outline";
import CommunityListPage from "../CommunityListPage";

export default function CommunityPopularPage() {
  return (
    <CommunityListPage
      category="popular"
      title="인기글"
      description="인기 게시글을 확인하세요."
      icon={<FireIcon className="h-6 w-6" />}
      accentClassName="text-orange-400"
    />
  );
}
