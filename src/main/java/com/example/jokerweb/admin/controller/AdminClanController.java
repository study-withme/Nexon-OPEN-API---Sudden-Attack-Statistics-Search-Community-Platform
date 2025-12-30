package com.example.jokerweb.admin.controller;

import com.example.jokerweb.admin.dto.ChangeClanMasterRequest;
import com.example.jokerweb.admin.dto.ClanDetailResponse;
import com.example.jokerweb.admin.dto.ClanListResponse;
import com.example.jokerweb.admin.dto.SuspendClanRequest;
import com.example.jokerweb.admin.service.AdminClanService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/clans")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminClanController {
    
    private final AdminClanService clanService;
    
    @GetMapping
    public ResponseEntity<Page<ClanListResponse>> getClans(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<ClanListResponse> clans = clanService.getClans(status, search, pageable);
        return ResponseEntity.ok(clans);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ClanDetailResponse> getClanDetail(@PathVariable Long id) {
        ClanDetailResponse clan = clanService.getClanDetail(id);
        return ResponseEntity.ok(clan);
    }
    
    @PostMapping("/{id}/suspend")
    public ResponseEntity<Void> suspendClan(
            @PathVariable Long id,
            @RequestBody SuspendClanRequest request
    ) {
        clanService.suspendClan(id, request);
        return ResponseEntity.ok().build();
    }
    
    @PostMapping("/{id}/release")
    public ResponseEntity<Void> releaseClan(@PathVariable Long id) {
        clanService.releaseClan(id);
        return ResponseEntity.ok().build();
    }
    
    @PostMapping("/{id}/delete")
    public ResponseEntity<Void> deleteClan(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "관리자 삭제") String reason
    ) {
        clanService.deleteClan(id, reason);
        return ResponseEntity.ok().build();
    }
    
    @PostMapping("/{id}/change-master")
    public ResponseEntity<Void> changeMaster(
            @PathVariable Long id,
            @RequestBody ChangeClanMasterRequest request
    ) {
        clanService.changeMaster(id, request);
        return ResponseEntity.ok().build();
    }
}
