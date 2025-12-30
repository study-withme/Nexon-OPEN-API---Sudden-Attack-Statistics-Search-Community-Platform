# Windows PowerShell에서 UTF-8 인코딩으로 애플리케이션 실행
# 사용법: .\run-utf8.ps1

# 콘솔 출력 인코딩을 UTF-8로 설정
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 | Out-Null

# Gradle로 애플리케이션 실행
.\gradlew bootRun
