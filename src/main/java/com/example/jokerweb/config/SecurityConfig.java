package com.example.jokerweb.config;

import com.example.jokerweb.logging.AccessLoggingFilter;
import com.example.jokerweb.logging.TraceIdFilter;
import com.example.jokerweb.security.AdminAccessProtectionFilter;
import com.example.jokerweb.security.JwtAuthenticationFilter;
import com.example.jokerweb.security.NexonLinkGuard;
import com.example.jokerweb.security.RateLimitingFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final RateLimitingFilter rateLimitingFilter;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final AccessLoggingFilter accessLoggingFilter;
    private final TraceIdFilter traceIdFilter;
    private final NexonLinkGuard nexonLinkGuard;
    private final AdminAccessProtectionFilter adminAccessProtectionFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/player/**").permitAll()
                        .requestMatchers("/api/sa/**").permitAll() // 전적검색 비회원 접근 허용
                        .requestMatchers("/api/metadata/**").permitAll()
                        .requestMatchers("/api/stats/**").permitAll()
                        .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/trolls/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/trolls/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/posts/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/posts").permitAll() // ?? ??? ?? ??
                        .requestMatchers(HttpMethod.POST, "/api/posts/*/comments").permitAll() // ?? ?? ?? ??
                        .requestMatchers(HttpMethod.POST, "/api/files/upload").permitAll() // ?? ??? ?? (?? ??)
                        .requestMatchers("/api/files/**").authenticated()
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .anyRequest().authenticated()
                )
                .addFilterBefore(rateLimitingFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(traceIdFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterAfter(adminAccessProtectionFilter, JwtAuthenticationFilter.class)
                .addFilterAfter(accessLoggingFilter, AdminAccessProtectionFilter.class);
        return http.build();
    }

    @Bean
    public WebMvcConfigurer webMvcConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addInterceptors(InterceptorRegistry registry) {
                registry.addInterceptor(nexonLinkGuard);
            }
        };
    }
}
