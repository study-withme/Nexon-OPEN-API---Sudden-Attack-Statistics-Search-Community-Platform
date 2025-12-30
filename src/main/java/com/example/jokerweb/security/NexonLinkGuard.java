package com.example.jokerweb.security;

import com.example.jokerweb.member.Member;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
@RequiredArgsConstructor
public class NexonLinkGuard implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if (!(handler instanceof HandlerMethod method)) {
            return true;
        }
        
        String requestURI = request.getRequestURI();
        String methodName = request.getMethod();
        
        // 게시글 조회(GET)와 익명 게시글/댓글 작성(POST)은 인증 없이도 접근 가능
        if (requestURI != null && requestURI.startsWith("/api/posts")) {
            if ("GET".equals(methodName)) {
                // GET /api/posts, GET /api/posts/{id}, GET /api/posts/{id}/comments 모두 허용
                return true;
            }
            // GET /api/posts/rules도 허용
            if (requestURI.endsWith("/rules") && "GET".equals(methodName)) {
                return true;
            }
            // POST /api/posts (익명 게시글 작성) 허용
            if ("POST".equals(methodName) && requestURI.equals("/api/posts")) {
                return true;
            }
            // POST /api/posts/{id}/comments (익명 댓글 작성) 허용
            if ("POST".equals(methodName) && requestURI.matches("/api/posts/\\d+/comments")) {
                return true;
            }
        }
        
        boolean annotated = method.hasMethodAnnotation(RequireNexonLinked.class)
                || method.getBeanType().isAnnotationPresent(RequireNexonLinked.class);
        if (!annotated) {
            return true;
        }
        
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        Object principal = auth != null ? auth.getDetails() : null;
        if (principal instanceof Member member) {
            if (member.isNexonLinked()) {
                return true;
            }
        }
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.getWriter().write("NEXON_LINK_REQUIRED");
        return false;
    }
}
