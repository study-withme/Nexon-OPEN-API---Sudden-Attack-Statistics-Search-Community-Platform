package com.example.jokerweb.nexon;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Function;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriBuilder;

import com.example.jokerweb.nexon.dto.IdResponse;
import com.example.jokerweb.nexon.dto.MatchDetailResponse;
import com.example.jokerweb.nexon.dto.MatchListResponse;
import com.example.jokerweb.nexon.dto.UserBasicResponse;
import com.example.jokerweb.nexon.dto.UserRankResponse;
import com.example.jokerweb.nexon.dto.UserRecentInfoResponse;
import com.example.jokerweb.nexon.dto.UserTierResponse;

@Component
@RequiredArgsConstructor
public class NxOpenApiClient {

    private static final Logger log = LoggerFactory.getLogger(NxOpenApiClient.class);

    private final RestClient.Builder restClientBuilder;
    private final NexonApiRateLimiter rateLimiter;
    private final ObjectMapper objectMapper;
    private final com.example.jokerweb.monitoring.ApiMetricsService metricsService;

    private RestClient restClient;
    private List<String> apiKeys;
    private final AtomicInteger currentKeyIndex = new AtomicInteger(0);

    @Value("${nxopen.api.base-url}")
    private String baseUrl;

    @Value("${nxopen.api.key}")
    private String apiKey;

    @Value("${nxopen.api.key.backup:}")
    private String apiKeyBackup;

    @Value("${nxopen.api.key.third:}")
    private String apiKeyThird;

    @Value("${nxopen.api.key.fourth:}")
    private String apiKeyFourth;

    @PostConstruct
    void init() {
        ensureConfigured();
        
        // API 키 리스트 초기화
        apiKeys = new ArrayList<>();
        if (StringUtils.hasText(apiKey)) {
            apiKeys.add(apiKey);
        }
        if (StringUtils.hasText(apiKeyBackup)) {
            apiKeys.add(apiKeyBackup);
        }
        if (StringUtils.hasText(apiKeyThird)) {
            apiKeys.add(apiKeyThird);
        }
        if (StringUtils.hasText(apiKeyFourth)) {
            apiKeys.add(apiKeyFourth);
        }
        
        if (apiKeys.isEmpty()) {
            throw new IllegalStateException("최소 하나의 API 키가 필요합니다.");
        }
        
        log.info("Nexon API 키 로테이션 초기화 완료: 총 {}개의 API 키 사용", apiKeys.size());
        
        this.restClient = restClientBuilder
                .baseUrl(baseUrl)
                .defaultHeader("Accept", MediaType.APPLICATION_JSON_VALUE)
                .requestInterceptor((request, body, execution) -> {
                    request.getHeaders().setAccept(MediaType.parseMediaTypes(MediaType.APPLICATION_JSON_VALUE));
                    return execution.execute(request, body);
                })
                .build();
    }
    
    
    /**
     * API 키 로테이션을 사용하여 API 호출을 실행합니다.
     * 429 에러 발생 시 다음 키로 자동 재시도합니다.
     */
    private <T> T executeWithApiKeyRotation(java.util.function.Function<String, T> apiCall) {
        int startIndex = currentKeyIndex.get() % apiKeys.size();
        int attempts = 0;
        Exception lastException = null;
        
        while (attempts < apiKeys.size()) {
            int currentIndex = (startIndex + attempts) % apiKeys.size();
            String currentKey = apiKeys.get(currentIndex);
            
            try {
                return apiCall.apply(currentKey);
            } catch (NexonApiRateLimitException e) {
                attempts++;
                lastException = e;
                if (attempts < apiKeys.size()) {
                    log.debug("API 키 {}에서 429 에러 발생, 다음 키로 재시도 전 {}초 대기 (시도 {}/{})", 
                            currentIndex + 1, e.getRetryAfterSeconds(), attempts + 1, apiKeys.size());
                    // Retry-After 시간만큼 대기
                    try {
                        Thread.sleep(e.getRetryAfterSeconds() * 1000L);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        throw new RuntimeException("API 호출이 중단되었습니다.", ie);
                    }
                    // 다음 키로 인덱스 이동
                    currentKeyIndex.set((currentIndex + 1) % apiKeys.size());
                } else {
                    log.debug("모든 API 키에서 429 에러 발생, 모든 키를 시도했습니다.");
                }
            } catch (Exception e) {
                // 429가 아닌 다른 에러는 즉시 전파
                throw e;
            }
        }
        
        // 모든 키를 시도했지만 모두 실패한 경우
        if (lastException != null) {
            throw new NexonApiRateLimitException(
                "모든 API 키에서 요청 제한에 도달했습니다. 잠시 후 다시 시도해주세요.", lastException);
        }
        
        throw new RuntimeException("API 호출 실패: 알 수 없는 오류");
    }

    @org.springframework.cache.annotation.Cacheable(
        cacheNames = "ouid",
        key = "#userName",
        unless = "#result == null || (#result.ouid != null && #result.ouid.isEmpty())"
    )
    public IdResponse getIdByUserName(String userName) {
        if (!StringUtils.hasText(userName)) {
            log.warn("Nexon API 호출 실패: getIdByUserName, user_name이 비어있음");
            return null;
        }
        log.debug("Nexon API 호출 시작: getIdByUserName, user_name={}", userName);
        long startTime = System.currentTimeMillis();
        metricsService.recordRequestStart();
        
        try {
            IdResponse response = executeWithRateLimit(() -> {
                return executeWithApiKeyRotation(apiKey -> {
                    try {
                        return restClient.get()
                                .uri(buildUriFunction("/suddenattack/v1/id", b -> b.queryParam("user_name", userName)))
                                .header("x-nxopen-api-key", apiKey)
                                .retrieve()
                                .body(IdResponse.class);
                    } catch (HttpClientErrorException e) {
                        // 429 에러는 특별히 처리
                        if (e.getStatusCode().value() == 429) {
                            log.debug("Nexon API 429 에러: getIdByUserName, user_name={}", userName);
                            metricsService.recordRateLimit();
                            // Retry-After 헤더 확인 (초 단위)
                            int retryAfterSeconds = 30; // 기본값
                            try {
                                String retryAfterHeader = e.getResponseHeaders().getFirst("Retry-After");
                                if (retryAfterHeader != null && !retryAfterHeader.isEmpty()) {
                                    retryAfterSeconds = Integer.parseInt(retryAfterHeader);
                                }
                            } catch (Exception ignored) {
                                // 헤더 파싱 실패 시 기본값 사용
                            }
                            throw new NexonApiRateLimitException(
                                "Nexon API 요청 제한에 도달했습니다. 잠시 후 다시 시도해주세요.", e, retryAfterSeconds);
                        }
                        String body = e.getResponseBodyAsString();
                        log.warn("Nexon API 에러: getIdByUserName, user_name={}, status={}, body={}", 
                                userName, e.getStatusCode(), body);
                        return null;
                    } catch (HttpServerErrorException e) {
                        String body = e.getResponseBodyAsString();
                        log.warn("Nexon API 서버 에러: getIdByUserName, user_name={}, status={}, body={}", 
                                userName, e.getStatusCode(), body);
                        return null;
                    }
                });
            });
            
            long responseTime = System.currentTimeMillis() - startTime;
            if (response != null) {
                metricsService.recordSuccess(responseTime);
                log.debug("Nexon API 호출 성공: getIdByUserName, user_name={}, ouid={}, responseTime={}ms", 
                        userName, response.getOuid(), responseTime);
            } else {
                metricsService.recordFailure(responseTime);
                log.warn("Nexon API 응답이 null: getIdByUserName, user_name={}, responseTime={}ms", userName, responseTime);
            }
            return response;
        } catch (NexonApiRateLimitException e) {
            long responseTime = System.currentTimeMillis() - startTime;
            metricsService.recordFailure(responseTime);
            // Rate limit 예외는 그대로 전파
            throw e;
        } catch (Exception e) {
            long responseTime = System.currentTimeMillis() - startTime;
            metricsService.recordFailure(responseTime);
            log.error("Nexon API 호출 실패: getIdByUserName, user_name={}, error={}, responseTime={}ms", 
                    userName, e.getMessage(), responseTime, e);
            return null; // 에러 발생 시 null 반환하여 기능이 계속 작동하도록
        }
    }

    public UserBasicResponse getUserBasic(String ouid) {
        log.debug("Nexon API 호출 시작: getUserBasic, ouid={}", ouid);
        try {
            UserBasicResponse response = executeWithRateLimit(() -> {
                return executeWithApiKeyRotation(apiKey -> {
                    try {
                        return restClient.get()
                                .uri(buildUriFunction("/suddenattack/v1/user/basic", b -> b.queryParam("ouid", ouid)))
                                .header("x-nxopen-api-key", apiKey)
                                .retrieve()
                                .body(UserBasicResponse.class);
                    } catch (HttpClientErrorException e) {
                        String body = e.getResponseBodyAsString();
                        log.warn("Nexon API 에러: getUserBasic, ouid={}, status={}, body={}", 
                                ouid, e.getStatusCode(), body);
                        if (e.getStatusCode().value() == 429) {
                            throw new NexonApiRateLimitException(
                                "Nexon API 요청 제한에 도달했습니다. 잠시 후 다시 시도해주세요.", e);
                        }
                        return null;
                    } catch (HttpServerErrorException e) {
                        String body = e.getResponseBodyAsString();
                        log.warn("Nexon API 서버 에러: getUserBasic, ouid={}, status={}, body={}", 
                                ouid, e.getStatusCode(), body);
                        return null;
                    }
                });
            });
            if (response != null) {
                log.debug("Nexon API 호출 성공: getUserBasic, ouid={}", ouid);
            } else {
                log.warn("Nexon API 응답이 null: getUserBasic, ouid={}", ouid);
            }
            return response;
        } catch (Exception e) {
            log.error("Nexon API 호출 실패: getUserBasic, ouid={}, error={}", ouid, e.getMessage(), e);
            return null; // 에러 발생 시 null 반환하여 기능이 계속 작동하도록
        }
    }

    public UserRankResponse getUserRank(String ouid) {
        log.debug("Nexon API 호출 시작: getUserRank, ouid={}", ouid);
        try {
            // 원본 JSON 응답을 받아서 로깅 후 파싱
            String rawResponse = executeWithRateLimit(() -> {
                return executeWithApiKeyRotation(apiKey -> {
                    try {
                        return restClient.get()
                                .uri(buildUriFunction("/suddenattack/v1/user/rank", b -> b.queryParam("ouid", ouid)))
                                .header("x-nxopen-api-key", apiKey)
                                .retrieve()
                                .body(String.class);
                    } catch (HttpClientErrorException e) {
                        String body = e.getResponseBodyAsString();
                        log.warn("Nexon API 에러: getUserRank, ouid={}, status={}, body={}", 
                                ouid, e.getStatusCode(), body);
                        if (e.getStatusCode().value() == 429) {
                            throw new NexonApiRateLimitException(
                                "Nexon API 요청 제한에 도달했습니다. 잠시 후 다시 시도해주세요.", e);
                        }
                        return null;
                    } catch (HttpServerErrorException e) {
                        String body = e.getResponseBodyAsString();
                        log.warn("Nexon API 서버 에러: getUserRank, ouid={}, status={}, body={}", 
                                ouid, e.getStatusCode(), body);
                        return null;
                    }
                });
            });
            
            if (!StringUtils.hasText(rawResponse)) {
                log.warn("UserRank API 응답이 비어있음: ouid={}", ouid);
                return null;
            }
            
            log.debug("UserRank API 원본 응답: ouid={}, responseLength={}", ouid, rawResponse.length());
            
            // JSON 파싱
            UserRankResponse response = objectMapper.readValue(rawResponse, UserRankResponse.class);
            
            // 서든어택 API에서 받은 이미지 URL을 그대로 사용 (검증 제거)
            // 빈 문자열은 null로 변환하여 프론트엔드에서 처리하기 쉽게 함
            if (response != null) {
                if (response.getGradeImage() != null && response.getGradeImage().trim().isEmpty()) {
                    response.setGradeImage(null);
                }
                if (response.getSeasonGradeImage() != null && response.getSeasonGradeImage().trim().isEmpty()) {
                    response.setSeasonGradeImage(null);
                }
                log.debug("UserRank API 파싱 성공: ouid={}, grade={}, seasonGrade={}", 
                        ouid, response.getGrade(), response.getSeasonGrade());
            } else {
                log.warn("UserRank API 파싱 결과가 null: ouid={}", ouid);
            }
            return response;
        } catch (Exception e) {
            log.error("Nexon API 호출 실패: getUserRank, ouid={}, error={}", ouid, e.getMessage(), e);
            return null; // 에러 발생 시 null 반환하여 기능이 계속 작동하도록
        }
    }

    public UserTierResponse getUserTier(String ouid) {
        log.debug("Nexon API 호출 시작: getUserTier, ouid={}", ouid);
        try {
            // 원본 JSON 응답을 받아서 로깅 후 파싱
            String rawResponse = executeWithRateLimit(() -> {
                return executeWithApiKeyRotation(apiKey -> {
                    try {
                        return restClient.get()
                                .uri(buildUriFunction("/suddenattack/v1/user/tier", b -> b.queryParam("ouid", ouid)))
                                .header("x-nxopen-api-key", apiKey)
                                .retrieve()
                                .body(String.class);
                    } catch (HttpClientErrorException e) {
                        String body = e.getResponseBodyAsString();
                        log.warn("Nexon API 에러: getUserTier, ouid={}, status={}, body={}", 
                                ouid, e.getStatusCode(), body);
                        if (e.getStatusCode().value() == 429) {
                            throw new NexonApiRateLimitException(
                                "Nexon API 요청 제한에 도달했습니다. 잠시 후 다시 시도해주세요.", e);
                        }
                        return null;
                    } catch (HttpServerErrorException e) {
                        String body = e.getResponseBodyAsString();
                        log.warn("Nexon API 서버 에러: getUserTier, ouid={}, status={}, body={}", 
                                ouid, e.getStatusCode(), body);
                        return null;
                    }
                });
            });
            
            if (!StringUtils.hasText(rawResponse)) {
                log.warn("UserTier API 응답이 비어있음: ouid={}", ouid);
                return null;
            }
            
            log.debug("UserTier API 원본 응답: ouid={}, responseLength={}", ouid, rawResponse.length());
            
            // JSON 파싱
            UserTierResponse response = objectMapper.readValue(rawResponse, UserTierResponse.class);
            
            // 서든어택 API에서 받은 이미지 URL을 그대로 사용 (검증 제거)
            // 빈 문자열은 null로 변환하여 프론트엔드에서 처리하기 쉽게 함
            if (response != null) {
                if (response.getSoloRankMatchTierImage() != null && response.getSoloRankMatchTierImage().trim().isEmpty()) {
                    response.setSoloRankMatchTierImage(null);
                }
                if (response.getPartyRankMatchTierImage() != null && response.getPartyRankMatchTierImage().trim().isEmpty()) {
                    response.setPartyRankMatchTierImage(null);
                }
                log.debug("UserTier API 파싱 성공: ouid={}, soloTier={}, partyTier={}", 
                        ouid, response.getSoloRankMatchTier(), response.getPartyRankMatchTier());
            } else {
                log.warn("UserTier API 파싱 결과가 null: ouid={}", ouid);
            }
            return response;
        } catch (Exception e) {
            log.error("Nexon API 호출 실패: getUserTier, ouid={}, error={}", ouid, e.getMessage(), e);
            return null; // 에러 발생 시 null 반환하여 기능이 계속 작동하도록
        }
    }

    public UserRecentInfoResponse getUserRecentInfo(String ouid) {
        log.debug("Nexon API 호출 시작: getUserRecentInfo, ouid={}", ouid);
        try {
            UserRecentInfoResponse response = executeWithRateLimit(() -> {
                return executeWithApiKeyRotation(apiKey -> {
                    try {
                        return restClient.get()
                                .uri(buildUriFunction("/suddenattack/v1/user/recent-info", b -> b.queryParam("ouid", ouid)))
                                .header("x-nxopen-api-key", apiKey)
                                .retrieve()
                                .body(UserRecentInfoResponse.class);
                    } catch (HttpClientErrorException e) {
                        String body = e.getResponseBodyAsString();
                        log.warn("Nexon API 에러: getUserRecentInfo, ouid={}, status={}, body={}", 
                                ouid, e.getStatusCode(), body);
                        if (e.getStatusCode().value() == 429) {
                            throw new NexonApiRateLimitException(
                                "Nexon API 요청 제한에 도달했습니다. 잠시 후 다시 시도해주세요.", e);
                        }
                        return null;
                    } catch (HttpServerErrorException e) {
                        String body = e.getResponseBodyAsString();
                        log.warn("Nexon API 서버 에러: getUserRecentInfo, ouid={}, status={}, body={}", 
                                ouid, e.getStatusCode(), body);
                        return null;
                    }
                });
            });
            if (response != null) {
                log.debug("Nexon API 호출 성공: getUserRecentInfo, ouid={}", ouid);
            } else {
                log.warn("Nexon API 응답이 null: getUserRecentInfo, ouid={}", ouid);
            }
            return response;
        } catch (Exception e) {
            log.error("Nexon API 호출 실패: getUserRecentInfo, ouid={}, error={}", ouid, e.getMessage(), e);
            return null; // 에러 발생 시 null 반환하여 기능이 계속 작동하도록
        }
    }

    public MatchListResponse getMatches(String ouid, String matchMode, String matchType) {
        log.debug("Nexon API 호출 시작: getMatches, ouid={}, match_mode={}, match_type={}", ouid, matchMode, matchType);
        try {
            MatchListResponse response = executeWithRateLimit(() -> {
                return executeWithApiKeyRotation(apiKey -> {
                    try {
                        return restClient.get()
                                .uri(buildUriFunction("/suddenattack/v1/match", b -> {
                                    b.queryParam("ouid", ouid).queryParam("match_mode", matchMode);
                                    if (StringUtils.hasText(matchType)) {
                                        b.queryParam("match_type", matchType);
                                    }
                                }))
                                .header("x-nxopen-api-key", apiKey)
                                .retrieve()
                                .body(MatchListResponse.class);
                    } catch (HttpClientErrorException e) {
                        if (e.getStatusCode().value() == 429) {
                            log.debug("Nexon API 429 에러: getMatches, ouid={}, match_mode={}, match_type={}", 
                                    ouid, matchMode, matchType);
                            // Retry-After 헤더 확인 (초 단위)
                            int retryAfterSeconds = 30; // 기본값
                            try {
                                String retryAfterHeader = e.getResponseHeaders().getFirst("Retry-After");
                                if (retryAfterHeader != null && !retryAfterHeader.isEmpty()) {
                                    retryAfterSeconds = Integer.parseInt(retryAfterHeader);
                                }
                            } catch (Exception ignored) {
                                // 헤더 파싱 실패 시 기본값 사용
                            }
                            throw new NexonApiRateLimitException(
                                "Nexon API 요청 제한에 도달했습니다. 잠시 후 다시 시도해주세요.", e, retryAfterSeconds);
                        }
                        String body = e.getResponseBodyAsString();
                        log.warn("Nexon API 에러: getMatches, ouid={}, match_mode={}, match_type={}, status={}, body={}", 
                                ouid, matchMode, matchType, e.getStatusCode(), body);
                        return null;
                    } catch (HttpServerErrorException e) {
                        String body = e.getResponseBodyAsString();
                        log.warn("Nexon API 서버 에러: getMatches, ouid={}, match_mode={}, match_type={}, status={}, body={}", 
                                ouid, matchMode, matchType, e.getStatusCode(), body);
                        return null;
                    }
                });
            });
            if (response != null && response.getMatch() != null) {
                log.debug("Nexon API 호출 성공: getMatches, ouid={}, matchCount={}", ouid, response.getMatch().size());
                // 첫 번째 매치의 matchId 확인 (디버깅용)
                if (!response.getMatch().isEmpty()) {
                    MatchListResponse.MatchItem firstMatch = response.getMatch().get(0);
                    log.debug("첫 번째 매치 정보: matchId={}, matchMode={}, matchType={}", 
                            firstMatch.getMatchId(), firstMatch.getMatchMode(), firstMatch.getMatchType());
                }
            } else {
                log.warn("Nexon API 응답이 null 또는 빈 매치: getMatches, ouid={}", ouid);
            }
            return response;
        } catch (NexonApiRateLimitException e) {
            // Rate limit 예외는 그대로 전파 (상위에서 재시도 처리)
            log.debug("Nexon API Rate Limit: getMatches, ouid={}, match_mode={}, match_type={}, retryAfter={}초", 
                    ouid, matchMode, matchType, e.getRetryAfterSeconds());
            throw e;
        } catch (Exception e) {
            log.error("Nexon API 호출 실패: getMatches, ouid={}, match_mode={}, match_type={}, error={}", 
                    ouid, matchMode, matchType, e.getMessage(), e);
            return null; // 에러 발생 시 null 반환하여 기능이 계속 작동하도록
        }
    }

    public MatchDetailResponse getMatchDetail(String matchId) {
        if (!StringUtils.hasText(matchId)) {
            log.warn("Nexon API 호출 실패: getMatchDetail, match_id가 비어있음");
            return null;
        }
        log.debug("Nexon API 호출 시작: getMatchDetail, match_id={}", matchId);
        try {
            MatchDetailResponse response = executeWithRateLimit(() -> {
                return executeWithApiKeyRotation(apiKey -> {
                    try {
                        return restClient.get()
                                .uri(buildUriFunction("/suddenattack/v1/match-detail", b -> b.queryParam("match_id", matchId)))
                                .header("x-nxopen-api-key", apiKey)
                                .retrieve()
                                .body(MatchDetailResponse.class);
                    } catch (HttpClientErrorException e) {
                        String body = e.getResponseBodyAsString();
                        if (e.getStatusCode().value() == 429) {
                            log.debug("Nexon API 429 에러: getMatchDetail, match_id={}", matchId);
                            // Retry-After 헤더 확인 (초 단위)
                            int retryAfterSeconds = 30; // 기본값
                            try {
                                String retryAfterHeader = e.getResponseHeaders().getFirst("Retry-After");
                                if (retryAfterHeader != null && !retryAfterHeader.isEmpty()) {
                                    retryAfterSeconds = Integer.parseInt(retryAfterHeader);
                                }
                            } catch (Exception ignored) {
                                // 헤더 파싱 실패 시 기본값 사용
                            }
                            throw new NexonApiRateLimitException(
                                "Nexon API 요청 제한에 도달했습니다. 잠시 후 다시 시도해주세요.", e, retryAfterSeconds);
                        }
                        log.warn("Nexon API 에러: getMatchDetail, match_id={}, status={}, body={}", 
                                matchId, e.getStatusCode(), body);
                        return null;
                    } catch (HttpServerErrorException e) {
                        String body = e.getResponseBodyAsString();
                        log.warn("Nexon API 서버 에러: getMatchDetail, match_id={}, status={}, body={}", 
                                matchId, e.getStatusCode(), body);
                        return null;
                    }
                });
            });
            if (response != null) {
                log.debug("Nexon API 호출 성공: getMatchDetail, match_id={}", matchId);
            } else {
                log.warn("Nexon API 응답이 null: getMatchDetail, match_id={}", matchId);
            }
            return response;
        } catch (Exception e) {
            log.error("Nexon API 호출 실패: getMatchDetail, match_id={}, error={}", matchId, e.getMessage(), e);
            return null; // 에러 발생 시 null 반환하여 기능이 계속 작동하도록
        }
    }
    
    /**
     * 레이트 리밋을 적용한 API 호출 실행
     */
    private <T> T executeWithRateLimit(java.util.function.Supplier<T> apiCall) {
        try {
            rateLimiter.acquire();
            try {
                return apiCall.get();
            } finally {
                rateLimiter.release();
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("Nexon API 호출 중단");
            throw new RuntimeException("API 호출이 중단되었습니다.", e);
        }
    }

    private void ensureConfigured() {
        if (!StringUtils.hasText(baseUrl)) {
            throw new IllegalStateException("NxOpen API 설정이 누락되었습니다. base-url을 확인하세요.");
        }
    }

    private Function<UriBuilder, URI> buildUriFunction(String path, java.util.function.Consumer<UriBuilder> customizer) {
        ensureConfigured();
        return uriBuilder -> {
            UriBuilder builder = uriBuilder.path(path);
            customizer.accept(builder);
            URI uri = builder.build();
            log.debug("생성된 URI: path={}, uri={}", path, uri);
            return uri;
        };
    }
    
    // 이미지 URL 검증 로직 제거 - 서든어택 API에서 받은 이미지 URL을 그대로 사용
    
    /**
     * 메타데이터 조회 메서드들
     * 각 메타데이터 엔드포인트를 호출하여 응답을 확인
     */
    
    public String getLogoMetadata() {
        return getMetadataAsString("/static/suddenattack/meta/logo");
    }
    
    public String getGradeMetadata() {
        return getMetadataAsString("/static/suddenattack/meta/grade");
    }
    
    public String getSeasonGradeMetadata() {
        return getMetadataAsString("/static/suddenattack/meta/season_grade");
    }
    
    public String getTierMetadata() {
        return getMetadataAsString("/static/suddenattack/meta/tier");
    }
    
    /**
     * 메타데이터를 문자열로 받아서 로깅 및 확인
     */
    private String getMetadataAsString(String path) {
        log.debug("메타데이터 조회 시작: path={}", path);
        try {
            String metadataResponse = executeWithRateLimit(() -> {
                return executeWithApiKeyRotation(apiKey -> {
                    try {
                        return restClient.get()
                                .uri(buildUriFunction(path, b -> {}))
                                .header("x-nxopen-api-key", apiKey)
                                .retrieve()
                                .body(String.class);
                    } catch (HttpClientErrorException e) {
                        String body = e.getResponseBodyAsString();
                        log.warn("메타데이터 API 에러: path={}, status={}, body={}", path, e.getStatusCode(), body);
                        if (e.getStatusCode().value() == 429) {
                            throw new NexonApiRateLimitException(
                                "Nexon API 요청 제한에 도달했습니다. 잠시 후 다시 시도해주세요.", e);
                        }
                        return null;
                    } catch (HttpServerErrorException e) {
                        String body = e.getResponseBodyAsString();
                        log.warn("메타데이터 API 서버 에러: path={}, status={}, body={}", path, e.getStatusCode(), body);
                        return null;
                    }
                });
            });
            
            if (metadataResponse != null) {
                log.debug("메타데이터 조회 성공: path={}, responseLength={}", path, metadataResponse.length());
            } else {
                log.warn("메타데이터 응답이 null: path={}", path);
            }
            return metadataResponse;
        } catch (Exception e) {
            log.error("메타데이터 조회 실패: path={}, error={}", path, e.getMessage(), e);
            return null;
        }
    }
}

