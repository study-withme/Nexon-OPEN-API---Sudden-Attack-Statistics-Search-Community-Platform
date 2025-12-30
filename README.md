# Nexon OPEN API - Sudden Attack Statistics Search & Community Platform

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.4-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Next.js](https://img.shields.io/badge/Next.js-16.0.10-black.svg)](https://nextjs.org/)
[![Java](https://img.shields.io/badge/Java-21-orange.svg)](https://openjdk.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Redis](https://img.shields.io/badge/Redis-7.0-red.svg)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-Compose-blue.svg)](https://www.docker.com/)

솔로 프로젝트 - 서든어택 게임 플레이어를 위한 전적 조회 및 커뮤니티 플랫폼

## 프로젝트 개요

Nexon OPEN API를 활용한 서든어택 플레이어 전적 검색 및 커뮤니티 플랫폼입니다. 넥슨에서 제공하는 OPEN API를 통해 실시간으로 플레이어의 전적 정보를 조회하고, 상세한 통계 분석과 매치 데이터를 제공합니다. 또한 게임 커뮤니티 기능을 제공하여 플레이어들이 정보를 공유하고 소통할 수 있는 환경을 제공합니다.

이 프로젝트는 대용량 트래픽 처리와 외부 API 호출 최적화에 중점을 두고 설계되었습니다. Redis를 활용한 멀티 레벨 캐싱 전략, 병렬 API 호출, Rate Limiting 등의 기법을 통해 성능을 최적화하고 안정적인 서비스를 제공합니다.

### 주요 기능

**플레이어 전적 검색**
- 닉네임 기반 실시간 플레이어 검색
- 기본 정보, 랭크, 티어 등 상세 통계 조회
- 최근 매치 기록 및 성적 분석

**매치 분석**
- 개별 매치 상세 정보 제공
- 맵별, 시간대별 통계 분석
- 랭크전 매치 데이터 수집 및 분석

**커뮤니티 기능**
- 게시글 작성, 댓글, 좋아요/싫어요 기능
- 클랜 등록 및 관리
- 전적 공유 및 비교 기능
- 트롤 신고 시스템

**시스템 관리**
- JWT 기반 사용자 인증 및 권한 관리
- 관리자 대시보드 및 통계 모니터링
- API 메트릭 및 캐시 히트율 모니터링

---

## 기술 스택

### Backend
- **Framework**: Spring Boot 3.3.4
- **Language**: Java 21
- **Database**: MariaDB 10.6 (Flyway 마이그레이션)
- **Cache**: Redis 7.0 (프로덕션) / Caffeine (로컬 개발 fallback)
- **Security**: Spring Security, JWT (JJWT)
- **Rate Limiting**: Bucket4j
- **API Documentation**: SpringDoc OpenAPI 3 (Swagger UI)
- **Build Tool**: Gradle
- **Monitoring**: Spring Actuator

### Frontend
- **Framework**: Next.js 16.0.10 (App Router)
- **Language**: TypeScript 5.0
- **UI Library**: React 19.2.1
- **State Management**: React Query (TanStack Query)
- **Styling**: Tailwind CSS 4.0
- **Rich Text Editor**: Tiptap
- **Charts**: Recharts

### Infrastructure & DevOps
- **Containerization**: Docker, Docker Compose
- **Reverse Proxy**: Nginx (프로덕션)
- **Deployment**: Cloudtype (PaaS)
- **Version Control**: Git
- **CI/CD**: GitHub Actions (선택적)

---

## 시작하기

### 사전 요구사항
- Java 21+
- Node.js 20.9.0+
- Docker & Docker Compose
- MariaDB 10.6+ (또는 Docker 사용)

### 환경 변수 설정

`.env` 파일을 생성하고 다음 변수들을 설정하세요:

```env
# 데이터베이스
DB_ROOT_PASSWORD=your_root_password
DB_NAME=jokercommunity
DB_USERNAME=root
DB_PASSWORD=your_password
DB_PORT=3306

# 백엔드
JWT_SECRET=your_32_char_secret_key_minimum
NXOPEN_API_KEY=your_nexon_api_key
CORS_ALLOWED_ORIGINS=http://localhost:3000
FLYWAY_ENABLED=true

# Redis (프로덕션 권장)
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=optional_password

# 프론트엔드
NEXT_PUBLIC_API_BASE=http://localhost:8080/api

# 포트 설정
BACKEND_PORT=8080
FRONTEND_PORT=3000
```

### Docker Compose로 실행

```bash
# 프로덕션 환경 (Redis 포함)
docker-compose -f docker-compose.prod.yml up -d

# 개발 환경
docker-compose up -d
```

### 로컬 개발 환경 실행

#### Backend
```bash
./gradlew clean build
./gradlew bootRun
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

### API 문서 확인
백엔드 서버 실행 후 다음 URL에서 Swagger UI에 접근할 수 있습니다:
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`

---

## 아키텍처 및 설계

### 시스템 아키텍처
```
┌─────────────┐
│   Next.js   │ (Frontend - SSR/SSG)
└──────┬──────┘
       │ HTTP/REST
┌──────▼──────────────────────┐
│   Spring Boot (Backend)     │
│  ┌──────────────────────┐   │
│  │  Rate Limiting       │   │ (Bucket4j)
│  │  JWT Auth            │   │
│  │  API Gateway         │   │
│  └──────────────────────┘   │
└──────┬──────────────────────┘
       │
┌──────▼──────┐  ┌──────────┐  ┌──────────┐
│   MariaDB   │  │  Redis   │  │ Nexon API│
└─────────────┘  └──────────┘  └──────────┘
```

### 캐싱 전략

#### 1. Redis 캐싱 (프로덕션)
- **목적**: 분산 캐시를 통한 성능 향상 및 서버 간 캐시 공유
- **구현**: Spring Cache Abstraction + RedisCacheManager
- **TTL 전략**:
  - 프로필 정보: 1시간
  - 매치 정보: 10분
  - 통계 데이터: 30분
  - 메타데이터: 24시간
  - OUID 매핑: 1시간

```java
@Cacheable(cacheNames = "profile", key = "#ouid")
public PlayerProfileResponse fetchAndSaveProfile(String ouid) {
    // 프로필 조회 로직
}
```

#### 2. Caffeine 캐싱 (로컬 개발)
- **Fallback**: Redis 미설정 시 자동 전환
- **장점**: 개발 환경에서 추가 인프라 불필요
- **최대 크기**: 캐시별 최적화된 크기 설정 (예: 프로필 10,000개)

#### 3. 데이터베이스 캐싱
- **SearchHistory 테이블**: 닉네임 → OUID 매핑 캐시
- **효과**: 반복 검색 시 외부 API 호출 100% 제거
- **비동기 저장**: 응답 속도 향상을 위한 비동기 처리

### Rate Limiting 전략

#### 1. API Gateway 레벨 (Bucket4j)
- **익명 사용자**: 분당 100회
- **인증 사용자**: 분당 500회
- **회원가입**: IP당 시간당 5회
- **구현**: `RateLimitingFilter` (OncePerRequestFilter)

```java
@Component
@Order(1)
public class RateLimitingFilter extends OncePerRequestFilter {
    // IP 기반 Rate Limiting
    // Bucket4j를 활용한 Token Bucket 알고리즘
}
```

#### 2. 외부 API 레이트 리밋 (Nexon API)
- **제한**: 초당 8회 (안전 마진 포함)
- **구현**: 슬라이딩 윈도우 방식
- **대기 전략**: 제한 초과 시 다음 초까지 대기

---

## 성능 최적화 및 트러블슈팅

### 1. API 호출 최적화

#### 문제 상황
- 초기 설계에서 플레이어 프로필 조회 시 4개의 외부 API를 순차 호출
- 매치 정보까지 자동 조회하여 초기 로딩 시간 3-5초 소요
- 반복 검색 시 동일한 API 호출 발생

#### 해결 방안

**① 병렬 API 호출**
```java
// 순차 호출 → 병렬 처리 전환
CompletableFuture<UserBasicResponse> basicFuture = 
    CompletableFuture.supplyAsync(() -> nxClient.getUserBasic(ouid));
CompletableFuture<UserRankResponse> rankFuture = 
    CompletableFuture.supplyAsync(() -> nxClient.getUserRank(ouid));
// ... 4개 API 동시 호출

CompletableFuture.allOf(basicFuture, rankFuture, tierFuture, recentFuture)
    .get(10, TimeUnit.SECONDS);
```
- **효과**: API 호출 시간 약 75% 단축 (순차 2-3초 → 병렬 0.5-0.8초)

**② DB 캐시 우선 확인**
```java
// 검색 시 DB 캐시 먼저 확인
SearchHistory cached = searchService.findCachedSearch(nickname);
if (cached != null && cached.getOuid() != null) {
    return cached.getOuid(); // API 호출 없이 즉시 반환
}
```
- **효과**: 반복 검색 시 API 호출 100% 제거, 응답 시간 10-50ms로 단축

**③ 지연 로딩 (Lazy Loading)**
- 프로필 조회 시 매치 정보 자동 조회 제거
- 사용자가 명시적으로 요청할 때만 매치 정보 조회
- **효과**: 초기 로딩 시간 1-2초 단축

### 2. 트래픽 처리 및 확장성

#### 문제 상황
- 트래픽 집중 시 서버 과부하
- 외부 API Rate Limit 초과로 인한 오류 발생
- 동시 사용자 증가 시 응답 지연

#### 해결 방안

**① 멀티 레벨 캐싱**
1. **프론트엔드 캐싱**: 메모리 캐시 (1시간 TTL) + 디바운싱 (500ms)
2. **백엔드 Redis 캐싱**: 분산 캐시로 서버 간 캐시 공유
3. **DB 캐싱**: SearchHistory 테이블을 통한 영구 캐시

**② 디바운싱 및 요청 병합**
```typescript
// 프론트엔드: 동일 요청 병합
const requestCache = new Map<string, Promise<T>>();
export function mergeRequest<T>(key: string, requestFn: () => Promise<T>) {
    if (requestCache.has(key)) {
        return requestCache.get(key)!;
    }
    const promise = requestFn().finally(() => requestCache.delete(key));
    requestCache.set(key, promise);
    return promise;
}
```

**③ 비동기 처리**
- 검색 기록 저장: `@Async` 어노테이션으로 비동기 처리
- 매치 상세 정보: 배치 비동기 처리 (최신 50개 제한)

### 3. Redis 운영 경험

#### 설계 결정
- **Redis vs Caffeine**: 프로덕션에서는 Redis, 개발 환경에서는 Caffeine fallback
- **Conditional Bean**: `@ConditionalOnProperty`로 자동 전환

```java
@Bean
@ConditionalOnProperty(name = "spring.data.redis.host", matchIfMissing = false)
public CacheManager redisCacheManager(RedisConnectionFactory factory) {
    // Redis 캐시 매니저
}

@Bean
@ConditionalOnProperty(name = "spring.data.redis.host", matchIfMissing = true)
public CacheManager caffeineCacheManager() {
    // Caffeine 캐시 매니저 (fallback)
}
```

#### 트러블슈팅 경험
1. **Redis 연결 실패 시 서비스 중단 문제**
   - 해결: Caffeine fallback 자동 전환으로 무중단 서비스 제공

2. **캐시 TTL 최적화**
   - 초기 설정: 모든 캐시 1시간 통일
   - 문제: 실시간성이 중요한 매치 정보가 오래된 데이터 제공
   - 해결: 데이터 특성에 맞는 차등 TTL 적용
     - 매치 정보: 10분 (높은 실시간성 요구)
     - 통계 데이터: 30분 (중간 수준)
     - 메타데이터: 24시간 (변경 빈도 낮음)

3. **캐시 히트율 모니터링**
   - Spring Cache 통계 활성화 (`recordStats()`)
   - `/api/metrics/cache` 엔드포인트로 실시간 모니터링
   - 목표: 캐시 히트율 80% 이상 유지

### 4. 데이터베이스 최적화

#### 인덱싱 전략
```sql
-- 검색 성능 향상을 위한 복합 인덱스
CREATE INDEX idx_search_nickname ON search_history(nickname);
CREATE INDEX idx_search_created ON search_history(created_at);

-- 조회 성능 향상
CREATE INDEX idx_post_view_history ON post_view_history(post_id, member_id);
```

#### 배치 처리
- 매치 메타데이터: `saveAll()`을 통한 배치 저장
- 중복 조회 최소화: `findAllById()`로 한 번에 조회 후 Map으로 변환

---

## 성능 지표 및 개선 효과

### API 호출량 감소
- **검색 API**: 반복 검색 시 **100% 감소** (DB 캐시 활용)
- **프로필 API**: 병렬 처리 및 지연 로딩으로 **60-80% 감소**
- **전체**: 예상 약 **60-80% API 호출량 감소**

### 응답 속도 개선
- **검색 (캐시 히트)**: 10-50ms (기존 200-500ms 대비)
- **프로필 조회**: 병렬 처리로 **75% 시간 단축** (2-3초 → 0.5-0.8초)
- **초기 로딩**: 매치 자동 조회 제거로 **1-2초 단축**

### 트래픽 처리
- **Rate Limiting**: DDoS 및 과도한 요청 방지
- **캐시 히트율**: 목표 80% 이상 유지
- **동시 사용자**: 확장 가능한 아키텍처로 수평 확장 지원

---

## 보안

### 인증 및 권한
- **JWT 기반 인증**: Stateless 인증 방식
- **Role-Based Access Control (RBAC)**: ADMIN, USER 권한 분리
- **관리자 접근 보호**: `AdminAccessProtectionFilter`로 IP 제한 및 시도 횟수 제한

### API 보안
- **Rate Limiting**: IP 및 사용자별 요청 제한
- **CORS 설정**: 허용된 Origin만 접근 가능
- **SQL Injection 방지**: JPA를 통한 파라미터 바인딩

### 데이터 보호
- **비밀번호 암호화**: BCrypt 해싱
- **민감 정보 마스킹**: 로그에서 토큰, 비밀번호 제외

---

## API 문서화

### Swagger/OpenAPI
- **도구**: SpringDoc OpenAPI 3
- **접근 URL**: `http://localhost:8080/swagger-ui.html`
- **기능**:
  - 모든 API 엔드포인트 문서화
  - 요청/응답 스키마 정의
  - 인증 테스트 기능
  - 인터랙티브 API 테스트

### 주요 API 엔드포인트
- `/api/player/search` - 플레이어 검색
- `/api/player/profile` - 프로필 조회
- `/api/player/matches` - 매치 목록 조회
- `/api/auth/**` - 인증 관련
- `/api/admin/**` - 관리자 기능
- `/api/metrics/**` - 시스템 메트릭

---

## 테스트

```bash
# 백엔드 테스트
./gradlew test

# 프론트엔드 테스트
cd frontend
npm test

# 통합 테스트 (Docker Compose)
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

---

## 배포

### Docker 이미지 빌드

```bash
# 백엔드
docker build -t jokerweb-backend .

# 프론트엔드
docker build -t jokerweb-frontend ./frontend \
  --build-arg NEXT_PUBLIC_API_BASE=http://localhost:8080/api
```

### 프로덕션 배포
- **Platform**: Cloudtype (PaaS)
- **CI/CD**: GitHub Actions (선택적)
- **모니터링**: Spring Actuator + 커스텀 메트릭 엔드포인트

---

## 기여

이 프로젝트는 개인 프로젝트입니다. 버그 리포트나 기능 제안은 Issue를 통해 환영합니다.

## 라이선스

이 프로젝트는 개인 프로젝트입니다.

## 주요 성과 및 학습 경험

### 기술적 성과
1. **성능 최적화**: API 호출 최적화로 응답 시간 75% 단축
2. **캐싱 전략**: Redis 멀티 레벨 캐싱으로 트래픽 처리 능력 향상
3. **확장성 설계**: 수평 확장 가능한 아키텍처 구현
4. **트러블슈팅**: 실제 운영 환경에서의 문제 해결 경험

### 개발 프로세스
- **솔로 프로젝트**: 기획부터 배포까지 전 과정 독립 개발
- **애자일 개발**: 지속적인 개선 및 피드백 반영
- **문서화**: Swagger를 통한 체계적인 API 문서화

### 기술 스택 경험
- Spring Boot, Next.js 등 최신 기술 스택 활용
- Redis를 활용한 분산 캐싱 및 성능 최적화
- Docker를 통한 컨테이너화 및 배포 자동화
- Rate Limiting, 모니터링 등 프로덕션 레벨 고려사항 구현

---

## 문의

프로젝트 관련 문의사항은 Issue를 통해 남겨주세요.
