package com.example.jokerweb.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReorderCategoriesRequest {
    private List<Long> categoryIds; // 순서대로 정렬된 카테고리 ID 목록
}
