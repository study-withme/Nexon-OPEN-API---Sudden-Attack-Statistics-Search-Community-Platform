# Next.js 프론트엔드용 Dockerfile (Cloudtype Docker 배포용)
# Multi-stage build for optimized image size

FROM node:20-alpine AS base

# 빌드 단계
FROM base AS builder
WORKDIR /app

# package.json과 lock 파일 복사 (의존성 캐시 최적화)
COPY package.json package-lock.json* ./

# 의존성 설치 (빌드에 필요한 devDependencies 포함)
RUN npm ci && npm cache clean --force

# 소스 코드 복사
COPY . .

# 환경변수 설정 (빌드 시 필요)
# Cloudtype에서 빌드 인자로 전달되거나, 환경 변수로 설정됨
ARG NEXT_PUBLIC_API_BASE
ENV NEXT_PUBLIC_API_BASE=${NEXT_PUBLIC_API_BASE}

# Next.js 빌드 (standalone 모드 활성화)
RUN npm run build

# 실행 단계
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 사용자 생성 (보안을 위해 root가 아닌 사용자로 실행)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Next.js standalone 모드 실행에 필요한 파일 복사
# standalone 모드에서는 .next/standalone 디렉토리 구조를 그대로 사용
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

# Healthcheck 추가 (Cloudtype에서 사용)
# Alpine에 wget이 없을 수 있으므로 Node.js 내장 http 모듈 사용
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# standalone 모드에서는 server.js가 .next/standalone 디렉토리에 생성됨
# 현재 작업 디렉토리가 standalone 디렉토리이므로 server.js를 직접 실행
CMD ["node", "server.js"]
