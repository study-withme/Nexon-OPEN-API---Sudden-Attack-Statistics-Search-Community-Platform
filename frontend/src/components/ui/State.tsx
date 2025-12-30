"use client";

type StateProps = {
  message?: string;
  action?: React.ReactNode;
};

export function LoadingSpinner({ message = "불러오는 중..." }: StateProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-slate-950/70 to-emerald-500/10 px-4 py-3 text-sm text-slate-200 animate-pulse">
      <div className="relative">
        <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
        <span className="absolute inset-0 inline-block h-5 w-5 animate-ping rounded-full border-2 border-emerald-400/30" />
      </div>
      <span className="font-medium">{message}</span>
    </div>
  );
}

export function LoadingSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="h-4 bg-slate-700/50 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-slate-700/50 rounded w-1/2"></div>
    </div>
  );
}

export function LoadingCard({ count = 1 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3 animate-pulse"
        >
          <div className="h-4 bg-slate-700/50 rounded w-1/4"></div>
          <div className="h-6 bg-slate-700/50 rounded w-1/2"></div>
          <div className="h-3 bg-slate-700/50 rounded w-3/4"></div>
        </div>
      ))}
    </>
  );
}

export function LoadingProgressBar() {
  return (
    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
      <div className="h-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-400 rounded-full animate-shimmer" style={{
        backgroundSize: '200% 100%',
        animation: 'shimmer 2s infinite linear'
      }}></div>
    </div>
  );
}

export function LoadingSpinnerLarge({ message = "데이터를 불러오는 중..." }: StateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-4 border-emerald-400/20"></div>
        <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-transparent border-t-emerald-400 animate-spin"></div>
        <div className="absolute inset-2 h-12 w-12 rounded-full border-4 border-transparent border-r-emerald-300 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
      </div>
      <div className="text-center space-y-2">
        <p className="text-base font-semibold text-emerald-200 animate-pulse">{message}</p>
        <div className="flex gap-1 justify-center">
          <div className="h-2 w-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="h-2 w-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="h-2 w-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
}

export function ErrorBox({ message = "오류가 발생했습니다.", action }: StateProps) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
      <div className="flex-1">{message}</div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function EmptyState({ message = "데이터가 없습니다.", action }: StateProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-300">
      <div className="flex-1">{message}</div>
      {action && <div>{action}</div>}
    </div>
  );
}
