package com.example.jokerweb.security;

import com.example.jokerweb.admin.role.MemberRole;
import com.example.jokerweb.admin.role.MemberRoleRepository;
import com.example.jokerweb.member.Member;
import com.example.jokerweb.member.MemberRepository;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenService tokenService;
    private final MemberRepository memberRepository;
    private final MemberRoleRepository memberRoleRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (StringUtils.hasText(authHeader) && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring("Bearer ".length());
            try {
                Claims claims = tokenService.parse(token);
                Long memberId = Long.parseLong(claims.getSubject());
                Optional<Member> memberOpt = memberRepository.findById(memberId);
                memberOpt.ifPresent(member -> {
                    List<SimpleGrantedAuthority> authorities = resolveAuthorities(member.getId());
                    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                            String.valueOf(member.getId()),
                            null,
                            authorities
                    );
                    authentication.setDetails(member);
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                });
            } catch (Exception ignored) {
                // 토큰 파싱 실패 시 인증 없이 진행, Controller에서 인증 요구시 401 처리
            }
        }
        filterChain.doFilter(request, response);
    }

    private List<SimpleGrantedAuthority> resolveAuthorities(Long memberId) {
        Set<String> roles = new HashSet<>();
        // 기본 사용자 롤
        roles.add("USER");

        // roleEntity.name 과 role 문자열 컬럼을 모두 존중
        List<MemberRole> activeRoles = memberRoleRepository.findActiveRolesByMemberId(memberId);
        for (MemberRole mr : activeRoles) {
            if (mr.getRoleEntity() != null && mr.getRoleEntity().getName() != null) {
                roles.add(mr.getRoleEntity().getName());
            }
            if (mr.getRole() != null && !mr.getRole().isBlank()) {
                roles.add(mr.getRole());
            }
        }

        return roles.stream()
                .map(String::toUpperCase)
                .map(r -> r.startsWith("ROLE_") ? r : "ROLE_" + r)
                .map(SimpleGrantedAuthority::new)
                .toList();
    }
}
