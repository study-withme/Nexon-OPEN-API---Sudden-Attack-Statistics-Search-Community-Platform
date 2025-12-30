package com.example.jokerweb.clan;

import com.example.jokerweb.security.RequireNexonLinked;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/clans")
@RequiredArgsConstructor
@RequireNexonLinked
public class ClanController {

    private final ClanService clanService;

    @PostMapping
    public ResponseEntity<Clan> create(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @RequestBody CreateClanRequest request
    ) {
        Clan clan = clanService.create(authorization, request.getClanName(), request.getBarracksAddress(),
                request.getDescription(), request.getContact());
        return ResponseEntity.ok(clan);
    }

    @GetMapping
    public ResponseEntity<List<Clan>> list() {
        return ResponseEntity.ok(clanService.list());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Clan> detail(@PathVariable Long id) {
        return ResponseEntity.ok(clanService.detail(id));
    }

    @PostMapping("/{id}/verify")
    public ResponseEntity<ClanVerificationRequest> requestVerification(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @PathVariable Long id,
            @RequestBody VerifyRequest request
    ) {
        return ResponseEntity.ok(clanService.requestVerification(authorization, id, request.getReason()));
    }

    @Data
    public static class CreateClanRequest {
        @NotBlank
        private String clanName;
        @NotBlank
        private String barracksAddress;
        private String description;
        private String contact;
    }

    @Data
    public static class VerifyRequest {
        private String reason;
    }
}
