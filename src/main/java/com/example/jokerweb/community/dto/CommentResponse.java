package com.example.jokerweb.community.dto;

import com.example.jokerweb.community.Comment;
import com.example.jokerweb.common.IpUtils;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CommentResponse {
    private Long id;
    private String content;
    private String author;
    private LocalDateTime createdAt;
    private Boolean deleted;
    private Long parentId;
    private Integer likes;
    private java.util.List<CommentResponse> replies;

    public static CommentResponse from(Comment comment) {
        if (comment == null) {
            throw new IllegalArgumentException("댓글 정보가 없습니다.");
        }
        // parent를 안전하게 접근 (LazyInitializationException 방지)
        Long parentId = null;
        try {
            if (comment.getParent() != null) {
                parentId = comment.getParent().getId();
            }
        } catch (Exception e) {
            // LazyInitializationException 등 예외 발생 시 null로 처리
            parentId = null;
        }
        
        // 익명 댓글인 경우 "익명"으로 표시
        boolean isAnonymous = false;
        boolean hasAuthor = false;
        String authorName = "알 수 없음";
        
        // isAnonymous 필드가 없을 수 있으므로 안전하게 처리
        try {
            Boolean anonymousValue = comment.getIsAnonymous();
            isAnonymous = anonymousValue != null && anonymousValue;
        } catch (Exception e) {
            // isAnonymous 필드가 없는 경우 (마이그레이션 전) false로 처리
            isAnonymous = false;
        }
        
        // author 존재 여부 확인 (로그인 여부 판단)
        try {
            hasAuthor = comment.getAuthor() != null && comment.getAuthor().getNickname() != null;
        } catch (Exception e) {
            hasAuthor = false;
        }
        
        // author가 null인 경우 비로그인 사용자
        boolean isGuest = false;
        try {
            if (comment.getAuthor() == null) {
                isGuest = true;
                String ip = comment.getAuthorIp();
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
                            authorName = "익명";
                        }
                    }
                } else {
                    authorName = "익명";
                }
            } else if (!isAnonymous) {
                try {
                    authorName = comment.getAuthor().getNickname();
                } catch (Exception e) {
                    authorName = "알 수 없음";
                }
            } else {
                // 익명 댓글인 경우 (로그인 사용자)
                authorName = "익명";
            }
        } catch (Exception e) {
            authorName = "알 수 없음";
        }
        
        return CommentResponse.builder()
                .id(comment.getId())
                .content(comment.getContent() != null ? comment.getContent() : "")
                .author(authorName)
                .createdAt(comment.getCreatedAt())
                .deleted(comment.getIsDeleted() != null ? comment.getIsDeleted() : false)
                .parentId(parentId)
                .likes(comment.getLikes() != null ? comment.getLikes() : 0)
                .replies(java.util.Collections.emptyList())
                .build();
    }
    
    public static CommentResponse from(Comment comment, java.util.List<CommentResponse> replies) {
        if (comment == null) {
            throw new IllegalArgumentException("댓글 정보가 없습니다.");
        }
        // parent를 안전하게 접근 (LazyInitializationException 방지)
        Long parentId = null;
        try {
            if (comment.getParent() != null) {
                parentId = comment.getParent().getId();
            }
        } catch (Exception e) {
            // LazyInitializationException 등 예외 발생 시 null로 처리
            parentId = null;
        }
        
        // 익명 댓글인 경우 "익명"으로 표시
        boolean isAnonymous = false;
        boolean hasAuthor = false;
        String authorName = "알 수 없음";
        
        // isAnonymous 필드가 없을 수 있으므로 안전하게 처리
        try {
            Boolean anonymousValue = comment.getIsAnonymous();
            isAnonymous = anonymousValue != null && anonymousValue;
        } catch (Exception e) {
            // isAnonymous 필드가 없는 경우 (마이그레이션 전) false로 처리
            isAnonymous = false;
        }
        
        // author 존재 여부 확인 (로그인 여부 판단)
        try {
            hasAuthor = comment.getAuthor() != null && comment.getAuthor().getNickname() != null;
        } catch (Exception e) {
            hasAuthor = false;
        }
        
        // author가 null인 경우 비로그인 사용자
        boolean isGuest = false;
        try {
            if (comment.getAuthor() == null) {
                isGuest = true;
                String ip = comment.getAuthorIp();
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
                            authorName = "익명";
                        }
                    }
                } else {
                    authorName = "익명";
                }
            } else if (!isAnonymous) {
                try {
                    authorName = comment.getAuthor().getNickname();
                } catch (Exception e) {
                    authorName = "알 수 없음";
                }
            } else {
                // 익명 댓글인 경우 (로그인 사용자)
                authorName = "익명";
            }
        } catch (Exception e) {
            authorName = "알 수 없음";
        }
        
        return CommentResponse.builder()
                .id(comment.getId())
                .content(comment.getContent() != null ? comment.getContent() : "")
                .author(authorName)
                .createdAt(comment.getCreatedAt())
                .deleted(comment.getIsDeleted() != null ? comment.getIsDeleted() : false)
                .parentId(parentId)
                .likes(comment.getLikes() != null ? comment.getLikes() : 0)
                .replies(replies != null ? replies : java.util.Collections.emptyList())
                .build();
    }
}
