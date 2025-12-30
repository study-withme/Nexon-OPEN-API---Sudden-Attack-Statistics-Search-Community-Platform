#!/bin/bash

# 간단한 배포 스크립트
set -e

echo "🚀 배포 시작..."

# 환경 변수 확인 (없어도 계속 진행)
if [ -z "$DB_PASSWORD" ] || [ -z "$JWT_SECRET" ] || [ -z "$NXOPEN_API_KEY" ]; then
    echo "⚠️  환경 변수가 설정되지 않았습니다."
    echo "필수: DB_PASSWORD, JWT_SECRET, NXOPEN_API_KEY"
    echo "계속하려면 환경 변수를 설정하거나 Ctrl+C로 취소하세요."
    read -p "계속? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Docker Compose로 배포
if command -v docker-compose &> /dev/null; then
    echo "📦 Docker Compose로 배포..."
    docker-compose -f docker-compose.prod.yml up -d --build
    echo "✅ 배포 완료!"
else
    echo "📦 직접 빌드 및 실행..."
    ./gradlew clean build
    java -jar build/libs/jokerweb-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod
fi

