package com.example.jokerweb.nexon.controller;

import com.example.jokerweb.nexon.dto.MatchDetailSummaryResponse;
import com.example.jokerweb.nexon.dto.MatchSummaryResponse;
import com.example.jokerweb.nexon.dto.PlayerMatchHistoryResponse;
import com.example.jokerweb.nexon.service.SuddenAttackMatchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 서든어택 매치 정보 조회 API
 * Nexon OPEN API를 안전하게 감싸서 제공
 */
@Slf4j
@RestController
@RequestMapping("/api/sa/matches")
@RequiredArgsConstructor
@Tag(name = "Sudden Attack Match API", description = "서든어택 매치 정보 조회 API")
public class SuddenAttackMatchController {

    private final SuddenAttackMatchService matchService;

    @Operation(
        summary = "매치 정보 조회",
        description = "플레이어의 매치 정보를 조회합니다. Nexon OPEN API를 내부적으로 호출하여 안전하게 제공합니다."
    )
    @GetMapping
    public ResponseEntity<MatchSummaryResponse> getMatches(
            @Parameter(description = "계정 식별자 (ouid)", required = true)
            @RequestParam("ouid") String ouid,
            @Parameter(description = "게임 모드 (예: 폭파미션, 개인전, 데스매치 등)", required = true)
            @RequestParam("mode") String mode,
            @Parameter(description = "매치 유형 (예: 랭크전 솔로, 랭크전 파티, 클랜전 등)", required = false)
            @RequestParam(value = "type", required = false) String type,
            @Parameter(description = "페이지네이션 커서 (선택적)")
            @RequestParam(value = "cursor", required = false) String cursor,
            @Parameter(description = "최대 반환 개수 (기본값: 100, 최대: 1000)")
            @RequestParam(value = "limit", required = false, defaultValue = "100") Integer limit,
            @Parameter(description = "KST 시간대 사용 여부 (기본값: false, UTC 사용)")
            @RequestParam(value = "useKst", required = false, defaultValue = "false") Boolean useKst
    ) {
        log.info("매치 정보 조회 요청: ouid={}, mode={}, type={}, cursor={}, limit={}, useKst={}",
                maskOuid(ouid), mode, type, cursor, limit, useKst);

        try {
            MatchSummaryResponse response = matchService.getMatches(ouid, mode, type, cursor, limit, useKst);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("잘못된 요청 파라미터: {}", e.getMessage());
            throw e; // GlobalExceptionHandler에서 처리
        } catch (Exception e) {
            log.error("매치 정보 조회 중 오류 발생", e);
            throw e; // GlobalExceptionHandler에서 처리
        }
    }

    @Operation(
        summary = "매치 상세 정보 조회",
        description = "매치 ID를 기반으로 매치 상세 정보(참여자 정보 포함)를 조회합니다."
    )
    @GetMapping("/{matchId}/detail")
    public ResponseEntity<MatchDetailSummaryResponse> getMatchDetail(
            @Parameter(description = "매치 ID", required = true)
            @PathVariable("matchId") String matchId,
            @Parameter(description = "KST 시간대 사용 여부 (기본값: false, UTC 사용)")
            @RequestParam(value = "useKst", required = false, defaultValue = "false") Boolean useKst
    ) {
        log.info("매치 상세 정보 조회 요청: matchId={}, useKst={}", matchId, useKst);

        try {
            MatchDetailSummaryResponse response = matchService.getMatchDetail(matchId, useKst);
            if (response == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("잘못된 요청 파라미터: {}", e.getMessage());
            throw e; // GlobalExceptionHandler에서 처리
        } catch (Exception e) {
            log.error("매치 상세 정보 조회 중 오류 발생", e);
            throw e; // GlobalExceptionHandler에서 처리
        }
    }

    @Operation(
        summary = "플레이어 전적검색",
        description = "플레이어의 최근 200게임 매치 정보와 상세 정보를 조회합니다. " +
                "랭크전 솔로, 랭크전 파티, 클랜 랭크전, 클랜전 카테고리별로 분류하여 제공합니다."
    )
    @GetMapping("/history")
    public ResponseEntity<PlayerMatchHistoryResponse> getPlayerMatchHistory(
            @Parameter(description = "계정 식별자 (ouid)", required = true)
            @RequestParam("ouid") String ouid,
            @Parameter(description = "KST 시간대 사용 여부 (기본값: false, UTC 사용)")
            @RequestParam(value = "useKst", required = false, defaultValue = "false") Boolean useKst
    ) {
        log.info("전적검색 요청: ouid={}, useKst={}", maskOuid(ouid), useKst);

        try {
            PlayerMatchHistoryResponse response = matchService.getPlayerMatchHistory(ouid, useKst);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("잘못된 요청 파라미터: {}", e.getMessage());
            throw e; // GlobalExceptionHandler에서 처리
        } catch (Exception e) {
            log.error("전적검색 중 오류 발생", e);
            throw e; // GlobalExceptionHandler에서 처리
        }
    }

    /**
     * OUID 마스킹 (로그에서 민감정보 보호)
     */
    private String maskOuid(String ouid) {
        if (ouid == null || ouid.length() <= 8) {
            return "***";
        }
        return ouid.substring(0, 4) + "***" + ouid.substring(ouid.length() - 4);
    }
}
