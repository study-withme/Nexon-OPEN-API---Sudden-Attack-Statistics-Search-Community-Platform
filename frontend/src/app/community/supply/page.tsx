"use client";

import { GiftIcon } from "@heroicons/react/24/outline";
import CommunityListPage from "../CommunityListPage";

export default function CommunitySupplyPage() {
  return (
    <CommunityListPage
      category="supply"
      title="보급"
      description="A보급 3보급 유저들을 위한 게시판입니다."
      icon={<GiftIcon className="h-6 w-6" />}
      accentClassName="text-purple-400"
    />
  );
}
