import axios, { InternalAxiosRequestConfig } from "axios";
import { emitToast } from "@/lib/toast";

type ApiErrorResponse = {
  status?: number;
  code?: string;
  message?: string;
  error?: string;
  path?: string;
  timestamp?: string;
};

export type ApiError = {
  status?: number;
  code?: string;
  message: string;
  path?: string;
  raw?: unknown;
  body?: ApiErrorResponse;
};

// API 베이스 URL 설정 (런타임에 동적으로 결정)
// 우선순위:
// 1. 환경 변수 (NEXT_PUBLIC_API_BASE) - 빌드 타임 및 런타임 모두 지원
// 2. 브라우저 환경에서 프로덕션 자동 감지 (런타임)
// 3. 개발 환경 기본값 (localhost)
const getBaseURL = (): string => {
  // 환경 변수 확인 (최우선) - Next.js는 NEXT_PUBLIC_ 접두사가 있으면 클라이언트에서도 접근 가능
  // 브라우저와 서버 모두에서 확인
  const envApiBase = 
    (typeof window !== "undefined" && (window as any).__NEXT_PUBLIC_API_BASE__) ||
    process.env.NEXT_PUBLIC_API_BASE;
  
  if (envApiBase) {
    const url = envApiBase.endsWith("/api") ? envApiBase : `${envApiBase}/api`;
    if (typeof window !== "undefined" && process.env.NODE_ENV === 'development') {
      console.log("[API] Using environment variable:", url);
    }
    return url;
  }
  
  // 브라우저 환경에서 런타임 감지
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    // 디버깅 정보 출력 (개발 환경에서만)
    if (process.env.NODE_ENV === 'development') {
      console.log("[API] Detecting base URL - hostname:", hostname, "protocol:", protocol);
    }
    
    // localhost가 아닌 경우 (프로덕션)
    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
      // 프론트엔드 도메인에서 백엔드 도메인 추론
      // 예: port-0-frontends-xxx -> port-0-backend-xxx
      if (hostname.includes("frontends")) {
        const backendHostname = hostname.replace("frontends", "backend");
        const url = `${protocol}//${backendHostname}/api`;
        if (process.env.NODE_ENV === 'development') {
          console.log("[API] Inferred from hostname:", url);
        }
        return url;
      }
      
      // 클라우드타입 도메인 패턴 감지 (fallback)
      if (hostname.includes("cloudtype.app")) {
        // 환경 변수에서 백엔드 URL 가져오기
        const envBackendUrl = process.env.NEXT_PUBLIC_API_BASE;
        if (envBackendUrl) {
          if (process.env.NODE_ENV === 'development') {
            console.log("[API] Using environment variable:", envBackendUrl);
          }
          return envBackendUrl;
        }
        // 환경 변수가 없으면 호스트명 기반으로 추론
        const backendHostname = hostname.replace("frontends", "backend");
        const url = `${protocol}//${backendHostname}/api`;
        if (process.env.NODE_ENV === 'development') {
          console.log("[API] Inferred from hostname:", url);
        }
        return url;
      }
      
      // 기타 프로덕션 환경 (도메인이 있는 경우)
      if (process.env.NODE_ENV === 'development') {
        console.warn("[API] Production environment detected but no backend URL found. Please set NEXT_PUBLIC_API_BASE environment variable.");
      }
      // 환경 변수가 없으면 에러를 발생시키거나 기본값 사용
      return process.env.NEXT_PUBLIC_API_BASE || "/api";
    }
  }
  
  // 서버 사이드 렌더링 또는 로컬 개발 환경
  // 브라우저 환경이 아니거나 localhost인 경우
  if (typeof window === "undefined") {
    // 서버 사이드에서는 환경 변수나 기본값 사용
    return "http://localhost:8080/api";
  }
  
  // 브라우저에서 localhost인 경우에만 localhost 사용
  // (이미 위에서 프로덕션 환경은 처리됨)
  if (process.env.NODE_ENV === 'development') {
    console.warn("[API] Running on localhost. Using default localhost:8080. Set NEXT_PUBLIC_API_BASE env var to override.");
  }
  return "http://localhost:8080/api";
};


const ERROR_MESSAGES: Record<number, string> = {
  400: "잘못된 요청입니다. 입력값을 확인하세요.",
  401: "로그인이 필요합니다. 다시 로그인해 주세요.",
  403: "접근 권한이 없습니다.",
  404: "요청한 리소스를 찾을 수 없습니다.",
  409: "이미 처리된 요청입니다.",
  422: "요청을 처리할 수 없습니다. 입력값을 확인하세요.",
  429: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
  500: "서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
  502: "외부 서비스와 통신 중 오류가 발생했습니다.",
  503: "서비스를 사용할 수 없습니다. 잠시 후 다시 시도해 주세요.",
  504: "요청 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.",
};

export const api = axios.create({
  baseURL: getBaseURL(), // 초기값 설정
  withCredentials: true,
  timeout: 30000, // 30초 타임아웃
  headers: {
    "Content-Type": "application/json",
  },
});

function safeGetStoredToken() {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem("token");
  } catch {
    return null;
  }
}

function clearStoredToken() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem("token");
    window.dispatchEvent(new Event("auth-change"));
  } catch {
    // ignore storage errors
  }
}

export function normalizeApiError(error: unknown): ApiError {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const status = error.response?.status;
    const body = error.response?.data;
    
    // 네트워크 에러 처리
    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      return {
        status: 504,
        message: "요청 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.",
        raw: error,
        body,
      };
    }
    
    if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND" || error.code === "ERR_NETWORK") {
      return {
        status: 503,
        message: "서버에 연결할 수 없습니다. 네트워크 연결을 확인해 주세요.",
        raw: error,
        body,
      };
    }
    
    const message =
      body?.message ||
      body?.error ||
      (status ? ERROR_MESSAGES[status] : undefined) ||
      error.message ||
      "알 수 없는 오류가 발생했습니다.";

    return {
      status,
      code: body?.code,
      message,
      path: body?.path,
      raw: error,
      body,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message || "알 수 없는 오류가 발생했습니다.",
      raw: error,
    };
  }

  return {
    message: "알 수 없는 오류가 발생했습니다.",
    raw: error,
  };
}

export function setAuthToken(token?: string) {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // 매 요청마다 baseURL을 동적으로 업데이트
  const currentBaseURL = getBaseURL();
  if (config.baseURL !== currentBaseURL) {
    config.baseURL = currentBaseURL;
  }
  
  const token = safeGetStoredToken();
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  
  // 쿠키 동의 여부를 헤더로 전송 (백엔드에서 확인 가능하도록)
  if (typeof window !== "undefined") {
    try {
      const consent = localStorage.getItem("cookie-consent-accepted");
      if (consent === "true") {
        config.headers["X-Cookie-Consent"] = "true";
      }
    } catch {
      // localStorage 접근 실패 시 무시
    }
  }
  
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const normalized = normalizeApiError(error);
    const hadToken = !!safeGetStoredToken();

    if (normalized.status === 401) {
      // 인증 만료 시 토큰을 제거해 재로그인을 유도
      setAuthToken(undefined);
      clearStoredToken();

      if (hadToken && typeof window !== "undefined") {
        const currentPath = `${window.location.pathname}${window.location.search || ""}`;
        const nextParam = encodeURIComponent(currentPath || "/");
        emitToast({
          type: "error",
          message: ERROR_MESSAGES[401],
        });
        if (!currentPath.startsWith("/login") && !currentPath.startsWith("/register")) {
          window.location.href = `/login?next=${nextParam}`;
        }
      }
    } else {
      // 네트워크 연결 실패(백엔드 중지)나 서비스 불가 상태는 토스트 표시 안 함
      // 사용자가 명시적으로 요청한 액션(로그인, 게시글 작성 등)은 제외하고 조용히 처리
      const isNetworkError = normalized.status === 503 || 
                            normalized.status === undefined ||
                            normalized.message?.includes("연결할 수 없습니다") ||
                            normalized.message?.includes("ECONNREFUSED") ||
                            normalized.message?.includes("ERR_NETWORK");
      
      // 서버가 꺼졌을 때도 토큰을 제거하여 로그아웃 상태 유지
      if (isNetworkError && hadToken) {
        setAuthToken(undefined);
        clearStoredToken();
      }
      
      // 네트워크 에러가 아니거나, 사용자 액션이 아닌 경우에만 토스트 표시
      // (백엔드 중지 시 자동으로 실행되는 폴링/폴백 요청은 조용히 처리)
      if (!isNetworkError) {
        emitToast({
          type: "error",
          message: normalized.status ? normalized.message : "네트워크 오류가 발생했습니다. 연결을 확인해 주세요.",
        });
      }
    }

    return Promise.reject(normalized);
  }
);

