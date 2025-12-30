package com.example.jokerweb.community;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 병영수첩 ↔ 닉네임/ouid 조회용 API.
 *
 * 병영신고 작성 화면에서:
 * - 닉네임으로 병영주소를 채우거나
 * - 병영주소로 닉네임/클랜/ouid를 역으로 채우는 데 사용된다.
 */
@RestController
@RequestMapping("/api/barracks/lookup")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "BarracksLookup", description = "병영수첩 조회 보조 API")
public class BarracksLookupController {

    private final BarracksLookupService barracksLookupService;

    @Operation(summary = "병영수첩 URL로 사용자 정보 조회", description = "병영수첩 주소를 기반으로 닉네임/클랜/ouid/병영ID를 조회합니다.")
    @GetMapping("/by-url")
    public ResponseEntity<?> resolveByUrl(
            @Parameter(description = "병영수첩 전체 URL", required = true, example = "https://barracks.sa.nexon.com/barracks/profile.aspx?sn=352822630")
            @RequestParam("url") String url
    ) {
        if (!StringUtils.hasText(url)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "url 파라미터는 필수입니다."));
        }

        return barracksLookupService.resolveByUrl(url)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "병영수첩 주소로 사용자를 찾을 수 없습니다.")));
    }

    @Operation(summary = "닉네임으로 병영수첩 정보 조회", description = "같은 닉네임에 대해 우리 DB에 저장된 최근 병영주소가 있다면 이를 재사용합니다.")
    @GetMapping("/by-nickname")
    public ResponseEntity<?> resolveByNickname(
            @Parameter(description = "서든어택 닉네임", required = true, example = "찌잼")
            @RequestParam("nickname") String nickname
    ) {
        if (!StringUtils.hasText(nickname)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "nickname 파라미터는 필수입니다."));
        }

        return barracksLookupService.resolveByNickname(nickname)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "해당 닉네임으로 저장된 병영수첩 주소가 없습니다. 먼저 병영수첩 주소를 입력해 제보해 주세요.")));
    }
}

