import { api, setAuthToken } from "./api";

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  token: string;
  member?: MemberResponse;
};

export type MemberResponse = {
  id: number;
  email: string;
  nickname: string;
  roles?: string[];
  admin?: boolean;
  ouid?: string;
  clanName?: string;
  titleName?: string;
  mannerGrade?: string;
};

export type RegisterRequest = {
  email: string;
  password: string;
  nickname: string;
  ouid?: string;
};

export type RegisterResponse = MemberResponse;

export function getStoredToken() {
  if (typeof window === "undefined") return null;
  try {
    const token = sessionStorage.getItem("token");
    return token && token.trim().length > 0 ? token : null;
  } catch {
    return null;
  }
}

export function persistToken(token?: string) {
  if (!token) return;
  setAuthToken(token);
  try {
    sessionStorage.setItem("token", token);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("auth-change"));
    }
  } catch {
    // ignore storage failure (e.g. when sessionStorage is not available on SSR)
  }
}

export function clearToken() {
  setAuthToken(undefined);
  try {
    sessionStorage.removeItem("token");
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("auth-change"));
    }
  } catch {
    // ignore
  }
}

export async function login(req: LoginRequest): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/auth/login", req);
  if (data?.token) {
    persistToken(data.token);
  }
  return data;
}

export async function register(req: RegisterRequest): Promise<RegisterResponse> {
  const { data } = await api.post<RegisterResponse>("/auth/register", req);
  return data;
}

export type AvailabilityResponse = {
  available: boolean;
  message: string;
};

export async function checkEmailAvailability(email: string): Promise<AvailabilityResponse> {
  const { data } = await api.get<AvailabilityResponse>("/auth/check-email", {
    params: { email },
  });
  return data;
}

export async function checkNicknameAvailability(nickname: string): Promise<AvailabilityResponse> {
  const { data } = await api.get<AvailabilityResponse>("/auth/check-nickname", {
    params: { nickname },
  });
  return data;
}

export async function checkOuidAvailability(ouid: string | null | undefined): Promise<AvailabilityResponse> {
  if (!ouid) {
    return { available: true, message: "OUID가 없어도 가입이 가능합니다." };
  }
  const { data } = await api.get<AvailabilityResponse>("/auth/check-ouid", {
    params: { ouid },
  });
  return data;
}

export async function fetchMe(): Promise<MemberResponse | null> {
  try {
    const { data } = await api.get<MemberResponse>("/auth/me");
    return data;
  } catch (error) {
    return null;
  }
}
