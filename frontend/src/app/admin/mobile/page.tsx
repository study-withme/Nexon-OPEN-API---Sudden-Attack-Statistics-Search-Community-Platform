"use client";

export default function MobilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">모바일 관리</h1>
        <p className="text-slate-400 mt-1">모바일 앱 버전 및 푸시 알림 관리</p>
      </div>

      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <h3 className="text-lg font-bold text-white mb-4">앱 버전 관리</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              현재 버전
            </label>
            <input
              type="text"
              defaultValue="1.0.0"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              최소 지원 버전
            </label>
            <input
              type="text"
              defaultValue="1.0.0"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                className="w-4 h-4 text-emerald-600 bg-slate-700 border-slate-600 rounded"
              />
              <span className="text-sm text-slate-300">강제 업데이트 활성화</span>
            </label>
          </div>
          <button className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors">
            저장
          </button>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <h3 className="text-lg font-bold text-white mb-4">푸시 알림 관리</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              알림 제목
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              알림 내용
            </label>
            <textarea
              rows={4}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
            />
          </div>
          <button className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors">
            알림 발송
          </button>
        </div>
      </div>
    </div>
  );
}
