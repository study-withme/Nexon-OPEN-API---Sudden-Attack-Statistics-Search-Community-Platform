# 서든어택 매치 정보 조회 API

## 개요

이 패키지는 Nexon OPEN API를 안전하게 감싸서 제공하는 매치 정보 조회 API입니다.

## API 엔드포인트

### 1. 매치 정보 조회
- **엔드포인트**: `GET /api/sa/matches`
- **파라미터**:
  - `ouid` (필수): 계정 식별자 (8-64자, 영문자/숫자만)
  - `mode` (필수): 게임 모드 (폭파미션, 개인전, 데스매치, 진짜를 모아라)
  - `type` (선택): 매치 유형 (랭크전 솔로, 랭크전 파티, 클랜 랭크전, 클랜전, 퀵매치 클랜전)
  - `limit` (선택): 최대 반환 개수 (1-1000, 기본값: 100)
  - `useKst` (선택): KST 시간대 사용 여부 (기본값: false)

### 2. 매치 상세 정보 조회
- **엔드포인트**: `GET /api/sa/matches/{matchId}/detail`
- **파라미터**:
  - `matchId` (경로): 매치 ID (1-64자, 영문자/숫자만)
  - `useKst` (선택): KST 시간대 사용 여부 (기본값: false)

### 3. 플레이어 전적검색
- **엔드포인트**: `GET /api/sa/matches/history`
- **파라미터**:
  - `ouid` (필수): 계정 식별자 (8-64자, 영문자/숫자만)
  - `useKst` (선택): KST 시간대 사용 여부 (기본값: false)
- **기능**: 최근 200게임의 매치 정보와 상세 정보를 카테고리별로 조회

## 기존 API와의 차이점

### `/api/player/matches` (기존 API)
- **목적**: 프론트엔드에서 사용 중인 기존 API
- **서비스**: `MatchService.fetchMatches()` 사용
- **특징**: 
  - 프론트엔드 모드 값 변환 로직 포함
  - DB 폴백 전략 포함
  - 비동기 매치 상세 정보 저장

### `/api/sa/matches` (새 API)
- **목적**: 표준화된 응답, 강화된 에러 처리, 재시도 로직
- **서비스**: `SuddenAttackMatchService.getMatches()` 사용
- **특징**:
  - 표준화된 응답 포맷 (match_result enum 변환)
  - 지수 백오프 재시도 로직
  - 캐시 적용 (60초 TTL)
  - 엄격한 파라미터 검증
  - KST 시간대 옵션 제공
  - match_id를 string으로 처리 (절대 long으로 파싱하지 않음)

## 주요 기능

### 1. 재시도 로직
- 지수 백오프를 사용한 자동 재시도
- 429 (Rate Limit), 5xx (Server Error), 타임아웃 처리
- 최대 3회 재시도

### 2. 캐시
- 매치 정보: 60초 TTL
- 매치 상세 정보: 10분 TTL
- Redis 또는 Caffeine 사용

### 3. 에러 처리
- 엄격한 파라미터 검증
- 명확한 에러 메시지
- 로그에서 민감정보 마스킹

### 4. DB 저장
- match_summary 테이블에 upsert
- last_fetched_at으로 갱신 주기 제어

## 주의사항

1. **예약어 처리**: `kill`, `death`, `assist`는 MariaDB 예약어이므로 컬럼명을 `kill_count`, `death_count`, `assist_count`로 사용
2. **match_id**: 절대 long으로 파싱하지 않고 string으로 처리
3. **비동기 처리**: 전적검색 시 많은 API 호출이 발생하므로 비동기 배치 처리 사용
