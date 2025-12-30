package com.example.jokerweb.community.dto;

import com.example.jokerweb.community.Post;
import com.example.jokerweb.admin.service.AuthorizationService;
import com.example.jokerweb.common.IpUtils;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PostResponse {
    private Long id;
    private String category;
    private String title;
    private String content;
    private String author;
    private Boolean authorIsAdmin;
    private Integer views;
    private Integer likes;
    private Boolean notice;
    private Boolean pinned;
    private Long commentCount;
    private LocalDateTime createdAt;

    public static PostResponse from(Post post, long commentCount) {
        return from(post, commentCount, null, null);
    }
    
    public static PostResponse from(Post post, long commentCount, Long currentUserId) {
        return from(post, commentCount, currentUserId, null);
    }
    
    public static PostResponse from(Post post, long commentCount, Long currentUserId, AuthorizationService authorizationService) {
        if (post == null) {
            throw new IllegalArgumentException("게시글 정보가 없습니다.");
        }
        
        // author를 안전하게 접근 (LazyInitializationException 방지)
        // 익명 게시글인 경우 작성자 본인도 포함하여 모두 "익명"으로 표시
        String authorName = "알 수 없음";
        boolean isAnonymous = false;
        
        // isAnonymous 필드가 없을 수 있으므로 안전하게 처리
        try {
            Boolean anonymousValue = post.getIsAnonymous();
            isAnonymous = anonymousValue != null && anonymousValue;
        } catch (Exception e) {
            // isAnonymous 필드가 없는 경우 (마이그레이션 전) false로 처리
            isAnonymous = false;
        }
        
        // 익명 게시글인 경우, 작성자 본인도 포함하여 모두 "익명"으로 표시
        boolean authorIsAdmin = false;
        boolean isGuest = false;
        
        try {
            if (post.getAuthor() == null) {
                // 비로그인 사용자
                isGuest = true;
                String ip = post.getAuthorIp();
                if (ip != null && !ip.isEmpty()) {
                    String blurredIp = IpUtils.blurIp(ip);
                    if (blurredIp != null && !blurredIp.isEmpty()) {
                        authorName = "익명(" + blurredIp + ")";
                    } else {
                        // IP 마스킹 실패 시 원본 IP의 앞 두 옥텟만 표시
                        String[] parts = ip.split("\\.");
                        if (parts.length >= 2) {
                            authorName = "익명(" + parts[0] + "." + parts[1] + ".xxx.xxx)";
                        } else {
                            // IP 형식이 이상한 경우에도 원본 IP 표시 시도
                            authorName = "익명(" + ip + ")";
                        }
                    }
                } else {
                    // IP가 없는 경우 (기존 게시글 등)
                    authorName = "익명";
                }
            } else if (isAnonymous) {
                authorName = "익명";
            } else {
                String nickname = post.getAuthor().getNickname();
                if (nickname != null && !nickname.isEmpty()) {
                    authorName = nickname;
                }
                // 작성자가 관리자인지 확인
                if (authorizationService != null) {
                    try {
                        authorIsAdmin = authorizationService.hasRole(post.getAuthor().getId(), "ADMIN");
                    } catch (Exception e) {
                        // 관리자 확인 실패 시 false로 처리
                        authorIsAdmin = false;
                    }
                }
            }
        } catch (Exception e) {
            // LazyInitializationException 등 예외 발생 시 기본값 사용
            authorName = "알 수 없음";
        }
        
        return PostResponse.builder()
                .id(post.getId())
                .category(post.getCategory() != null ? post.getCategory() : "")
                .title(post.getTitle() != null ? post.getTitle() : "")
                .content(post.getContent() != null ? post.getContent() : "")
                .author(authorName)
                .authorIsAdmin(authorIsAdmin)
                .views(post.getViews() != null ? post.getViews() : 0)
                .likes(post.getLikes() != null ? post.getLikes() : 0)
                .notice(post.getIsNotice() != null ? post.getIsNotice() : false)
                .pinned(post.getIsPinned() != null ? post.getIsPinned() : false)
                .commentCount(commentCount)
                .createdAt(post.getCreatedAt())
                .build();
    }
}
