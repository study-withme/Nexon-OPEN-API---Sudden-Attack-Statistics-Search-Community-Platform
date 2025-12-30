package com.example.jokerweb.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateCategoryRequest {
    private String name;
    private String description;
    private Integer displayOrder;
    private Boolean canWrite;
    private Boolean canRead;
}
