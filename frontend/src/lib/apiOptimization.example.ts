/**
 * API 최적화 사용 예제
 * 
 * 이 파일은 예제일 뿐이며, 실제 프로젝트에서는 필요에 따라 적용하세요.
 */

import { useQuery } from "@tanstack/react-query";
import { debounceAndMergeRequest, mergeRequest } from "./apiUtils";
import { api } from "./api";

// ============================================
// 예제 1: 검색 API에 디바운싱 적용
// ============================================
export function useDebouncedPlayerSearch(nickname: string) {
  return useQuery({
    queryKey: ["player", "search", nickname],
    queryFn: () => {
      const requestFn = () =>
        api
          .get(`/player/search?name=${encodeURIComponent(nickname)}`)
          .then((res) => res.data);
      const requestKey = `GET:/player/search?name=${nickname}`;
      
      // 300ms 디바운싱 + 병합 적용
      return debounceAndMergeRequest(requestKey, requestFn, 300);
    },
    enabled: nickname.length >= 2, // 최소 2글자 이상일 때만 호출
  });
}

// ============================================
// 예제 2: 플레이어 프로필 조회에 병합만 적용 (디바운싱 없음)
// ============================================
export function usePlayerProfile(ouid: string) {
  return useQuery({
    queryKey: ["player", "profile", ouid],
    queryFn: () => {
      const requestFn = () =>
        api.get(`/player/${ouid}/profile`).then((res) => res.data);
      const requestKey = `GET:/player/${ouid}/profile`;
      
      // 병합만 적용 (동시 요청 방지)
      return mergeRequest(requestKey, requestFn);
    },
    enabled: !!ouid,
    staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
  });
}

// ============================================
// 예제 3: 게시글 목록 조회 (React Query 기본 캐싱 활용)
// ============================================
export function usePostList(category?: string, page = 0) {
  return useQuery({
    queryKey: ["posts", category, page],
    queryFn: () => {
      const url = category
        ? `/posts?category=${category}&page=${page}`
        : `/posts?page=${page}`;
      return api.get(url).then((res) => res.data);
    },
    staleTime: 2 * 60 * 1000, // 2분간 캐시 유지
    gcTime: 5 * 60 * 1000, // 5분간 메모리에 유지
  });
}

// ============================================
// 예제 4: 자동완성 검색 (짧은 디바운싱)
// ============================================
export function useAutocompleteSearch(query: string) {
  return useQuery({
    queryKey: ["autocomplete", query],
    queryFn: () => {
      const requestFn = () =>
        api
          .get(`/search/autocomplete?q=${encodeURIComponent(query)}`)
          .then((res) => res.data);
      const requestKey = `GET:/search/autocomplete?q=${query}`;
      
      // 150ms 디바운싱 (빠른 자동완성)
      return debounceAndMergeRequest(requestKey, requestFn, 150);
    },
    enabled: query.length >= 1,
    staleTime: 1 * 60 * 1000, // 1분간 캐시
  });
}

/**
 * 사용법:
 * 
 * // 컴포넌트에서 사용
 * function SearchComponent() {
 *   const [nickname, setNickname] = useState("");
 *   const { data, isLoading } = useDebouncedPlayerSearch(nickname);
 *   
 *   return (
 *     <div>
 *       <input 
 *         value={nickname}
 *         onChange={(e) => setNickname(e.target.value)}
 *       />
 *       {isLoading && <div>검색 중...</div>}
 *       {data && <div>{JSON.stringify(data)}</div>}
 *     </div>
 *   );
 * }
 */
