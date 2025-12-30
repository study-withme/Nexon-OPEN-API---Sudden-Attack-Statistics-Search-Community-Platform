package com.example.jokerweb.admin.service;

import com.example.jokerweb.admin.dto.ContentReportDetailResponse;
import com.example.jokerweb.admin.dto.ContentReportListResponse;
import com.example.jokerweb.admin.dto.ProcessContentReportRequest;
import com.example.jokerweb.community.Comment;
import com.example.jokerweb.community.CommentRepository;
import com.example.jokerweb.community.ContentReport;
import com.example.jokerweb.community.ContentReportRepository;
import com.example.jokerweb.community.Post;
import com.example.jokerweb.community.PostRepository;
import com.example.jokerweb.member.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AdminReportService {
    
    private final ContentReportRepository reportRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final MemberRepository memberRepository;
    private final AuthorizationService authorizationService;
    
    public Page<ContentReportListResponse> getReports(
            String targetType, // post, comment
            String reportReason, // spam, abuse, harassment, illegal, inappropriate, other
            String status, // pending, processing, resolved, rejected
            String search, // 신고자 검색
            Pageable pageable
    ) {
        Specification<ContentReport> spec = Specification.where(null);
        
        if (targetType != null && !targetType.isEmpty()) {
            spec = spec.and((root, query, cb) -> 
                cb.equal(root.get("targetType"), targetType)
            );
        }
        
        if (reportReason != null && !reportReason.isEmpty()) {
            spec = spec.and((root, query, cb) -> 
                cb.equal(root.get("reportReason"), reportReason)
            );
        }
        
        if (status != null && !status.isEmpty()) {
            spec = spec.and((root, query, cb) -> 
                cb.equal(root.get("status"), status)
            );
        }
        
        if (search != null && !search.isEmpty()) {
            spec = spec.and((root, query, cb) -> 
                cb.like(cb.lower(root.get("reporter").get("nickname")), "%" + search.toLowerCase() + "%")
            );
        }
        
        Page<ContentReport> reports = reportRepository.findAll(spec, pageable);
        
        return reports.map(report -> ContentReportListResponse.builder()
                .id(report.getId())
                .targetType(report.getTargetType())
                .targetId(report.getTargetId())
                .reportReason(report.getReportReason())
                .reporter(report.getReporter() != null ? report.getReporter().getNickname() : "익명")
                .reportedAt(report.getCreatedAt())
                .status(report.getStatus())
                .processor(report.getProcessedBy() != null ? report.getProcessedBy().getNickname() : null)
                .processedAt(report.getProcessedAt())
                .build());
    }
    
    public ContentReportDetailResponse getReportDetail(Long reportId) {
        ContentReport report = reportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("신고를 찾을 수 없습니다: " + reportId));
        
        ContentReportDetailResponse.ContentReportDetailResponseBuilder builder = ContentReportDetailResponse.builder()
                .id(report.getId())
                .targetType(report.getTargetType())
                .targetId(report.getTargetId())
                .reportReason(report.getReportReason())
                .description(report.getDescription())
                .reporter(report.getReporter() != null ? report.getReporter().getNickname() : "익명")
                .reportedAt(report.getCreatedAt())
                .status(report.getStatus())
                .processor(report.getProcessedBy() != null ? report.getProcessedBy().getNickname() : null)
                .processedAt(report.getProcessedAt())
                .adminNotes(report.getAdminNotes());
        
        // 대상 정보 조회
        if ("post".equals(report.getTargetType())) {
            Post post = postRepository.findById(report.getTargetId()).orElse(null);
            if (post != null) {
                builder.targetTitle(post.getTitle())
                        .targetAuthor(post.getAuthor() != null ? post.getAuthor().getNickname() : "알 수 없음")
                        .targetContent(post.getContent());
            }
        } else if ("comment".equals(report.getTargetType())) {
            Comment comment = commentRepository.findById(report.getTargetId()).orElse(null);
            if (comment != null) {
                builder.targetTitle("댓글")
                        .targetAuthor(comment.getAuthor() != null ? comment.getAuthor().getNickname() : "알 수 없음")
                        .targetContent(comment.getContent());
                
                // 댓글이 속한 게시글 정보도 포함
                if (comment.getPost() != null) {
                    builder.targetTitle("댓글 (게시글: " + comment.getPost().getTitle() + ")");
                }
            }
        }
        
        return builder.build();
    }
    
    @Transactional
    public void approveReport(Long reportId, ProcessContentReportRequest request) {
        ContentReport report = reportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("신고를 찾을 수 없습니다: " + reportId));
        
        Long adminId = authorizationService.getCurrentUserId();
        if (adminId == null) {
            throw new RuntimeException("관리자 인증이 필요합니다");
        }
        
        report.setStatus("resolved");
        report.setProcessedAt(LocalDateTime.now());
        report.setAdminNotes(request.getAdminNotes() != null ? request.getAdminNotes() : request.getReason());
        
        // processedBy 설정
        com.example.jokerweb.member.Member admin = memberRepository.findById(adminId)
                .orElseThrow(() -> new RuntimeException("관리자를 찾을 수 없습니다: " + adminId));
        report.setProcessedBy(admin);
        
        reportRepository.save(report);
        
        // 신고 승인 시 대상 게시글/댓글 삭제 또는 숨김 처리
        if ("post".equals(report.getTargetType())) {
            Post post = postRepository.findById(report.getTargetId()).orElse(null);
            if (post != null) {
                post.setIsDeleted(true);
                post.setDeletedAt(LocalDateTime.now());
                postRepository.save(post);
            }
        } else if ("comment".equals(report.getTargetType())) {
            Comment comment = commentRepository.findById(report.getTargetId()).orElse(null);
            if (comment != null) {
                comment.setIsDeleted(true);
                comment.setDeletedAt(LocalDateTime.now());
                commentRepository.save(comment);
            }
        }
    }
    
    @Transactional
    public void rejectReport(Long reportId, ProcessContentReportRequest request) {
        ContentReport report = reportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("신고를 찾을 수 없습니다: " + reportId));
        
        Long adminId = authorizationService.getCurrentUserId();
        if (adminId == null) {
            throw new RuntimeException("관리자 인증이 필요합니다");
        }
        
        report.setStatus("rejected");
        report.setProcessedAt(LocalDateTime.now());
        report.setAdminNotes(request.getAdminNotes() != null ? request.getAdminNotes() : request.getReason());
        
        // processedBy 설정
        com.example.jokerweb.member.Member admin = memberRepository.findById(adminId)
                .orElseThrow(() -> new RuntimeException("관리자를 찾을 수 없습니다: " + adminId));
        report.setProcessedBy(admin);
        
        reportRepository.save(report);
    }
}
