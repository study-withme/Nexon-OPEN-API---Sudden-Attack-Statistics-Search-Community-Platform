"use client";

import { useState } from "react";
import { DataTable } from "@/components/admin/DataTable";
import { Modal } from "@/components/admin/Modal";
import { QuestionMarkCircleIcon, PlusIcon, ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";

interface Inquiry {
  id: number;
  title: string;
  author: string;
  createdAt: string;
  status: "대기" | "처리중" | "완료";
}

const mockInquiries: Inquiry[] = [
  {
    id: 1,
    title: "계정 정지 문의",
    author: "플레이어1",
    createdAt: "2024-01-20 14:30",
    status: "대기",
  },
  {
    id: 2,
    title: "결제 환불 요청",
    author: "플레이어2",
    createdAt: "2024-01-20 12:15",
    status: "처리중",
  },
];

export default function SupportPage() {
  const [activeTab, setActiveTab] = useState<"inquiry" | "faq">("inquiry");
  const [inquiries, setInquiries] = useState<Inquiry[]>(mockInquiries);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [page, setPage] = useState(1);

  const columns = [
    {
      key: "title",
      label: "제목",
      render: (inquiry: Inquiry) => (
        <div className="flex items-center space-x-2">
          <QuestionMarkCircleIcon className="w-5 h-5 text-slate-400" />
          <span className="font-medium text-white">{inquiry.title}</span>
        </div>
      ),
    },
    {
      key: "author",
      label: "작성자",
    },
    {
      key: "createdAt",
      label: "작성일",
    },
    {
      key: "status",
      label: "상태",
      render: (inquiry: Inquiry) => (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            inquiry.status === "완료"
              ? "bg-emerald-500/20 text-emerald-400"
              : inquiry.status === "처리중"
              ? "bg-blue-500/20 text-blue-400"
              : "bg-yellow-500/20 text-yellow-400"
          }`}
        >
          {inquiry.status}
        </span>
      ),
    },
  ];

  const handleRowClick = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">고객 지원</h1>
        <p className="text-slate-400 mt-1">문의 및 FAQ 관리</p>
      </div>

      <div className="bg-slate-800 rounded-lg border border-slate-700">
        <div className="flex border-b border-slate-700">
          <button
            onClick={() => setActiveTab("inquiry")}
            className={`flex items-center space-x-2 px-6 py-4 border-b-2 transition-colors ${
              activeTab === "inquiry"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <ChatBubbleLeftRightIcon className="w-5 h-5" />
            <span className="font-medium">문의 관리</span>
          </button>
          <button
            onClick={() => setActiveTab("faq")}
            className={`flex items-center space-x-2 px-6 py-4 border-b-2 transition-colors ${
              activeTab === "faq"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <QuestionMarkCircleIcon className="w-5 h-5" />
            <span className="font-medium">FAQ 관리</span>
          </button>
        </div>

        <div className="p-6">
          {activeTab === "inquiry" && (
            <>
              <DataTable
                data={inquiries}
                columns={columns}
                onRowClick={handleRowClick}
                pagination={{
                  page,
                  pageSize: 20,
                  total: inquiries.length,
                  onPageChange: setPage,
                }}
                searchable
                selectable
              />

              <Modal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                title="문의 상세"
                size="lg"
                footer={
                  <>
                    <button
                      onClick={() => setIsDetailModalOpen(false)}
                      className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
                    >
                      닫기
                    </button>
                    <button
                      onClick={() => {
                        // 답변 로직
                        setIsDetailModalOpen(false);
                      }}
                      className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                    >
                      답변 작성
                    </button>
                  </>
                }
              >
                {selectedInquiry && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-slate-400">제목</label>
                        <p className="text-white mt-1">{selectedInquiry.title}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-400">작성자</label>
                        <p className="text-white mt-1">{selectedInquiry.author}</p>
                      </div>
                    </div>
                    <div className="border-t border-slate-700 pt-4">
                      <h3 className="text-lg font-bold text-white mb-4">문의 내용</h3>
                      <div className="bg-slate-700 rounded-lg p-4 text-white">
                        문의 내용이 여기에 표시됩니다...
                      </div>
                    </div>
                    <div className="border-t border-slate-700 pt-4">
                      <h3 className="text-lg font-bold text-white mb-4">답변</h3>
                      <textarea
                        rows={6}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                        placeholder="답변을 입력하세요..."
                      />
                    </div>
                  </div>
                )}
              </Modal>
            </>
          )}

          {activeTab === "faq" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">FAQ 목록</h3>
                <button className="flex items-center space-x-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors">
                  <PlusIcon className="w-5 h-5" />
                  <span>FAQ 추가</span>
                </button>
              </div>
              <div className="space-y-2">
                {[
                  { id: 1, title: "계정 정지 문의", category: "계정", views: 123 },
                  { id: 2, title: "결제 환불 방법", category: "결제", views: 89 },
                ].map((faq) => (
                  <div
                    key={faq.id}
                    className="flex items-center justify-between p-4 bg-slate-700 rounded-lg"
                  >
                    <div>
                      <p className="text-white font-medium">{faq.title}</p>
                      <p className="text-sm text-slate-400">{faq.category} • 조회 {faq.views}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
                        수정
                      </button>
                      <button className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors">
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
