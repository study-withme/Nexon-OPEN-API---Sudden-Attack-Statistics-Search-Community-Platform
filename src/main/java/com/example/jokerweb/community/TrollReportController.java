package com.example.jokerweb.community;

import com.example.jokerweb.auth.AuthService;
import com.example.jokerweb.member.Member;
import com.example.jokerweb.security.RequireNexonLinked;
import jakarta.validation.Valid;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/trolls")
@RequiredArgsConstructor
@RequireNexonLinked
public class TrollReportController {

    private final BarracksReportRepository barracksReportRepository;
    private final AuthService authService;

    @PostMapping
    public ResponseEntity<TrollReportResponse> create(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @Valid @RequestBody TrollReportRequest request
    ) {
        Member member = authService.authenticate(authorization)
                .orElseThrow(() -> new IllegalArgumentException("인증이 필요합니다."));

        BarracksReport report = BarracksReport.builder()
                .reporter(member)
                .targetNickname(request.getTargetName())
                .content(request.getDescription())
                .title("트롤 신고 - " + request.getTargetName())
                .reportType("troll")
                .status("pending")
                .adminNotes(request.getEvidenceUrl())
                .build();

        return ResponseEntity.ok(TrollReportResponse.from(barracksReportRepository.save(report)));
    }

    @GetMapping
    public ResponseEntity<List<TrollReportResponse>> list(
            @RequestParam(name = "targetName", required = false) String targetName
    ) {
        List<BarracksReport> reports = (targetName == null || targetName.isBlank())
                ? barracksReportRepository.findAllByOrderByCreatedAtDesc()
                : barracksReportRepository.findByTargetNicknameContainingIgnoreCaseOrderByCreatedAtDesc(targetName);

        List<TrollReportResponse> responses = reports.stream()
                .map(TrollReportResponse::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }
}

