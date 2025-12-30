"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  UsersIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  ShieldExclamationIcon,
  FlagIcon,
  EyeIcon,
  UserPlusIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ServerIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { api } from "@/lib/api";

interface DashboardStats {
  newMembers: number;
  activeUsers: number;
  posts: number;
  comments: number;
  barracksReports: number;
  processedReports: number;
  visitorsPv: number;
  visitorsUv: number;
  signupRate: number;
  pendingReports?: number;
  unprocessedReports24h?: number;
}

interface HourlyAccessData {
  time: string;
  users: number;
}

interface DailySignupData {
  date: string;
  count: number;
}

interface CategoryDistribution {
  name: string;
  value: number;
  color: string;
  [key: string]: string | number; // 인덱스 시그니처 추가 (Recharts 호환성)
}

interface RecentActivity {
  type: string;
  title: string;
  user: string;
  time: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const activityIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  member: UserPlusIcon,
  post: DocumentTextIcon,
  comment: ChatBubbleLeftRightIcon,
  report: ShieldExclamationIcon,
  report_process: FlagIcon,
};

// alerts는 실제 데이터 기반으로 계산됩니다

export default function AdminDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<"today" | "week" | "month">("today");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [hourlyAccessData, setHourlyAccessData] = useState<HourlyAccessData[]>([]);
  const [dailySignupData, setDailySignupData] = useState<DailySignupData[]>([]);
  const [categoryDistribution, setCategoryDistribution] = useState<CategoryDistribution[]>([]);
  const [reportTypeDistribution, setReportTypeDistribution] = useState<CategoryDistribution[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // 간단한 클라이언트 캐시: 기간별 통계/차트 데이터를 메모리에 저장
  const cacheRef = useRef<
    Record<
      "today" | "week" | "month",
      | {
          stats: DashboardStats | null;
          hourlyAccessData: HourlyAccessData[];
          dailySignupData: DailySignupData[];
          categoryDistribution: CategoryDistribution[];
          reportTypeDistribution: CategoryDistribution[];
          recentActivities: Omit<RecentActivity, "icon">[];
        }
      | undefined
    >
  >({
    today: undefined,
    week: undefined,
    month: undefined,
  });

  // 알림 데이터를 실제 통계에서 계산
  const alerts = useMemo(() => {
    if (!stats) return [];
    
    const todayReports = stats.barracksReports ?? 0;
    const processedToday = stats.processedReports ?? 0;
    const pending = stats.pendingReports ?? 0;
    const unprocessed24h = stats.unprocessedReports24h ?? 0;
    
    return [
      {
        type: "warning" as const,
        title: "처리 대기 중인 신고",
        count: pending,
        icon: ExclamationTriangleIcon,
        color: "yellow",
      },
      {
        type: "warning" as const,
        title: "24시간 미처리 신고",
        count: unprocessed24h,
        icon: ClockIcon,
        color: "orange",
      },
      {
        type: "info" as const,
        title: "오늘 신규 신고",
        count: todayReports,
        icon: FlagIcon,
        color: "blue",
      },
      {
        type: "success" as const,
        title: "오늘 처리된 신고",
        count: processedToday,
        icon: ServerIcon,
        color: "green",
      },
    ];
  }, [stats]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      // 캐시에 데이터가 있으면 우선 즉시 보여주고, 백그라운드에서 최신화
      const cached = cacheRef.current[selectedPeriod];
      if (cached) {
        setStats(cached.stats);
        setHourlyAccessData(cached.hourlyAccessData);
        setDailySignupData(cached.dailySignupData);
        setCategoryDistribution(cached.categoryDistribution);
        setReportTypeDistribution(cached.reportTypeDistribution);
        setRecentActivities(
          cached.recentActivities.map((activity) => ({
            ...activity,
            icon: activityIconMap[activity.type] || DocumentTextIcon,
          }))
        );
      }

      setLoading(!cached);
      setError(null);
      
      try {
        // 개별 API 호출로 변경하여 일부 실패해도 다른 데이터는 표시 가능하도록
        const results = await Promise.allSettled([
          api.get<DashboardStats>(`/admin/dashboard/stats?period=${selectedPeriod}`),
          api.get<HourlyAccessData[]>("/admin/dashboard/charts/hourly-access"),
          api.get<DailySignupData[]>("/admin/dashboard/charts/daily-signups?days=7"),
          api.get<CategoryDistribution[]>("/admin/dashboard/charts/category-distribution"),
          api.get<CategoryDistribution[]>("/admin/dashboard/charts/report-type-distribution"),
          api.get<RecentActivity[]>("/admin/dashboard/activities?limit=10"),
        ]);

        // 각 결과 처리
        if (results[0].status === "fulfilled") {
          const statsData = results[0].value.data;
          // null 값을 0으로 설정
          const normalizedStats: DashboardStats = {
            newMembers: statsData?.newMembers ?? 0,
            activeUsers: statsData?.activeUsers ?? 0,
            posts: statsData?.posts ?? 0,
            comments: statsData?.comments ?? 0,
            barracksReports: statsData?.barracksReports ?? 0,
            processedReports: statsData?.processedReports ?? 0,
            visitorsPv: statsData?.visitorsPv ?? 0,
            visitorsUv: statsData?.visitorsUv ?? 0,
            signupRate: statsData?.signupRate ?? 0,
            pendingReports: statsData?.pendingReports ?? 0,
            unprocessedReports24h: statsData?.unprocessedReports24h ?? 0,
          };
          setStats(normalizedStats);
          // 캐시에 반영
          cacheRef.current[selectedPeriod] = {
            ...(cacheRef.current[selectedPeriod] ?? {
              hourlyAccessData: [],
              dailySignupData: [],
              categoryDistribution: [],
              reportTypeDistribution: [],
              recentActivities: [],
            }),
            stats: normalizedStats,
          };
        } else {
          console.error("Failed to fetch stats:", results[0].reason);
          setError("통계 데이터를 불러오는데 실패했습니다.");
        }

        if (results[1].status === "fulfilled") {
          const data = results[1].value.data || [];
          setHourlyAccessData(data);
          cacheRef.current[selectedPeriod] = {
            ...(cacheRef.current[selectedPeriod] ?? {
              stats,
              dailySignupData: [],
              categoryDistribution: [],
              reportTypeDistribution: [],
              recentActivities: [],
            }),
            hourlyAccessData: data,
          };
        } else {
          console.error("Failed to fetch hourly access data:", results[1].reason);
        }

        if (results[2].status === "fulfilled") {
          const data = results[2].value.data || [];
          setDailySignupData(data);
          cacheRef.current[selectedPeriod] = {
            ...(cacheRef.current[selectedPeriod] ?? {
              stats,
              hourlyAccessData,
              categoryDistribution: [],
              reportTypeDistribution: [],
              recentActivities: [],
            }),
            dailySignupData: data,
          };
        } else {
          console.error("Failed to fetch daily signup data:", results[2].reason);
        }

        if (results[3].status === "fulfilled") {
          const data = results[3].value.data || [];
          setCategoryDistribution(data);
          cacheRef.current[selectedPeriod] = {
            ...(cacheRef.current[selectedPeriod] ?? {
              stats,
              hourlyAccessData,
              dailySignupData,
              reportTypeDistribution: [],
              recentActivities: [],
            }),
            categoryDistribution: data,
          };
        } else {
          console.error("Failed to fetch category distribution:", results[3].reason);
        }

        if (results[4].status === "fulfilled") {
          const data = results[4].value.data || [];
          setReportTypeDistribution(data);
          cacheRef.current[selectedPeriod] = {
            ...(cacheRef.current[selectedPeriod] ?? {
              stats,
              hourlyAccessData,
              dailySignupData,
              categoryDistribution,
              recentActivities: [],
            }),
            reportTypeDistribution: data,
          };
        } else {
          console.error("Failed to fetch report type distribution:", results[4].reason);
          // 빈 배열로 설정하여 UI는 계속 작동하도록
          setReportTypeDistribution([]);
        }

        if (results[5].status === "fulfilled") {
          const rawActivities = results[5].value.data || [];
          const mappedActivities = rawActivities.map((activity) => ({
            ...activity,
            icon: activityIconMap[activity.type] || DocumentTextIcon,
          }));
          setRecentActivities(mappedActivities);
          // 아이콘 정보 제외한 원본만 캐시에 저장 (직렬화 안전)
          cacheRef.current[selectedPeriod] = {
            ...(cacheRef.current[selectedPeriod] ?? {
              stats,
              hourlyAccessData,
              dailySignupData,
              categoryDistribution,
              reportTypeDistribution,
            }),
            recentActivities: rawActivities,
          };
        } else {
          console.error("Failed to fetch recent activities:", results[5].reason);
          // 최근 활동이 없어도 계속 진행 (빈 배열로 설정)
          setRecentActivities([]);
        }

      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        if (!cacheRef.current[selectedPeriod]) {
          setError("대시보드 데이터를 불러오는데 실패했습니다. 페이지를 새로고침해주세요.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [selectedPeriod]);

  if (loading && !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-6">
            <p className="text-red-400 text-lg font-semibold mb-2">오류 발생</p>
            <p className="text-slate-300 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
            >
              새로고침
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">대시보드 홈</h1>
          <p className="text-slate-400 mt-1">실시간 통계 및 현황을 확인하세요</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setSelectedPeriod("today")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedPeriod === "today"
                ? "bg-emerald-500 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            오늘
          </button>
          <button
            onClick={() => setSelectedPeriod("week")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedPeriod === "week"
                ? "bg-emerald-500 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            이번 주
          </button>
          <button
            onClick={() => setSelectedPeriod("month")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedPeriod === "month"
                ? "bg-emerald-500 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            이번 달
          </button>
        </div>
      </div>

      {/* 에러 메시지 표시 */}
      {error && (
        <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400" />
            <p className="text-yellow-400">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-yellow-400 hover:text-yellow-300"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* 알림 및 경고 */}
      {alerts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {alerts.map((alert, index) => (
          <button
            key={index}
            type="button"
            onClick={() => {
              // 알림 종류에 따라 관련 관리 페이지로 이동
              if (alert.title.includes("처리 대기")) {
                router.push("/admin/reports?status=pending");
              } else if (alert.title.includes("24시간 미처리")) {
                router.push("/admin/reports?status=pending&olderThan=24h");
              } else if (alert.title.includes("신규 신고")) {
                router.push("/admin/reports?period=today");
              } else if (alert.title.includes("처리된 신고")) {
                router.push("/admin/reports?status=completed&period=today");
              }
            }}
            className="bg-slate-800 rounded-lg border border-slate-700 p-4 flex items-start space-x-3 text-left hover:border-emerald-500/50 hover:bg-slate-700/70 transition-colors"
          >
            <alert.icon
              className={`w-6 h-6 flex-shrink-0 ${
                alert.color === "yellow"
                  ? "text-yellow-400"
                  : alert.color === "orange"
                  ? "text-orange-400"
                  : alert.color === "blue"
                  ? "text-blue-400"
                  : "text-emerald-400"
              }`}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">{alert.title}</p>
              {alert.count !== undefined && (
                <p className="text-2xl font-bold text-white mt-1">{alert.count}</p>
              )}
            </div>
          </button>
          ))}
        </div>
      )}

      {/* 실시간 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={UserPlusIcon}
          label="신규 회원"
          value={stats.newMembers ?? 0}
          color="emerald"
          onClick={() => router.push("/admin/users?period=today")}
        />
        <StatCard
          icon={UsersIcon}
          label="활성 사용자"
          value={stats.activeUsers ?? 0}
          color="blue"
          onClick={() => router.push("/admin/analytics?tab=active-users")}
        />
        <StatCard
          icon={DocumentTextIcon}
          label="게시글"
          value={stats.posts ?? 0}
          color="purple"
          onClick={() => router.push(`/admin/posts?period=${selectedPeriod}`)}
        />
        <StatCard
          icon={ChatBubbleLeftRightIcon}
          label="댓글"
          value={stats.comments ?? 0}
          color="pink"
          onClick={() => router.push(`/admin/posts?filter=hasComments&period=${selectedPeriod}`)}
        />
        <StatCard
          icon={ShieldExclamationIcon}
          label="병영신고"
          value={stats.barracksReports ?? 0}
          color="orange"
          onClick={() => router.push(`/admin/barracks-reports?period=${selectedPeriod}`)}
        />
        <StatCard
          icon={FlagIcon}
          label="신고 처리"
          value={stats.processedReports ?? 0}
          color="green"
          onClick={() => router.push(`/admin/reports?status=completed&period=${selectedPeriod}`)}
        />
        <StatCard
          icon={EyeIcon}
          label="방문자 (PV)"
          value={stats.visitorsPv ?? 0}
          color="cyan"
          onClick={() => router.push(`/admin/analytics?tab=traffic&period=${selectedPeriod}`)}
        />
        <StatCard
          icon={UsersIcon}
          label="방문자 (UV)"
          value={stats.visitorsUv ?? 0}
          color="indigo"
          onClick={() => router.push(`/admin/analytics?tab=traffic&period=${selectedPeriod}`)}
        />
      </div>

      {/* 차트 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 시간대별 접속자 추이 */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h2 className="text-xl font-bold text-white mb-4">시간대별 접속자 추이 (24시간)</h2>
          {hourlyAccessData.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400">데이터가 없습니다.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={hourlyAccessData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="users"
                stroke="#10b981"
                strokeWidth={2}
                name="접속자 수"
              />
            </LineChart>
          </ResponsiveContainer>
          )}
        </div>

        {/* 일별 회원 가입 추이 */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h2 className="text-xl font-bold text-white mb-4">일별 회원 가입 추이</h2>
          {dailySignupData.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400">데이터가 없습니다.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailySignupData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar dataKey="count" fill="#10b981" name="가입 수"               />
            </BarChart>
          </ResponsiveContainer>
          )}
        </div>

        {/* 카테고리별 게시글 분포 */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h2 className="text-xl font-bold text-white mb-4">카테고리별 게시글 분포</h2>
          {categoryDistribution.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400">데이터가 없습니다.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                  onClick={(data, index) => {
                    const category = categoryDistribution[index]?.name;
                    if (category) {
                      router.push(`/admin/posts?category=${encodeURIComponent(category)}`);
                    }
                  }}
                >
                  {categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} className="cursor-pointer" />
                  ))}
                </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          )}
        </div>

        {/* 신고 유형별 분포 */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h2 className="text-xl font-bold text-white mb-4">신고 유형별 분포</h2>
          {reportTypeDistribution.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400">신고 데이터가 없습니다.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={reportTypeDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  onClick={(data, index) => {
                    const type = reportTypeDistribution[index]?.name;
                    if (type) {
                      router.push(`/admin/barracks-reports?type=${encodeURIComponent(type)}`);
                    }
                  }}
                >
                  {reportTypeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} className="cursor-pointer" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 최근 활동 피드 */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <h2 className="text-xl font-bold text-white mb-4">최근 활동 피드</h2>
        {recentActivities.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-400">최근 활동이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentActivities.map((activity, index) => (
            <button
              key={index}
              type="button"
              onClick={() => {
                // 활동 타입별로 관련 화면으로 이동
                if (activity.type === "member") {
                  router.push(`/admin/users?search=${encodeURIComponent(activity.user)}`);
                } else if (activity.type === "post") {
                  router.push(`/admin/posts?search=${encodeURIComponent(activity.user)}`);
                } else if (activity.type === "report") {
                  router.push(`/admin/reports`);
                }
              }}
              className="w-full flex items-center space-x-4 p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors text-left"
            >
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  activity.color === "emerald"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : activity.color === "blue"
                    ? "bg-blue-500/20 text-blue-400"
                    : activity.color === "purple"
                    ? "bg-purple-500/20 text-purple-400"
                    : activity.color === "red"
                    ? "bg-red-500/20 text-red-400"
                    : "bg-green-500/20 text-green-400"
                }`}
              >
                <activity.icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{activity.title}</p>
                <p className="text-xs text-slate-400">{activity.user}</p>
              </div>
              <span className="text-xs text-slate-400">{activity.time}</span>
            </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
  onClick?: () => void;
}) {
  const colorClasses = {
    emerald: "bg-emerald-500/20 text-emerald-400",
    blue: "bg-blue-500/20 text-blue-400",
    purple: "bg-purple-500/20 text-purple-400",
    pink: "bg-pink-500/20 text-pink-400",
    orange: "bg-orange-500/20 text-orange-400",
    green: "bg-green-500/20 text-green-400",
    cyan: "bg-cyan-500/20 text-cyan-400",
    indigo: "bg-indigo-500/20 text-indigo-400",
  };

  const content = (
    <>
      <div className="flex items-center justify-between mb  -4">
        <div
          className={`w-12 h-12 rounded-lg flex items-center justify-center ${
            colorClasses[color as keyof typeof colorClasses]
          }`}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <p className="text-sm text-slate-400 mb-1">{label}</p>
      <p className="text-3xl font-bold text-white">
        {(value ?? 0).toLocaleString()}
      </p>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="bg-slate-800 rounded-lg border border-slate-700 p-6 text-left hover:border-emerald-500/50 hover:bg-slate-700/70 transition-colors"
      >
        {content}
      </button>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
      {content}
    </div>
  );
}
