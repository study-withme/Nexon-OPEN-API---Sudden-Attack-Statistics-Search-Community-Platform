"use client";

import { TrophyIcon } from "@heroicons/react/24/outline";
import CommunityListPage from "../CommunityListPage";

export default function CommunityRankedPage() {
  return (
    <CommunityListPage
      category="ranked"
      title="랭크전"
      description="랭크전에 관한 이야기를 나누는 게시판입니다."
      icon={<TrophyIcon className="h-6 w-6" />}
      accentClassName="text-yellow-400"
    />
  );
}
