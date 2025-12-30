package com.example.jokerweb.admin.controller;

import com.example.jokerweb.admin.dto.PostDetailResponse;
import com.example.jokerweb.admin.dto.PostListResponse;
import com.example.jokerweb.admin.service.AdminPostService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/posts")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminPostController {
    
    private final AdminPostService postService;
    
    @GetMapping
    public ResponseEntity<Page<PostListResponse>> getPosts(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<PostListResponse> posts = postService.getPosts(category, status, search, pageable);
        return ResponseEntity.ok(posts);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<PostDetailResponse> getPostDetail(@PathVariable Long id) {
        PostDetailResponse post = postService.getPostDetail(id);
        return ResponseEntity.ok(post);
    }
    
    @PostMapping("/{id}/hide")
    public ResponseEntity<Void> hidePost(@PathVariable Long id) {
        postService.hidePost(id);
        return ResponseEntity.ok().build();
    }
    
    @PostMapping("/{id}/delete")
    public ResponseEntity<Void> deletePost(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "") String reason
    ) {
        postService.deletePost(id, reason);
        return ResponseEntity.ok().build();
    }
    
    @PostMapping("/{id}/restore")
    public ResponseEntity<Void> restorePost(@PathVariable Long id) {
        postService.restorePost(id);
        return ResponseEntity.ok().build();
    }
    
    @PostMapping("/{id}/move-category")
    public ResponseEntity<Void> moveCategory(
            @PathVariable Long id,
            @RequestParam String category
    ) {
        postService.moveCategory(id, category);
        return ResponseEntity.ok().build();
    }
    
    @PostMapping("/{id}/set-featured")
    public ResponseEntity<Void> setFeatured(
            @PathVariable Long id,
            @RequestParam boolean featured
    ) {
        postService.setFeatured(id, featured);
        return ResponseEntity.ok().build();
    }
    
    @PostMapping("/{id}/set-notice")
    public ResponseEntity<Void> setNotice(
            @PathVariable Long id,
            @RequestParam boolean notice
    ) {
        postService.setNotice(id, notice);
        return ResponseEntity.ok().build();
    }
}
