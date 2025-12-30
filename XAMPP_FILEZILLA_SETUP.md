# XAMPP FileZilla Server 연동 가이드

## 디렉토리 설정 옵션

FileZilla Server는 **로컬 컴퓨터의 실제 물리적 경로**를 사용해야 합니다. 두 가지 옵션이 있습니다:

### 옵션 1: 프로젝트 디렉토리 내 설정 (권장 - 개발용)

프로젝트 폴더 내에 `uploads` 디렉토리를 만드는 방법입니다.

**절대 경로 예시:**
```
E:\Sudden-Attack-Database-main\Sudden-Attack-Database-main\uploads
```

**FileZilla Server 설정:**
1. FileZilla Server Interface → Edit → Users → jokerweb
2. Shared folders → Add
3. Directory: `E:\Sudden-Attack-Database-main\Sudden-Attack-Database-main\uploads`
4. Alias: `/` 또는 비워두기

**장점:**
- 프로젝트와 함께 관리됨
- Git으로 제외하기 쉬움 (.gitignore)
- 개발 환경에서 편리함

**단점:**
- 프로젝트 폴더 이동 시 경로 변경 필요

### 옵션 2: XAMPP 디렉토리 사용 (기본)

XAMPP의 htdocs 디렉토리를 사용하는 방법입니다.

**절대 경로:**
```
C:\xampp\htdocs\uploads
```

**FileZilla Server 설정:**
1. FileZilla Server Interface → Edit → Users → jokerweb
2. Shared folders → Add
3. Directory: `C:\xampp\htdocs\uploads`
4. Alias: `/` 또는 비워두기

**장점:**
- XAMPP의 표준 디렉토리 사용
- Apache와 쉽게 연동 (웹 접근 가능)
- 프로젝트와 독립적

**단점:**
- 프로젝트와 분리되어 있음

## 권장 설정 (개발 환경)

개발 환경에서는 **프로젝트 디렉토리 내** 설정을 권장합니다:

### 1. 디렉토리 생성

프로젝트 루트에 `uploads` 폴더 생성:
```
E:\Sudden-Attack-Database-main\Sudden-Attack-Database-main\uploads
```

### 2. .gitignore에 추가 (이미 되어있어야 함)

```gitignore
# Uploads directory
uploads/
```

### 3. FileZilla Server 설정

1. FileZilla Server Interface 실행
2. Edit → Users → Add
   - Account: `jokerweb`
   - Password: 원하는 비밀번호 (예: `jokerweb123`)
   - Enable account: ✅
3. Shared folders 탭
   - Add 클릭
   - Directory: `E:\Sudden-Attack-Database-main\Sudden-Attack-Database-main\uploads`
   - Alias: `/` (또는 비워두기)
   - 권한:
     - ✅ Files: Read, Write
     - ✅ Directories: List, Create, Delete, Inherit

### 4. Spring Boot 설정

`application-dev.properties`:
```properties
ftp.host=localhost
ftp.port=21
ftp.username=jokerweb
ftp.password=jokerweb123
ftp.base-path=/                    # FileZilla의 홈 디렉토리 기준 (Alias가 /이면)
ftp.base-url=http://localhost:8080/files  # 웹 접근 URL
```

### 5. 웹에서 파일 접근 설정

#### 방법 A: Spring Boot에서 직접 서빙 (간단)

`WebConfig.java` 파일 수정하여 주석 해제:
```java
@Override
public void addResourceHandlers(ResourceHandlerRegistry registry) {
    String filePath = "file:E:/Sudden-Attack-Database-main/Sudden-Attack-Database-main/uploads/";
    registry.addResourceHandler("/files/**")
            .addResourceLocations(filePath)
            .setCachePeriod(3600)
            .resourceChain(true);
}
```

#### 방법 B: Apache (XAMPP)에서 서빙

`C:\xampp\apache\conf\httpd.conf`에 추가:
```apache
Alias /files "E:/Sudden-Attack-Database-main/Sudden-Attack-Database-main/uploads"
<Directory "E:/Sudden-Attack-Database-main/Sudden-Attack-Database-main/uploads">
    Options -Indexes FollowSymLinks
    AllowOverride None
    Require all granted
</Directory>
```

## 디렉토리 구조

업로드된 파일은 다음과 같이 저장됩니다:

```
uploads/
  └── 2024/
      └── 01/
          └── 15/
              ├── abc123def456.jpg          # 원본 파일
              ├── abc123def456.png
              └── thumbnails/               # 썸네일
                  ├── abc123def456.jpg
                  └── abc123def456.png
```

## 정리

**네, 로컬 컴퓨터의 실제 절대 경로를 사용해야 합니다.**

- ❌ 상대 경로나 URL은 사용 불가
- ✅ 절대 경로만 사용 가능 (예: `E:\...\uploads` 또는 `C:\xampp\htdocs\uploads`)

프로젝트 디렉토리 내에 설정하면:
- 개발 환경에서 관리가 편리함
- Git에서 쉽게 제외 가능
- 프로젝트와 함께 백업 가능

## 빠른 시작 체크리스트

- [ ] 프로젝트 루트에 `uploads` 폴더 생성
- [ ] FileZilla Server Interface에서 사용자 `jokerweb` 생성
- [ ] FileZilla Server에서 업로드 디렉토리 경로 설정 (프로젝트 내 `uploads` 폴더)
- [ ] 파일 쓰기 권한 확인
- [ ] Spring Boot `application-dev.properties` 확인
- [ ] 파일 업로드 테스트
