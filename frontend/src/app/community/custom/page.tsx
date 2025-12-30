"use client";

import { UserGroupIcon } from "@heroicons/react/24/outline";
import CommunityListPage from "../CommunityListPage";

export default function CommunityCustomPage() {
  return (
    <CommunityListPage
      category="custom"
      title="대룰"
      description="대룰 게임에 관한 이야기를 나누는 게시판입니다."
      icon={<UserGroupIcon className="h-6 w-6" />}
      accentClassName="text-blue-400"
    />
  );
}
