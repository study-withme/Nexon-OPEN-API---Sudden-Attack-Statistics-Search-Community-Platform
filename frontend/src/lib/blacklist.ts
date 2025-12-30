import { api, normalizeApiError } from "./api";

export type BlacklistEntry = {
  id: number;
  targetNickname: string;
  targetOuid?: string | null;
  reason: string;
  createdAt: string;
  createdBy: string;
  warningCount?: number; // 경고 횟수
};

export type CreateBlacklistPayload = {
  targetNickname: string;
  targetOuid?: string;
  reason: string;
};

export async function fetchBlacklist() {
  try {
    const { data } = await api.get<BlacklistEntry[]>("/blacklist");
    return data ?? [];
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export async function addToBlacklist(payload: CreateBlacklistPayload) {
  try {
    const { data } = await api.post<BlacklistEntry>("/blacklist", payload);
    return data;
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export async function removeFromBlacklist(id: number) {
  try {
    await api.delete(`/blacklist/${id}`);
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export async function checkBlacklist(nickname: string) {
  try {
    const { data } = await api.get<BlacklistEntry | null>(`/blacklist/check`, {
      params: { nickname },
    });
    return data;
  } catch (error) {
    throw normalizeApiError(error);
  }
}
