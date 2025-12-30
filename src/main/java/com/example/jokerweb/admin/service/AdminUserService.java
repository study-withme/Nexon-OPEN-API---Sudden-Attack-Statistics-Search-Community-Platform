package com.example.jokerweb.admin.service;

import com.example.jokerweb.admin.dto.*;
import com.example.jokerweb.admin.role.*;
import com.example.jokerweb.community.BarracksReportRepository;
import com.example.jokerweb.community.CommentRepository;
import com.example.jokerweb.community.PostRepository;
import com.example.jokerweb.logging.AccessLogRepository;
import com.example.jokerweb.member.Member;
import com.example.jokerweb.member.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminUserService {
    
    private final MemberRepository memberRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final BarracksReportRepository barracksReportRepository;
    private final AccessLogRepository accessLogRepository;
    private final MemberSuspensionRepository suspensionRepository;
    private final MemberGradeHistoryRepository gradeHistoryRepository;
    private final MemberRoleRepository memberRoleRepository;
    private final AuthorizationService authorizationService;
    
    public Page<UserListResponse> getUsers(
            String status,
            String grade,
            String search,
            LocalDateTime joinDateFrom,
            LocalDateTime joinDateTo,
            Pageable pageable
    ) {
        Specification<Member> spec = Specification.where(null);
        
        if (status != null && !status.isEmpty()) {
            LocalDateTime now = LocalDateTime.now();
            if ("정지".equals(status)) {
                spec = spec.and((root, query, cb) -> {
                    var sub = query.subquery(MemberSuspension.class);
                    var ms = sub.from(MemberSuspension.class);
                    sub.select(ms.get("id")).where(
                            cb.equal(ms.get("memberId"), root.get("id")),
                            cb.isNull(ms.get("releasedAt")),
                            cb.or(cb.isNull(ms.get("expiresAt")), cb.greaterThan(ms.get("expiresAt"), now))
                    );
                    return cb.exists(sub);
                });
            } else if ("정상".equals(status)) {
                spec = spec.and((root, query, cb) -> {
                    var sub = query.subquery(MemberSuspension.class);
                    var ms = sub.from(MemberSuspension.class);
                    sub.select(ms.get("id")).where(
                            cb.equal(ms.get("memberId"), root.get("id")),
                            cb.isNull(ms.get("releasedAt")),
                            cb.or(cb.isNull(ms.get("expiresAt")), cb.greaterThan(ms.get("expiresAt"), now))
                    );
                    return cb.not(cb.exists(sub));
                });
            }
        }
        
        if (search != null && !search.isEmpty()) {
            spec = spec.and((root, query, cb) -> 
                cb.or(
                    cb.like(cb.lower(root.get("nickname")), "%" + search.toLowerCase() + "%"),
                    cb.like(cb.lower(root.get("email")), "%" + search.toLowerCase() + "%")
                )
            );
        }
        
        if (joinDateFrom != null) {
            spec = spec.and((root, query, cb) -> 
                cb.greaterThanOrEqualTo(root.get("createdAt"), joinDateFrom)
            );
        }
        
        if (joinDateTo != null) {
            spec = spec.and((root, query, cb) -> 
                cb.lessThanOrEqualTo(root.get("createdAt"), joinDateTo)
            );
        }
        
        Page<Member> members = memberRepository.findAll(spec, pageable);
        
        return members.map(member -> {
            boolean isSuspended = isSuspended(member.getId());
            String memberStatus = isSuspended ? "정지" : "정상";
            
            List<Role> roles = memberRoleRepository.findRolesByMemberId(member.getId());
            String memberGrade = roles.isEmpty() ? "일반" : roles.get(0).getDisplayName();
            
            Long postCount = postRepository.countByAuthorId(member.getId());
            Long commentCount = commentRepository.countByAuthorId(member.getId());
            Long reportCount = barracksReportRepository.countByReporterId(member.getId());
            
            LocalDateTime lastAccess = getLastAccessTime(member.getId());
            
            return UserListResponse.builder()
                    .id(member.getId())
                    .nickname(member.getNickname())
                    .email(member.getEmail())
                    .joinDate(member.getCreatedAt())
                    .lastAccess(lastAccess)
                    .status(memberStatus)
                    .grade(memberGrade)
                    .postCount(postCount)
                    .commentCount(commentCount)
                    .reportCount(reportCount)
                    .build();
        });
    }
    
    public UserDetailResponse getUserDetail(Long userId) {
        Member member = memberRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("회원을 찾을 수 없습니다: " + userId));
        
        boolean isSuspended = isSuspended(member.getId());
        String status = isSuspended ? "정지" : "정상";
        
        List<Role> roles = memberRoleRepository.findRolesByMemberId(member.getId());
        String grade = roles.isEmpty() ? "일반" : roles.get(0).getDisplayName();
        
        Long postCount = postRepository.countByAuthorId(member.getId());
        Long commentCount = commentRepository.countByAuthorId(member.getId());
        Long likes = getTotalLikes(member.getId());
        Long reportCount = barracksReportRepository.countByReporterId(member.getId());
        Long reportedCount = barracksReportRepository.countByTargetNickname(member.getNickname());
        
        LocalDateTime lastAccess = getLastAccessTime(member.getId());
        
        UserDetailResponse.UserStats stats = UserDetailResponse.UserStats.builder()
                .postCount(postCount)
                .commentCount(commentCount)
                .likes(likes)
                .reportCount(reportCount)
                .reportedCount(reportedCount)
                .build();
        
        List<String> roleNames = roles.stream()
                .map(Role::getName)
                .collect(Collectors.toList());
        
        return UserDetailResponse.builder()
                .id(member.getId())
                .nickname(member.getNickname())
                .email(member.getEmail())
                .joinDate(member.getCreatedAt())
                .lastAccess(lastAccess)
                .status(status)
                .grade(grade)
                .stats(stats)
                .roles(roleNames)
                .build();
    }
    
    @Transactional
    public void suspendUser(Long userId, SuspendUserRequest request) {
        Member member = memberRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("회원을 찾을 수 없습니다: " + userId));
        
        Long adminId = authorizationService.getCurrentUserId();
        if (adminId == null) {
            throw new RuntimeException("관리자 인증이 필요합니다");
        }
        
        LocalDateTime expiresAt = calculateExpiresAt(request.getPeriod());
        
        MemberSuspension suspension = MemberSuspension.builder()
                .memberId(userId)
                .reason(request.getReason())
                .suspendedBy(adminId)
                .expiresAt(expiresAt)
                .build();
        
        suspensionRepository.save(suspension);
    }
    
    @Transactional
    public void releaseUser(Long userId, String reason) {
        MemberSuspension suspension = suspensionRepository.findActiveSuspension(userId, LocalDateTime.now())
                .orElseThrow(() -> new RuntimeException("정지된 회원이 아닙니다: " + userId));
        
        Long adminId = authorizationService.getCurrentUserId();
        if (adminId == null) {
            throw new RuntimeException("관리자 인증이 필요합니다");
        }
        
        suspension.setReleasedAt(LocalDateTime.now());
        suspension.setReleasedBy(adminId);
        suspensionRepository.save(suspension);
    }
    
    @Transactional
    public void changeGrade(Long userId, String newGrade) {
        Member member = memberRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("회원을 찾을 수 없습니다: " + userId));
        
        Long adminId = authorizationService.getCurrentUserId();
        if (adminId == null) {
            throw new RuntimeException("관리자 인증이 필요합니다");
        }
        
        String oldGrade = memberRoleRepository.findRolesByMemberId(userId).stream()
                .findFirst()
                .map(Role::getDisplayName)
                .orElse("일반");
        
        MemberGradeHistory history = MemberGradeHistory.builder()
                .memberId(userId)
                .oldGrade(oldGrade)
                .newGrade(newGrade)
                .changedBy(adminId)
                .build();
        
        gradeHistoryRepository.save(history);
        
        // 실제 등급 변경은 역할 시스템으로 처리
        // 여기서는 이력만 기록
    }
    
    private boolean isSuspended(Long memberId) {
        return suspensionRepository.findActiveSuspension(memberId, LocalDateTime.now()).isPresent();
    }
    
    private LocalDateTime calculateExpiresAt(String period) {
        if ("영구".equals(period)) {
            return null;
        }
        
        LocalDateTime now = LocalDateTime.now();
        return switch (period) {
            case "1일" -> now.plusDays(1);
            case "3일" -> now.plusDays(3);
            case "7일" -> now.plusDays(7);
            case "30일" -> now.plusDays(30);
            default -> now.plusDays(1);
        };
    }
    
    private LocalDateTime getLastAccessTime(Long memberId) {
        return accessLogRepository.findLastAccessByMemberId(memberId)
                .orElse(null);
    }
    
    private Long getTotalLikes(Long memberId) {
        // Post와 Comment의 좋아요 합계
        return postRepository.sumLikesByAuthorId(memberId) + 
               commentRepository.sumLikesByAuthorId(memberId);
    }
}
