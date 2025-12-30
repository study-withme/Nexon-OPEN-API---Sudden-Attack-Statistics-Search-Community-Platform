package com.example.jokerweb.community;

import com.example.jokerweb.auth.AuthService;
import com.example.jokerweb.community.dto.BoardRuleResponse;
import com.example.jokerweb.community.dto.CommentCreateRequest;
import com.example.jokerweb.community.dto.CommentResponse;
import com.example.jokerweb.community.dto.LikeStatusResponse;
import com.example.jokerweb.community.dto.PostCreateRequest;
import com.example.jokerweb.community.dto.PostResponse;
import com.example.jokerweb.member.Member;
import com.example.jokerweb.security.RequireNexonLinked;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;
    private final AuthService authService;

    @PostMapping
    public ResponseEntity<PostResponse> create(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @Valid @RequestBody PostCreateRequest request,
            HttpServletRequest httpRequest
    ) {
        String clientIp = extractClientIp(httpRequest);
        return ResponseEntity.ok(postService.create(authorization, request, clientIp));
    }

    @GetMapping
    public ResponseEntity<List<PostResponse>> list(
            @RequestParam(value = "category", required = false) String category
    ) {
        return ResponseEntity.ok(postService.list(category));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PostResponse> detail(
            @PathVariable Long id,
            @RequestHeader(name = "Authorization", required = false) String authorization,
            HttpServletRequest request
    ) {
        String clientIp = extractClientIp(request);
        Long memberId = getCurrentMemberId(authorization);
        return ResponseEntity.ok(postService.detail(id, clientIp, memberId));
    }

    @PutMapping("/{id}")
    @RequireNexonLinked
    public ResponseEntity<PostResponse> update(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @PathVariable Long id,
            @Valid @RequestBody com.example.jokerweb.community.dto.PostUpdateRequest request
    ) {
        return ResponseEntity.ok(postService.updatePost(authorization, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @PathVariable Long id,
            @RequestBody(required = false) com.example.jokerweb.community.dto.PostDeleteRequest request
    ) {
        String password = request != null ? request.getPassword() : null;
        postService.deletePost(authorization, id, password);
        return ResponseEntity.ok().build();
    }

    /**
     * 비로그인(게스트) 게시글 수정용 엔드포인트
     * Authorization 없이 비밀번호로만 인증한다.
     */
    @PutMapping("/{id}/anonymous")
    public ResponseEntity<PostResponse> updateAnonymous(
            @PathVariable Long id,
            @Valid @RequestBody com.example.jokerweb.community.dto.PostUpdateRequest request
    ) {
        return ResponseEntity.ok(postService.updatePostAsGuest(id, request));
    }
    
    // 클라이언트 IP 추출 (IpUtils 사용)
    private String extractClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        String xRealIp = request.getHeader("X-Real-IP");
        String remoteAddr = request.getRemoteAddr();
        String extractedIp = com.example.jokerweb.common.IpUtils.extractClientIp(xForwardedFor, xRealIp, remoteAddr);
        // IP 추출 디버깅 로그
        if (extractedIp == null || extractedIp.isEmpty()) {
            org.slf4j.LoggerFactory.getLogger(PostController.class).debug(
                "IP 추출 실패: X-Forwarded-For={}, X-Real-IP={}, remoteAddr={}", 
                xForwardedFor, xRealIp, remoteAddr
            );
        } else {
            org.slf4j.LoggerFactory.getLogger(PostController.class).debug(
                "IP 추출 성공: extractedIp={}, X-Forwarded-For={}, X-Real-IP={}, remoteAddr={}", 
                extractedIp, xForwardedFor, xRealIp, remoteAddr
            );
        }
        return extractedIp;
    }
    
    // 현재 로그인한 회원 ID 추출
    private Long getCurrentMemberId(String authorization) {
        try {
            return authService.authenticate(authorization)
                    .map(Member::getId)
                    .orElse(null);
        } catch (Exception e) {
            // 인증 정보가 없거나 오류가 발생한 경우 null 반환
            return null;
        }
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<Void> comment(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @PathVariable Long id,
            @Valid @RequestBody CommentCreateRequest request,
            HttpServletRequest httpRequest
    ) {
        request.setPostId(id);
        String clientIp = extractClientIp(httpRequest);
        postService.addComment(authorization, request, clientIp);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/comments")
    public ResponseEntity<List<CommentResponse>> comments(@PathVariable Long id) {
        return ResponseEntity.ok(postService.listComments(id));
    }

    @PutMapping("/{postId}/comments/{commentId}")
    @RequireNexonLinked
    public ResponseEntity<CommentResponse> updateComment(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @PathVariable Long postId,
            @PathVariable Long commentId,
            @Valid @RequestBody com.example.jokerweb.community.dto.CommentUpdateRequest request
    ) {
        return ResponseEntity.ok(postService.updateComment(authorization, postId, commentId, request));
    }

    @DeleteMapping("/{postId}/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @PathVariable Long postId,
            @PathVariable Long commentId,
            @RequestBody(required = false) com.example.jokerweb.community.dto.CommentDeleteRequest request
    ) {
        String password = request != null ? request.getPassword() : null;
        postService.deleteComment(authorization, postId, commentId, password);
        return ResponseEntity.ok().build();
    }

    // 게시글 신고
    @PostMapping("/{id}/report")
    @RequireNexonLinked
    public ResponseEntity<Void> reportPost(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @PathVariable Long id,
            @Valid @RequestBody com.example.jokerweb.community.dto.ReportRequest request
    ) {
        postService.reportPost(authorization, id, request);
        return ResponseEntity.ok().build();
    }

    // 댓글 신고
    @PostMapping("/{postId}/comments/{commentId}/report")
    @RequireNexonLinked
    public ResponseEntity<Void> reportComment(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @PathVariable Long postId,
            @PathVariable Long commentId,
            @Valid @RequestBody com.example.jokerweb.community.dto.ReportRequest request
    ) {
        postService.reportComment(authorization, postId, commentId, request);
        return ResponseEntity.ok().build();
    }

    // 어드민: 게시글 삭제
    @DeleteMapping("/{id}/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> adminDeletePost(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "") String reason
    ) {
        postService.adminDeletePost(authorization, id, reason);
        return ResponseEntity.ok().build();
    }

    // 어드민: 댓글 삭제
    @DeleteMapping("/{postId}/comments/{commentId}/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> adminDeleteComment(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @PathVariable Long postId,
            @PathVariable Long commentId,
            @RequestParam(required = false, defaultValue = "") String reason
    ) {
        postService.adminDeleteComment(authorization, postId, commentId, reason);
        return ResponseEntity.ok().build();
    }

    // 어드민: 게시글 스팸 처리
    @PostMapping("/{id}/spam")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> markPostAsSpam(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @PathVariable Long id
    ) {
        postService.markPostAsSpam(authorization, id);
        return ResponseEntity.ok().build();
    }

    // 어드민: 댓글 스팸 처리
    @PostMapping("/{postId}/comments/{commentId}/spam")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> markCommentAsSpam(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @PathVariable Long postId,
            @PathVariable Long commentId
    ) {
        postService.markCommentAsSpam(authorization, postId, commentId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/rules")
    public ResponseEntity<List<BoardRuleResponse>> rules() {
        return ResponseEntity.ok(postService.getBoardRules());
    }

    // 게시글 좋아요/비추천 상태 조회
    @GetMapping("/{id}/like-status")
    public ResponseEntity<LikeStatusResponse> getPostLikeStatus(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(postService.getPostLikeStatus(authorization, id));
    }

    // 게시글 좋아요
    @PostMapping("/{id}/like")
    @RequireNexonLinked
    public ResponseEntity<Void> likePost(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @PathVariable Long id
    ) {
        postService.likePost(authorization, id);
        return ResponseEntity.ok().build();
    }

    // 게시글 좋아요 취소
    @DeleteMapping("/{id}/like")
    @RequireNexonLinked
    public ResponseEntity<Void> unlikePost(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @PathVariable Long id
    ) {
        postService.unlikePost(authorization, id);
        return ResponseEntity.ok().build();
    }

    // 게시글 비추천
    @PostMapping("/{id}/dislike")
    @RequireNexonLinked
    public ResponseEntity<Void> dislikePost(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @PathVariable Long id
    ) {
        postService.dislikePost(authorization, id);
        return ResponseEntity.ok().build();
    }

    // 게시글 비추천 취소
    @DeleteMapping("/{id}/dislike")
    @RequireNexonLinked
    public ResponseEntity<Void> undislikePost(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @PathVariable Long id
    ) {
        postService.undislikePost(authorization, id);
        return ResponseEntity.ok().build();
    }

    // 댓글 좋아요/비추천 상태 조회
    @GetMapping("/{postId}/comments/{commentId}/like-status")
    public ResponseEntity<LikeStatusResponse> getCommentLikeStatus(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @PathVariable Long postId,
            @PathVariable Long commentId
    ) {
        return ResponseEntity.ok(postService.getCommentLikeStatus(authorization, postId, commentId));
    }

    // 댓글 좋아요
    @PostMapping("/{postId}/comments/{commentId}/like")
    @RequireNexonLinked
    public ResponseEntity<Void> likeComment(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @PathVariable Long postId,
            @PathVariable Long commentId
    ) {
        postService.likeComment(authorization, postId, commentId);
        return ResponseEntity.ok().build();
    }

    // 댓글 좋아요 취소
    @DeleteMapping("/{postId}/comments/{commentId}/like")
    @RequireNexonLinked
    public ResponseEntity<Void> unlikeComment(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @PathVariable Long postId,
            @PathVariable Long commentId
    ) {
        postService.unlikeComment(authorization, postId, commentId);
        return ResponseEntity.ok().build();
    }

    // 댓글 비추천
    @PostMapping("/{postId}/comments/{commentId}/dislike")
    @RequireNexonLinked
    public ResponseEntity<Void> dislikeComment(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @PathVariable Long postId,
            @PathVariable Long commentId
    ) {
        postService.dislikeComment(authorization, postId, commentId);
        return ResponseEntity.ok().build();
    }

    // 댓글 비추천 취소
    @DeleteMapping("/{postId}/comments/{commentId}/dislike")
    @RequireNexonLinked
    public ResponseEntity<Void> undislikeComment(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @PathVariable Long postId,
            @PathVariable Long commentId
    ) {
        postService.undislikeComment(authorization, postId, commentId);
        return ResponseEntity.ok().build();
    }
}
