# 통합 정책 및 작업 메모

이 문서는 프론트/백엔드/DB/Nexon 연동 작업 시 참고용으로 유지한다.  
필요한 만큼만 요약하며, 변경 시 이 파일을 업데이트한다.

## 운영 정책 (확정)
- 가입은 허용. **Nexon 연동이 없으면 커뮤니티 활동 제한**.
- 로그인 실패 시: 경고 후 제한 기능만 잠금.
- 병영박제: **비로그인/비연동 모두 접근 불가**(작성·조회·댓글 포함).
- 클랜: **모든 기능 Nexon 연동 필수**(등록/검증/멤버 관리/조회 등).
- 마켓: 이용 시 댓글/상세 조회도 연동 필수.
- 클랜 검증: Nexon 기준 검증이 무조건 들어가야 함.

## 현재 상태 (요약)
- Spring Boot dev 프로필 기동 및 `./gradlew test` 통과.
- RBAC: `/api/admin/**` ADMIN/MODERATOR 제한, JWT에 롤 포함.
- 프론트 관리자 영역은 API 연동 완료(신고, 회원 등) 및 RequireAdmin 가드 적용.
- DB 덤프 `jokercommunity.sql` 존재. 현 JPA 엔티티와 스키마 간 불일치 가능성 큼(예: access_log, clan*, activity_log 등).

## 우선 작업 순서
1) 스키마 ↔ 엔티티 정합성 점검 및 수정
   - access_log, activity_log, admin_action_log
   - barracks_report + attachment ✅
   - clan / clan_member / clan_verification_request / clan_delete_request ✅ (기본 CRUD/검증요청)
   - bookmark/notification 등 사용 여부 확인
2) Nexon 연동 강화
   - 회원가입/로그인 시 Nexon 기본정보(닉네임/클랜/OUID) 조회·저장
   - 연동 여부 플래그/필드 추가 및 동기화 실패 시 제한
   - 글/댓글/클랜/병영/마켓에서 연동 필수 가드 적용 (글/댓글/클랜/병영/트롤 신고 ✅, 마켓 TBD)
3) 프론트 연동/가드
   - 일반 사용자 플로우(회원가입→로그인→글/댓글→클랜/병영/마켓) API 연결 및 비연동 차단
4) 로그/추적
   - access_log/활동/관리자 작업 로그 삽입 포인트 보강
5) 검증
   - `./gradlew test` 재확인 및 기본 스모크(E2E 경로) 점검

## 메모
- Nexon API DTO: `UserBasicResponse`에 user_name/clan_name 등 존재. 회원 가입/로그인 시 활용 예정.
- 클랜 검증은 Nexon API 결과 기반으로 상태 전이(pending → verified 등) 필요.
- 비연동 차단 시 응답 코드는 401/403 중 정책에 맞춰 결정(기본은 403, 미인증은 401). 필요 시 커스텀 에러 코드/메시지 정의.
