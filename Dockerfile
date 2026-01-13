# Spring Boot 애플리케이션 Dockerfile (Cloudtype 배포용)
# Multi-stage build for optimized image size

# Build stage
FROM gradle:8.5-jdk21 AS build

WORKDIR /app

# Copy Gradle files for dependency caching
COPY build.gradle settings.gradle gradlew ./
COPY gradle ./gradle

# Download dependencies (cached layer)
RUN gradle dependencies --no-daemon || true

# Copy source code
COPY src ./src

# Build application (JAR 파일 생성)
RUN gradle clean build -x test --no-daemon

# Runtime stage
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Create non-root user for security
RUN addgroup -S spring && adduser -S spring -G spring

# Copy JAR from build stage (명시적 파일명 사용)
COPY --from=build /app/build/libs/jokerweb-0.0.1-SNAPSHOT.jar app.jar

# Install curl for health checks
RUN apk add --no-cache curl

# Change ownership
RUN chown spring:spring app.jar

# Switch to non-root user
USER spring:spring

EXPOSE 8080

# Health check (Cloudtype에서 사용)
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

# JVM optimization for container (하비 플랜 512MB RAM 최적화)
# MaxRAMPercentage를 70%로 설정하여 메모리 여유 확보
# G1GC 사용으로 메모리 효율성 향상 및 GC 일시정지 시간 최소화
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=70.0 -XX:+UseG1GC -XX:+UseStringDeduplication -XX:MaxGCPauseMillis=200 -XX:G1HeapRegionSize=4m -XX:InitiatingHeapOccupancyPercent=45 -Djava.security.egd=file:/dev/./urandom -XX:+ExitOnOutOfMemoryError"

# Spring Boot 프로파일 기본값 (Cloudtype 환경 변수로 오버라이드 가능)
ENV SPRING_PROFILES_ACTIVE=prod

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar --spring.profiles.active=${SPRING_PROFILES_ACTIVE}"]

