"use client";

import { UserPlusIcon } from "@heroicons/react/24/outline";
import CommunityListPage from "../CommunityListPage";

export default function CommunityDuoPage() {
  return (
    <CommunityListPage
      category="duo"
      title="듀오"
      description="듀오 파티를 구하는 게시판입니다."
      icon={<UserPlusIcon className="h-6 w-6" />}
      accentClassName="text-cyan-400"
    />
  );
}
