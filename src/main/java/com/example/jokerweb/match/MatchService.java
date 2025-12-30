package com.example.jokerweb.match;

import com.example.jokerweb.nexon.NxOpenApiClient;
import com.example.jokerweb.nexon.dto.MatchDetailResponse;
import com.example.jokerweb.nexon.dto.MatchListResponse;
import com.example.jokerweb.player.Player;
import com.example.jokerweb.player.PlayerRepository;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MatchService {

    private static final Logger log = LoggerFactory.getLogger(MatchService.class);

    private final NxOpenApiClient nxClient;
    private final MatchMetaRepository matchMetaRepository;
    private final MatchPlayerRepository matchPlayerRepository;
    private final PlayerRepository playerRepository;

    /**
     * 프론트엔드의 모드 값을 Nexon API의 실제 값으로 변환
     */
    private String convertMatchMode(String frontendMode) {
        if (frontendMode == null) {
            return "개인전"; // 기본값
        }
        return switch (frontendMode.toLowerCase()) {
            case "all" -> "개인전"; // 전체 조회는 개인전으로 시작
            case "rating" -> "개인전"; // 랭크는 match_type으로 구분
            case "normal" -> "개인전";
            case "sniper" -> "개인전"; // 무기 타입은 별도 필터링 필요
            case "melee" -> "개인전"; // 무기 타입은 별도 필터링 필요
            default -> frontendMode; // 이미 올바른 값이면 그대로 사용
        };
    }

    /**
     * 프론트엔드의 모드 값에 따라 match_type 결정
     * rating은 fetchBombMissionMatchTypes에서 처리하므로 여기서는 null 반환
     */
    private String convertMatchType(String frontendMode) {
        if (frontendMode == null) {
            return null;
        }
        return switch (frontendMode.toLowerCase()) {
            case "normal" -> "일반전";
            default -> null; // rating은 별도 처리, all이나 다른 값은 type 없이 조회
        };
    }

    /**
     * "all" 모드의 경우 모든 게임 모드와 매치 타입을 조회하여 합침
     */
    private MatchListResponse fetchAllMatchTypes(String ouid) {
        MatchListResponse combinedResponse = new MatchListResponse();
        java.util.ArrayList<MatchListResponse.MatchItem> allMatches = new java.util.ArrayList<>();
        
        // 개인전 모드의 매치 타입들
        String[] personalMatchTypes = {null, "일반전", "랭크전 솔로", "랭크전 파티", "클랜전"};
        for (String type : personalMatchTypes) {
            MatchListResponse response = nxClient.getMatches(ouid, "개인전", type);
            if (response != null && response.getMatch() != null) {
                allMatches.addAll(response.getMatch());
            }
        }
        
        // 데스매치 모드
        MatchListResponse deathMatch = nxClient.getMatches(ouid, "데스매치", null);
        if (deathMatch != null && deathMatch.getMatch() != null) {
            allMatches.addAll(deathMatch.getMatch());
        }
        
        // 폭파미션 모드 (랭크전 타입들)
        MatchListResponse bombMission = fetchBombMissionMatchTypes(ouid);
        if (bombMission != null && bombMission.getMatch() != null) {
            allMatches.addAll(bombMission.getMatch());
        }
        
        // 진짜를 모아라 모드
        MatchListResponse collectMode = nxClient.getMatches(ouid, "진짜를 모아라", null);
        if (collectMode != null && collectMode.getMatch() != null) {
            allMatches.addAll(collectMode.getMatch());
        }
        
        combinedResponse.setMatch(allMatches);
        return combinedResponse;
    }

    /**
     * 폭파미션의 경우 여러 매치 타입을 조회하여 합침
     * 랭크전 솔로, 랭크전 파티, 클랜 랭크전, 토너먼트를 모두 조회
     */
    private MatchListResponse fetchBombMissionMatchTypes(String ouid) {
        MatchListResponse combinedResponse = new MatchListResponse();
        java.util.ArrayList<MatchListResponse.MatchItem> allMatches = new java.util.ArrayList<>();
        
        // 폭파미션의 매치 타입들
        String[] matchTypes = {"랭크전 솔로", "랭크전 파티", "클랜 랭크전", "토너먼트"};
        
        for (String type : matchTypes) {
            MatchListResponse response = nxClient.getMatches(ouid, "폭파미션", type);
            if (response != null && response.getMatch() != null) {
                allMatches.addAll(response.getMatch());
            }
        }
        
        combinedResponse.setMatch(allMatches);
        return combinedResponse;
    }

    /**
     * 단순 API 호출만 수행 (DB 저장 없음)
     * 넥슨 API에서 매치 정보를 직접 조회하여 반환
     */
    public MatchListResponse fetchMatchesSimple(String ouid, String matchMode, String matchType) {
        try {
            // 폭파미션 모드인 경우 랭크전 타입별로 구분하여 조회
            if ("폭파미션".equals(matchMode) || "폭파미션".equalsIgnoreCase(matchMode)) {
                MatchListResponse response = new MatchListResponse();
                java.util.ArrayList<MatchListResponse.MatchItem> allMatches = new java.util.ArrayList<>();
                
                // matchType이 지정된 경우 해당 타입만 조회, 없으면 모든 타입 조회
                if (matchType != null && !matchType.isEmpty()) {
                    MatchListResponse result = nxClient.getMatches(ouid, "폭파미션", matchType);
                    if (result != null && result.getMatch() != null) {
                        allMatches.addAll(result.getMatch());
                    }
                } else {
                    // 폭파미션의 모든 타입 조회
                    String[] matchTypes = {"랭크전 솔로", "랭크전 파티", "클랜 랭크전", "토너먼트"};
                    for (String type : matchTypes) {
                        MatchListResponse result = nxClient.getMatches(ouid, "폭파미션", type);
                        if (result != null && result.getMatch() != null) {
                            allMatches.addAll(result.getMatch());
                        }
                    }
                }
                
                response.setMatch(allMatches);
                log.debug("폭파미션 매치 조회 완료 (단순 API): ouid={}, type={}, matchCount={}", ouid, matchType, allMatches.size());
                return response;
            }
            
            // 일반 모드/타입 조회
            MatchListResponse response = nxClient.getMatches(ouid, matchMode, matchType);
            if (response == null) {
                return new MatchListResponse();
            }
            log.debug("매치 조회 완료 (단순 API): ouid={}, mode={}, type={}, matchCount={}", 
                    ouid, matchMode, matchType, response.getMatch() != null ? response.getMatch().size() : 0);
            return response;
        } catch (Exception e) {
            log.error("매치 조회 실패 (단순 API): ouid={}, mode={}, type={}, error={}", ouid, matchMode, matchType, e.getMessage());
            return new MatchListResponse();
        }
    }

    /**
     * 매치 상세 정보를 단순 API 호출만 수행 (DB 저장 없음)
     */
    public MatchDetailResponse fetchMatchDetailSimple(String matchId) {
        if (matchId == null || matchId.trim().isEmpty()) {
            log.warn("매치 ID가 비어있음: matchId={}", matchId);
            return null;
        }
        
        try {
            MatchDetailResponse detail = nxClient.getMatchDetail(matchId);
            log.debug("매치 상세 조회 완료 (단순 API): matchId={}", matchId);
            return detail;
        } catch (Exception e) {
            log.error("매치 상세 조회 실패 (단순 API): matchId={}, error={}", matchId, e.getMessage());
            return null;
        }
    }

    @Cacheable(
        cacheNames = "matches", 
        key = "#ouid + '_' + (#matchMode != null ? #matchMode : 'null') + '_' + (#matchType != null ? #matchType : 'null')",
        unless = "#result == null || (#result.match != null && #result.match.isEmpty())"
    )
    public MatchListResponse fetchMatches(String ouid, String matchMode, String matchType) {
        // "all" 모드의 경우 모든 게임 모드와 매치 타입을 조회하여 합침
        if ("all".equalsIgnoreCase(matchMode)) {
            MatchListResponse response = fetchAllMatchTypes(ouid);
            if (response == null || response.getMatch() == null || response.getMatch().isEmpty()) {
                log.warn("전체 매치 조회 결과 없음: ouid={}, matchCount=0", ouid);
                return response != null ? response : new MatchListResponse();
            }
            
            log.info("전체 매치 조회 성공: ouid={}, matchCount={}", ouid, response.getMatch().size());
            
            // 매치 ID 리스트 추출
            List<String> matchIds = response.getMatch().stream()
                    .map(MatchListResponse.MatchItem::getMatchId)
                    .filter(id -> id != null && !id.trim().isEmpty())
                    .toList();
            
            // DB 조회를 한 번만 수행하여 최적화
            Map<String, MatchMeta> metaMap = matchIds.isEmpty() 
                    ? java.util.Collections.emptyMap()
                    : matchMetaRepository.findAllById(matchIds).stream()
                        .collect(Collectors.toMap(MatchMeta::getMatchId, meta -> meta));
                
                // 매치 목록 응답에 DB의 메타데이터 정보 채우기
                for (MatchListResponse.MatchItem item : response.getMatch()) {
                    if (item.getMatchId() != null) {
                        MatchMeta meta = metaMap.get(item.getMatchId());
                        if (meta != null) {
                            // DB에 저장된 정보로 채우기
                            if (item.getMatchMode() == null || item.getMatchMode().isEmpty()) {
                                item.setMatchMode(meta.getMatchMode());
                            }
                            if (item.getMatchType() == null || item.getMatchType().isEmpty()) {
                                item.setMatchType(meta.getMatchType());
                        }
                    }
                }
            }
            
            // 배치로 저장
            try {
                saveMatchesInBatch(response.getMatch());
                log.debug("전체 매치 메타데이터 저장 완료: ouid={}, matchCount={}", ouid, response.getMatch().size());
            } catch (Exception e) {
                log.error("전체 매치 메타데이터 저장 실패: ouid={}, error={}", ouid, e.getMessage(), e);
            }
            
            // 상세 정보는 비동기 배치로 처리 (메모리 최적화)
            Set<String> existingIds = metaMap.keySet();
            List<String> newIds = response.getMatch().stream()
                    .map(MatchListResponse.MatchItem::getMatchId)
                    .filter(id -> id != null && !id.trim().isEmpty() && !existingIds.contains(id))
                    .limit(50) // 최신 50개만 처리하여 메모리 사용 최소화
                    .toList();

            log.debug("전체 매치 상세 정보 조회 필요: ouid={}, newMatchCount={}, totalMatchCount={}", ouid, newIds.size(), response.getMatch().size());

            // 배치로 비동기 처리
            if (!newIds.isEmpty()) {
                fetchAndSaveMatchDetailsBatchAsync(newIds);
            }
            
            return response;
        }
        
        // "rating" (랭크전) 모드의 경우 폭파미션의 모든 랭크전 타입을 조회
        if ("rating".equalsIgnoreCase(matchMode)) {
            MatchListResponse response = fetchBombMissionMatchTypes(ouid);
            if (response == null || response.getMatch() == null || response.getMatch().isEmpty()) {
                log.warn("랭크전 매치 조회 결과 없음: ouid={}, matchCount=0", ouid);
                return response != null ? response : new MatchListResponse();
            }
            
            log.info("랭크전 매치 조회 성공: ouid={}, matchCount={}", ouid, response.getMatch().size());
            
            // 매치 ID 리스트 추출
            List<String> matchIds = response.getMatch().stream()
                    .map(MatchListResponse.MatchItem::getMatchId)
                    .filter(id -> id != null && !id.trim().isEmpty())
                    .toList();
            
            // DB 조회를 한 번만 수행하여 최적화
            Map<String, MatchMeta> metaMap = matchIds.isEmpty() 
                    ? java.util.Collections.emptyMap()
                    : matchMetaRepository.findAllById(matchIds).stream()
                        .collect(Collectors.toMap(MatchMeta::getMatchId, meta -> meta));
                
                // 매치 목록 응답에 DB의 메타데이터 정보 채우기
                for (MatchListResponse.MatchItem item : response.getMatch()) {
                    if (item.getMatchId() != null) {
                        MatchMeta meta = metaMap.get(item.getMatchId());
                        if (meta != null) {
                            // DB에 저장된 정보로 채우기
                            if (item.getMatchMode() == null || item.getMatchMode().isEmpty()) {
                                item.setMatchMode(meta.getMatchMode());
                            }
                            if (item.getMatchType() == null || item.getMatchType().isEmpty()) {
                                item.setMatchType(meta.getMatchType());
                        }
                    }
                }
            }
            
            // 배치로 저장
            try {
                saveMatchesInBatch(response.getMatch());
                log.debug("랭크전 매치 메타데이터 저장 완료: ouid={}, matchCount={}", ouid, response.getMatch().size());
            } catch (Exception e) {
                log.error("랭크전 매치 메타데이터 저장 실패: ouid={}, error={}", ouid, e.getMessage(), e);
            }
            
            // 상세 정보는 비동기 배치로 처리 (메모리 최적화)
            Set<String> existingIds = metaMap.keySet();
            List<String> newIds = response.getMatch().stream()
                    .map(MatchListResponse.MatchItem::getMatchId)
                    .filter(id -> id != null && !id.trim().isEmpty() && !existingIds.contains(id))
                    .limit(50) // 최신 50개만 처리하여 메모리 사용 최소화
                    .toList();

            log.debug("랭크전 매치 상세 정보 조회 필요: ouid={}, newMatchCount={}, totalMatchCount={}", ouid, newIds.size(), response.getMatch().size());

            // 배치로 비동기 처리
            if (!newIds.isEmpty()) {
                fetchAndSaveMatchDetailsBatchAsync(newIds);
            }
            
            return response;
        }
        
        // "폭파미션" 모드의 경우 폭파미션의 모든 랭크전 타입을 조회
        if ("폭파미션".equals(matchMode) || "폭파미션".equalsIgnoreCase(matchMode)) {
            MatchListResponse response = fetchBombMissionMatchTypes(ouid);
            if (response == null || response.getMatch() == null || response.getMatch().isEmpty()) {
                log.warn("폭파미션 매치 조회 결과 없음: ouid={}, matchCount=0", ouid);
                return response != null ? response : new MatchListResponse();
            }
            
            log.info("폭파미션 매치 조회 성공: ouid={}, matchCount={}", ouid, response.getMatch().size());
            
            // 매치 ID 리스트 추출
            List<String> matchIds = response.getMatch().stream()
                    .map(MatchListResponse.MatchItem::getMatchId)
                    .filter(id -> id != null && !id.trim().isEmpty())
                    .toList();
            
            // DB 조회를 한 번만 수행하여 최적화
            Map<String, MatchMeta> metaMap = matchIds.isEmpty() 
                    ? java.util.Collections.emptyMap()
                    : matchMetaRepository.findAllById(matchIds).stream()
                        .collect(Collectors.toMap(MatchMeta::getMatchId, meta -> meta));
                
                // 매치 목록 응답에 DB의 메타데이터 정보 채우기
                for (MatchListResponse.MatchItem item : response.getMatch()) {
                    if (item.getMatchId() != null) {
                        MatchMeta meta = metaMap.get(item.getMatchId());
                        if (meta != null) {
                            // DB에 저장된 정보로 채우기
                            if (item.getMatchMode() == null || item.getMatchMode().isEmpty()) {
                                item.setMatchMode(meta.getMatchMode());
                            }
                            if (item.getMatchType() == null || item.getMatchType().isEmpty()) {
                                item.setMatchType(meta.getMatchType());
                        }
                    }
                }
            }
            
            // 배치로 저장
            try {
                saveMatchesInBatch(response.getMatch());
                log.debug("폭파미션 매치 메타데이터 저장 완료: ouid={}, matchCount={}", ouid, response.getMatch().size());
            } catch (Exception e) {
                log.error("폭파미션 매치 메타데이터 저장 실패: ouid={}, error={}", ouid, e.getMessage(), e);
            }
            
            // 상세 정보는 비동기 배치로 처리 (메모리 최적화)
            Set<String> existingIds = metaMap.keySet();
            List<String> newIds = response.getMatch().stream()
                    .map(MatchListResponse.MatchItem::getMatchId)
                    .filter(id -> id != null && !id.trim().isEmpty() && !existingIds.contains(id))
                    .limit(50) // 최신 50개만 처리하여 메모리 사용 최소화
                    .toList();

            log.debug("폭파미션 매치 상세 정보 조회 필요: ouid={}, newMatchCount={}, totalMatchCount={}", ouid, newIds.size(), response.getMatch().size());

            // 배치로 비동기 처리
            if (!newIds.isEmpty()) {
                fetchAndSaveMatchDetailsBatchAsync(newIds);
            }
            
            return response;
        }
        
        // 프론트엔드의 모드 값을 Nexon API 값으로 변환
        String convertedMode = convertMatchMode(matchMode);
        
        // "개인전" 모드일 때는 "일반전" 타입만 조회
        String convertedType;
        if ("개인전".equals(matchMode)) {
            convertedType = "일반전"; // 개인전 모드는 일반전만 조회
        } else if (matchType != null && !"all".equalsIgnoreCase(matchType)) {
            convertedType = matchType;
        } else if (matchType == null) {
            convertedType = convertMatchType(matchMode);
        } else {
            convertedType = null; // "all"이면 모든 타입 조회
        }
        
        MatchListResponse response = null;
        try {
            response = nxClient.getMatches(ouid, convertedMode, convertedType);
        } catch (Exception e) {
            log.warn("매치 API 호출 실패: ouid={}, mode={}, type={}, error={}", ouid, convertedMode, convertedType, e.getMessage());
            // API 실패 시 DB에서 최근 매치 조회 (폴백 전략)
            response = fetchMatchesFromDatabase(ouid, convertedMode, convertedType);
        }
        
        if (response == null) {
            // API 호출 실패 시 빈 응답 반환
            log.warn("매치 조회 실패: ouid={}, mode={}, type={}, response=null", ouid, convertedMode, convertedType);
            return new MatchListResponse();
        }
        if (response.getMatch() == null || response.getMatch().isEmpty()) {
            log.debug("매치 조회 결과 없음: ouid={}, mode={}, type={}, matchCount=0", ouid, convertedMode, convertedType);
            return response;
        }
        
        log.info("매치 조회 성공: ouid={}, mode={}, type={}, matchCount={}", ouid, convertedMode, convertedType, response.getMatch().size());
        
        // 매치 ID 리스트 추출 및 로깅
        List<String> matchIds = response.getMatch().stream()
                .map(MatchListResponse.MatchItem::getMatchId)
                .filter(id -> id != null && !id.trim().isEmpty())
                .toList();
        
        // matchId가 없는 매치 확인
        long matchIdsWithoutId = response.getMatch().stream()
                .filter(item -> item.getMatchId() == null || item.getMatchId().trim().isEmpty())
                .count();
        if (matchIdsWithoutId > 0) {
            log.warn("matchId가 없는 매치 발견: ouid={}, count={}", ouid, matchIdsWithoutId);
        }
        
        log.debug("매치 ID 추출 완료: ouid={}, totalMatches={}, validMatchIds={}", ouid, response.getMatch().size(), matchIds.size());
        
        // DB 조회를 한 번만 수행하여 최적화
        Map<String, MatchMeta> metaMap = matchIds.isEmpty() 
                ? java.util.Collections.emptyMap()
                : matchMetaRepository.findAllById(matchIds).stream()
                    .collect(Collectors.toMap(MatchMeta::getMatchId, meta -> meta));
            
            log.debug("DB에서 매치 메타데이터 조회 완료: ouid={}, foundCount={}, totalMatchIds={}", ouid, metaMap.size(), matchIds.size());
            
            // 매치 목록 응답에 DB의 메타데이터 정보 채우기
            int filledCount = 0;
            for (MatchListResponse.MatchItem item : response.getMatch()) {
                if (item.getMatchId() != null && !item.getMatchId().trim().isEmpty()) {
                    MatchMeta meta = metaMap.get(item.getMatchId());
                    if (meta != null) {
                        // DB에 저장된 정보로 채우기
                        if (item.getMatchMode() == null || item.getMatchMode().isEmpty()) {
                            item.setMatchMode(meta.getMatchMode());
                            filledCount++;
                        }
                        if (item.getMatchType() == null || item.getMatchType().isEmpty()) {
                            item.setMatchType(meta.getMatchType());
                            filledCount++;
                        }
                    }
                }
            }
            log.debug("매치 메타데이터 채우기 완료: ouid={}, filledCount={}", ouid, filledCount);
        
        // 배치로 저장하여 트랜잭션 횟수 감소
        try {
            saveMatchesInBatch(response.getMatch());
            log.debug("매치 메타데이터 저장 완료: ouid={}, matchCount={}", ouid, response.getMatch().size());
        } catch (Exception e) {
            log.error("매치 메타데이터 저장 실패: ouid={}, error={}", ouid, e.getMessage(), e);
            // 저장 실패해도 응답은 반환
        }
        
        // 상세 정보는 비동기 배치로 처리 (메모리 최적화)
        Set<String> existingIds = metaMap.keySet();
        List<String> newIds = matchIds.stream()
                .filter(id -> !existingIds.contains(id))
                .limit(50) // 최신 50개만 처리하여 메모리 사용 최소화
                .toList();

        log.debug("새로운 매치 상세 정보 조회 필요: ouid={}, newMatchCount={}, totalMatchCount={}", ouid, newIds.size(), response.getMatch().size());

        // 배치로 비동기 처리
        if (!newIds.isEmpty()) {
            fetchAndSaveMatchDetailsBatchAsync(newIds);
        }
        
        return response;
    }

    /**
     * 매치 메타데이터를 배치로 저장
     */
    @Transactional
    public void saveMatchesInBatch(List<MatchListResponse.MatchItem> items) {
        if (items == null || items.isEmpty()) {
            return;
        }
        
        List<MatchMeta> metasToSave = new java.util.ArrayList<>();
        List<MatchMeta> metasToUpdate = new java.util.ArrayList<>();
        
        // 중복 조회 방지: matchId만 추출하여 한 번만 조회
        List<String> matchIds = items.stream()
                .map(MatchListResponse.MatchItem::getMatchId)
                .filter(id -> id != null && !id.trim().isEmpty())
                .toList();
        
        Set<String> existingIds = matchIds.isEmpty() 
                ? java.util.Collections.emptySet()
                : matchMetaRepository.findAllById(matchIds).stream()
                        .map(MatchMeta::getMatchId)
                        .collect(Collectors.toSet());
        
        for (MatchListResponse.MatchItem item : items) {
            LocalDateTime dateUtc = item.getDateMatch() != null
                    ? item.getDateMatch().toInstant().atZone(ZoneOffset.UTC).toLocalDateTime()
                    : LocalDateTime.now();

            if (existingIds.contains(item.getMatchId())) {
                // 기존 메타데이터 업데이트
                matchMetaRepository.findById(item.getMatchId()).ifPresent(meta -> {
                    boolean changed = false;
                    if (item.getMatchResult() != null && (meta.getMatchResult() == null || !item.getMatchResult().equals(meta.getMatchResult()))) {
                        meta.setMatchResult(item.getMatchResult());
                        changed = true;
                    }
                    if (item.getMatchMode() != null && (meta.getMatchMode() == null || !item.getMatchMode().equals(meta.getMatchMode()))) {
                        meta.setMatchMode(item.getMatchMode());
                        changed = true;
                    }
                    if (item.getMatchType() != null && (meta.getMatchType() == null || !item.getMatchType().equals(meta.getMatchType()))) {
                        meta.setMatchType(item.getMatchType());
                        changed = true;
                    }
                    // 기존 match_map은 상세 호출에서만 채워지므로 여기서는 덮어쓰지 않는다.
                    if (changed) {
                        metasToUpdate.add(meta);
                    }
                });
            } else {
                // 신규 메타데이터 생성
                metasToSave.add(
                    MatchMeta.builder()
                            .matchId(item.getMatchId())
                            .matchType(item.getMatchType())
                            .matchMode(item.getMatchMode())
                            .matchResult(item.getMatchResult())
                            .matchMap(null) // 상세 호출에서 채움
                            .dateMatchUtc(dateUtc)
                            .build()
                );
            }
        }
        
        // 배치 저장
        if (!metasToSave.isEmpty()) {
            matchMetaRepository.saveAll(metasToSave);
        }
        if (!metasToUpdate.isEmpty()) {
            matchMetaRepository.saveAll(metasToUpdate);
        }
    }

    /**
     * 비동기로 매치 상세 정보를 조회하고 저장
     */
    @Async
    public CompletableFuture<Void> fetchAndSaveMatchDetailAsync(String matchId) {
        try {
            fetchAndSaveMatchDetail(matchId);
            log.debug("비동기 매치 상세 정보 저장 완료: matchId={}", matchId);
        } catch (Exception e) {
            log.error("비동기 매치 상세 정보 저장 실패: matchId={}, error={}", matchId, e.getMessage(), e);
        }
        return CompletableFuture.completedFuture(null);
    }
    
    /**
     * 여러 매치 상세 정보를 배치로 비동기 처리 (메모리 최적화)
     */
    @Async
    public CompletableFuture<Void> fetchAndSaveMatchDetailsBatchAsync(List<String> matchIds) {
        if (matchIds == null || matchIds.isEmpty()) {
            return CompletableFuture.completedFuture(null);
        }
        
        log.debug("매치 상세 정보 배치 비동기 처리 시작: matchCount={}", matchIds.size());
        int successCount = 0;
        int failCount = 0;
        
        // 작은 배치로 나누어 처리하여 메모리 사용 최소화
        int batchSize = 10;
        for (int i = 0; i < matchIds.size(); i += batchSize) {
            int end = Math.min(i + batchSize, matchIds.size());
            List<String> batch = matchIds.subList(i, end);
            
            for (String matchId : batch) {
                try {
                    fetchAndSaveMatchDetail(matchId);
                    successCount++;
                } catch (Exception e) {
                    log.warn("매치 상세 정보 조회 실패: matchId={}, error={}", matchId, e.getMessage());
                    failCount++;
                }
            }
            
            // 배치 간 대기로 API 요청 속도 조절 및 메모리 해제 시간 확보
            if (i + batchSize < matchIds.size()) {
                try {
                    Thread.sleep(500); // 500ms 대기로 API 요청 속도 조절
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        }
        
        log.debug("매치 상세 정보 배치 비동기 처리 완료: 성공={}, 실패={}, 총={}", successCount, failCount, matchIds.size());
        return CompletableFuture.completedFuture(null);
    }
    
    /**
     * 여러 매치 상세 정보를 동기적으로 조회하고 저장
     * 분석에 필요한 데이터를 확보하기 위해 사용
     */
    public void fetchAndSaveMatchDetailsSync(List<String> matchIds) {
        if (matchIds == null || matchIds.isEmpty()) {
            return;
        }
        
        log.info("매치 상세 정보 동기 조회 시작: matchIds={}", matchIds.size());
        int successCount = 0;
        int failCount = 0;
        
        for (String matchId : matchIds) {
            try {
                MatchDetailResponse detail = fetchAndSaveMatchDetail(matchId);
                if (detail != null) {
                    successCount++;
                } else {
                    failCount++;
                }
            } catch (Exception e) {
                log.warn("매치 상세 정보 조회 실패: matchId={}, error={}", matchId, e.getMessage());
                failCount++;
            }
        }
        
        log.info("매치 상세 정보 동기 조회 완료: 성공={}, 실패={}", successCount, failCount);
    }

    /**
     * DB에서 매치 상세 정보 조회
     */
    public MatchDetailResponse fetchMatchDetailFromDatabase(String matchId) {
        MatchMeta meta = matchMetaRepository.findById(matchId).orElse(null);
        if (meta == null) {
            return null;
        }

        List<MatchPlayer> players = matchPlayerRepository.findByMatchId(matchId);

        if (players.isEmpty()) {
            return null;
        }

        // MatchDetailResponse로 변환
        MatchDetailResponse response = new MatchDetailResponse();
        response.setMatchId(meta.getMatchId());
        response.setMatchType(meta.getMatchType());
        response.setMatchMode(meta.getMatchMode());
        response.setMatchMap(meta.getMatchMap());
        response.setDateMatch(meta.getDateMatchUtc().atZone(ZoneOffset.UTC).toOffsetDateTime());

        List<MatchDetailResponse.MatchPlayerDetail> details = players.stream()
                .map(mp -> {
                    MatchDetailResponse.MatchPlayerDetail detail = new MatchDetailResponse.MatchPlayerDetail();
                    detail.setTeamId(mp.getTeamId());
                    detail.setMatchResult(mp.getMatchResult());
                    detail.setUserName(mp.getUserName());
                    detail.setSeasonGrade(mp.getSeasonGrade());
                    detail.setClanName(mp.getClanName());
                    detail.setKill(mp.getKillCount());
                    detail.setDeath(mp.getDeathCount());
                    detail.setAssist(mp.getAssistCount());
                    detail.setHeadshot(mp.getHeadshot());
                    detail.setDamage(mp.getDamage());
                    return detail;
                })
                .collect(Collectors.toList());

        response.setMatchDetail(details);
        return response;
    }

    @Transactional
    public MatchDetailResponse fetchAndSaveMatchDetail(String matchId) {
        if (matchId == null || matchId.trim().isEmpty()) {
            log.warn("매치 ID가 비어있음: matchId={}", matchId);
            return null;
        }
        
        // 먼저 DB에서 조회 시도
        MatchDetailResponse dbDetail = fetchMatchDetailFromDatabase(matchId);
        if (dbDetail != null && dbDetail.getMatchDetail() != null && !dbDetail.getMatchDetail().isEmpty()) {
            log.debug("DB에서 매치 상세 정보 조회 성공: matchId={}, playerCount={}", matchId, dbDetail.getMatchDetail().size());
            return dbDetail;
        } else {
            log.debug("DB에서 매치 상세 정보 없음: matchId={}, API 호출 필요", matchId);
        }

        // DB에 없으면 API 호출
        log.debug("매치 상세 정보 API 호출 시작: matchId={}", matchId);
        MatchDetailResponse detail = nxClient.getMatchDetail(matchId);
        if (detail == null) {
            log.debug("매치 상세 정보를 찾을 수 없음: matchId={}", matchId);
            return null;
        }
        
        log.debug("매치 상세 정보 API 호출 성공: matchId={}, playerCount={}", matchId, 
                detail.getMatchDetail() != null ? detail.getMatchDetail().size() : 0);

        LocalDateTime dateUtc = detail.getDateMatch() != null
                ? detail.getDateMatch().toInstant().atZone(ZoneOffset.UTC).toLocalDateTime()
                : LocalDateTime.now();

        MatchMeta meta = MatchMeta.builder()
                .matchId(detail.getMatchId())
                .matchMode(detail.getMatchMode())
                .matchType(detail.getMatchType())
                .matchMap(detail.getMatchMap())
                .dateMatchUtc(dateUtc)
                .build();
        matchMetaRepository.save(meta);

        if (detail.getMatchDetail() != null && !detail.getMatchDetail().isEmpty()) {
            log.debug("매치 상세 정보 저장 시작: matchId={}, playerCount={}", matchId, detail.getMatchDetail().size());
            int savedCount = 0;
            int failedCount = 0;
            
            // 배치로 ouid 조회를 최적화
            List<String> userNames = detail.getMatchDetail().stream()
                    .map(MatchDetailResponse.MatchPlayerDetail::getUserName)
                    .filter(name -> name != null && !name.trim().isEmpty())
                    .distinct()
                    .toList();
            
            // DB에서 이미 저장된 플레이어들을 배치로 조회 (한 번만 조회)
            Map<String, Player> existingPlayers = playerRepository.findAllById(userNames).stream()
                    .collect(Collectors.toMap(Player::getOuid, player -> player));
            
            // userName을 ouid로 매핑 (기존 플레이어는 기존 ouid 사용, 없으면 userName을 ouid로 사용)
            Map<String, String> userNameToOuidMap = new java.util.HashMap<>();
            for (String userName : userNames) {
                Player existingPlayer = existingPlayers.get(userName);
                if (existingPlayer != null) {
                    userNameToOuidMap.put(userName, existingPlayer.getOuid());
                } else {
                    userNameToOuidMap.put(userName, userName); // userName을 ouid로 사용
                }
            }
            
            // 플레이어 정보 배치 저장
            List<Player> playersToSave = new java.util.ArrayList<>();
            for (MatchDetailResponse.MatchPlayerDetail p : detail.getMatchDetail()) {
                    if (p.getUserName() == null || p.getUserName().trim().isEmpty()) {
                        continue;
                    }
                    
                    final String ouid = userNameToOuidMap.getOrDefault(p.getUserName(), p.getUserName());
                Player player = existingPlayers.get(ouid);
                
                if (player == null) {
                    // 신규 플레이어 생성
                    player = Player.builder()
                            .ouid(ouid)
                            .latestName(p.getUserName())
                            .clanName(p.getClanName())
                            .build();
                } else {
                    // 기존 플레이어 정보 업데이트
                    if (p.getUserName() != null && !p.getUserName().equals(player.getLatestName())) {
                        player.setLatestName(p.getUserName());
                    }
                    if (p.getClanName() != null) {
                        player.setClanName(p.getClanName());
                    }
                    }
                    
                    player.touchUpdatedAt();
                playersToSave.add(player);
            }
            
            // 플레이어 정보 배치 저장
            if (!playersToSave.isEmpty()) {
                    try {
                    playerRepository.saveAll(playersToSave);
                    } catch (Exception e) {
                    log.warn("플레이어 배치 저장 중 일부 실패: matchId={}, error={}", matchId, e.getMessage());
                }
            }
            
            // MatchPlayer 중복 확인을 위한 배치 조회 (matchId로 한 번만 조회)
            Set<String> existingOuidSet = matchPlayerRepository.findByMatchId(detail.getMatchId()).stream()
                    .map(MatchPlayer::getOuid)
                    .collect(Collectors.toSet());
            
            // MatchPlayer 배치 저장
            List<MatchPlayer> matchPlayersToSave = new java.util.ArrayList<>();
            for (MatchDetailResponse.MatchPlayerDetail p : detail.getMatchDetail()) {
                try {
                    if (p.getUserName() == null || p.getUserName().trim().isEmpty()) {
                        continue;
                    }
                    
                    final String ouid = userNameToOuidMap.getOrDefault(p.getUserName(), p.getUserName());
                    
                    // 중복 확인 (matchId + ouid 조합)
                    if (!existingOuidSet.contains(ouid)) {
                        matchPlayersToSave.add(
                                MatchPlayer.builder()
                                        .matchId(detail.getMatchId())
                                        .ouid(ouid)
                                        .teamId(p.getTeamId())
                                        .matchResult(p.getMatchResult())
                                        .userName(p.getUserName())
                                        .seasonGrade(p.getSeasonGrade())
                                        .clanName(p.getClanName())
                                        .killCount(p.getKill())
                                        .deathCount(p.getDeath())
                                        .assistCount(p.getAssist())
                                        .headshot(p.getHeadshot())
                                        .damage(p.getDamage())
                                        .build()
                        );
                        savedCount++;
                    }
                } catch (Exception e) {
                    log.warn("매치 플레이어 정보 저장 실패: matchId={}, userName={}, error={}", 
                            matchId, p.getUserName(), e.getMessage());
                    failedCount++;
                }
            }
            
            // MatchPlayer 배치 저장
            if (!matchPlayersToSave.isEmpty()) {
                try {
                    matchPlayerRepository.saveAll(matchPlayersToSave);
                } catch (Exception e) {
                    log.warn("매치 플레이어 배치 저장 실패: matchId={}, error={}", matchId, e.getMessage());
                    failedCount += matchPlayersToSave.size();
                }
            }
            
            log.debug("매치 상세 정보 저장 완료: matchId={}, saved={}, failed={}, total={}", 
                    matchId, savedCount, failedCount, detail.getMatchDetail().size());
        } else {
            log.warn("매치 상세 정보에 플레이어 정보가 없음: matchId={}", matchId);
        }
        return detail;
    }

    /**
     * API 실패 시 DB에서 매치 목록 조회 (폴백 전략)
     */
    private MatchListResponse fetchMatchesFromDatabase(String ouid, String matchMode, String matchType) {
        try {
            log.debug("DB에서 매치 목록 조회 시작: ouid={}, mode={}, type={}", ouid, matchMode, matchType);
            
            // match_player에서 해당 ouid의 최근 매치 조회
            List<MatchPlayer> matchPlayers = matchPlayerRepository.findByOuidOrderByMatchIdDesc(ouid);
            
            if (matchPlayers.isEmpty()) {
                log.debug("DB에서 매치 없음: ouid={}", ouid);
                return new MatchListResponse();
        }
        
            // matchId로 match_meta 조회
            List<String> matchIds = matchPlayers.stream()
                    .map(MatchPlayer::getMatchId)
                    .distinct()
                    .limit(100) // 최대 100개만
                    .toList();
            
            Map<String, MatchMeta> metaMap = matchMetaRepository.findAllById(matchIds).stream()
                    .collect(Collectors.toMap(MatchMeta::getMatchId, meta -> meta));
            
            // 필터링 (모드/타입)
            List<MatchListResponse.MatchItem> items = new java.util.ArrayList<>();
            for (MatchPlayer mp : matchPlayers) {
                MatchMeta meta = metaMap.get(mp.getMatchId());
                if (meta == null) continue;
                
                // 모드/타입 필터링
                if (matchMode != null && !matchMode.equals("all") && !matchMode.equals(meta.getMatchMode())) {
                    continue;
                }
                if (matchType != null && !matchType.equals("all") && !matchType.equals(meta.getMatchType())) {
                    continue;
                }
                
                MatchListResponse.MatchItem item = new MatchListResponse.MatchItem();
                item.setMatchId(meta.getMatchId());
                item.setMatchMode(meta.getMatchMode());
                item.setMatchType(meta.getMatchType());
                item.setMatchResult(meta.getMatchResult());
                item.setDateMatch(meta.getDateMatchUtc().atZone(ZoneOffset.UTC).toOffsetDateTime());
                item.setKill(mp.getKillCount());
                item.setDeath(mp.getDeathCount());
                item.setAssist(mp.getAssistCount());
                items.add(item);
            }
            
            MatchListResponse response = new MatchListResponse();
            response.setMatch(items);
            
            log.debug("DB에서 매치 목록 조회 완료: ouid={}, count={}", ouid, items.size());
            return response;
            
        } catch (Exception e) {
            log.error("DB에서 매치 목록 조회 실패: ouid={}, error={}", ouid, e.getMessage(), e);
            return new MatchListResponse();
        }
    }

}

