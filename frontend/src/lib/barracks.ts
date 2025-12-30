import { api, normalizeApiError } from "./api";

export type BarracksReport = {
  id: number;
  targetNickname: string;
  targetOuid?: string | null;
  barracksAddress: string;
  reportType: string;
  title: string;
  content: string;
  anonymous?: boolean;
  status?: string;
  reporter?: string;
  author?: string; // 작성자 (reporter와 동일하거나 익명일 수 있음)
  createdAt?: string;
  reportCount?: number;
  trustScore?: number; // 신뢰도 점수 (0-100)
  evidenceUrls?: string[]; // 증빙 자료 URL 목록
  processedAt?: string; // 처리 일시
  processor?: string; // 처리자
  processReason?: string; // 처리 사유
  banStatus?: string | null; // 정지 상태: null=미확인, active=활동중, temporary=임시정지, permanent=영구정지
  banCheckedAt?: string | null; // 정지 상태 확인 일시
  totalReportCount?: number; // 해당 닉네임에 대한 전체 제보 건수
};

export type CreateBarracksReportPayload = {
  targetNickname: string;
  targetOuid?: string;
  barracksAddress: string;
  reportType: string;
  title: string;
  content: string;
  anonymous?: boolean;
};

export type BarracksResolveResponse = {
  nickname: string | null;
  clanName: string | null;
  ouid: string | null;
  barracksId: string | null;
  barracksUrl: string;
};

export async function fetchBarracksReports() {
  try {
    const { data } = await api.get<BarracksReport[]>("/barracks");
    return data ?? [];
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export async function fetchBarracksReport(id: number) {
  if (!id) throw new Error("유효한 제보 ID가 아닙니다.");
  try {
    const { data } = await api.get<BarracksReport>(`/barracks/${id}`);
    return data;
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export async function createBarracksReport(payload: CreateBarracksReportPayload) {
  try {
    const { data } = await api.post<BarracksReport>("/barracks", payload);
    return data;
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export async function getReportCounts(targetNickname: string) {
  try {
    const { data } = await api.get<{ barracksCount: number; trollCount: number }>(
      `/barracks/count?targetNickname=${encodeURIComponent(targetNickname)}`
    );
    return data;
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export async function checkBanStatus(reportId: number) {
  try {
    const { data } = await api.post<{ message: string }>(`/barracks/${reportId}/check-ban-status`);
    return data;
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export async function resolveBarracksByUrl(url: string) {
  if (!url) throw new Error("병영수첩 주소가 비어있습니다.");
  try {
    const { data } = await api.get<BarracksResolveResponse>("/barracks/lookup/by-url", {
      params: { url },
    });
    return data;
  } catch (error) {
    throw normalizeApiError(error);
  }
}
