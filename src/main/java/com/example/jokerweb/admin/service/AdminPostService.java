package com.example.jokerweb.admin.service;

import com.example.jokerweb.admin.dto.PostDetailResponse;
import com.example.jokerweb.admin.dto.PostListResponse;
import com.example.jokerweb.community.CommentRepository;
import com.example.jokerweb.community.ContentReportRepository;
import com.example.jokerweb.community.Post;
import com.example.jokerweb.community.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AdminPostService {
    
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final ContentReportRepository contentReportRepository;
    
    public Page<PostListResponse> getPosts(
            String category,
            String status,
            String search,
            Pageable pageable
    ) {
        Page<Post> posts;
        
        if (search != null && !search.isEmpty()) {
            posts = postRepository.searchPostsWithAuthor(category, search, pageable);
        } else if (category != null && !category.isEmpty()) {
            posts = postRepository.findByCategoryAndIsDeletedFalseWithAuthor(category, pageable);
        } else {
            posts = postRepository.findByIsDeletedFalseWithAuthor(pageable);
        }
        
        return posts.map(post -> {
            String postStatus = post.getIsDeleted() ? "삭제" :
                               (post.getIsNotice() ? "공지" : "정상");

            Long commentCount = commentRepository.countByPostIdAndIsDeletedFalse(post.getId());
            long reportCount = contentReportRepository.findByTargetTypeAndTargetId("post", post.getId()).size();

            // 작성자 정보가 null 인 게시글 방어 처리 (탈퇴 회원/익명 등)
            String authorName = "(알 수 없음)";
            if (post.getAuthor() != null && post.getAuthor().getNickname() != null) {
                authorName = post.getAuthor().getNickname();
            }

            return PostListResponse.builder()
                    .id(post.getId())
                    .title(post.getTitle())
                    .author(authorName)
                    .category(post.getCategory())
                    .createdAt(post.getCreatedAt())
                    .views(post.getViews())
                    .comments(commentCount != null ? commentCount.intValue() : 0)
                    .likes(post.getLikes())
                    .reports((int) reportCount)
                    .status(postStatus)
                    .build();
        });
    }
    
    public PostDetailResponse getPostDetail(Long postId) {
        Post post = postRepository.findByIdWithAuthor(postId)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다: " + postId));
        
        String status = post.getIsDeleted() ? "삭제" : 
                       (post.getIsNotice() ? "공지" : "정상");
        
        Long commentCount = commentRepository.countByPostIdAndIsDeletedFalse(postId);
        long reportCount = contentReportRepository.findByTargetTypeAndTargetId("post", postId).size();

        String authorName = "(알 수 없음)";
        if (post.getAuthor() != null && post.getAuthor().getNickname() != null) {
            authorName = post.getAuthor().getNickname();
        }
        
        return PostDetailResponse.builder()
                .id(post.getId())
                .title(post.getTitle())
                .content(post.getContent())
                .author(authorName)
                .category(post.getCategory())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .views(post.getViews())
                .comments(commentCount != null ? commentCount.intValue() : 0)
                .likes(post.getLikes())
                .reports((int) reportCount)
                .status(status)
                .build();
    }
    
    @Transactional
    public void hidePost(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다: " + postId));
        // 숨김 처리는 별도 필드 필요하거나 isDeleted 사용
        // 임시로 isDeleted 사용
    }
    
    @Transactional
    public void deletePost(Long postId, String reason) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다: " + postId));
        post.setIsDeleted(true);
        post.setDeletedAt(LocalDateTime.now());
        postRepository.save(post);
    }
    
    @Transactional
    public void restorePost(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다: " + postId));
        post.setIsDeleted(false);
        post.setDeletedAt(null);
        postRepository.save(post);
    }
    
    @Transactional
    public void moveCategory(Long postId, String newCategory) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다: " + postId));
        post.setCategory(newCategory);
        postRepository.save(post);
    }
    
    @Transactional
    public void setFeatured(Long postId, boolean featured) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다: " + postId));
        post.setIsPinned(featured);
        postRepository.save(post);
    }
    
    @Transactional
    public void setNotice(Long postId, boolean notice) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다: " + postId));
        post.setIsNotice(notice);
        postRepository.save(post);
    }
}
