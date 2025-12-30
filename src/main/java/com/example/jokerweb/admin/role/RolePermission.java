package com.example.jokerweb.admin.role;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "role_permission")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@IdClass(RolePermissionId.class)
public class RolePermission {
    
    @Id
    @Column(name = "role_id")
    private Long roleId;
    
    @Id
    @Column(name = "permission_id")
    private Long permissionId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_id", insertable = false, updatable = false)
    private Role role;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "permission_id", insertable = false, updatable = false)
    private Permission permission;
}
