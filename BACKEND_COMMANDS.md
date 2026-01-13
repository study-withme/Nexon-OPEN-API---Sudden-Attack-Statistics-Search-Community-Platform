# 백엔드 명령어 모음

## 🚀 빠른 시작

### 개발 환경 실행
```bash
# Windows
.\gradlew bootRun

# Linux/Mac
./gradlew bootRun
```

### 빌드
```bash
# Windows
.\gradlew clean build

# Linux/Mac
./gradlew clean build
```

### 빌드 후 실행
```bash
# Windows
.\gradlew clean build
java -jar build\libs\jokerweb-0.0.1-SNAPSHOT.jar

# Linux/Mac
./gradlew clean build
java -jar build/libs/jokerweb-0.0.1-SNAPSHOT.jar
```

## 📦 주요 명령어

### 애플리케이션 실행
```bash
# 개발 환경 (기본: dev 프로파일)
.\gradlew bootRun

# 특정 프로파일 지정
.\gradlew bootRun --args='--spring.profiles.active=prod'

# 환경 변수와 함께 실행
$env:DB_PASSWORD="your_password"
$env:JWT_SECRET="your_secret"
.\gradlew bootRun
```

### 빌드
```bash
# 클린 빌드
.\gradlew clean build

# 테스트 제외하고 빌드 (빠른 빌드)
.\gradlew clean build -x test

# 실행 가능한 JAR 생성
.\gradlew bootJar
```

### 테스트
```bash
# 모든 테스트 실행
.\gradlew test

# 특정 테스트 클래스 실행
.\gradlew test --tests "com.example.jokerweb.*Test"

# 테스트 리포트 확인
.\gradlew test
# 리포트 위치: build/reports/tests/test/index.html
```

### 의존성 관리
```bash
# 의존성 업데이트 확인
.\gradlew dependencies

# 의존성 트리 확인
.\gradlew dependencies --configuration compileClasspath

# 오래된 의존성 확인
.\gradlew dependencyUpdates
```

### 프로젝트 정보
```bash
# 프로젝트 정보 출력
.\gradlew projects

# 태스크 목록 확인
.\gradlew tasks

# 사용 가능한 모든 태스크 확인
.\gradlew tasks --all
```

## 🔧 환경별 실행

### 개발 환경 (기본)
```bash
.\gradlew bootRun
# application-dev.properties 사용
# 기본 포트: 8080
```

### 프로덕션 환경
```bash
# JAR 파일로 실행
java -jar build/libs/jokerweb-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod

# 환경 변수 설정 (Windows PowerShell)
$env:DB_PASSWORD="your_password"
$env:JWT_SECRET="your_secret"
$env:NXOPEN_API_KEY="your_api_key"
java -jar build/libs/jokerweb-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod

# 환경 변수 설정 (Linux/Mac)
export DB_PASSWORD="your_password"
export JWT_SECRET="your_secret"
export NXOPEN_API_KEY="your_api_key"
java -jar build/libs/jokerweb-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod
```

### 테스트 환경
```bash
.\gradlew bootRun --args='--spring.profiles.active=test'
```

## 🗄️ 데이터베이스 관련

### Flyway 마이그레이션
```bash
# 마이그레이션 정보 확인
.\gradlew flywayInfo

# 마이그레이션 실행 (부트 실행 시 자동 실행됨)
.\gradlew flywayMigrate

# 마이그레이션 상태 확인
.\gradlew flywayInfo
```

## 🔍 디버깅

### 디버그 모드로 실행
```bash
# 포트 5005에서 디버그 모드로 실행
.\gradlew bootRun --debug-jvm

# IDE에서 Remote Debug 연결: localhost:5005
```

### 로그 확인
```bash
# 실시간 로그 확인 (Windows)
Get-Content -Wait logs\application.log

# 실시간 로그 확인 (Linux/Mac)
tail -f logs/application.log
```

## 📊 빌드 결과물

### JAR 파일 위치
```
build/libs/jokerweb-0.0.1-SNAPSHOT.jar
```

### 빌드 리포트
```
build/reports/tests/test/index.html  # 테스트 리포트
build/reports/                       # 기타 리포트
```

## ⚡ 자주 사용하는 명령어 조합

### 개발 시작 (전체 빌드 없이)
```bash
.\gradlew bootRun
```

### 프로덕션 배포용 빌드
```bash
.\gradlew clean build -x test
java -jar build/libs/jokerweb-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod
```

### 빠른 재시작 (코드 변경 후)
```bash
# Gradle 데몬이 변경사항 감지하여 자동 재시작
.\gradlew bootRun
# 또는 Ctrl+C 후 다시 실행
```

## 🐛 문제 해결

### Gradle 캐시 초기화
```bash
.\gradlew clean
# 또는
.\gradlew clean build --refresh-dependencies
```

### Gradle Wrapper 재다운로드
```bash
.\gradlew wrapper --gradle-version=8.5
```

### 포트가 이미 사용 중인 경우
```bash
# 포트 확인 (Windows)
netstat -ano | findstr :8080

# 포트 사용 프로세스 종료 (Windows)
taskkill /PID <PID번호> /F

# 포트 변경하여 실행
.\gradlew bootRun --args='--server.port=8081'
```

## 📝 환경 변수 설정 (Windows PowerShell)

```powershell
# 개발 환경 변수 설정
$env:DB_PASSWORD="your_password"
$env:JWT_SECRET="your_secret"
$env:NXOPEN_API_KEY="your_api_key"
$env:DB_URL="jdbc:mariadb://localhost:3306/jokercommunity"

# FTP 설정 (XAMPP FileZilla Server)
$env:FTP_HOST="localhost"
$env:FTP_PORT="21"
$env:FTP_USERNAME="jokerweb"
$env:FTP_PASSWORD="your_ftp_password"
$env:FTP_BASE_URL="http://localhost:8080/files"

# 실행
.\gradlew bootRun
```

## 📝 환경 변수 설정 (Linux/Mac)

```bash
# 개발 환경 변수 설정
export DB_PASSWORD="your_password"
export JWT_SECRET="your_secret"
export NXOPEN_API_KEY="your_api_key"
export DB_URL="jdbc:mariadb://localhost:3306/jokercommunity"

# FTP 설정
export FTP_HOST="localhost"
export FTP_PORT="21"
export FTP_USERNAME="jokerweb"
export FTP_PASSWORD="your_ftp_password"
export FTP_BASE_URL="http://localhost:8080/files"

# 실행
./gradlew bootRun
```

## 🎯 가장 많이 사용하는 명령어

1. **개발 실행**: `.\gradlew bootRun`
2. **빌드**: `.\gradlew clean build`
3. **테스트**: `.\gradlew test`
4. **프로덕션 실행**: `java -jar build/libs/jokerweb-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod`

---

**팁**: `.\gradlew tasks`로 사용 가능한 모든 명령어를 확인할 수 있습니다!











