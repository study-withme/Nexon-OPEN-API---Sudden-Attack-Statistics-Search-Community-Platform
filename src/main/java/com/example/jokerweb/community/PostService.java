package com.example.jokerweb.community;

import com.example.jokerweb.admin.service.AuthorizationService;
import com.example.jokerweb.auth.AuthService;
import com.example.jokerweb.community.dto.BoardRuleResponse;
import com.example.jokerweb.community.dto.CommentCreateRequest;
import com.example.jokerweb.community.dto.CommentResponse;
import com.example.jokerweb.community.dto.LikeStatusResponse;
import com.example.jokerweb.community.dto.PostCreateRequest;
import com.example.jokerweb.community.dto.PostResponse;
import com.example.jokerweb.community.dto.ReportRequest;
import com.example.jokerweb.member.Member;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.regex.Pattern;
import java.util.concurrent.ConcurrentHashMap;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.Hibernate;
import org.springframework.dao.DataAccessException;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Slf4j
@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final AuthService authService;
    private final AuthorizationService authorizationService;
    private final CategoryRepository categoryRepository;
    private final PostLikeRepository postLikeRepository;
    private final CommentLikeRepository commentLikeRepository;
    private final PostDislikeRepository postDislikeRepository;
    private final CommentDislikeRepository commentDislikeRepository;
    private final ContentReportRepository contentReportRepository;
    private final PostViewHistoryRepository postViewHistoryRepository;
    private final PasswordEncoder passwordEncoder;

    // 조회수 중복 증가 방지를 위한 임시 캐시 (최근 1초 이내 동일 요청 무시)
    private final ConcurrentHashMap<String, Long> viewCountCache = new ConcurrentHashMap<>();
    private static final long VIEW_COUNT_CACHE_TTL = 1000L; // 1초

    private static final Pattern TAG_PATTERN = Pattern.compile("<[^>]*>");
    private static final Pattern IMG_PATTERN = Pattern.compile("<img\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern LINK_PATTERN = Pattern.compile("<a\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern YOUTUBE_PATTERN = Pattern.compile("youtube\\.com|youtu\\.be", Pattern.CASE_INSENSITIVE);
    private static final Pattern TABLE_PATTERN = Pattern.compile("<table\\b", Pattern.CASE_INSENSITIVE);

    private record BoardRule(
            String category,
            String name,
            String description,
            boolean canRead,
            boolean canWrite,
            int minTitleLength,
            int maxTitleLength,
            int minContentLength,
            int maxContentLength,
            int maxMediaCount,
            boolean allowAnonymous,
            boolean allowLinks,
            boolean allowYoutube,
            boolean allowTable,
            boolean allowCodeBlock,
            String notice
    ) {}

    private static final Map<String, BoardRule> BOARD_RULES = Map.of(
            "notice", new BoardRule(
                    "notice",
                    "공지",
                    "서비스 공지 및 필독 안내",
                    true,
                    true,
                    5, 120,
                    20, 4000,
                    2,
                    false,
                    false,
                    false,
                    false,
                    false,
                    "중요 공지는 깔끔하게 관리해주세요."
            ),
            "popular", new BoardRule(
                    "popular",
                    "인기",
                    "좋아요와 조회수가 높은 글 모음",
                    true,
                    false,
                    5, 120,
                    30, 6000,
                    5,
                    true,
                    true,
                    true,
                    true,
                    true,
                    "인기 탭은 자동 집계됩니다."
            ),
            "free", new BoardRule(
                    "free",
                    "자유",
                    "자유로운 소통 공간",
                    true,
                    true,
                    5, 120,
                    10, 8000,
                    5,
                    true,
                    true,
                    true,
                    true,
                    true,
                    "비방, 광고, 저작권 위반 금지"
            ),
            "ranked", new BoardRule(
                    "ranked",
                    "랭크전",
                    "랭크전 정보와 후기 공유",
                    true,
                    true,
                    5, 120,
                    20, 6000,
                    4,
                    true,
                    true,
                    true,
                    true,
                    true,
                    "전략, 스크린샷 위주로 작성"
            ),
            "custom", new BoardRule(
                    "custom",
                    "대룰",
                    "커스텀/대룰 방 모집 및 후기",
                    true,
                    true,
                    5, 120,
                    15, 5000,
                    4,
                    true,
                    true,
                    true,
                    true,
                    true,
                    "모집 글은 시작/종료 시각 명시"
            ),
            "supply", new BoardRule(
                    "supply",
                    "보급",
                    "보급/이벤트 정보 공유",
                    true,
                    true,
                    5, 120,
                    10, 4000,
                    3,
                    true,
                    true,
                    true,
                    true,
                    true,
                    "캡처와 링크로 출처 기재"
            ),
            "duo", new BoardRule(
                    "duo",
                    "듀오",
                    "함께할 팀원/듀오 찾기",
                    true,
                    true,
                    5, 80,
                    5, 3000,
                    3,
                    true,
                    true,
                    false,
                    false,
                    false,
                    "플레이 시간대와 음성 여부 명시"
            )
    );

    @Transactional
    public PostResponse create(String authorization, PostCreateRequest req, String clientIp) {
        try {
        Optional<Member> authorOpt = authService.authenticate(authorization);
        Member author = authorOpt.orElse(null);
        
        String normalizedCategory = req.getCategory() == null ? "" : req.getCategory().toLowerCase();
        BoardRule rule = getRule(normalizedCategory);
        
        // 비로그인 사용자의 경우 익명 작성만 허용
        if (author == null) {
            if (!rule.allowAnonymous()) {
                throw new IllegalArgumentException("이 게시판은 로그인이 필요합니다.");
            }
            // 비로그인 사용자는 비밀번호 필수
            if (!StringUtils.hasText(req.getPassword()) || req.getPassword().length() < 4) {
                throw new IllegalArgumentException("비로그인 게시글 작성 시 비밀번호(4자 이상)를 입력해주세요.");
            }
        } else {
            // 로그인 사용자는 작성 권한 검증
            validateWritePermission(normalizedCategory, rule);
        }
        
        validateContent(req, rule);
        
        // 익명 게시글 여부 확인 (allowAnonymous가 true인 경우에만 허용)
        boolean isAnonymous = Boolean.TRUE.equals(req.getAnonymous()) && rule.allowAnonymous();
        
        // 비로그인 사용자는 항상 익명
        if (author == null) {
            isAnonymous = true;
        }
        
        // XSS 방지를 위한 내용 정제 (위험한 스크립트 태그만 제거, HTML은 유지)
        String sanitizedContent = com.example.jokerweb.common.SecurityUtils.sanitizeScriptTags(req.getContent());
        
        Post.PostBuilder postBuilder = Post.builder()
                .author(author)
                .category(normalizedCategory)
                .title(req.getTitle().trim())
                .content(sanitizedContent)
                .isAnonymous(isAnonymous);
        
        // 비로그인 사용자의 경우 비밀번호 해시와 IP 저장
        if (author == null) {
            String passwordHash = passwordEncoder.encode(req.getPassword());
            postBuilder.passwordHash(passwordHash);
            // IP가 없어도 빈 문자열로 저장하지 않고, 있으면 저장
            if (StringUtils.hasText(clientIp)) {
                postBuilder.authorIp(clientIp);
                log.debug("비로그인 게시글 작성 시 IP 저장: clientIp={}", clientIp);
            } else {
                // IP 추출 실패 시 로그 남기기 (디버깅용)
                log.warn("비로그인 게시글 작성 시 IP 추출 실패: clientIp={}", clientIp);
            }
        }
        
        Post saved = postRepository.save(postBuilder.build());
            try {
        return PostResponse.from(saved, 0L, null, authorizationService);
            } catch (Exception e) {
                log.error("PostResponse 생성 중 오류 발생: postId={}, error={}", saved.getId(), e.getMessage(), e);
                throw new IllegalArgumentException("게시글 응답 생성 중 오류가 발생했습니다: " + e.getMessage(), e);
            }
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            log.error("게시글 생성 중 예상치 못한 오류 발생: error={}", e.getMessage(), e);
            throw new IllegalArgumentException("게시글 생성 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }

    @Transactional(readOnly = true)
    public List<PostResponse> list(String category) {
        String normalized = category == null ? null : category.toLowerCase();
        if ("popular".equals(normalized)) {
            Sort popularSort = Sort.by(
                    Sort.Order.desc("likes"),
                    Sort.Order.desc("views"),
                    Sort.Order.desc("createdAt")
            );
            return postRepository.findByIsDeletedFalse(popularSort).stream()
                    .map(p -> PostResponse.from(p, commentRepository.countByPostIdAndIsDeletedFalse(p.getId()), null, authorizationService))
                    .toList();
        }

        Sort sort = Sort.by(
                Sort.Order.desc("isPinned"),
                Sort.Order.desc("isNotice"),
                Sort.Order.desc("createdAt")
        );
        List<Post> posts = (normalized == null || normalized.isBlank())
                ? postRepository.findByIsDeletedFalse(sort)
                : postRepository.findByCategoryAndIsDeletedFalse(normalized, sort);
        return posts.stream()
                .map(p -> PostResponse.from(p, commentRepository.countByPostIdAndIsDeletedFalse(p.getId()), null, authorizationService))
                .toList();
    }

    @Transactional(readOnly = true)
    public PostResponse detail(Long id, String clientIp, Long memberId) {
        try {
            // 게시글 조회 (fetch join으로 author를 함께 로드)
            Post post = null;
            try {
                post = postRepository.findByIdWithAuthor(id)
                        .orElse(null);
            } catch (Exception e) {
                log.warn("findByIdWithAuthor 실패, 일반 findById 시도: postId={}, error={}", id, e.getMessage());
            }
            
            // fetch join 실패 시 일반 findById 사용
            if (post == null) {
                post = postRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
                
                // author를 명시적으로 초기화 (LazyInitializationException 방지)
                try {
                    if (post.getAuthor() != null) {
                        // Hibernate를 사용하여 author 초기화
                        Hibernate.initialize(post.getAuthor());
                    }
                } catch (Exception e) {
                    log.warn("author 초기화 중 오류 발생 (무시하고 계속 진행): postId={}, error={}", id, e.getMessage());
                }
            }
            
            if (post == null) {
                throw new IllegalArgumentException("게시글을 찾을 수 없습니다.");
            }
            
            if (Boolean.TRUE.equals(post.getIsDeleted())) {
                throw new IllegalArgumentException("삭제된 게시글입니다.");
            }
            
            // 읽기 권한 검증 (예외 발생 시에도 계속 진행하지 않음)
            try {
            validateReadPermission(post);
            } catch (IllegalArgumentException e) {
                // 읽기 권한이 없는 경우 예외를 다시 던짐
                throw e;
            } catch (Exception e) {
                // 기타 예외는 로그만 남기고 계속 진행 (기본적으로 읽기 허용)
                log.warn("읽기 권한 검증 중 오류 발생 (무시하고 계속 진행): postId={}, error={}", id, e.getMessage());
            }
            
            long commentCount = commentRepository.countByPostIdAndIsDeletedFalse(post.getId());
            
            // PostResponse 생성
            PostResponse response;
            try {
                // 현재 사용자 ID 전달 (익명 게시글 처리용)
                response = PostResponse.from(post, commentCount, memberId, authorizationService);
            } catch (Exception e) {
                // PostResponse 생성 실패 시 상세한 오류 메시지와 함께 예외 발생
                log.error("PostResponse 생성 중 오류 발생: postId={}, error={}", id, e.getMessage(), e);
                throw new IllegalArgumentException("게시글 응답 생성 중 오류가 발생했습니다: " + e.getMessage(), e);
            }
            
            // 조회수 증가는 별도 트랜잭션에서 처리 (비동기)
            try {
                incrementViewCountAsync(id, clientIp, memberId);
            } catch (Exception e) {
                // 조회수 증가 실패해도 게시글은 반환 (조회수만 증가하지 않음)
                log.warn("조회수 증가 중 오류 발생 (무시하고 계속 진행): postId={}, error={}", id, e.getMessage());
            }
            
            return response;
        } catch (IllegalArgumentException e) {
            // 명시적인 예외는 다시 던짐
            throw e;
        } catch (Exception e) {
            // 기타 예외는 로그를 남기고 IllegalArgumentException으로 변환
            log.error("게시글 조회 중 예상치 못한 오류 발생: postId={}, error={}", id, e.getMessage(), e);
            throw new IllegalArgumentException("게시글을 불러오는 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }
    
    // 기존 detail 메서드 호환성 유지 (클라이언트 IP와 회원 ID가 없는 경우)
    @Transactional(readOnly = true)
    public PostResponse detail(Long id) {
        return detail(id, null, null);
    }
    
    // 조회 기록 확인 (24시간 이내 중복 조회 방지)
    private boolean isAlreadyViewed(Long postId, String clientIp, Long memberId) {
        if (postId == null) {
            return false;
        }
        
        try {
            LocalDateTime oneDayAgo = LocalDateTime.now().minusDays(1);
            
            // IP 주소가 없으면 조회 불가능 (조회수 증가 허용)
            if (clientIp == null || clientIp.isBlank()) {
                return false;
            }
            
            // 회원인 경우: memberId와 IP 주소로 정교하게 추적
            if (memberId != null && memberId > 0) {
                // 1. 정확한 복합 키로 조회 (memberId + IP)
                PostViewHistory.PostViewHistoryId id = new PostViewHistory.PostViewHistoryId();
                id.setPostId(postId);
                id.setMemberId(memberId);
                id.setIpAddress(clientIp);
                
                Optional<PostViewHistory> existing = postViewHistoryRepository.findById(id);
                if (existing.isPresent()) {
                    PostViewHistory history = existing.get();
                    return history.getViewedAt().isAfter(oneDayAgo);
                }
                
                // 2. 같은 회원이 다른 IP에서 조회한 경우도 확인 (24시간 이내)
                Optional<PostViewHistory> existingByMember = postViewHistoryRepository
                    .findByPostIdAndMemberIdAndViewedAtAfter(postId, memberId, oneDayAgo);
                if (existingByMember.isPresent()) {
                    return true;
                }
            } else {
                // 익명 사용자인 경우: IP 주소로만 추적 (memberId = 0, 실제 IP 주소 저장)
                PostViewHistory.PostViewHistoryId id = new PostViewHistory.PostViewHistoryId();
                id.setPostId(postId);
                id.setMemberId(0L);
                id.setIpAddress(clientIp);
                
                Optional<PostViewHistory> existing = postViewHistoryRepository.findById(id);
                if (existing.isPresent()) {
                    PostViewHistory history = existing.get();
                    return history.getViewedAt().isAfter(oneDayAgo);
                }
                
                // 같은 IP에서 조회한 경우 확인 (익명 사용자용)
                Optional<PostViewHistory> existingByIp = postViewHistoryRepository
                    .findByPostIdAndIpAddressAndViewedAtAfterForAnonymous(postId, clientIp, oneDayAgo);
                if (existingByIp.isPresent()) {
                    return true;
                }
            }
        } catch (Exception e) {
            // 테이블이 없거나 조회 실패 시 false 반환 (조회수 증가 허용)
            return false;
        }
        
        return false;
    }
    
    // 조회수 증가 (별도 트랜잭션)
    // 요청이 들어올 때마다 무조건 1씩 증가시킨다.
    // 단, 동일한 요청이 1초 이내에 중복으로 들어오는 경우는 무시한다.
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public void incrementViewCountAsync(Long postId, String clientIp, Long memberId) {
        if (postId == null) {
            return;
        }
        
        // 중복 요청 방지: postId + clientIp + memberId 조합으로 캐시 키 생성
        String cacheKey = postId + ":" + (clientIp != null ? clientIp : "unknown") + ":" + (memberId != null ? memberId : "0");
        long currentTime = System.currentTimeMillis();
        
        // 캐시에 존재하고 1초 이내인 경우 중복 요청으로 간주하고 무시
        Long lastViewTime = viewCountCache.get(cacheKey);
        if (lastViewTime != null && (currentTime - lastViewTime) < VIEW_COUNT_CACHE_TTL) {
            log.debug("중복 조회수 증가 요청 무시: postId={}, clientIp={}, memberId={}, interval={}ms", 
                    postId, clientIp, memberId, currentTime - lastViewTime);
            return;
        }
        
        try {
            int updated = postRepository.incrementViews(postId);
            if (updated == 0) {
                log.warn("조회수 증가 실패: 게시글을 찾을 수 없거나 삭제됨. postId={}", postId);
            } else {
                // 조회수 증가 성공 시 캐시에 타임스탬프 저장
                viewCountCache.put(cacheKey, currentTime);
                log.debug("조회수 증가 완료: postId={}, clientIp={}, memberId={}", postId, clientIp, memberId);
            }
        } catch (Exception e) {
            // 조회수 증가 실패는 무시 (로그만 남김)
            log.warn("조회수 증가 중 오류 발생: postId={}, error={}", postId, e.getMessage(), e);
        }
        
        // 오래된 캐시 항목 정리 (메모리 누수 방지)
        if (viewCountCache.size() > 10000) {
            long cutoffTime = currentTime - VIEW_COUNT_CACHE_TTL;
            viewCountCache.entrySet().removeIf(entry -> entry.getValue() < cutoffTime);
        }
    }
    
    // 조회 기록 저장 시도 (성공 여부 반환)
    // 동시 요청 시 데이터베이스 PRIMARY KEY 제약조건으로 중복 방지
    // 저장이 성공하면 true, 실패하면(중복이면) false 반환
    private boolean trySaveViewRecord(Long postId, String clientIp, Long memberId) {
        if (postId == null || clientIp == null || clientIp.isBlank()) {
            return false;
        }
        
        try {
            // 회원인 경우: 실제 memberId와 실제 IP 주소 저장
            // 익명 사용자인 경우: memberId = 0, 실제 IP 주소 저장
            Long finalMemberId = (memberId != null && memberId > 0) ? memberId : 0L;
            
            // 조회 기록 저장 (새로운 기록 생성)
            // 동시 요청 시 PRIMARY KEY 제약조건에 의해 중복 저장이 자동으로 방지됨
            PostViewHistory viewHistory = PostViewHistory.builder()
                .postId(postId)
                .memberId(finalMemberId)
                .ipAddress(clientIp) // 실제 IP 주소 저장
                .viewedAt(LocalDateTime.now())
                .build();
            
            postViewHistoryRepository.save(viewHistory);
            return true; // 저장 성공 (중복이 아님)
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            // 중복 키 오류 (동시 요청으로 인한 중복 저장 시도)
            // 데이터베이스 PRIMARY KEY 제약조건에 의해 자동으로 방지됨
            // 또는 이미 조회 기록이 존재하는 경우
            log.debug("중복 조회 기록 저장 시도 (무시): postId={}, clientIp={}, memberId={}", postId, clientIp, memberId);
            return false;
        } catch (Exception e) {
            // 테이블이 없거나 저장 실패 시
            log.debug("조회 기록 저장 중 오류 발생: postId={}, error={}", postId, e.getMessage());
            return false;
        }
    }

    @Transactional
    public void addComment(String authorization, CommentCreateRequest req, String clientIp) {
        Optional<Member> authorOpt = authService.authenticate(authorization);
        Member author = authorOpt.orElse(null);
        
        Post post = postRepository.findById(req.getPostId())
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        if (Boolean.TRUE.equals(post.getIsDeleted())) {
            throw new IllegalArgumentException("삭제된 게시글에는 댓글을 작성할 수 없습니다.");
        }
        
        // 게시판 규칙 확인 (익명 댓글 허용 여부)
        BoardRule rule = getRule(post.getCategory());
        
        // 비로그인 사용자의 경우 익명 작성만 허용
        if (author == null) {
            if (!rule.allowAnonymous()) {
                throw new IllegalArgumentException("이 게시판은 로그인이 필요합니다.");
            }
        }
        
        boolean isAnonymous = Boolean.TRUE.equals(req.getAnonymous()) && rule.allowAnonymous();
        
        // 비로그인 사용자는 항상 익명
        if (author == null) {
            isAnonymous = true;
        }
        
        Comment.CommentBuilder commentBuilder = Comment.builder()
                .author(author)
                .post(post)
                .content(req.getContent())
                .isAnonymous(isAnonymous);
        
        // 비로그인 사용자의 경우 비밀번호 해시와 IP 저장
        if (author == null) {
            // 비로그인 댓글은 비밀번호 선택사항 (게시글과 달리)
            if (StringUtils.hasText(req.getPassword()) && req.getPassword().length() >= 4) {
                String passwordHash = passwordEncoder.encode(req.getPassword());
                commentBuilder.passwordHash(passwordHash);
            }
            // IP가 없어도 빈 문자열로 저장하지 않고, 있으면 저장
            if (StringUtils.hasText(clientIp)) {
                commentBuilder.authorIp(clientIp);
            } else {
                // IP 추출 실패 시 로그 남기기 (디버깅용)
                log.warn("비로그인 댓글 작성 시 IP 추출 실패: clientIp={}", clientIp);
            }
        }
        
        // 대댓글인 경우 부모 댓글 설정
        if (req.getParentId() != null) {
            Comment parent = commentRepository.findById(req.getParentId())
                    .orElseThrow(() -> new IllegalArgumentException("부모 댓글을 찾을 수 없습니다."));
            if (!Objects.equals(parent.getPost().getId(), post.getId())) {
                throw new IllegalArgumentException("부모 댓글이 해당 게시글의 댓글이 아닙니다.");
            }
            if (Boolean.TRUE.equals(parent.getIsDeleted())) {
                throw new IllegalArgumentException("삭제된 댓글에는 답글을 작성할 수 없습니다.");
            }
            commentBuilder.parent(parent);
        }
        
        commentRepository.save(commentBuilder.build());
    }

    @Transactional(readOnly = true)
    public List<CommentResponse> listComments(Long postId) {
        if (postId == null) {
            throw new IllegalArgumentException("게시글 ID가 필요합니다.");
        }
        
        try {
            Post post = postRepository.findById(postId)
                    .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
            if (Boolean.TRUE.equals(post.getIsDeleted())) {
                throw new IllegalArgumentException("삭제된 게시글입니다.");
            }
            
            // 읽기 권한 검증 (category 테이블이 없어도 작동하도록 안전하게 처리)
            try {
                validateReadPermission(post);
            } catch (IllegalArgumentException e) {
                // 읽기 권한이 없는 경우 예외를 다시 던짐
                throw e;
            } catch (DataAccessException e) {
                // 데이터베이스 오류 (category 테이블이 없는 경우 등)는 무시하고 계속 진행
                log.debug("읽기 권한 검증 중 데이터베이스 오류 발생 (무시하고 계속 진행): postId={}, error={}", postId, e.getMessage());
            } catch (Exception e) {
                // 기타 예외는 로그만 남기고 계속 진행 (기본적으로 읽기 허용)
                log.debug("읽기 권한 검증 중 오류 발생 (무시하고 계속 진행): postId={}, error={}", postId, e.getMessage());
            }
            
            // 모든 댓글 조회 (author를 fetch join으로 가져와서 LazyInitializationException 방지)
            List<Comment> allComments;
            try {
                allComments = commentRepository.findByPostIdAndIsDeletedFalseWithAuthor(postId);
                // author를 명시적으로 초기화 (안전장치)
                if (allComments != null) {
                    for (Comment comment : allComments) {
                        try {
                            if (comment.getAuthor() != null) {
                                Hibernate.initialize(comment.getAuthor());
                            }
                            if (comment.getParent() != null) {
                                Hibernate.initialize(comment.getParent());
                            }
                        } catch (Exception e) {
                            // 초기화 실패해도 계속 진행
                            log.debug("댓글 author/parent 초기화 중 오류 (무시): commentId={}, error={}", 
                                    comment.getId(), e.getMessage());
                        }
                    }
                }
            } catch (Exception e) {
                log.error("댓글 조회 중 오류 발생: postId={}, error={}", postId, e.getMessage(), e);
                throw new IllegalArgumentException("댓글을 불러오는 중 오류가 발생했습니다: " + e.getMessage(), e);
            }
            
            if (allComments == null || allComments.isEmpty()) {
                return List.of();
            }
            
            // parent_id 매핑을 먼저 조회 (Lazy loading 문제 방지)
            Map<Long, Long> commentParentMap = new java.util.HashMap<>();
            try {
                List<Object[]> parentIds = commentRepository.findCommentIdsWithParentIds(postId);
                if (parentIds != null) {
                    for (Object[] row : parentIds) {
                        if (row != null && row.length >= 2) {
                            Long commentId = (Long) row[0];
                            Long parentId = (Long) row[1];
                            if (commentId != null) {
                                commentParentMap.put(commentId, parentId);
                            }
                        }
                    }
                }
            } catch (Exception e) {
                // parent_id 조회 실패 시 빈 맵 사용 (모든 댓글을 부모 댓글로 처리)
                log.warn("parent_id 조회 중 오류 발생 (무시하고 계속 진행): postId={}, error={}", postId, e.getMessage());
            }
            
            // 부모 댓글과 자식 댓글 분리
            Map<Long, List<Comment>> repliesMap = new java.util.HashMap<>();
            List<Comment> parentComments = new java.util.ArrayList<>();
            
            for (Comment comment : allComments) {
                if (comment == null) {
                    continue;
                }
                
                try {
                    Long commentId = comment.getId();
                    Long parentId = commentParentMap.get(commentId);
                    
                    if (parentId == null) {
                        // 부모 댓글
                        parentComments.add(comment);
                    } else {
                        // 자식 댓글
                        repliesMap.computeIfAbsent(parentId, k -> new java.util.ArrayList<>()).add(comment);
                    }
                } catch (Exception e) {
                    // 개별 댓글 처리 실패 시 부모 댓글로 처리
                    parentComments.add(comment);
                }
            }
            
            // 부모 댓글에 답글 매핑
            return parentComments.stream()
                    .filter(parent -> parent != null && parent.getId() != null)
                    .map(parent -> {
                        try {
                            List<CommentResponse> replies = repliesMap.getOrDefault(parent.getId(), List.of())
                                    .stream()
                                    .filter(c -> c != null)
                                    .map(reply -> {
                                        try {
                                            return CommentResponse.from(reply);
                                        } catch (Exception e) {
                                            // 개별 답글 처리 실패 시 null 반환 (필터링됨)
                log.warn("답글 처리 중 오류 발생 (무시하고 계속 진행): replyId={}, error={}", 
                        reply != null ? reply.getId() : null, e.getMessage());
                                            return null;
                                        }
                                    })
                                    .filter(r -> r != null)
                                    .collect(Collectors.toList());
                            return CommentResponse.from(parent, replies);
                        } catch (Exception e) {
                            // 개별 댓글 처리 실패 시 빈 replies로 처리
                            log.warn("댓글 처리 중 오류 발생 (빈 replies로 처리): parentId={}, error={}", 
                                    parent != null ? parent.getId() : null, e.getMessage());
                            try {
                                return CommentResponse.from(parent, List.of());
                            } catch (Exception ex) {
                                // 최종 실패 시 null 반환 (필터링됨)
                                log.error("댓글 응답 생성 최종 실패: parentId={}, error={}", 
                                        parent != null ? parent.getId() : null, ex.getMessage(), ex);
                                return null;
                            }
                        }
                    })
                    .filter(r -> r != null)
                    .collect(Collectors.toList());
        } catch (IllegalArgumentException e) {
            // 명시적인 예외는 다시 던짐
            throw e;
        } catch (Exception e) {
            // 기타 예외는 로그를 남기고 IllegalArgumentException으로 변환
            log.error("댓글 목록 조회 중 예상치 못한 오류 발생: postId={}, error={}", postId, e.getMessage(), e);
            throw new IllegalArgumentException("댓글을 불러오는 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }

    @Transactional
    public PostResponse updatePost(String authorization, Long postId, com.example.jokerweb.community.dto.PostUpdateRequest req) {
        Member member = authService.authenticate(authorization)
                .orElseThrow(() -> new IllegalArgumentException("로그인이 필요합니다."));
        Post post = postRepository.findByIdWithAuthor(postId)
                .orElseGet(() -> {
                    Post p = postRepository.findById(postId)
                            .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
                    // author를 명시적으로 초기화
                    if (p.getAuthor() != null) {
                        Hibernate.initialize(p.getAuthor());
                    }
                    return p;
                });
        if (Boolean.TRUE.equals(post.getIsDeleted())) {
            throw new IllegalArgumentException("삭제된 게시글은 수정할 수 없습니다.");
        }
        // 비로그인 게시글은 수정 불가
        if (post.getAuthor() == null) {
            throw new IllegalArgumentException("비로그인 게시글은 수정할 수 없습니다.");
        }
        if (!Objects.equals(post.getAuthor().getId(), member.getId())) {
            throw new IllegalArgumentException("본인이 작성한 게시글만 수정할 수 있습니다.");
        }
        
        String normalizedCategory = post.getCategory() != null ? post.getCategory().toLowerCase() : "";
        BoardRule rule = getRule(normalizedCategory);
        validateWritePermission(normalizedCategory, rule);
        
        // 제목과 내용 길이 검증
        if (req.getTitle() != null) {
            String title = req.getTitle().trim();
            if (title.length() < rule.minTitleLength() || title.length() > rule.maxTitleLength()) {
                throw new IllegalArgumentException(
                    String.format("제목은 %d자 이상 %d자 이하로 작성해주세요.", rule.minTitleLength(), rule.maxTitleLength())
                );
            }
            post.setTitle(title);
        }
        
        if (req.getContent() != null) {
            String content = req.getContent().trim();
            int contentLength = content.replaceAll("<[^>]+>", "").length(); // HTML 태그 제거 후 길이 계산
            if (contentLength < rule.minContentLength() || contentLength > rule.maxContentLength()) {
                throw new IllegalArgumentException(
                    String.format("본문은 %d자 이상 %d자 이하로 작성해주세요.", rule.minContentLength(), rule.maxContentLength())
                );
            }
            post.setContent(content);
        }
        
        // 익명 게시글 여부 업데이트 (allowAnonymous가 true인 경우에만 허용)
        if (req.getAnonymous() != null) {
            boolean isAnonymous = Boolean.TRUE.equals(req.getAnonymous()) && rule.allowAnonymous();
            post.setIsAnonymous(isAnonymous);
        }
        
        post.setUpdatedAt(java.time.LocalDateTime.now());
        Post saved = postRepository.save(post);
        long commentCount = commentRepository.countByPostIdAndIsDeletedFalse(postId);
        return PostResponse.from(saved, commentCount, null, authorizationService);
    }

    /**
     * 비로그인(게스트) 게시글 수정 - 비밀번호로 인증
     */
    @Transactional
    public PostResponse updatePostAsGuest(Long postId, com.example.jokerweb.community.dto.PostUpdateRequest req) {
        Post post = postRepository.findByIdWithAuthor(postId)
                .orElseGet(() -> {
                    Post p = postRepository.findById(postId)
                            .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
                    if (p.getAuthor() != null) {
                        Hibernate.initialize(p.getAuthor());
                    }
                    return p;
                });

        if (Boolean.TRUE.equals(post.getIsDeleted())) {
            throw new IllegalArgumentException("삭제된 게시글은 수정할 수 없습니다.");
        }

        // 로그인 사용자가 작성한 게시글은 이 메서드로 수정할 수 없음
        if (post.getAuthor() != null) {
            throw new IllegalArgumentException("로그인 게시글은 비밀번호로 수정할 수 없습니다.");
        }

        // 비밀번호 검증
        if (req.getPassword() == null || req.getPassword().isBlank()) {
            throw new IllegalArgumentException("비밀번호를 입력해주세요.");
        }
        if (post.getPasswordHash() == null) {
            throw new IllegalArgumentException("비밀번호가 설정되지 않은 게시글입니다.");
        }
        if (!passwordEncoder.matches(req.getPassword(), post.getPasswordHash())) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }

        String normalizedCategory = post.getCategory() != null ? post.getCategory().toLowerCase() : "";
        BoardRule rule = getRule(normalizedCategory);
        validateWritePermission(normalizedCategory, rule);

        // 제목과 내용 길이 검증
        if (req.getTitle() != null) {
            String title = req.getTitle().trim();
            if (title.length() < rule.minTitleLength() || title.length() > rule.maxTitleLength()) {
                throw new IllegalArgumentException(
                        String.format("제목은 %d자 이상 %d자 이하로 작성해주세요.", rule.minTitleLength(), rule.maxTitleLength())
                );
            }
            post.setTitle(title);
        }

        if (req.getContent() != null) {
            String content = req.getContent().trim();
            int contentLength = content.replaceAll("<[^>]+>", "").length(); // HTML 태그 제거 후 길이 계산
            if (contentLength < rule.minContentLength() || contentLength > rule.maxContentLength()) {
                throw new IllegalArgumentException(
                        String.format("본문은 %d자 이상 %d자 이하로 작성해주세요.", rule.minContentLength(), rule.maxContentLength())
                );
            }
            post.setContent(content);
        }

        // 익명 게시글 여부는 항상 true 유지 (게스트 글)
        post.setIsAnonymous(true);

        post.setUpdatedAt(java.time.LocalDateTime.now());
        Post saved = postRepository.save(post);
        long commentCount = commentRepository.countByPostIdAndIsDeletedFalse(postId);
        return PostResponse.from(saved, commentCount, null, authorizationService);
    }

    @Transactional
    public void deletePost(String authorization, Long postId, String password) {
        Optional<Member> memberOpt = authService.authenticate(authorization);
        Member member = memberOpt.orElse(null);
        
        Post post = postRepository.findByIdWithAuthor(postId)
                .orElseGet(() -> {
                    Post p = postRepository.findById(postId)
                            .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
                    // author를 명시적으로 초기화
                    if (p.getAuthor() != null) {
                        Hibernate.initialize(p.getAuthor());
                    }
                    return p;
                });
        if (Boolean.TRUE.equals(post.getIsDeleted())) {
            throw new IllegalArgumentException("이미 삭제된 게시글입니다.");
        }
        
        // 관리자는 항상 삭제 가능
        boolean isAdmin = member != null && isAdmin(member);
        
        if (isAdmin) {
            // 관리자는 바로 삭제
            post.setIsDeleted(true);
            post.setDeletedAt(java.time.LocalDateTime.now());
            postRepository.save(post);
            return;
        }
        
        // 비로그인 게시글인 경우 비밀번호 검증
        if (post.getAuthor() == null) {
            if (!StringUtils.hasText(password)) {
                throw new IllegalArgumentException("비밀번호를 입력해주세요.");
            }
            if (post.getPasswordHash() == null) {
                throw new IllegalArgumentException("비밀번호가 설정되지 않은 게시글입니다.");
            }
            if (!passwordEncoder.matches(password, post.getPasswordHash())) {
                throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
            }
            post.setIsDeleted(true);
            post.setDeletedAt(java.time.LocalDateTime.now());
            postRepository.save(post);
            return;
        }
        
        // 로그인 사용자의 경우 본인 게시글만 삭제 가능
        if (member == null) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }
        if (!Objects.equals(post.getAuthor().getId(), member.getId())) {
            throw new IllegalArgumentException("본인이 작성한 게시글만 삭제할 수 있습니다.");
        }
        post.setIsDeleted(true);
        post.setDeletedAt(java.time.LocalDateTime.now());
        postRepository.save(post);
    }

    @Transactional
    public CommentResponse updateComment(String authorization, Long postId, Long commentId, com.example.jokerweb.community.dto.CommentUpdateRequest req) {
        Member member = authService.authenticate(authorization)
                .orElseThrow(() -> new IllegalArgumentException("로그인이 필요합니다."));
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));
        if (!Objects.equals(comment.getPost().getId(), postId)) {
            throw new IllegalArgumentException("댓글과 게시글이 일치하지 않습니다.");
        }
        if (Boolean.TRUE.equals(comment.getIsDeleted())) {
            throw new IllegalArgumentException("삭제된 댓글은 수정할 수 없습니다.");
        }
        // 비로그인 댓글은 수정 불가
        if (comment.getAuthor() == null) {
            throw new IllegalArgumentException("비로그인 댓글은 수정할 수 없습니다.");
        }
        if (!Objects.equals(comment.getAuthor().getId(), member.getId())) {
            throw new IllegalArgumentException("본인이 작성한 댓글만 수정할 수 있습니다.");
        }
        
        if (req.getContent() != null && !req.getContent().trim().isEmpty()) {
            comment.setContent(req.getContent().trim());
        } else {
            throw new IllegalArgumentException("댓글 내용을 입력해주세요.");
        }
        
        comment.setUpdatedAt(java.time.LocalDateTime.now());
        Comment saved = commentRepository.save(comment);
        
        // 답글이 있는 경우 replies 포함하여 반환
        if (saved.getParent() == null) {
            List<Comment> replies = commentRepository.findByPostIdAndIsDeletedFalseWithAuthor(postId)
                    .stream()
                    .filter(c -> c.getParent() != null && Objects.equals(c.getParent().getId(), saved.getId()))
                    .collect(Collectors.toList());
            List<CommentResponse> replyResponses = replies.stream()
                    .map(CommentResponse::from)
                    .collect(Collectors.toList());
            return CommentResponse.from(saved, replyResponses);
        } else {
            return CommentResponse.from(saved);
        }
    }

    @Transactional
    public void deleteComment(String authorization, Long postId, Long commentId, String password) {
        Optional<Member> memberOpt = authService.authenticate(authorization);
        Member member = memberOpt.orElse(null);
        
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));
        if (!Objects.equals(comment.getPost().getId(), postId)) {
            throw new IllegalArgumentException("댓글과 게시글이 일치하지 않습니다.");
        }
        
        // 관리자는 항상 삭제 가능
        boolean isAdmin = member != null && isAdmin(member);
        
        if (isAdmin) {
            // 관리자는 바로 삭제
            comment.setIsDeleted(true);
            comment.setDeletedAt(java.time.LocalDateTime.now());
            commentRepository.save(comment);
            return;
        }
        
        // 비로그인 댓글인 경우 비밀번호 검증
        if (comment.getAuthor() == null) {
            if (!StringUtils.hasText(password)) {
                throw new IllegalArgumentException("비밀번호를 입력해주세요.");
            }
            if (comment.getPasswordHash() == null) {
                throw new IllegalArgumentException("비밀번호가 설정되지 않은 댓글입니다.");
            }
            if (!passwordEncoder.matches(password, comment.getPasswordHash())) {
                throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
            }
            comment.setIsDeleted(true);
            comment.setDeletedAt(java.time.LocalDateTime.now());
            commentRepository.save(comment);
            return;
        }
        
        // 로그인 사용자의 경우 본인 댓글만 삭제 가능
        if (member == null) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }
        if (!Objects.equals(comment.getAuthor().getId(), member.getId())) {
            throw new IllegalArgumentException("본인이 작성한 댓글만 삭제할 수 있습니다.");
        }
        // 답글이 있는 경우에도 댓글은 삭제 처리 (답글은 남겨둠)
        comment.setIsDeleted(true);
        comment.setDeletedAt(java.time.LocalDateTime.now());
        commentRepository.save(comment);
    }

    // 어드민 권한 확인
    private boolean isAdmin(Member member) {
        if (member == null) {
            return false;
        }
        Long memberId = member.getId();
        return authorizationService.hasRole(memberId, "ADMIN") || 
               authorizationService.hasCurrentUserRole("ADMIN");
    }

    // 게시글 신고
    @Transactional
    public void reportPost(String authorization, Long postId, ReportRequest request) {
        Member reporter = authService.authenticate(authorization)
                .orElseThrow(() -> new IllegalArgumentException("로그인이 필요합니다."));
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        if (Boolean.TRUE.equals(post.getIsDeleted())) {
            throw new IllegalArgumentException("삭제된 게시글입니다.");
        }
        
        // 중복 신고 확인 (같은 사용자가 같은 게시글을 이미 신고했는지)
        List<ContentReport> existingReports = contentReportRepository.findByTargetTypeAndTargetId("post", postId);
        boolean alreadyReported = existingReports.stream()
                .anyMatch(r -> r.getReporter() != null && Objects.equals(r.getReporter().getId(), reporter.getId()));
        if (alreadyReported) {
            throw new IllegalArgumentException("이미 신고한 게시글입니다.");
        }
        
        // 신고 저장
        ContentReport report = ContentReport.builder()
                .reporter(reporter)
                .targetType("post")
                .targetId(postId)
                .reportReason(request.getReason())
                .description(request.getDescription())
                .status("pending")
                .build();
        contentReportRepository.save(report);
    }

    // 댓글 신고
    @Transactional
    public void reportComment(String authorization, Long postId, Long commentId, ReportRequest request) {
        Member reporter = authService.authenticate(authorization)
                .orElseThrow(() -> new IllegalArgumentException("로그인이 필요합니다."));
        postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));
        if (!Objects.equals(comment.getPost().getId(), postId)) {
            throw new IllegalArgumentException("댓글과 게시글이 일치하지 않습니다.");
        }
        if (Boolean.TRUE.equals(comment.getIsDeleted())) {
            throw new IllegalArgumentException("삭제된 댓글입니다.");
        }
        
        // 중복 신고 확인 (같은 사용자가 같은 댓글을 이미 신고했는지)
        List<ContentReport> existingReports = contentReportRepository.findByTargetTypeAndTargetId("comment", commentId);
        boolean alreadyReported = existingReports.stream()
                .anyMatch(r -> r.getReporter() != null && Objects.equals(r.getReporter().getId(), reporter.getId()));
        if (alreadyReported) {
            throw new IllegalArgumentException("이미 신고한 댓글입니다.");
        }
        
        // 신고 저장
        ContentReport report = ContentReport.builder()
                .reporter(reporter)
                .targetType("comment")
                .targetId(commentId)
                .reportReason(request.getReason())
                .description(request.getDescription())
                .status("pending")
                .build();
        contentReportRepository.save(report);
    }

    // 어드민: 게시글 삭제
    @Transactional
    public void adminDeletePost(String authorization, Long postId, String reason) {
        Member admin = authService.authenticate(authorization)
                .orElseThrow(() -> new IllegalArgumentException("로그인이 필요합니다."));
        if (!isAdmin(admin)) {
            throw new IllegalArgumentException("관리자 권한이 필요합니다.");
        }
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        post.setIsDeleted(true);
        post.setDeletedAt(java.time.LocalDateTime.now());
        postRepository.save(post);
        // TODO: 삭제 이력 기록 (AdminPostService와 연계)
    }

    // 어드민: 댓글 삭제
    @Transactional
    public void adminDeleteComment(String authorization, Long postId, Long commentId, String reason) {
        Member admin = authService.authenticate(authorization)
                .orElseThrow(() -> new IllegalArgumentException("로그인이 필요합니다."));
        if (!isAdmin(admin)) {
            throw new IllegalArgumentException("관리자 권한이 필요합니다.");
        }
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));
        if (!Objects.equals(comment.getPost().getId(), postId)) {
            throw new IllegalArgumentException("댓글과 게시글이 일치하지 않습니다.");
        }
        comment.setIsDeleted(true);
        comment.setDeletedAt(java.time.LocalDateTime.now());
        commentRepository.save(comment);
        // TODO: 삭제 이력 기록
    }

    // 어드민: 게시글 스팸 처리
    @Transactional
    public void markPostAsSpam(String authorization, Long postId) {
        Member admin = authService.authenticate(authorization)
                .orElseThrow(() -> new IllegalArgumentException("로그인이 필요합니다."));
        if (!isAdmin(admin)) {
            throw new IllegalArgumentException("관리자 권한이 필요합니다.");
        }
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        post.setIsDeleted(true);
        post.setDeletedAt(java.time.LocalDateTime.now());
        postRepository.save(post);
        // TODO: 스팸 처리 이력 기록 및 작성자 제재
    }

    // 어드민: 댓글 스팸 처리
    @Transactional
    public void markCommentAsSpam(String authorization, Long postId, Long commentId) {
        Member admin = authService.authenticate(authorization)
                .orElseThrow(() -> new IllegalArgumentException("로그인이 필요합니다."));
        if (!isAdmin(admin)) {
            throw new IllegalArgumentException("관리자 권한이 필요합니다.");
        }
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));
        if (!Objects.equals(comment.getPost().getId(), postId)) {
            throw new IllegalArgumentException("댓글과 게시글이 일치하지 않습니다.");
        }
        comment.setIsDeleted(true);
        comment.setDeletedAt(java.time.LocalDateTime.now());
        commentRepository.save(comment);
        // TODO: 스팸 처리 이력 기록 및 작성자 제재
    }

    @Transactional(readOnly = true)
    public List<BoardRuleResponse> getBoardRules() {
        return BOARD_RULES.values().stream()
                .sorted(Comparator.comparing(BoardRule::category))
                .map(rule -> BoardRuleResponse.builder()
                        .category(rule.category())
                        .name(rule.name())
                        .description(rule.description())
                        .canRead(rule.canRead())
                        .canWrite(rule.canWrite())
                        .minTitleLength(rule.minTitleLength())
                        .maxTitleLength(rule.maxTitleLength())
                        .minContentLength(rule.minContentLength())
                        .maxContentLength(rule.maxContentLength())
                        .maxMediaCount(rule.maxMediaCount())
                        .allowAnonymous(rule.allowAnonymous())
                        .allowLinks(rule.allowLinks())
                        .allowYoutube(rule.allowYoutube())
                        .allowTable(rule.allowTable())
                        .allowCodeBlock(rule.allowCodeBlock())
                        .notice(rule.notice())
                        .build())
                .toList();
    }

    // 게시글 좋아요
    @Transactional
    public void likePost(String authorization, Long postId) {
        Member member = authService.authenticate(authorization)
                .orElseThrow(() -> new IllegalArgumentException("로그인이 필요합니다."));
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        if (Boolean.TRUE.equals(post.getIsDeleted())) {
            throw new IllegalArgumentException("삭제된 게시글입니다.");
        }
        
        // 이미 좋아요를 눌렀는지 확인
        if (postLikeRepository.existsByPostIdAndMemberId(postId, member.getId())) {
            throw new IllegalArgumentException("이미 좋아요를 누른 게시글입니다.");
        }
        
        // 비추천이 있으면 제거
        postDislikeRepository.findByPostIdAndMemberId(postId, member.getId())
                .ifPresent(postDislikeRepository::delete);
        
        // 좋아요 추가
        PostLike postLike = PostLike.builder()
                .postId(postId)
                .memberId(member.getId())
                .post(post)
                .member(member)
                .build();
        postLikeRepository.save(postLike);
        
        // 게시글의 좋아요 수 업데이트
        long likeCount = postLikeRepository.countByPostId(postId);
        post.setLikes((int) likeCount);
        postRepository.save(post);
    }

    // 게시글 좋아요 취소
    @Transactional
    public void unlikePost(String authorization, Long postId) {
        Member member = authService.authenticate(authorization)
                .orElseThrow(() -> new IllegalArgumentException("로그인이 필요합니다."));
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        
        PostLike postLike = postLikeRepository.findByPostIdAndMemberId(postId, member.getId())
                .orElseThrow(() -> new IllegalArgumentException("좋아요를 누르지 않은 게시글입니다."));
        
        postLikeRepository.delete(postLike);
        
        // 게시글의 좋아요 수 업데이트
        long likeCount = postLikeRepository.countByPostId(postId);
        post.setLikes((int) likeCount);
        postRepository.save(post);
    }

    // 게시글 비추천
    @Transactional
    public void dislikePost(String authorization, Long postId) {
        Member member = authService.authenticate(authorization)
                .orElseThrow(() -> new IllegalArgumentException("로그인이 필요합니다."));
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        if (Boolean.TRUE.equals(post.getIsDeleted())) {
            throw new IllegalArgumentException("삭제된 게시글입니다.");
        }
        
        // 이미 비추천을 눌렀는지 확인
        if (postDislikeRepository.existsByPostIdAndMemberId(postId, member.getId())) {
            throw new IllegalArgumentException("이미 비추천을 누른 게시글입니다.");
        }
        
        // 좋아요가 있으면 제거
        postLikeRepository.findByPostIdAndMemberId(postId, member.getId())
                .ifPresent(postLikeRepository::delete);
        
        // 비추천 추가
        PostDislike postDislike = PostDislike.builder()
                .postId(postId)
                .memberId(member.getId())
                .post(post)
                .member(member)
                .build();
        postDislikeRepository.save(postDislike);
        
        // 게시글의 좋아요 수 업데이트 (비추천은 별도로 카운트하지 않음)
        long likeCount = postLikeRepository.countByPostId(postId);
        post.setLikes((int) likeCount);
        postRepository.save(post);
    }

    // 게시글 비추천 취소
    @Transactional
    public void undislikePost(String authorization, Long postId) {
        Member member = authService.authenticate(authorization)
                .orElseThrow(() -> new IllegalArgumentException("로그인이 필요합니다."));
        postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        
        PostDislike postDislike = postDislikeRepository.findByPostIdAndMemberId(postId, member.getId())
                .orElseThrow(() -> new IllegalArgumentException("비추천을 누르지 않은 게시글입니다."));
        
        postDislikeRepository.delete(postDislike);
    }

    // 댓글 좋아요
    @Transactional
    public void likeComment(String authorization, Long postId, Long commentId) {
        Member member = authService.authenticate(authorization)
                .orElseThrow(() -> new IllegalArgumentException("로그인이 필요합니다."));
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));
        if (!Objects.equals(comment.getPost().getId(), postId)) {
            throw new IllegalArgumentException("댓글과 게시글이 일치하지 않습니다.");
        }
        if (Boolean.TRUE.equals(comment.getIsDeleted())) {
            throw new IllegalArgumentException("삭제된 댓글입니다.");
        }
        
        // 이미 좋아요를 눌렀는지 확인
        if (commentLikeRepository.existsByCommentIdAndMemberId(commentId, member.getId())) {
            throw new IllegalArgumentException("이미 좋아요를 누른 댓글입니다.");
        }
        
        // 비추천이 있으면 제거
        commentDislikeRepository.findByCommentIdAndMemberId(commentId, member.getId())
                .ifPresent(commentDislikeRepository::delete);
        
        // 좋아요 추가
        CommentLike commentLike = CommentLike.builder()
                .commentId(commentId)
                .memberId(member.getId())
                .comment(comment)
                .member(member)
                .build();
        commentLikeRepository.save(commentLike);
        
        // 댓글의 좋아요 수 업데이트
        long likeCount = commentLikeRepository.countByCommentId(commentId);
        comment.setLikes((int) likeCount);
        commentRepository.save(comment);
    }

    // 댓글 좋아요 취소
    @Transactional
    public void unlikeComment(String authorization, Long postId, Long commentId) {
        Member member = authService.authenticate(authorization)
                .orElseThrow(() -> new IllegalArgumentException("로그인이 필요합니다."));
        postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));
        if (!Objects.equals(comment.getPost().getId(), postId)) {
            throw new IllegalArgumentException("댓글과 게시글이 일치하지 않습니다.");
        }
        
        CommentLike commentLike = commentLikeRepository.findByCommentIdAndMemberId(commentId, member.getId())
                .orElseThrow(() -> new IllegalArgumentException("좋아요를 누르지 않은 댓글입니다."));
        
        commentLikeRepository.delete(commentLike);
        
        // 댓글의 좋아요 수 업데이트
        long likeCount = commentLikeRepository.countByCommentId(commentId);
        comment.setLikes((int) likeCount);
        commentRepository.save(comment);
    }

    // 댓글 비추천
    @Transactional
    public void dislikeComment(String authorization, Long postId, Long commentId) {
        Member member = authService.authenticate(authorization)
                .orElseThrow(() -> new IllegalArgumentException("로그인이 필요합니다."));
        postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));
        if (!Objects.equals(comment.getPost().getId(), postId)) {
            throw new IllegalArgumentException("댓글과 게시글이 일치하지 않습니다.");
        }
        if (Boolean.TRUE.equals(comment.getIsDeleted())) {
            throw new IllegalArgumentException("삭제된 댓글입니다.");
        }
        
        // 이미 비추천을 눌렀는지 확인
        if (commentDislikeRepository.existsByCommentIdAndMemberId(commentId, member.getId())) {
            throw new IllegalArgumentException("이미 비추천을 누른 댓글입니다.");
        }
        
        // 좋아요가 있으면 제거
        commentLikeRepository.findByCommentIdAndMemberId(commentId, member.getId())
                .ifPresent(commentLikeRepository::delete);
        
        // 비추천 추가
        CommentDislike commentDislike = CommentDislike.builder()
                .commentId(commentId)
                .memberId(member.getId())
                .comment(comment)
                .member(member)
                .build();
        commentDislikeRepository.save(commentDislike);
        
        // 댓글의 좋아요 수 업데이트
        long likeCount = commentLikeRepository.countByCommentId(commentId);
        comment.setLikes((int) likeCount);
        commentRepository.save(comment);
    }

    // 댓글 비추천 취소
    @Transactional
    public void undislikeComment(String authorization, Long postId, Long commentId) {
        Member member = authService.authenticate(authorization)
                .orElseThrow(() -> new IllegalArgumentException("로그인이 필요합니다."));
        postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));
        if (!Objects.equals(comment.getPost().getId(), postId)) {
            throw new IllegalArgumentException("댓글과 게시글이 일치하지 않습니다.");
        }
        
        CommentDislike commentDislike = commentDislikeRepository.findByCommentIdAndMemberId(commentId, member.getId())
                .orElseThrow(() -> new IllegalArgumentException("비추천을 누르지 않은 댓글입니다."));
        
        commentDislikeRepository.delete(commentDislike);
    }

    // 게시글 좋아요/비추천 상태 조회
    @Transactional(readOnly = true)
    public LikeStatusResponse getPostLikeStatus(String authorization, Long postId) {
        // 게시글 존재 확인
        postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        
        // 인증되지 않은 경우 모두 false 반환
        Optional<Member> memberOpt = authService.authenticate(authorization);
        if (memberOpt.isEmpty()) {
            return LikeStatusResponse.builder()
                    .liked(false)
                    .disliked(false)
                    .build();
        }
        
        Member member = memberOpt.get();
        boolean liked = postLikeRepository.existsByPostIdAndMemberId(postId, member.getId());
        boolean disliked = postDislikeRepository.existsByPostIdAndMemberId(postId, member.getId());
        
        return LikeStatusResponse.builder()
                .liked(liked)
                .disliked(disliked)
                .build();
    }

    // 댓글 좋아요/비추천 상태 조회
    @Transactional(readOnly = true)
    public LikeStatusResponse getCommentLikeStatus(String authorization, Long postId, Long commentId) {
        // 게시글 및 댓글 존재 확인
        postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));
        if (!Objects.equals(comment.getPost().getId(), postId)) {
            throw new IllegalArgumentException("댓글과 게시글이 일치하지 않습니다.");
        }
        
        // 인증되지 않은 경우 모두 false 반환
        Optional<Member> memberOpt = authService.authenticate(authorization);
        if (memberOpt.isEmpty()) {
            return LikeStatusResponse.builder()
                    .liked(false)
                    .disliked(false)
                    .build();
        }
        
        Member member = memberOpt.get();
        boolean liked = commentLikeRepository.existsByCommentIdAndMemberId(commentId, member.getId());
        boolean disliked = commentDislikeRepository.existsByCommentIdAndMemberId(commentId, member.getId());
        
        return LikeStatusResponse.builder()
                .liked(liked)
                .disliked(disliked)
                .build();
    }

    private BoardRule getRule(String category) {
        if (category == null || category.isBlank()) {
            throw new IllegalArgumentException("카테고리를 선택해주세요.");
        }
        BoardRule rule = BOARD_RULES.get(category.toLowerCase());
        if (rule == null) {
            throw new IllegalArgumentException("지원하지 않는 게시판입니다: " + category);
        }
        return rule;
    }

    private void validateWritePermission(String category, BoardRule rule) {
        // category 테이블이 없을 수 있으므로 try-catch로 처리
        try {
        categoryRepository.findByName(category)
                .ifPresent(cat -> {
                    if (!Boolean.TRUE.equals(cat.getCanWrite())) {
                        throw new IllegalArgumentException("해당 게시판은 현재 글쓰기가 제한되어 있습니다.");
                    }
                });
        } catch (Exception e) {
            // category 테이블이 없거나 조회 실패 시 무시하고 계속 진행
            log.debug("category 테이블 조회 실패 (무시하고 계속 진행): category={}, error={}", category, e.getMessage());
        }
        if (!rule.canWrite()) {
            throw new IllegalArgumentException("해당 게시판은 관리자만 작성할 수 있습니다.");
        }
    }

    private void validateReadPermission(Post post) {
        try {
            BoardRule rule = getRule(post.getCategory());
            // category 테이블이 없을 수 있으므로 try-catch로 처리
            try {
            categoryRepository.findByName(post.getCategory())
                    .ifPresent(cat -> {
                        if (!Boolean.TRUE.equals(cat.getCanRead())) {
                            throw new IllegalArgumentException("해당 게시판 읽기가 제한되어 있습니다.");
                        }
                    });
            } catch (Exception e) {
                // category 테이블이 없거나 조회 실패 시 무시하고 계속 진행
                log.debug("category 테이블 조회 실패 (무시하고 계속 진행): category={}, error={}", post.getCategory(), e.getMessage());
            }
            if (!rule.canRead()) {
                throw new IllegalArgumentException("해당 게시판은 접근이 제한되어 있습니다.");
            }
        } catch (IllegalArgumentException e) {
            // 카테고리 규칙이 없거나 읽기 권한이 없는 경우 예외 발생
            throw e;
        } catch (Exception e) {
            // 기타 예외는 무시하고 기본적으로 읽기 허용
            // 로그만 남기고 계속 진행
            log.debug("읽기 권한 검증 중 오류 발생 (무시하고 계속 진행): category={}, error={}", post.getCategory(), e.getMessage());
        }
    }

    private void validateContent(PostCreateRequest req, BoardRule rule) {
        String title = Objects.requireNonNullElse(req.getTitle(), "").trim();
        String content = Objects.requireNonNullElse(req.getContent(), "").trim();

        if (title.length() < rule.minTitleLength() || title.length() > rule.maxTitleLength()) {
            throw new IllegalArgumentException(
                    "제목은 " + rule.minTitleLength() + "자 이상 " + rule.maxTitleLength() + "자 이하여야 합니다.");
        }

        String textOnly = stripHtml(content);
        if (textOnly.length() < rule.minContentLength() || textOnly.length() > rule.maxContentLength()) {
            throw new IllegalArgumentException(
                    "본문은 " + rule.minContentLength() + "자 이상 " + rule.maxContentLength() + "자 이하여야 합니다.");
        }

        long imageCount = IMG_PATTERN.matcher(content).results().count();
        if (imageCount > rule.maxMediaCount()) {
            throw new IllegalArgumentException("이미지는 최대 " + rule.maxMediaCount() + "개까지 첨부할 수 있습니다.");
        }

        if (!rule.allowLinks() && LINK_PATTERN.matcher(content).find()) {
            throw new IllegalArgumentException("해당 게시판에서는 링크 첨부가 제한됩니다.");
        }

        if (!rule.allowYoutube() && YOUTUBE_PATTERN.matcher(content).find()) {
            throw new IllegalArgumentException("해당 게시판에서는 동영상 삽입이 제한됩니다.");
        }

        if (!rule.allowTable() && TABLE_PATTERN.matcher(content).find()) {
            throw new IllegalArgumentException("해당 게시판에서는 표 삽입이 제한됩니다.");
        }
    }

    private String stripHtml(String raw) {
        if (raw == null || raw.isEmpty()) {
            return "";
        }
        return TAG_PATTERN.matcher(raw).replaceAll("").trim();
    }
}
