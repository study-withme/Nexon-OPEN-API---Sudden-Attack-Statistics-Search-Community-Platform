/**
 * 디바운싱/병합이 적용된 API 호출 훅
 * React Query와 함께 사용하기 위한 헬퍼
 */

import { useQuery } from "@tanstack/react-query";
import { debounceAndMergeRequest, mergeRequest } from "./apiUtils";
import { api } from "./api";

/**
 * 디바운싱이 적용된 API 호출을 위한 커스텀 훅
 * 검색 등 사용자 입력에 따른 API 호출에 유용
 */
export function useDebouncedApiQuery<T>(
  queryKey: string[],
  url: string,
  options?: {
    enabled?: boolean;
    debounceMs?: number;
    mergeRequests?: boolean;
  }
) {
  const { enabled = true, debounceMs = 300, mergeRequests = true } =
    options || {};

  return useQuery({
    queryKey,
    queryFn: () => {
      const requestFn = () => api.get<T>(url).then((res) => res.data);
      const requestKey = `GET:${url}`;

      if (mergeRequests) {
        return debounceAndMergeRequest(requestKey, requestFn, debounceMs);
      } else {
        return requestFn();
      }
    },
    enabled,
  });
}

/**
 * 병합만 적용된 API 호출 (디바운싱 없음)
 * 동시에 발생하는 동일 요청을 하나로 합침
 */
export function useMergedApiQuery<T>(
  queryKey: string[],
  url: string,
  options?: {
    enabled?: boolean;
  }
) {
  const { enabled = true } = options || {};

  return useQuery({
    queryKey,
    queryFn: () => {
      const requestFn = () => api.get<T>(url).then((res) => res.data);
      const requestKey = `GET:${url}`;
      return mergeRequest(requestKey, requestFn);
    },
    enabled,
  });
}
