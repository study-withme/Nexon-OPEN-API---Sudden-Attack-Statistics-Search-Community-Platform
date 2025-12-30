package com.example.jokerweb.logging;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Slow Query 로깅 인터셉터
 * Repository 메서드와 JdbcTemplate 실행 시간을 측정하고 임계값을 초과하면 경고 로그 출력
 */
@Slf4j
@Aspect
@Component
public class SlowQueryInterceptor {

    @Value("${app.slow-query-threshold-ms:1000}")
    private long slowQueryThresholdMs;

    /**
     * Repository 인터페이스의 모든 메서드
     */
    @Pointcut("execution(* org.springframework.data.repository.Repository+.*(..))")
    public void repositoryMethods() {}

    /**
     * JdbcTemplate의 query/update 메서드
     */
    @Pointcut("execution(* org.springframework.jdbc.core.JdbcTemplate.query*(..)) || " +
              "execution(* org.springframework.jdbc.core.JdbcTemplate.update*(..)) || " +
              "execution(* org.springframework.jdbc.core.JdbcTemplate.execute*(..))")
    public void jdbcTemplateMethods() {}

    /**
     * EntityManager의 직접 호출 (선택사항)
     */
    @Pointcut("execution(* jakarta.persistence.EntityManager.*(..))")
    public void entityManagerMethods() {}

    @Around("repositoryMethods() || jdbcTemplateMethods() || entityManagerMethods()")
    public Object logSlowQuery(ProceedingJoinPoint joinPoint) throws Throwable {
        long startTime = System.currentTimeMillis();
        String methodName = joinPoint.getSignature().toShortString();
        
        try {
            Object result = joinPoint.proceed();
            long executionTime = System.currentTimeMillis() - startTime;
            
            if (executionTime >= slowQueryThresholdMs) {
                log.warn("⏱️ SLOW QUERY DETECTED: {} took {}ms (threshold: {}ms)", 
                        methodName, executionTime, slowQueryThresholdMs);
                
                // 파라미터 정보도 로깅 (디버깅용 - 너무 길면 생략)
                Object[] args = joinPoint.getArgs();
                if (args != null && args.length > 0 && args.length <= 5) {
                    log.debug("  Parameters: {}", java.util.Arrays.toString(args));
                } else if (args != null && args.length > 5) {
                    log.debug("  Parameters: {} arguments (too many to display)", args.length);
                }
            }
            
            return result;
        } catch (Throwable e) {
            long executionTime = System.currentTimeMillis() - startTime;
            if (executionTime >= slowQueryThresholdMs) {
                log.warn("⏱️ SLOW QUERY (FAILED): {} took {}ms before failing with: {} - {}", 
                        methodName, executionTime, e.getClass().getSimpleName(), e.getMessage());
            }
            throw e;
        }
    }
}
