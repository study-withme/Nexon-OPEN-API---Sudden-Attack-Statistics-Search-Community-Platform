package com.example.jokerweb.admin.service;

import com.example.jokerweb.admin.role.MemberRoleRepository;
import com.example.jokerweb.admin.role.Permission;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthorizationService {
    
    private final MemberRoleRepository memberRoleRepository;
    
    public Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        try {
            return Long.parseLong(authentication.getName());
        } catch (NumberFormatException e) {
            return null;
        }
    }
    
    public boolean hasPermission(Long memberId, String resource, String action) {
        List<Permission> permissions = memberRoleRepository.findPermissionsByMemberId(memberId);
        return permissions.stream()
                .anyMatch(p -> p.getResource().equals(resource) && p.getAction().equals(action));
    }
    
    public boolean hasRole(Long memberId, String roleName) {
        List<com.example.jokerweb.admin.role.Role> roles = memberRoleRepository.findRolesByMemberId(memberId);
        return roles.stream()
                .anyMatch(r -> r.getName().equals(roleName));
    }
    
    public boolean hasCurrentUserPermission(String resource, String action) {
        Long userId = getCurrentUserId();
        if (userId == null) {
            return false;
        }
        return hasPermission(userId, resource, action);
    }
    
    public boolean hasCurrentUserRole(String roleName) {
        Long userId = getCurrentUserId();
        if (userId == null) {
            return false;
        }
        return hasRole(userId, roleName);
    }
    
    public List<String> getCurrentUserRoles() {
        Long userId = getCurrentUserId();
        if (userId == null) {
            return List.of();
        }
        return memberRoleRepository.findRolesByMemberId(userId).stream()
                .map(com.example.jokerweb.admin.role.Role::getName)
                .collect(Collectors.toList());
    }
}
