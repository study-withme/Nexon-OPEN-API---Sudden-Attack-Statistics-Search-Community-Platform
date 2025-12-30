# XAMPP FileZilla Server 빠른 설정

## 답변: 네, 로컬 컴퓨터의 실제 절대 경로를 사용해야 합니다

FileZilla Server는 실제 파일 시스템의 절대 경로를 사용합니다. 두 가지 옵션이 있습니다:

## 옵션 1: 프로젝트 디렉토리 내 설정 (권장)

**장점**: 프로젝트와 함께 관리, Git에서 제외하기 쉬움

### 1. 디렉토리 생성

프로젝트 루트에 `uploads` 폴더가 없으면 생성:
```
E:\Sudden-Attack-Database-main\Sudden-Attack-Database-main\uploads
```

### 2. FileZilla Server 설정

1. XAMPP Control Panel → FileZilla의 **Admin** 클릭
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

### 3. Spring Boot 설정 (이미 완료됨)

`application-dev.properties`:
```properties
ftp.host=localhost
ftp.port=21
ftp.username=jokerweb
ftp.password=jokerweb123
ftp.base-path=/          # FileZilla의 홈 디렉토리 기준
ftp.base-url=http://localhost:8080/files
```

### 4. 파일 접근

- 업로드: Spring Boot가 FileZilla Server에 파일 업로드
- 다운로드: Spring Boot가 `/files/**` 경로로 파일 서빙 (WebConfig 설정됨)

## 옵션 2: XAMPP htdocs 디렉토리 사용

**장점**: XAMPP의 표준 디렉토리, Apache와 쉽게 연동

### 1. 디렉토리 생성

```
C:\xampp\htdocs\uploads
```

### 2. FileZilla Server 설정

Directory: `C:\xampp\htdocs\uploads`

### 3. Apache 설정 (파일 접근용)

`C:\xampp\apache\conf\httpd.conf`에 추가:
```apache
Alias /files "C:/xampp/htdocs/uploads"
<Directory "C:/xampp/htdocs/uploads">
    Options -Indexes FollowSymLinks
    AllowOverride None
    Require all granted
</Directory>
```

Apache 재시작 필요

## 현재 설정 (프로젝트 디렉토리 내)

현재는 **옵션 1 (프로젝트 디렉토리 내)** 방식으로 설정되어 있습니다.

**FileZilla Server에서 설정할 경로:**
```
E:\Sudden-Attack-Database-main\Sudden-Attack-Database-main\uploads
```

이 경로를 FileZilla Server Interface에서 설정하면 바로 사용할 수 있습니다!
