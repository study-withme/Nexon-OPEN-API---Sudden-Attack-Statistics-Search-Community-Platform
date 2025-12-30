package com.example.jokerweb.admin.role;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RolePermissionRepository extends JpaRepository<RolePermission, RolePermissionId> {
    
    @Query("SELECT rp.permission FROM RolePermission rp WHERE rp.roleId = :roleId")
    List<Permission> findPermissionsByRoleId(@Param("roleId") Long roleId);
    
    @Modifying
    @Query("DELETE FROM RolePermission rp WHERE rp.roleId = :roleId")
    void deleteByRoleId(@Param("roleId") Long roleId);
    
    @Query("SELECT COUNT(rp) > 0 FROM RolePermission rp WHERE rp.roleId = :roleId AND rp.permissionId = :permissionId")
    boolean existsByRoleIdAndPermissionId(@Param("roleId") Long roleId, @Param("permissionId") Long permissionId);
}
