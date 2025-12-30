package com.example.jokerweb.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Map;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class JwtTokenService {

    private final SecretKey secretKey;
    private final long accessTokenSeconds;

    public JwtTokenService(
            @Value("${security.jwt.secret:TEST_JWT_SECRET_012345678901234567890}") String secret,
            @Value("${security.jwt.access-token-seconds:2592000}") long accessTokenSeconds
    ) {
        this.secretKey = Keys.hmacShaKeyFor(ensureLength(secret).getBytes(StandardCharsets.UTF_8));
        this.accessTokenSeconds = accessTokenSeconds;
    }

    public String generateToken(Long memberId, String email) {
        return generateToken(memberId, email, java.util.List.of("USER"));
    }

    public String generateToken(Long memberId, String email, java.util.List<String> roles) {
        Instant now = Instant.now();
        Instant exp = now.plusSeconds(accessTokenSeconds);
        return Jwts.builder()
                .setSubject(String.valueOf(memberId))
                .addClaims(Map.of(
                        "email", email,
                        "roles", roles
                ))
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(exp))
                .signWith(secretKey, SignatureAlgorithm.HS256)
                .compact();
    }

    public Claims parse(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(secretKey)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private static String ensureLength(String secret) {
        if (!StringUtils.hasText(secret)) {
            throw new IllegalArgumentException("JWT secret이 설정되지 않았습니다.");
        }
        if (secret.length() >= 32) {
            return secret;
        }
        // 32자 미만이면 뒤를 패딩하여 최소 길이를 맞춘다.
        StringBuilder sb = new StringBuilder(secret);
        while (sb.length() < 32) {
            sb.append('0');
        }
        return sb.toString();
    }
}
