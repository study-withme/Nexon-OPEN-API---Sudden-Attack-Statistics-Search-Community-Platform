package com.example.jokerweb.admin.role;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface MemberRoleRepository extends JpaRepository<MemberRole, Long> {
    
    List<MemberRole> findByMemberIdAndIsActiveTrue(Long memberId);
    
    @Query("SELECT mr FROM MemberRole mr LEFT JOIN FETCH mr.roleEntity WHERE mr.memberId = :memberId AND mr.isActive = true")
    List<MemberRole> findActiveRolesByMemberId(@Param("memberId") Long memberId);
    
    Optional<MemberRole> findByMemberIdAndRoleIdAndIsActiveTrue(Long memberId, Long roleId);
    
    @Query("SELECT mr.roleEntity FROM MemberRole mr WHERE mr.memberId = :memberId AND mr.isActive = true AND mr.roleEntity IS NOT NULL")
    List<Role> findRolesByMemberId(@Param("memberId") Long memberId);
    
    @Query("SELECT p FROM Permission p " +
           "JOIN RolePermission rp ON p.id = rp.permissionId " +
           "JOIN MemberRole mr ON rp.roleId = mr.roleId " +
           "WHERE mr.memberId = :memberId AND mr.isActive = true")
    List<Permission> findPermissionsByMemberId(@Param("memberId") Long memberId);
}
