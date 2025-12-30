package com.example.jokerweb.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import java.time.Duration;
import java.util.concurrent.TimeUnit;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.util.StringUtils;

/**
 * Redis 캐시 설정
 * Redis가 사용 가능하면 Redis를 사용하고, 없으면 Caffeine으로 fallback
 */
@Slf4j
@Configuration
@EnableCaching
public class RedisConfig {

    @Value("${spring.data.redis.host:}")
    private String redisHost;

    @Value("${spring.data.redis.port:6379}")
    private int redisPort;

    @Value("${spring.data.redis.password:}")
    private String redisPassword;

    /**
     * Redis가 활성화되어 있는지 확인
     */
    private boolean isRedisEnabled() {
        return StringUtils.hasText(redisHost) && !redisHost.trim().isEmpty();
    }

    /**
     * Redis 연결 팩토리 생성 (Redis가 설정되어 있을 때만)
     */
    @Bean
    @ConditionalOnProperty(name = "spring.data.redis.host", matchIfMissing = false)
    public RedisConnectionFactory redisConnectionFactory() {
        if (!isRedisEnabled()) {
            throw new IllegalStateException("Redis host is not configured");
        }
        
        RedisStandaloneConfiguration config = new RedisStandaloneConfiguration();
        config.setHostName(redisHost.trim());
        config.setPort(redisPort);
        if (StringUtils.hasText(redisPassword)) {
            config.setPassword(redisPassword);
        }
        
        LettuceConnectionFactory factory = new LettuceConnectionFactory(config);
        factory.setValidateConnection(true);
        log.info("Redis connection factory created: {}:{}", redisHost, redisPort);
        return factory;
    }

    /**
     * Redis CacheManager (Redis가 사용 가능할 때)
     * RedisConnectionFactory가 빈으로 등록되어 있을 때만 생성됨
     */
    @Bean(name = "cacheManager")
    @Primary
    @ConditionalOnProperty(name = "spring.data.redis.host", matchIfMissing = false)
    public CacheManager redisCacheManager(RedisConnectionFactory redisConnectionFactory) {
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofHours(1))
                .disableCachingNullValues();

        return RedisCacheManager.builder(redisConnectionFactory)
                .cacheDefaults(defaultConfig)
                .withCacheConfiguration("profile", 
                    RedisCacheConfiguration.defaultCacheConfig()
                        .entryTtl(Duration.ofHours(1))
                        .disableCachingNullValues())
                .withCacheConfiguration("mapStats",
                    RedisCacheConfiguration.defaultCacheConfig()
                        .entryTtl(Duration.ofMinutes(30))
                        .disableCachingNullValues())
                .withCacheConfiguration("timeStats",
                    RedisCacheConfiguration.defaultCacheConfig()
                        .entryTtl(Duration.ofMinutes(30))
                        .disableCachingNullValues())
                .withCacheConfiguration("tierMetadata",
                    RedisCacheConfiguration.defaultCacheConfig()
                        .entryTtl(Duration.ofHours(24))
                        .disableCachingNullValues())
                .withCacheConfiguration("gradeMetadata",
                    RedisCacheConfiguration.defaultCacheConfig()
                        .entryTtl(Duration.ofHours(24))
                        .disableCachingNullValues())
                .withCacheConfiguration("seasonGradeMetadata",
                    RedisCacheConfiguration.defaultCacheConfig()
                        .entryTtl(Duration.ofHours(24))
                        .disableCachingNullValues())
                .withCacheConfiguration("matches",
                    RedisCacheConfiguration.defaultCacheConfig()
                        .entryTtl(Duration.ofMinutes(10))
                        .disableCachingNullValues())
                .withCacheConfiguration("rankedMatches",
                    RedisCacheConfiguration.defaultCacheConfig()
                        .entryTtl(Duration.ofMinutes(10))
                        .disableCachingNullValues())
                .withCacheConfiguration("ouid",
                    RedisCacheConfiguration.defaultCacheConfig()
                        .entryTtl(Duration.ofHours(1))
                        .disableCachingNullValues())
                .withCacheConfiguration("globalMapStats",
                    RedisCacheConfiguration.defaultCacheConfig()
                        .entryTtl(Duration.ofHours(1))
                        .disableCachingNullValues())
                .withCacheConfiguration("globalTimeStats",
                    RedisCacheConfiguration.defaultCacheConfig()
                        .entryTtl(Duration.ofHours(1))
                        .disableCachingNullValues())
                .withCacheConfiguration("rankedStats",
                    RedisCacheConfiguration.defaultCacheConfig()
                        .entryTtl(Duration.ofMinutes(30))
                        .disableCachingNullValues())
                .withCacheConfiguration("saMatches",
                    RedisCacheConfiguration.defaultCacheConfig()
                        .entryTtl(Duration.ofSeconds(60))
                        .disableCachingNullValues())
                .withCacheConfiguration("saMatchDetails",
                    RedisCacheConfiguration.defaultCacheConfig()
                        .entryTtl(Duration.ofMinutes(10))
                        .disableCachingNullValues())
                .transactionAware()
                .build();
    }

    /**
     * Caffeine CacheManager (Redis가 없을 때 fallback)
     */
    @Bean(name = "cacheManager")
    @Primary
    @ConditionalOnProperty(name = "spring.data.redis.host", matchIfMissing = true)
    public CacheManager caffeineCacheManager() {
        log.info("Using Caffeine cache (Redis not configured)");
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();
        
        // 프로필 캐시: 1시간 TTL, 최대 10,000개 항목
        cacheManager.registerCustomCache("profile", Caffeine.newBuilder()
                .maximumSize(10_000)
                .expireAfterWrite(1, TimeUnit.HOURS)
                .recordStats()
                .build());
        
        // 맵 통계 캐시: 30분 TTL, 최대 5,000개 항목
        cacheManager.registerCustomCache("mapStats", Caffeine.newBuilder()
                .maximumSize(5_000)
                .expireAfterWrite(30, TimeUnit.MINUTES)
                .recordStats()
                .build());
        
        // 시간대 통계 캐시: 30분 TTL, 최대 5,000개 항목
        cacheManager.registerCustomCache("timeStats", Caffeine.newBuilder()
                .maximumSize(5_000)
                .expireAfterWrite(30, TimeUnit.MINUTES)
                .recordStats()
                .build());
        
        // 메타데이터 캐시: 24시간 TTL
        cacheManager.registerCustomCache("tierMetadata", Caffeine.newBuilder()
                .maximumSize(1)
                .expireAfterWrite(24, TimeUnit.HOURS)
                .recordStats()
                .build());
        
        cacheManager.registerCustomCache("gradeMetadata", Caffeine.newBuilder()
                .maximumSize(1)
                .expireAfterWrite(24, TimeUnit.HOURS)
                .recordStats()
                .build());
        
        cacheManager.registerCustomCache("seasonGradeMetadata", Caffeine.newBuilder()
                .maximumSize(1)
                .expireAfterWrite(24, TimeUnit.HOURS)
                .recordStats()
                .build());
        
        // 매치 목록 캐시: 10분 TTL, 최대 5,000개 항목
        cacheManager.registerCustomCache("matches", Caffeine.newBuilder()
                .maximumSize(5_000)
                .expireAfterWrite(10, TimeUnit.MINUTES)
                .recordStats()
                .build());
        
        // 랭크전 매치 캐시: 10분 TTL, 최대 2,000개 항목
        cacheManager.registerCustomCache("rankedMatches", Caffeine.newBuilder()
                .maximumSize(2_000)
                .expireAfterWrite(10, TimeUnit.MINUTES)
                .recordStats()
                .build());
        
        // OUID 조회 캐시: 닉네임 → OUID 매핑, 1시간 TTL, 최대 20,000개 항목
        cacheManager.registerCustomCache("ouid", Caffeine.newBuilder()
                .maximumSize(20_000)
                .expireAfterWrite(1, TimeUnit.HOURS)
                .recordStats()
                .build());
        
        // 글로벌 통계 캐시
        cacheManager.registerCustomCache("globalMapStats", Caffeine.newBuilder()
                .maximumSize(100)
                .expireAfterWrite(1, TimeUnit.HOURS)
                .recordStats()
                .build());
        
        cacheManager.registerCustomCache("globalTimeStats", Caffeine.newBuilder()
                .maximumSize(100)
                .expireAfterWrite(1, TimeUnit.HOURS)
                .recordStats()
                .build());
        
        cacheManager.registerCustomCache("rankedStats", Caffeine.newBuilder()
                .maximumSize(5_000)
                .expireAfterWrite(30, TimeUnit.MINUTES)
                .recordStats()
                .build());
        
        // 서든어택 매치 정보 캐시: 60초 TTL, 최대 5,000개 항목
        cacheManager.registerCustomCache("saMatches", Caffeine.newBuilder()
                .maximumSize(5_000)
                .expireAfterWrite(60, TimeUnit.SECONDS)
                .recordStats()
                .build());
        
        // 서든어택 매치 상세 정보 캐시: 10분 TTL, 최대 2,000개 항목
        cacheManager.registerCustomCache("saMatchDetails", Caffeine.newBuilder()
                .maximumSize(2_000)
                .expireAfterWrite(10, TimeUnit.MINUTES)
                .recordStats()
                .build());
        
        return cacheManager;
    }
}
