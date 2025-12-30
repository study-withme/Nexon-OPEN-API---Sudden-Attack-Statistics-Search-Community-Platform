export default function TrollsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 pt-10 space-y-8">
      <div className="flex flex-col gap-2">
        <p className="text-sm text-slate-400">트롤 제보</p>
        <h1 className="text-3xl font-semibold text-emerald-200">제보 / 조회 허브</h1>
        <p className="text-sm text-slate-400">
          로그인 회원 전용으로 제보와 검색을 지원할 예정입니다.
        </p>
      </div>

      <section className="card p-5 space-y-3">
        <h2 className="text-lg font-semibold text-emerald-200">기능 예고</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
          <li>제보 등록: 닉네임, 모드, 시간, 증빙 스크린샷(옵션)</li>
          <li>검색/필터: 닉네임, 모드, 날짜, 신뢰도 정렬</li>
          <li>신뢰도: 반복 제보/확인된 제보 기반 점수</li>
          <li>운영 툴: 관리자 확인/숨김 처리</li>
        </ul>
      </section>

      <section className="card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-emerald-200">최근 제보</h3>
            <p className="text-sm text-slate-400">데이터 연동 전까지는 더미 리스트를 노출합니다.</p>
          </div>
          <button className="rounded-md bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-emerald-400">
            제보하기
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-1"
            >
              <p className="text-sm font-semibold text-emerald-200">닉네임 -</p>
              <p className="text-xs text-slate-400">모드/맵 -</p>
              <p className="text-xs text-slate-500">제보 내용은 API 연동 후 표시</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
