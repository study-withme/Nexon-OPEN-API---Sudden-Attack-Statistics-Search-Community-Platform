package com.example.jokerweb.community;

import com.example.jokerweb.community.dto.BarracksReportCreateRequest;
import com.example.jokerweb.community.dto.BarracksReportResponse;
import com.example.jokerweb.security.RequireNexonLinked;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/barracks")
@RequiredArgsConstructor
@RequireNexonLinked
public class BarracksReportController {

    private final BarracksReportService service;

    @PostMapping
    public ResponseEntity<BarracksReportResponse> create(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @Valid @RequestBody BarracksReportCreateRequest request
    ) {
        return ResponseEntity.ok(service.create(authorization, request));
    }

    @GetMapping
    public ResponseEntity<List<BarracksReportResponse>> list() {
        return ResponseEntity.ok(service.list());
    }

    @GetMapping("/{id}")
    public ResponseEntity<BarracksReportResponse> detail(@PathVariable Long id) {
        return ResponseEntity.ok(service.detail(id));
    }

    @GetMapping("/count")
    public ResponseEntity<java.util.Map<String, Long>> getReportCounts(
            @RequestParam("targetNickname") String targetNickname) {
        long barracksCount = service.getBarracksReportCount(targetNickname);
        long trollCount = service.getTrollReportCount(targetNickname);
        return ResponseEntity.ok(java.util.Map.of(
                "barracksCount", barracksCount,
                "trollCount", trollCount
        ));
    }

    @PostMapping("/{id}/check-ban-status")
    public ResponseEntity<java.util.Map<String, String>> checkBanStatus(@PathVariable Long id) {
        BarracksReportResponse report = service.detail(id);
        service.checkAndUpdateBanStatus(report.getTargetNickname(), report.getTargetOuid());
        return ResponseEntity.ok(java.util.Map.of("message", "정지 상태 확인이 시작되었습니다."));
    }
}
