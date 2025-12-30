package com.example.jokerweb.admin.service;

import com.example.jokerweb.admin.dto.BarracksReportDetailResponse;
import com.example.jokerweb.admin.dto.BarracksReportListResponse;
import com.example.jokerweb.admin.dto.ProcessBarracksReportRequest;
import com.example.jokerweb.community.BarracksReport;
import com.example.jokerweb.community.BarracksReportRepository;
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
public class AdminBarracksReportService {
    
    private final BarracksReportRepository reportRepository;
    private final MemberRepository memberRepository;
    private final AuthorizationService authorizationService;
    
    public Page<BarracksReportListResponse> getReports(
            String reportType,
            String status,
            String search,
            Pageable pageable
    ) {
        Specification<BarracksReport> spec = Specification.where(null);
        
        if (reportType != null && !reportType.isEmpty()) {
            spec = spec.and((root, query, cb) -> 
                cb.equal(root.get("reportType"), reportType)
            );
        }
        
        if (status != null && !status.isEmpty()) {
            spec = spec.and((root, query, cb) -> 
                cb.equal(root.get("status"), status)
            );
        }
        
        if (search != null && !search.isEmpty()) {
            spec = spec.and((root, query, cb) -> 
                cb.like(cb.lower(root.get("targetNickname")), "%" + search.toLowerCase() + "%")
            );
        }
        
        Page<BarracksReport> reports = reportRepository.findAll(spec, pageable);
        
        return reports.map(report -> BarracksReportListResponse.builder()
                .id(report.getId())
                .targetNickname(report.getTargetNickname())
                .barracksAddress(report.getBarracksAddress() != null ? report.getBarracksAddress() : "")
                .reportType(report.getReportType() != null ? report.getReportType() : "기타")
                .reportCount(report.getReportCount() != null ? report.getReportCount() : 1)
                .reportedAt(report.getCreatedAt())
                .status(report.getStatus() != null ? report.getStatus() : "대기")
                .processor(report.getProcessedBy() != null ? report.getProcessedBy().getNickname() : null)
                .build());
    }
    
    public BarracksReportDetailResponse getReportDetail(Long reportId) {
        BarracksReport report = reportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("신고를 찾을 수 없습니다: " + reportId));
        
        return BarracksReportDetailResponse.builder()
                .id(report.getId())
                .targetNickname(report.getTargetNickname())
                .barracksAddress(report.getBarracksAddress() != null ? report.getBarracksAddress() : "")
                .reportType(report.getReportType() != null ? report.getReportType() : "기타")
                .reportCount(report.getReportCount() != null ? report.getReportCount() : 1)
                .title(report.getTitle() != null ? report.getTitle() : "")
                .content(report.getContent())
                .reporter(report.getReporter() != null ? report.getReporter().getNickname() : "익명")
                .reportedAt(report.getCreatedAt())
                .status(report.getStatus() != null ? report.getStatus() : "대기")
                .processor(report.getProcessedBy() != null ? report.getProcessedBy().getNickname() : null)
                .processedAt(report.getProcessedAt())
                .processReason(report.getAdminNotes() != null ? report.getAdminNotes() : "")
                .build();
    }
    
    @Transactional
    public void processReport(Long reportId, ProcessBarracksReportRequest request) {
        BarracksReport report = reportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("신고를 찾을 수 없습니다: " + reportId));
        
        Long adminId = authorizationService.getCurrentUserId();
        if (adminId == null) {
            throw new RuntimeException("관리자 인증이 필요합니다");
        }
        
        report.setStatus(request.getStatus());
        report.setProcessedAt(LocalDateTime.now());
        report.setAdminNotes(request.getReason());
        
        // processedBy 설정
        com.example.jokerweb.member.Member admin = memberRepository.findById(adminId)
                .orElseThrow(() -> new RuntimeException("관리자를 찾을 수 없습니다: " + adminId));
        report.setProcessedBy(admin);
        
        reportRepository.save(report);
        
        // 조치 처리 (warning, suspend 등)
        if ("suspend".equals(request.getAction()) && report.getReporter() != null) {
            // 회원 정지 로직 (AdminUserService 활용)
        }
    }
}
