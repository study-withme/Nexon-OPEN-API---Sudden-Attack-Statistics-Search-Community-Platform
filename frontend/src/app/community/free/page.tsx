"use client";

import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import CommunityListPage from "../CommunityListPage";

export default function CommunityFreePage() {
  return (
    <CommunityListPage
      category="free"
      title="자유게시판"
      description="자유롭게 이야기를 나누는 게시판입니다."
      icon={<ChatBubbleLeftRightIcon className="h-6 w-6" />}
      accentClassName="text-emerald-400"
    />
  );
}
