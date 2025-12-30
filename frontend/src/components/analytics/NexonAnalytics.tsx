"use client";

import Script from "next/script";

// 개발 환경에서만 로깅
const log = {
  info: (message: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[NexonAnalytics] ${message}`);
    }
  },
};

const APP_ID = "244990";

export function NexonAnalytics() {
  return (
    <>
      {/* Nexon Open API Analytics 스크립트 */}
      {/* 공식 문서: https://openapi.nexon.com/analytics.js?app_id={app_id} */}
      {/* 실제 제공된 스크립트는 /js/analytics.js 경로 사용 */}
      <Script
        id="nexon-analytics"
        strategy="afterInteractive"
        src={`https://openapi.nexon.com/js/analytics.js?app_id=${APP_ID}`}
        onLoad={() => {
          log.info("Nexon Analytics 스크립트 로드 완료");
          // 스크립트 로드 확인
          if (typeof window !== 'undefined') {
            // 글로벌 객체 확인 (Nexon Analytics가 전역 객체를 생성할 수 있음)
            log.info("Analytics 스크립트 초기화 완료");
          }
        }}
        onError={(e) => {
          log.info(`Nexon Analytics 스크립트 로드 실패: ${e}`);
        }}
      />
    </>
  );
}
