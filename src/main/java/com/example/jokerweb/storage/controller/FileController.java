package com.example.jokerweb.storage.controller;

import com.example.jokerweb.auth.AuthService;
import com.example.jokerweb.storage.dto.FileUploadResponse;
import com.example.jokerweb.storage.service.FileUploadService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    private final FileUploadService fileUploadService;
    private final AuthService authService;

    @PostMapping("/upload")
    public ResponseEntity<FileUploadResponse> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        Long memberId = getCurrentMemberId(authorization);
        FileUploadResponse response = fileUploadService.uploadFile(file, memberId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{fileId}")
    public ResponseEntity<Void> deleteFile(
            @PathVariable Long fileId,
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        Long memberId = getCurrentMemberId(authorization);
        // TODO: ?? ?? (???? ?? ?????)
        fileUploadService.deleteFile(fileId);
        return ResponseEntity.noContent().build();
    }

    private Long getCurrentMemberId(String authorization) {
        if (authorization != null && authorization.startsWith("Bearer ")) {
            return authService.authenticate(authorization)
                    .map(member -> member.getId())
                    .orElse(null);
        }

        // SecurityContext ?? ?? ?? ??
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null
                && authentication.isAuthenticated()
                && !"anonymousUser".equals(authentication.getPrincipal())) {
            try {
                return Long.parseLong(authentication.getName());
            } catch (NumberFormatException e) {
                // ??? ??? ? ?? ?? ??
                log.debug("Authentication name is not a numeric ID: {}", authentication.getName());
            }
        }

        return null;
    }
}
