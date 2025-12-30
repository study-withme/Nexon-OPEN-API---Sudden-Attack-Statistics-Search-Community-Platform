import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloudtype Dockerfile 사용 시 standalone 모드 활성화
  output: 'standalone', // Dockerfile에서 standalone 모드 사용
  
  // Turbopack 루트 디렉토리 명시 (상위 디렉토리의 lockfile로 인한 경고 방지)
  turbopack: {
    root: __dirname,
  },
  
  images: {
    // 서든어택 API에서 제공하는 모든 이미지 도메인 허용
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'static.api.nexon.com',
      },
      {
        protocol: 'https',
        hostname: 'open.api.nexon.com',
      },
      {
        protocol: 'https',
        hostname: 'api.nexon.com',
      },
      {
        protocol: 'https',
        hostname: '**.nexon.com',
      },
      // 서든어택에서 사용하는 다른 이미지 도메인도 허용
      {
        protocol: 'https',
        hostname: '**.suddenattack.com',
      },
      {
        protocol: 'https',
        hostname: '**.nexon.co.kr',
      },
    ],
    // 이미지 최적화 설정
    formats: ['image/avif', 'image/webp'], // AVIF, WebP 형식 우선 지원
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840], // 반응형 이미지 크기
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384], // 아이콘/썸네일 크기
    minimumCacheTTL: 60, // 이미지 캐시 TTL (초)
  },
};

export default nextConfig;
