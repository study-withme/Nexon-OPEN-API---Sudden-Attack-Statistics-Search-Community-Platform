# 인증 API 및 프론트엔드 사용 가이드

## 1. 엔드포인트 요약

### 1.1 회원가입
- **URL**: `/api/auth/register`
- **Method**: `POST`
- **Request Body (JSON)**:
  - `email` (string, required) - 이메일 형식
  - `password` (string, required) - 8~64자, 영문/숫자/특수문자 조합 권장
  - `nickname` (string, optional) - 2~16자, 닉네임 규칙 검증
  - `ouid` (string, optional) - 서든어택 OUID, 있으면 넥슨 프로필 연동 시도
- **Response 200 (application/json)**: `MemberResponse`
- **주요 에러**:
  - `400 Bad Request` : 유효하지 않은 닉네임/비밀번호 등
  - `409 Conflict` : 이미 사용 중인 이메일/닉네임/OUID

### 1.2 로그인
- **URL**: `/api/auth/login`
- **Method**: `POST`
- **Request Body (JSON)**:
  - `email` (string, required)
  - `password` (string, required)
- **Response 200 (application/json)**: `LoginResponse`
  - `token` (string, required) - JWT 액세스 토큰 (로컬스토리지에 저장)
  - `member` (MemberResponse, required)
- **주요 에러**:
  - `400 Bad Request` : 이메일/비밀번호 불일치 등

### 1.3 프로필 조회(me)
- **URL**: `/api/auth/me`
- **Method**: `GET`
- **Headers**:
  - `Authorization: Bearer {token}`
- **Response 200 (application/json)**: `MemberResponse`
- **Response 401**: 토큰 누락/유효하지 않음

### 1.4 넥슨 계정 연동
- **URL**: `/api/auth/link-nexon`
- **Method**: `POST`
- **Headers**:
  - `Authorization: Bearer {token}`
- **Request Body (JSON)**:
  - `ouid` (string, optional)
  - `nickname` (string, optional)
- **Response 200 (application/json)**: `MemberResponse`
- **Response 401**: 인증 실패

### 1.5 중복/가용성 검사

모든 응답 공통 구조: 
```json
{
  "available": true,
  "message": "설명 메시지"
}
```

- **이메일 중복 검사**
  - `GET /api/auth/check-email?email={email}`
- **닉네임 중복/규칙 검사**
  - `GET /api/auth/check-nickname?nickname={nickname}`
- **OUID 중복 검사**
  - `GET /api/auth/check-ouid?ouid={ouid}`


## 2. DTO 구조

### 2.1 `RegisterRequest` (백엔드)

```12:26:src/main/java/com/example/jokerweb/auth/RegisterRequest.java
public class RegisterRequest {
    @Email
    @NotBlank
    private String email;

    @Size(min = 2, max = 16)
    private String nickname;

    @NotBlank
    @Size(min = 8, max = 64)
    private String password;

    private String ouid; // 선택 사항
}
```

### 2.2 `LoginRequest`

```10:17:src/main/java/com/example/jokerweb/auth/LoginRequest.java
public class LoginRequest {
    @Email
    @NotBlank
    private String email;

    @NotBlank
    private String password;
}
```

### 2.3 `LoginResponse`

```6:11:src/main/java/com/example/jokerweb/auth/LoginResponse.java
public class LoginResponse {
    private String token;
    private MemberResponse member;
}
```

### 2.4 `MemberResponse`

```8:35:src/main/java/com/example/jokerweb/auth/MemberResponse.java
public class MemberResponse {
    private Long id;
    private String email;
    private String nickname;
    private List<String> roles;
    private boolean admin;
    private String ouid;
    private String clanName;
    private String titleName;
    private String mannerGrade;
    private boolean nexonLinked;

    public static MemberResponse from(Member member, List<String> roles) { ... }
}
```

### 2.5 가용성 응답 DTO (`AvailabilityResponse`)

```70:75:src/main/java/com/example/jokerweb/auth/AuthController.java
public static class AvailabilityResponse {
    private boolean available;
    private String message;
}
```


## 3. 에러 응답 규칙 (공통)

`GlobalExceptionHandler`에서 다음 형태의 JSON을 반환합니다.

```255:262:src/main/java/com/example/jokerweb/common/GlobalExceptionHandler.java
public static class ErrorResponse {
    private int status;        // HTTP status code
    private String message;    // 사용자에게 노출할 메시지 (한국어)
    private Map<String, String> errors; // 필드별 검증 에러 (선택)
    private LocalDateTime timestamp;
}
```

프론트엔드는 `status`와 `message`만 주로 사용하며, `normalizeApiError`에서 HTTP 상태코드에 따른 기본 메시지를 보완합니다.


## 4. 프론트엔드 인증 사용 가이드

### 4.1 기본 API 레이어 (`frontend/src/lib/auth.ts`)

- **토큰 저장/조회/삭제**
  - `getStoredToken()` : `localStorage`에서 토큰 읽기
  - `persistToken(token)` : 토큰 저장 + `axios` Authorization 헤더 설정 + `auth-change` 이벤트 발행
  - `clearToken()` : 토큰 제거 + 헤더 제거 + `auth-change` 이벤트 발행

- **주요 함수**

```34:75:frontend/src/lib/auth.ts
export async function login(req: LoginRequest): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/auth/login", req);
  if (data?.token) {
    persistToken(data.token);
  }
  return data;
}

export async function register(req: RegisterRequest): Promise<RegisterResponse> {
  const { data } = await api.post<RegisterResponse>("/auth/register", req);
  return data;
}

export async function fetchMe(): Promise<MemberResponse | null> {
  try {
    const { data } = await api.get<MemberResponse>("/auth/me");
    return data;
  } catch (error) {
    return null;
  }
}
```

- **가용성 체크 함수**
  - `checkEmailAvailability(email)` → `/auth/check-email`
  - `checkNicknameAvailability(nickname)` → `/auth/check-nickname`
  - `checkOuidAvailability(ouid)` → `/auth/check-ouid`

### 4.2 인증 상태 훅 (`frontend/src/hooks/useAuth.ts`)

```7:42:frontend/src/hooks/useAuth.ts
export function useAuth() {
  const [token, setToken] = useState<string | null>(() => getStoredToken());

  useEffect(() => {
    const handler = () => {
      const current = getStoredToken();
      setToken(current);
      setAuthToken(current || undefined);
    };
    handler();

    window.addEventListener("storage", handler);
    window.addEventListener("auth-change", handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener("auth-change", handler);
    };
  }, []);

  const loginSet = (newToken: string) => {
    persistToken(newToken);
    setToken(newToken);
  };

  const logout = () => {
    clearToken();
    setToken(null);
  };

  return {
    token,
    isAuthed: !!token,
    setToken: loginSet,
    logout,
  };
}
```

- **권장 패턴**
  - 인증이 필요한 페이지에서는 `RequireAuth` 또는 `RequireAdmin` 컴포넌트로 보호
  - 토큰 직접 조작 대신 항상 `login`, `logout`, `useAuth.logout` 사용

### 4.3 라우팅 보호 컴포넌트

- **RequireAuth**: 로그인 필요 페이지 보호

```13:32:frontend/src/components/auth/RequireAuth.tsx
export function RequireAuth({ children, redirectTo = "/login" }: Props) {
  const router = useRouter();
  const { isAuthed, token } = useAuth();

  useEffect(() => {
    if (!token) {
      router.replace(redirectTo);
    }
  }, [token, router, redirectTo]);

  if (!isAuthed) {
    return <LoadingSpinner message="인증 상태 확인 중..." />;
  }

  return <>{children}</>;
}
```

- **RequireAdmin**: 관리자 페이지 보호 (`/admin/**`)

```9:86:frontend/src/components/admin/RequireAdmin.tsx
export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { isAuthed } = useAuth();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthed) { ... }
    let cancelled = false;
    fetchMe().then((profile) => {
      if (cancelled) return;
      if (!profile || !(profile.admin || profile.roles?.some((r) => r.toUpperCase() === "ADMIN"))) { ... }
      setAllowed(true);
      setChecking(false);
    }).catch(() => { ... });
    return () => { cancelled = true; };
  }, [isAuthed, router]);

  if (!allowed) { ... 경고 화면 ... }
  return <>{children}</>;
}
```

### 4.4 로그인/회원가입 페이지 플로우

- **로그인 페이지** (`frontend/src/app/login/page.tsx`)
  - `login({ email, password })` 호출 후 성공 시:
    - 토큰 자동 저장 (`persistToken`)
    - `next` 쿼리 파라미터 또는 `/`로 리다이렉트
  - 이미 로그인 상태(`isAuthed === true`)면:
    - 토스트: "이미 로그인된 상태입니다."
    - `next` 또는 `/`로 즉시 리다이렉트

- **회원가입 페이지** (`frontend/src/app/register/page.tsx`)
  - 이메일/닉네임 입력 시 500ms 디바운스로 가용성 체크 API 호출 → 중복/규칙 위반을 프론트에서 선제 검사
  - 회원가입 완료 후 바로 `login({ email, password })` 호출 → 자동 로그인 & 리다이렉트
  - 서든어택 OUID가 있으면 백엔드에서 넥슨 프로필 정보와 함께 `Member` 생성

### 4.5 중복 호출 최소화 패턴

- `fetchMe()`는 다음 위치에서 사용됩니다.
  - 메인 페이지 홈 카드의 로그인 사용자 정보/프로필 로딩
  - 관리자 보호 컴포넌트 (`RequireAdmin`)
  - 커뮤니티 목록 상단에서 현재 사용자 정보 확인 (권한/표시용)
  - 병영 신고 페이지에서 "내가 신고당한 건수" 계산
- **권장 사용법**:
  - 한 화면에서 여러 컴포넌트가 필요로 할 경우, 상위 컴포넌트가 한 번 `fetchMe()`를 호출해 상태로 내려주는 방식으로 점진적으로 교체
  - 이미 `useAuth`로 토큰 유무를 확인하는 경우, 토큰만 필요하면 `fetchMe()`를 추가로 호출하지 않도록 주의


## 5. 인증 관련 개발 체크리스트

- **백엔드**
  - [x] `/api/auth/register` 요청 시 이메일/닉네임/OUID 검증 + 넥슨 프로필 연동 + 기본 USER 권한 부여
  - [x] `/api/auth/login` 요청 시 비밀번호 검증 + 로그인 정보 업데이트 + 넥슨 정보 동기화 + JWT 발급
  - [x] `/api/auth/me` 요청 시 토큰 파싱 후 `MemberResponse` + 역할 목록 반환
  - [x] 중복/규칙 위반 시 `GlobalExceptionHandler`를 통해 일관된 `ErrorResponse` 반환

- **프론트엔드**
  - [x] `login`/`register`/`fetchMe` 등 인증 관련 API를 `lib/auth.ts`에서만 호출 (페이지/컴포넌트는 이 모듈만 사용)
  - [x] `useAuth` 훅으로 토큰 기반 인증 상태 관리 (localStorage + axios 헤더 동기화)
  - [x] 보호 페이지에서 `RequireAuth`/`RequireAdmin` 사용
  - [x] 이메일/닉네임/OUID 가용성 체크를 디바운스 + 단일 API 레이어로 통일

이 문서를 기준으로 이후 클랜/파일 업로드 영역에도 동일한 패턴(`lib/*`, `hooks/*`, 공통 에러 처리, 가용성 체크 API 등)을 적용할 수 있습니다.







