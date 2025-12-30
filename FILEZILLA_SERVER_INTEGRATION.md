# FileZilla Server 활용 방안

## 웹 커뮤니티에서 FileZilla Server의 일반적인 사용 사례

### 1. **파일 업로드/다운로드 서버**
- **게시글 첨부파일 저장**: 이미지, 동영상, 문서 등 대용량 파일 저장
- **프로필 이미지/아바타 저장**: 사용자 프로필 사진 관리
- **게임 리플레이 파일 저장**: 게임 플레이 영상 등
- **공지사항/문서 자료실**: 관리자가 업로드하는 공식 문서 저장

### 2. **CDN 대체 또는 보완**
- 클라우드 스토리지 비용 절감
- 자체 서버에서 파일 관리 (데이터 주권)
- 대용량 파일 전송 최적화

### 3. **백업 및 아카이브**
- 사용자 업로드 파일 백업
- 게시글 삭제 후에도 파일 보관 (법적 보관 의무 대응)

### 4. **대용량 파일 공유**
- 게임 패치 파일 배포
- 커뮤니티 이벤트 자료 배포

---

## 현재 프로젝트에 적용 가능한 방안

### 현재 상황 분석
- ? `file_storage` 테이블 존재 (미사용 상태)
- ? `post_attachment` 테이블 존재
- ? 현재는 base64 인코딩으로 이미지 전송 (비효율적)
- ? 별도 파일 업로드 API 없음

### 제안하는 구현 방안

#### 옵션 1: FTP/SFTP를 통한 직접 파일 업로드 (권장)

**구조:**
```
사용자 → Spring Boot API → FileZilla Server (FTP/SFTP) → 파일 저장
       ↓
    DB에 파일 메타데이터 저장
```

**장점:**
- 대용량 파일 처리 효율적
- 서버 리소스 부담 감소 (base64 인코딩 제거)
- 파일 관리 용이
- 기존 `file_storage` 테이블 활용 가능

**필요한 작업:**
1. Spring Boot에서 FTP/SFTP 클라이언트 설정 (Apache Commons VFS 또는 JSch)
2. 파일 업로드 API 엔드포인트 생성
3. 프론트엔드에서 multipart/form-data로 파일 전송
4. FileZilla Server 설정 (사용자 계정, 디렉토리 권한)

#### 옵션 2: 관리자용 파일 관리

**사용 사례:**
- 관리자가 공지사항 첨부파일 직접 업로드
- 이벤트 이미지/문서 관리
- 게임 가이드 PDF 등 공식 자료 관리

**구조:**
```
관리자 → FileZilla Client → FileZilla Server → 웹에서 접근
```

#### 옵션 3: 하이브리드 방식

**일반 사용자:** 
- 소용량 이미지 → Spring Boot API → 로컬 스토리지
- 대용량 파일 → Spring Boot API → FileZilla Server

**관리자:**
- FileZilla Client로 직접 파일 관리

---

## 구현 예시 (옵션 1)

### 1. Spring Boot 의존성 추가

```gradle
// build.gradle
dependencies {
    // FTP 클라이언트
    implementation 'org.apache.commons:commons-vfs2:2.10.0'
    // 또는 JSch (SFTP)
    implementation 'com.jcraft:jsch:0.1.55'
}
```

### 2. 파일 업로드 서비스 구현

```java
@Service
@RequiredArgsConstructor
public class FileUploadService {
    
    private final FileStorageRepository fileStorageRepository;
    private final FtpClient ftpClient; // FTP 클라이언트 빈
    
    public FileUploadResponse uploadFile(MultipartFile file, Long uploaderId) {
        // 1. 파일 검증
        validateFile(file);
        
        // 2. 고유 파일명 생성
        String fileName = generateUniqueFileName(file.getOriginalFilename());
        String filePath = "/uploads/" + LocalDate.now() + "/" + fileName;
        
        // 3. FTP 서버에 업로드
        String fileUrl = ftpClient.upload(file, filePath);
        
        // 4. DB에 메타데이터 저장
        FileStorage fileStorage = FileStorage.builder()
            .filePath(filePath)
            .fileUrl(fileUrl)
            .fileSize(file.getSize())
            .mimeType(file.getContentType())
            .uploaderId(uploaderId)
            .build();
        
        fileStorageRepository.save(fileStorage);
        
        return FileUploadResponse.from(fileStorage);
    }
}
```

### 3. REST API 엔드포인트

```java
@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {
    
    private final FileUploadService fileUploadService;
    
    @PostMapping("/upload")
    public ResponseEntity<FileUploadResponse> upload(
        @RequestParam("file") MultipartFile file,
        @RequestHeader("Authorization") String authorization
    ) {
        Long memberId = authService.getCurrentMemberId(authorization);
        return ResponseEntity.ok(fileUploadService.uploadFile(file, memberId));
    }
}
```

### 4. FileZilla Server 설정

**서버 설정:**
- 포트: 21 (FTP) 또는 22 (SFTP)
- 사용자 계정 생성
- 업로드 디렉토리: `/var/www/jokerweb/uploads`
- 권한: 읽기/쓰기

**보안 고려사항:**
- SFTP 사용 권장 (SSH 기반)
- 방화벽 설정 (필요 IP만 허용)
- 파일 크기 제한 설정

---

## FileZilla Server vs 다른 솔루션

### FileZilla Server 장점
- ? 무료 오픈소스
- ? Windows/Linux 지원
- ? GUI 관리 도구 제공
- ? 사용자 관리 용이
- ? 대용량 파일 처리 효율적

### 단점/대안
- ? 클라우드 스토리지에 비해 확장성 제한
- ? CDN 기능 없음

**대안:**
- **AWS S3 / Cloudflare R2**: 클라우드 객체 스토리지
- **MinIO**: S3 호환 자체 호스팅 스토리지
- **Nginx**: 정적 파일 서빙 + 직접 업로드

---

## 권장 사항

### 현재 프로젝트 기준

1. **단기적**: base64 방식 개선
   - Spring Boot에서 multipart 파일 업로드 구현
   - 로컬 파일 시스템에 저장 (단순화)
   - `file_storage` 테이블 활용

2. **중기적**: FileZilla Server 도입
   - 대용량 파일 처리 필요 시
   - 관리자 파일 관리 기능 필요 시

3. **장기적**: 클라우드 스토리지 검토
   - 트래픽 증가 시
   - 글로벌 서비스 확장 시

### 실무 커뮤니티 사례

- **소규모 커뮤니티**: 로컬 파일 시스템 또는 FileZilla Server
- **중규모 커뮤니티**: AWS S3 또는 MinIO
- **대규모 커뮤니티**: CDN + 객체 스토리지 조합

---

## 다음 단계

프로젝트에 FileZilla Server 통합을 진행하시려면:

1. ? 파일 업로드 API 구현
2. ? FTP/SFTP 클라이언트 설정
3. ? FileZilla Server 설치 및 설정
4. ? 프론트엔드 파일 업로드 로직 수정
5. ? 파일 URL 서빙 (Nginx 등)

필요하시면 각 단계별 상세 구현 코드를 제공하겠습니다.
