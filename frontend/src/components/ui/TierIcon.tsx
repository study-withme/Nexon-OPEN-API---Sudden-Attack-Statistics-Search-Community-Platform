"use client";

import Image from "next/image";
import { clsx } from "clsx";

const tierMap: Record<string, { label: string; src: string; color: string }> = {
  // 레전드
  legend: { label: "레전드", src: "/tiers/gm.svg", color: "text-yellow-300" },
  // 그랜드마스터 1~3
  "grand master i": { label: "그랜드마스터 I", src: "/tiers/gm.svg", color: "text-purple-400" },
  "grand master ii": { label: "그랜드마스터 II", src: "/tiers/gm.svg", color: "text-purple-400" },
  "grand master iii": { label: "그랜드마스터 III", src: "/tiers/gm.svg", color: "text-purple-400" },
  "grand master 1": { label: "그랜드마스터 I", src: "/tiers/gm.svg", color: "text-purple-400" },
  "grand master 2": { label: "그랜드마스터 II", src: "/tiers/gm.svg", color: "text-purple-400" },
  "grand master 3": { label: "그랜드마스터 III", src: "/tiers/gm.svg", color: "text-purple-400" },
  gm: { label: "그랜드마스터", src: "/tiers/gm.svg", color: "text-purple-400" },
  grandmaster: { label: "그랜드마스터", src: "/tiers/gm.svg", color: "text-purple-400" },
  "grand master": { label: "그랜드마스터", src: "/tiers/gm.svg", color: "text-purple-400" },
  // 마스터 1~3
  "master i": { label: "마스터 I", src: "/tiers/platinum.svg", color: "text-blue-400" },
  "master ii": { label: "마스터 II", src: "/tiers/platinum.svg", color: "text-blue-400" },
  "master iii": { label: "마스터 III", src: "/tiers/platinum.svg", color: "text-blue-400" },
  "master 1": { label: "마스터 I", src: "/tiers/platinum.svg", color: "text-blue-400" },
  "master 2": { label: "마스터 II", src: "/tiers/platinum.svg", color: "text-blue-400" },
  "master 3": { label: "마스터 III", src: "/tiers/platinum.svg", color: "text-blue-400" },
  master: { label: "마스터", src: "/tiers/platinum.svg", color: "text-blue-400" },
  // 골드 1~3
  "gold i": { label: "골드 I", src: "/tiers/gold.svg", color: "text-yellow-400" },
  "gold ii": { label: "골드 II", src: "/tiers/gold.svg", color: "text-yellow-400" },
  "gold iii": { label: "골드 III", src: "/tiers/gold.svg", color: "text-yellow-400" },
  "gold 1": { label: "골드 I", src: "/tiers/gold.svg", color: "text-yellow-400" },
  "gold 2": { label: "골드 II", src: "/tiers/gold.svg", color: "text-yellow-400" },
  "gold 3": { label: "골드 III", src: "/tiers/gold.svg", color: "text-yellow-400" },
  gold: { label: "골드", src: "/tiers/gold.svg", color: "text-yellow-400" },
  // 실버 1~3
  "silver i": { label: "실버 I", src: "/tiers/silver.svg", color: "text-gray-400" },
  "silver ii": { label: "실버 II", src: "/tiers/silver.svg", color: "text-gray-400" },
  "silver iii": { label: "실버 III", src: "/tiers/silver.svg", color: "text-gray-400" },
  "silver 1": { label: "실버 I", src: "/tiers/silver.svg", color: "text-gray-400" },
  "silver 2": { label: "실버 II", src: "/tiers/silver.svg", color: "text-gray-400" },
  "silver 3": { label: "실버 III", src: "/tiers/silver.svg", color: "text-gray-400" },
  silver: { label: "실버", src: "/tiers/silver.svg", color: "text-gray-400" },
  // 랭커
  ranker: { label: "RANKER", src: "/tiers/gm.svg", color: "text-emerald-400" },
  "high ranker": { label: "HIGH RANKER", src: "/tiers/gm.svg", color: "text-yellow-300" },
  // Unranked
  unrated: { label: "언랭크", src: "/tiers/unranked.svg", color: "text-slate-400" },
  unranked: { label: "언랭크", src: "/tiers/unranked.svg", color: "text-slate-400" },
  unr: { label: "언랭크", src: "/tiers/unranked.svg", color: "text-slate-400" },
  none: { label: "언랭크", src: "/tiers/unranked.svg", color: "text-slate-400" },
  // 계급 (Grade) - 서든어택 계급표
  "특급대장": { label: "특급대장", src: "/tiers/gm.svg", color: "text-purple-400" },
  "대장": { label: "대장", src: "/tiers/platinum.svg", color: "text-blue-400" },
  "중장": { label: "중장", src: "/tiers/platinum.svg", color: "text-blue-400" },
  "소장": { label: "소장", src: "/tiers/gold.svg", color: "text-yellow-400" },
  "준장": { label: "준장", src: "/tiers/gold.svg", color: "text-yellow-400" },
  "대위": { label: "대위", src: "/tiers/silver.svg", color: "text-gray-400" },
  "중위": { label: "중위", src: "/tiers/silver.svg", color: "text-gray-400" },
  "소위": { label: "소위", src: "/tiers/silver.svg", color: "text-gray-400" },
  "상사": { label: "상사", src: "/tiers/bronze.svg", color: "text-orange-400" },
  "중사": { label: "중사", src: "/tiers/bronze.svg", color: "text-orange-400" },
  "하사": { label: "하사", src: "/tiers/bronze.svg", color: "text-orange-400" },
  "병장": { label: "병장", src: "/tiers/bronze.svg", color: "text-orange-400" },
  "상병": { label: "상병", src: "/tiers/bronze.svg", color: "text-orange-400" },
  "일병": { label: "일병", src: "/tiers/bronze.svg", color: "text-orange-400" },
  "이병": { label: "이병", src: "/tiers/unranked.svg", color: "text-slate-400" },
};

// 점수 기반 티어 매핑 (랭크 점수)
// 실제 서든어택 티어 구조: 실버 1~3, 골드 1~3, 마스터 1~3, 그랜드마스터 1~3, 레전드
// 랭킹 기준: HIGH RANKER (100등 이하), RANKER (300등 이하)
// 사용자 요구사항: 2400점 = 마스터 1
export function getTierFromScore(score: number | null | undefined, ranking?: number | null): string {
  // 랭킹 기반 특수 티어 (최우선 판단)
  // 랭킹 100등 이하 = HIGH RANKER
  // 랭킹 300등 이하 = RANKER
  if (ranking !== null && ranking !== undefined && ranking > 0) {
    if (ranking <= 100) return "high ranker";
    if (ranking <= 300) return "ranker";
  }
  
  // 점수가 없으면 언랭크
  if (score === null || score === undefined) return "unranked";
  
  // 점수 기반 티어 (수정된 기준: 2400점 = 마스터 1)
  if (score >= 3000) return "legend";
  if (score >= 2800) return "grand master iii";
  if (score >= 2600) return "grand master ii";
  if (score >= 2500) return "grand master i";
  if (score >= 2400) return "master 1"; // 2400점 = 마스터 1
  if (score >= 2200) return "master iii";
  if (score >= 2000) return "master ii";
  if (score >= 1800) return "master i";
  if (score >= 1600) return "gold iii";
  if (score >= 1400) return "gold ii";
  if (score >= 1200) return "gold i";
  if (score >= 1000) return "silver iii";
  if (score >= 800) return "silver ii";
  if (score >= 600) return "silver i";
  if (score > 0) return "unranked";
  return "unranked";
}

type Props = {
  code?: string | number | null;
  score?: number | null; // 점수 기반 티어 판단용
  ranking?: number | null; // 랭킹 기반 티어 판단용 (RANKER, HIGH RANKER)
  imageUrl?: string | null; // API에서 받은 티어 이미지 URL (우선 사용)
  className?: string;
  showImage?: boolean;
};

export function TierIcon({ code, score, ranking, imageUrl, className, showImage = true }: Props) {
  // 우선순위: 1) API에서 받은 code (티어 이름), 2) 랭킹 기반, 3) 점수 기반
  let tierKey: string;
  
  // 1순위: API에서 받은 티어 코드가 있으면 우선 사용
  const codeStr = code != null ? String(code).trim() : "";
  if (codeStr !== "") {
    tierKey = normalize(code);
    // 정규화된 키가 tierMap에 없으면 점수/랭킹 기반으로 재판단
    if (!tierMap[tierKey] && (score !== null || ranking !== null)) {
      // code가 있지만 매핑되지 않은 경우, 점수/랭킹으로 보완 판단
      if (ranking !== null && ranking !== undefined && ranking > 0) {
        if (ranking <= 100) {
          tierKey = "high ranker";
        } else if (ranking <= 300) {
          tierKey = "ranker";
        } else if (score !== null && score !== undefined) {
          tierKey = getTierFromScore(score, ranking);
        }
      } else if (score !== null && score !== undefined) {
        tierKey = getTierFromScore(score, ranking);
      }
    }
  } 
  // 2순위: 랭킹 기반 티어 판단 (RANKER, HIGH RANKER)
  else if (ranking !== null && ranking !== undefined && ranking > 0) {
    if (ranking <= 100) {
      tierKey = "high ranker";
    } else if (ranking <= 300) {
      tierKey = "ranker";
    } else if (score !== null && score !== undefined) {
      tierKey = getTierFromScore(score, ranking);
    } else {
      tierKey = "unranked";
    }
  } 
  // 3순위: 점수 기반 티어 판단
  else if (score !== null && score !== undefined) {
    tierKey = getTierFromScore(score, ranking);
  } 
  // 4순위: 기본값
  else {
    tierKey = "unranked";
  }
  
  const entry = tierMap[tierKey] ?? { label: codeStr || "언랭크", src: "/tiers/unranked.svg", color: "text-slate-400" };
  
  // 서든어택 API에서 받은 이미지 URL이 있으면 무조건 사용, 없을 때만 기본 이미지
  // imageUrl이 null, undefined, 빈 문자열이 아닐 때만 API 이미지 사용
  const hasApiImage = imageUrl && imageUrl.trim().length > 0;
  const imageSrc = hasApiImage ? imageUrl : entry.src;
  const isExternalImage = hasApiImage && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'));
  
  // 디버깅: 이미지 URL 로깅 (개발 환경에서만)
  if (process.env.NODE_ENV === 'development') {
    console.log('[TierIcon] 이미지 정보:', { 
      code, 
      imageUrl, 
      hasApiImage,
      imageSrc, 
      isExternalImage,
      fallbackSrc: entry.src 
    });
  }
  
  return (
    <div className={clsx("flex items-center gap-2", className)}>
      {showImage && (
        <div className="relative h-10 w-10 rounded-lg border border-slate-800/60 bg-slate-900/70 flex items-center justify-center">
          {hasApiImage ? (
            // API에서 받은 이미지가 있으면 무조건 사용 (unoptimized로 로드)
            <Image
              src={imageUrl!}
              alt={entry.label}
              width={32}
              height={32}
              className="object-contain"
              unoptimized
              priority={false}
              onError={(e) => {
                // API 이미지 로드 실패 시 기본 이미지로 대체
                console.warn('[TierIcon] API 이미지 로드 실패, 기본 이미지로 대체:', imageUrl);
                const target = e.target as HTMLImageElement;
                target.src = entry.src;
              }}
            />
          ) : (
            // API 이미지가 없을 때만 기본 이미지 사용
            <Image
              src={entry.src}
              alt={entry.label}
              width={32}
              height={32}
              className="object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                if (target.parentElement) {
                  target.parentElement.innerHTML = `<span class="text-xs ${entry.color} font-semibold">${entry.label.charAt(0)}</span>`;
                }
              }}
            />
          )}
        </div>
      )}
      <div className={clsx("text-sm font-semibold", entry.color)}>{entry.label}</div>
    </div>
  );
}

function normalize(code?: string | number | null): string {
  if (code === null || code === undefined) return "unranked";
  if (typeof code === "number") {
    // 숫자 코드 매핑은 사용하지 않음 (API가 문자열로 반환)
    return "unranked";
  }
  
  // 문자열 정규화: 공백 제거, 소문자 변환
  let normalized = code.trim().toLowerCase().replace(/\s+/g, " ");
  
  // 한국어 계급명 직접 확인 (우선 처리)
  if (/[가-힣]/.test(code)) {
    const koreanCode = code.trim();
    if (tierMap[koreanCode]) {
      return koreanCode;
    }
  }
  
  // 로마숫자를 아라비아 숫자로 변환 (I -> 1, II -> 2, III -> 3)
  // 단, 단독 "i"는 "1"로 변환하지 않음 (단어 경계 확인)
  normalized = normalized.replace(/\biii\b/g, "3");
  normalized = normalized.replace(/\bii\b/g, "2");
  normalized = normalized.replace(/\bi\b/g, "1");
  
  // 직접 매핑 확인
  if (tierMap[normalized]) return normalized;
  
  // 패턴 매칭: "SILVER I", "GOLD 1", "GRAND MASTER I", "LEGEND" 등
  const patterns = [
    // 레전드
    { pattern: /^legend|레전드$/i, base: "legend" },
    // 그랜드마스터
    { pattern: /^(grand\s*master|그랜드마스터|gm)\s*([123i]{1,3})?$/i, base: "grand master", hasNumber: true },
    // 마스터
    { pattern: /^(master|마스터)\s*([123i]{1,3})?$/i, base: "master", hasNumber: true },
    // 골드
    { pattern: /^(gold|골드)\s*([123i]{1,3})?$/i, base: "gold", hasNumber: true },
    // 실버
    { pattern: /^(silver|실버)\s*([123i]{1,3})?$/i, base: "silver", hasNumber: true },
    // 랭커
    { pattern: /^high\s*ranker|하이\s*랭커$/i, base: "high ranker" },
    { pattern: /^ranker|랭커$/i, base: "ranker" },
  ];
  
  for (const { pattern, base, hasNumber } of patterns) {
    const match = normalized.match(pattern);
    if (match) {
      if (hasNumber && match[2]) {
        // 숫자 추출 및 변환
        let num = match[2];
        if (num === "iii" || num === "3") num = "3";
        else if (num === "ii" || num === "2") num = "2";
        else if (num === "i" || num === "1") num = "1";
        else num = num;
        return `${base} ${num}`;
      }
      return base;
    }
  }
  
  // 부분 매칭 시도 (예: "GRAND MASTER I" -> "grand master 1")
  for (const key in tierMap) {
    const keyLower = key.toLowerCase();
    const normalizedLower = normalized.toLowerCase();
    // 정확한 부분 일치 확인
    if (normalizedLower === keyLower || 
        normalizedLower.includes(keyLower) || 
        keyLower.includes(normalizedLower)) {
      return key;
    }
  }
  
  return normalized;
}
