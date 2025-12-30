package com.example.jokerweb.admin.controller;

import com.example.jokerweb.admin.dto.*;
import com.example.jokerweb.admin.service.AdminUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {
    
    private final AdminUserService userService;
    
    @GetMapping
    public ResponseEntity<Page<UserListResponse>> getUsers(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String grade,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime joinDateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime joinDateTo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<UserListResponse> users = userService.getUsers(status, grade, search, joinDateFrom, joinDateTo, pageable);
        return ResponseEntity.ok(users);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<UserDetailResponse> getUserDetail(@PathVariable Long id) {
        UserDetailResponse user = userService.getUserDetail(id);
        return ResponseEntity.ok(user);
    }
    
    @PostMapping("/{id}/suspend")
    public ResponseEntity<Void> suspendUser(
            @PathVariable Long id,
            @RequestBody SuspendUserRequest request
    ) {
        userService.suspendUser(id, request);
        return ResponseEntity.ok().build();
    }
    
    @PostMapping("/{id}/release")
    public ResponseEntity<Void> releaseUser(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "") String reason
    ) {
        userService.releaseUser(id, reason);
        return ResponseEntity.ok().build();
    }
    
    @PostMapping("/{id}/change-grade")
    public ResponseEntity<Void> changeGrade(
            @PathVariable Long id,
            @RequestParam String grade
    ) {
        userService.changeGrade(id, grade);
        return ResponseEntity.ok().build();
    }
}
