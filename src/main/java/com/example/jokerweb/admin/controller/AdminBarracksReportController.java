package com.example.jokerweb.admin.controller;

import com.example.jokerweb.admin.dto.BarracksReportDetailResponse;
import com.example.jokerweb.admin.dto.BarracksReportListResponse;
import com.example.jokerweb.admin.dto.ProcessBarracksReportRequest;
import com.example.jokerweb.admin.service.AdminBarracksReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/barracks-reports")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminBarracksReportController {
    
    private final AdminBarracksReportService reportService;
    
    @GetMapping
    public ResponseEntity<Page<BarracksReportListResponse>> getReports(
            @RequestParam(required = false) String reportType,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<BarracksReportListResponse> reports = reportService.getReports(reportType, status, search, pageable);
        return ResponseEntity.ok(reports);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<BarracksReportDetailResponse> getReportDetail(@PathVariable Long id) {
        BarracksReportDetailResponse report = reportService.getReportDetail(id);
        return ResponseEntity.ok(report);
    }
    
    @PostMapping("/{id}/process")
    public ResponseEntity<Void> processReport(
            @PathVariable Long id,
            @RequestBody ProcessBarracksReportRequest request
    ) {
        reportService.processReport(id, request);
        return ResponseEntity.ok().build();
    }
}
