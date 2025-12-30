package com.example.jokerweb.admin.service;

import com.example.jokerweb.admin.role.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RoleService {
    
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final RolePermissionRepository rolePermissionRepository;
    private final MemberRoleRepository memberRoleRepository;
    
    public List<Role> getAllRoles() {
        return roleRepository.findAll();
    }
    
    public Role getRoleById(Long id) {
        return roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("역할을 찾을 수 없습니다: " + id));
    }
    
    public Role getRoleByName(String name) {
        return roleRepository.findByName(name)
                .orElseThrow(() -> new RuntimeException("역할을 찾을 수 없습니다: " + name));
    }
    
    @Transactional
    public Role createRole(String name, String displayName, String description) {
        Role role = Role.builder()
                .name(name)
                .displayName(displayName)
                .description(description)
                .build();
        return roleRepository.save(role);
    }
    
    @Transactional
    public Role updateRole(Long id, String displayName, String description) {
        Role role = getRoleById(id);
        role.setDisplayName(displayName);
        role.setDescription(description);
        return roleRepository.save(role);
    }
    
    @Transactional
    public void deleteRole(Long id) {
        roleRepository.deleteById(id);
    }
    
    public List<Permission> getRolePermissions(Long roleId) {
        return rolePermissionRepository.findPermissionsByRoleId(roleId);
    }
    
    @Transactional
    public void setRolePermissions(Long roleId, List<Long> permissionIds) {
        rolePermissionRepository.deleteByRoleId(roleId);
        for (Long permissionId : permissionIds) {
            RolePermission rp = new RolePermission();
            rp.setRoleId(roleId);
            rp.setPermissionId(permissionId);
            rolePermissionRepository.save(rp);
        }
    }
    
    public List<Permission> getAllPermissions() {
        return permissionRepository.findAll();
    }
    
    public Permission getPermissionByResourceAndAction(String resource, String action) {
        return permissionRepository.findByResourceAndAction(resource, action)
                .orElseThrow(() -> new RuntimeException("권한을 찾을 수 없습니다: " + resource + "." + action));
    }
}
