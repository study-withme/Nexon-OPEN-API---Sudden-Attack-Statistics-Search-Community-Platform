/**
 * API 요청 최적화 유틸리티
 * - 디바운싱: 연속된 요청을 지연시켜 마지막 요청만 실행
 * - 병합: 동시에 발생한 동일한 요청을 하나로 합침
 */

type PendingRequest<T> = {
  promise: Promise<T>;
  timestamp: number;
};

// 진행 중인 요청 추적 (병합용)
const pendingRequests = new Map<string, PendingRequest<any>>();

// 디바운스 타이머 추적
const debounceTimers = new Map<string, NodeJS.Timeout>();

/**
 * 요청 키 생성 함수
 */
function createRequestKey(url: string, options?: RequestInit): string {
  const method = options?.method || "GET";
  const body = options?.body ? JSON.stringify(options.body) : "";
  return `${method}:${url}:${body}`;
}

/**
 * 요청 병합: 동일한 요청이 동시에 여러 번 발생하면 하나의 요청만 실행하고 결과를 공유
 */
export function mergeRequest<T>(
  key: string,
  requestFn: () => Promise<T>
): Promise<T> {
  // 이미 진행 중인 동일한 요청이 있으면 그것을 반환
  const existing = pendingRequests.get(key);
  if (existing) {
    // 5초 이내의 요청만 병합 (너무 오래된 요청은 무시)
    if (Date.now() - existing.timestamp < 5000) {
      return existing.promise;
    } else {
      // 오래된 요청은 제거
      pendingRequests.delete(key);
    }
  }

  // 새로운 요청 생성
  const promise = requestFn()
    .then((result) => {
      pendingRequests.delete(key);
      return result;
    })
    .catch((error) => {
      pendingRequests.delete(key);
      throw error;
    });

  pendingRequests.set(key, {
    promise,
    timestamp: Date.now(),
  });

  return promise;
}

/**
 * 디바운싱: 연속된 요청을 지연시켜 마지막 요청만 실행
 */
export function debounceRequest<T>(
  key: string,
  requestFn: () => Promise<T>,
  delay: number = 300
): Promise<T> {
  return new Promise((resolve, reject) => {
    // 기존 타이머 취소
    const existingTimer = debounceTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // 새 타이머 설정
    const timer = setTimeout(async () => {
      debounceTimers.delete(key);
      try {
        const result = await requestFn();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }, delay);

    debounceTimers.set(key, timer);
  });
}

/**
 * 디바운스 + 병합 조합: 디바운싱 후 동일 요청 병합
 */
export function debounceAndMergeRequest<T>(
  key: string,
  requestFn: () => Promise<T>,
  delay: number = 300
): Promise<T> {
  return new Promise((resolve, reject) => {
    // 기존 타이머 취소
    const existingTimer = debounceTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
      // 타이머만 취소하고 Promise는 기존 것을 재사용
      const existing = pendingRequests.get(key);
      if (existing && Date.now() - existing.timestamp < 5000) {
        existing.promise.then(resolve).catch(reject);
        return;
      }
    }

    // 새 타이머 설정
    const timer = setTimeout(async () => {
      debounceTimers.delete(key);
      try {
        // 병합 로직 적용
        const result = await mergeRequest(key, requestFn);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }, delay);

    debounceTimers.set(key, timer);
  });
}

/**
 * 요청 캐시 클리어 (필요시 사용)
 */
export function clearRequestCache(key?: string): void {
  if (key) {
    pendingRequests.delete(key);
    const timer = debounceTimers.get(key);
    if (timer) {
      clearTimeout(timer);
      debounceTimers.delete(key);
    }
  } else {
    // 모든 캐시 클리어
    pendingRequests.clear();
    debounceTimers.forEach((timer) => clearTimeout(timer));
    debounceTimers.clear();
  }
}
