package com.example.jokerweb.community;

import com.example.jokerweb.admin.service.AuthorizationService;
import com.example.jokerweb.auth.AuthService;
import com.example.jokerweb.community.dto.PostCreateRequest;
import com.example.jokerweb.member.Member;
import com.example.jokerweb.member.MemberRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PostServiceTest {
    
    @Mock
    private PostRepository postRepository;
    
    @Mock
    private CommentRepository commentRepository;
    
    @Mock
    private AuthService authService;
    
    @Mock
    private PasswordEncoder passwordEncoder;
    
    @Mock
    private AuthorizationService authorizationService;
    
    @Mock
    private MemberRepository memberRepository;
    
    @InjectMocks
    private PostService postService;
    
    private Member testMember;
    private PostCreateRequest validRequest;
    
    @BeforeEach
    void setUp() {
        testMember = new Member();
        testMember.setId(1L);
        testMember.setEmail("test@example.com");
        testMember.setNickname("테스트");
        
        validRequest = new PostCreateRequest();
        validRequest.setCategory("free");
        validRequest.setTitle("테스트 제목");
        validRequest.setContent("테스트 내용");
        validRequest.setAnonymous(false);
    }
    
    @Test
    void testCreatePostWithXssContent() {
        // XSS 공격 시도
        validRequest.setContent("<script>alert('XSS')</script>안전한 내용");
        
        when(authService.authenticate(any())).thenReturn(Optional.of(testMember));
        when(passwordEncoder.encode(any())).thenReturn("hashed");
        when(postRepository.save(any(Post.class))).thenAnswer(invocation -> {
            Post post = invocation.getArgument(0);
            post.setId(1L);
            return post;
        });
        when(commentRepository.countByPostIdAndIsDeletedFalse(anyLong())).thenReturn(0L);
        
        // 서비스 호출
        var result = assertDoesNotThrow(() -> 
                postService.create("Bearer token", validRequest, "127.0.0.1")
        );
        
        // 스크립트 태그가 제거되었는지 확인
        verify(postRepository).save(argThat(post -> 
                !post.getContent().contains("<script>")
        ));
    }
    
    @Test
    void testCreatePostWithValidContent() {
        validRequest.setContent("<p>안전한 HTML 내용</p>");
        
        when(authService.authenticate(any())).thenReturn(Optional.of(testMember));
        when(postRepository.save(any(Post.class))).thenAnswer(invocation -> {
            Post post = invocation.getArgument(0);
            post.setId(1L);
            return post;
        });
        when(commentRepository.countByPostIdAndIsDeletedFalse(anyLong())).thenReturn(0L);
        
        assertDoesNotThrow(() -> 
                postService.create("Bearer token", validRequest, "127.0.0.1")
        );
        
        verify(postRepository, times(1)).save(any(Post.class));
    }
}
