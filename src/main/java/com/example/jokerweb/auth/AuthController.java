package com.example.jokerweb.auth;

import com.example.jokerweb.common.IpUtils;
import com.example.jokerweb.member.Member;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<MemberResponse> register(@Valid @RequestBody RegisterRequest request) {
        Member member = authService.register(request);
        List<String> roles = authService.getActiveRoleNames(member.getId());
        return ResponseEntity.ok(MemberResponse.from(member, roles));
    }

    @GetMapping("/check-email")
    public ResponseEntity<AvailabilityResponse> checkEmail(@jakarta.validation.constraints.Email @org.springframework.web.bind.annotation.RequestParam String email) {
        boolean available = authService.checkEmailAvailability(email);
        return ResponseEntity.ok(
                new AvailabilityResponse(
                        available,
                        available
                                ? "?? ??? ??????."
                                : "?? ?? ?? ??????."
                )
        );
    }

    @GetMapping("/check-nickname")
    public ResponseEntity<AvailabilityResponse> checkNickname(@org.springframework.web.bind.annotation.RequestParam String nickname) {
        boolean available = authService.checkNicknameAvailability(nickname);
        return ResponseEntity.ok(
                new AvailabilityResponse(
                        available,
                        available
                                ? "?? ??? ??????."
                                : "?? ?? ?? ??????."
                )
        );
    }

    @GetMapping("/check-ouid")
    public ResponseEntity<AvailabilityResponse> checkOuid(@org.springframework.web.bind.annotation.RequestParam(required = false) String ouid) {
        boolean available = authService.checkOuidAvailability(ouid);
        return ResponseEntity.ok(
                new AvailabilityResponse(
                        available,
                        available
                                ? "?? ??? OUID???."
                                : "?? ??? OUID???."
                )
        );
    }

    @lombok.Getter
    @lombok.AllArgsConstructor
    public static class AvailabilityResponse {
        private boolean available;
        private String message;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        String clientIp = extractClientIp(httpRequest);
        return ResponseEntity.ok(authService.login(request, clientIp));
    }

    private String extractClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        String xRealIp = request.getHeader("X-Real-IP");
        String remoteAddr = request.getRemoteAddr();
        // IPv4만 추출 (IPv6는 무시)
        return IpUtils.extractClientIp(xForwardedFor, xRealIp, remoteAddr);
    }

    @PostMapping("/link-nexon")
    public ResponseEntity<MemberResponse> linkNexon(
            @RequestHeader(name = "Authorization") String authorization,
            @Valid @RequestBody LinkNexonRequest request
    ) {
        return authService.linkNexon(authorization, request)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(401).build());
    }

    @GetMapping("/me")
    public ResponseEntity<MemberResponse> me(@RequestHeader(name = "Authorization", required = false) String authorization) {
        return authService.authenticateWithRoles(authorization)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(401).build());
    }
}

