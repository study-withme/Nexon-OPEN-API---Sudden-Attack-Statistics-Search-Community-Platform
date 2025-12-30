package com.example.jokerweb.admin.controller;

import com.example.jokerweb.admin.dto.ContentReportDetailResponse;
import com.example.jokerweb.admin.dto.ContentReportListResponse;
import com.example.jokerweb.admin.dto.ProcessContentReportRequest;
import com.example.jokerweb.admin.service.AdminReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/reports")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminReportController {
    
    private final AdminReportService reportService;
    
    @GetMapping("/posts")
    public ResponseEntity<Page<ContentReportListResponse>> getPostReports(
            @RequestParam(required = false) String reportReason,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<ContentReportListResponse> reports = reportService.getReports("post", reportReason, status, search, pageable);
        return ResponseEntity.ok(reports);
    }
    
    @GetMapping("/comments")
    public ResponseEntity<Page<ContentReportListResponse>> getCommentReports(
            @RequestParam(required = false) String reportReason,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<ContentReportListResponse> reports = reportService.getReports("comment", reportReason, status, search, pageable);
        return ResponseEntity.ok(reports);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ContentReportDetailResponse> getReportDetail(@PathVariable Long id) {
        ContentReportDetailResponse report = reportService.getReportDetail(id);
        return ResponseEntity.ok(report);
    }
    
    @PostMapping("/{id}/approve")
    public ResponseEntity<Void> approveReport(
            @PathVariable Long id,
            @RequestBody ProcessContentReportRequest request
    ) {
        reportService.approveReport(id, request);
        return ResponseEntity.ok().build();
    }
    
    @PostMapping("/{id}/reject")
    public ResponseEntity<Void> rejectReport(
            @PathVariable Long id,
            @RequestBody ProcessContentReportRequest request
    ) {
        reportService.rejectReport(id, request);
        return ResponseEntity.ok().build();
    }
}
