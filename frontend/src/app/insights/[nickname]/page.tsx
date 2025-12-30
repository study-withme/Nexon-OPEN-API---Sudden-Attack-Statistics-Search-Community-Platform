"use client";

import { useQuery } from "@tanstack/react-query";
import { use } from "react";
import { LoadingSpinner, LoadingSpinnerLarge, LoadingCard, LoadingProgressBar, ErrorBox, EmptyState } from "@/components/ui/State";
import {
  getMapInsights,
  getOuidByNickname,
  getTimeInsights,
  MapStat,
  TimeBucketStat,
} from "@/lib/playerApi";

type Props = {
  params: Promise<{
    nickname: string;
  }>;
};

export default function InsightsPage({ params }: Props) {
  const { nickname: rawNickname } = use(params) as { nickname: string };
  const nickname = decodeURIComponent(rawNickname ?? "");
  const ouidQuery = useQuery({
    queryKey: ["ouid", nickname],
    queryFn: () => getOuidByNickname(nickname),
    enabled: !!nickname && nickname.trim().length > 0,
  });

  const mapQuery = useQuery({
    queryKey: ["insights-map", ouidQuery.data?.ouid],
    queryFn: () => getMapInsights(ouidQuery.data!.ouid),
    enabled: !!ouidQuery.data?.ouid,
  });

  const timeQuery = useQuery({
    queryKey: ["insights-time", ouidQuery.data?.ouid],
    queryFn: () => getTimeInsights(ouidQuery.data!.ouid),
    enabled: !!ouidQuery.data?.ouid,
  });

  const loading = ouidQuery.isLoading || mapQuery.isLoading || timeQuery.isLoading;
  const error = ouidQuery.error || mapQuery.error || timeQuery.error;
  const mapData: MapStat[] | undefined = mapQuery.data;
  const timeData: TimeBucketStat[] | undefined = timeQuery.data;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-10 space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-400">인사이트</p>
          <h1 className="text-3xl font-semibold text-emerald-200">
            {nickname || "닉네임 미지정"}
          </h1>
          <p className="text-sm text-slate-400">
            맵/시간대/무기별 성과와 비교 지표를 준비 중입니다.
          </p>
        </div>
        <button
          className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
          onClick={() => {
            ouidQuery.refetch();
            mapQuery.refetch();
            timeQuery.refetch();
          }}
        >
          비교 대상 추가
        </button>
      </div>

      {ouidQuery.isError && (
        <ErrorBox
          message={(ouidQuery.error as { message?: string })?.message || "닉네임으로 OUID를 찾지 못했습니다."}
          action={<button onClick={() => ouidQuery.refetch()}>다시 시도</button>}
        />
      )}
      {loading && (
        <div className="space-y-6 animate-fade-in">
          <LoadingProgressBar />
          <div className="flex items-center justify-center py-8">
            <LoadingSpinnerLarge message="인사이트 데이터를 분석하는 중입니다..." />
          </div>
          <section className="grid gap-4 lg:grid-cols-2">
            <LoadingCard count={2} />
          </section>
        </div>
      )}
      {error && !ouidQuery.error && (
        <ErrorBox
          message={(error as { message?: string })?.message || "인사이트를 불러오는 중 오류가 발생했습니다."}
          action={
            <button
              onClick={() => {
                mapQuery.refetch();
                timeQuery.refetch();
              }}
            >
              다시 시도
            </button>
          }
        />
      )}

      {!loading && !error && (
        <>
          <section className="grid gap-4 lg:grid-cols-2">
            <div className="card p-5 space-y-3">
              <h3 className="text-lg font-semibold text-emerald-200">맵별 성과</h3>
              {!mapData || mapData.length === 0 ? (
                <EmptyState message="맵별 데이터가 없습니다." />
              ) : (
                <div className="space-y-2 text-sm text-slate-300">
                  {mapData.map((m) => (
                    <div key={m.matchMap} className="flex items-center justify-between rounded-lg border border-slate-800/70 bg-slate-950/50 px-3 py-2">
                      <span>{m.matchMap}</span>
                      <span className="text-emerald-200">
                        {formatNum(m.winRate)} / KD {formatNum(m.kd)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card p-5 space-y-3">
              <h3 className="text-lg font-semibold text-emerald-200">시간대별 승률</h3>
              {!timeData || timeData.length === 0 ? (
                <EmptyState message="시간대 데이터가 없습니다." />
              ) : (
                <div className="space-y-2 text-sm text-slate-300">
                  {timeData.map((t) => (
                    <div key={t.hourKst} className="flex items-center justify-between rounded-lg border border-slate-800/70 bg-slate-950/50 px-3 py-2">
                      <span>{t.hourKst}:00</span>
                      <span className="text-emerald-200">
                        {formatNum(t.winRate)} / KD {formatNum(t.kd)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-emerald-200">비교</h3>
                <p className="text-sm text-slate-400">
                  최근 N경기 집계를 두 플레이어 간 비교합니다.
                </p>
              </div>
              <button className="rounded-md px-3 py-2 text-sm text-emerald-200 hover:bg-slate-800">
                비교 시작
              </button>
            </div>
            <div className="grid gap-3 md:grid-cols-3 text-sm text-slate-300">
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
                <p className="text-xs text-slate-400">승률</p>
                <p className="text-2xl font-semibold text-emerald-200">-</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
                <p className="text-xs text-slate-400">K/D</p>
                <p className="text-2xl font-semibold text-emerald-200">-</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
                <p className="text-xs text-slate-400">HS%</p>
                <p className="text-2xl font-semibold text-emerald-200">-</p>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function formatNum(n?: number | null) {
  if (n === null || n === undefined) return "-";
  const num = typeof n === "string" ? Number(n) : n;
  return Number.isInteger(num) ? num : num.toFixed(2);
}
