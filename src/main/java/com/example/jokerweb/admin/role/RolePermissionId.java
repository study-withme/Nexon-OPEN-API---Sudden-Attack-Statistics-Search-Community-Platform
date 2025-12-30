package com.example.jokerweb.admin.role;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import java.io.Serializable;

@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class RolePermissionId implements Serializable {
    private Long roleId;
    private Long permissionId;
}
