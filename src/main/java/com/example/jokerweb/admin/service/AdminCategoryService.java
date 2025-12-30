package com.example.jokerweb.admin.service;

import com.example.jokerweb.admin.dto.CategoryListResponse;
import com.example.jokerweb.admin.dto.CreateCategoryRequest;
import com.example.jokerweb.admin.dto.ReorderCategoriesRequest;
import com.example.jokerweb.admin.dto.UpdateCategoryRequest;
import com.example.jokerweb.community.Category;
import com.example.jokerweb.community.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminCategoryService {
    
    private final CategoryRepository categoryRepository;
    private final AuthorizationService authorizationService;
    
    public List<CategoryListResponse> getAllCategories() {
        List<Category> categories = categoryRepository.findAllByOrderByDisplayOrderAsc();
        return categories.stream()
                .map(category -> CategoryListResponse.builder()
                        .id(category.getId())
                        .name(category.getName())
                        .description(category.getDescription())
                        .displayOrder(category.getDisplayOrder())
                        .canWrite(category.getCanWrite() != null ? category.getCanWrite() : true)
                        .canRead(category.getCanRead() != null ? category.getCanRead() : true)
                        .build())
                .collect(Collectors.toList());
    }
    
    public CategoryListResponse getCategory(Long categoryId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("카테고리를 찾을 수 없습니다: " + categoryId));
        
        return CategoryListResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                .displayOrder(category.getDisplayOrder())
                .canWrite(category.getCanWrite() != null ? category.getCanWrite() : true)
                .canRead(category.getCanRead() != null ? category.getCanRead() : true)
                .build();
    }
    
    @Transactional
    public CategoryListResponse createCategory(CreateCategoryRequest request) {
        Long adminId = authorizationService.getCurrentUserId();
        if (adminId == null) {
            throw new RuntimeException("관리자 인증이 필요합니다");
        }
        
        // 이름 중복 확인
        if (categoryRepository.findByName(request.getName()).isPresent()) {
            throw new RuntimeException("이미 존재하는 카테고리 이름입니다: " + request.getName());
        }
        
        // displayOrder가 없으면 최대값 + 1로 설정
        Integer displayOrder = request.getDisplayOrder();
        if (displayOrder == null) {
            Integer maxOrder = categoryRepository.findMaxDisplayOrder();
            displayOrder = (maxOrder != null ? maxOrder : 0) + 1;
        }
        
        Category category = Category.builder()
                .name(request.getName())
                .description(request.getDescription())
                .displayOrder(displayOrder)
                .canWrite(request.getCanWrite() != null ? request.getCanWrite() : true)
                .canRead(request.getCanRead() != null ? request.getCanRead() : true)
                .build();
        
        Category saved = categoryRepository.save(category);
        
        return CategoryListResponse.builder()
                .id(saved.getId())
                .name(saved.getName())
                .description(saved.getDescription())
                .displayOrder(saved.getDisplayOrder())
                .canWrite(saved.getCanWrite() != null ? saved.getCanWrite() : true)
                .canRead(saved.getCanRead() != null ? saved.getCanRead() : true)
                .build();
    }
    
    @Transactional
    public CategoryListResponse updateCategory(Long categoryId, UpdateCategoryRequest request) {
        Long adminId = authorizationService.getCurrentUserId();
        if (adminId == null) {
            throw new RuntimeException("관리자 인증이 필요합니다");
        }
        
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("카테고리를 찾을 수 없습니다: " + categoryId));
        
        // 이름 변경 시 중복 확인
        if (request.getName() != null && !request.getName().equals(category.getName())) {
            if (categoryRepository.findByName(request.getName()).isPresent()) {
                throw new RuntimeException("이미 존재하는 카테고리 이름입니다: " + request.getName());
            }
            category.setName(request.getName());
        }
        
        if (request.getDescription() != null) {
            category.setDescription(request.getDescription());
        }
        
        if (request.getDisplayOrder() != null) {
            category.setDisplayOrder(request.getDisplayOrder());
        }
        
        if (request.getCanWrite() != null) {
            category.setCanWrite(request.getCanWrite());
        }
        
        if (request.getCanRead() != null) {
            category.setCanRead(request.getCanRead());
        }
        
        Category saved = categoryRepository.save(category);
        
        return CategoryListResponse.builder()
                .id(saved.getId())
                .name(saved.getName())
                .description(saved.getDescription())
                .displayOrder(saved.getDisplayOrder())
                .canWrite(saved.getCanWrite() != null ? saved.getCanWrite() : true)
                .canRead(saved.getCanRead() != null ? saved.getCanRead() : true)
                .build();
    }
    
    @Transactional
    public void deleteCategory(Long categoryId) {
        Long adminId = authorizationService.getCurrentUserId();
        if (adminId == null) {
            throw new RuntimeException("관리자 인증이 필요합니다");
        }
        
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("카테고리를 찾을 수 없습니다: " + categoryId));
        
        // 카테고리를 사용하는 게시글이 있는지 확인 (선택적)
        // 여기서는 단순히 삭제
        
        categoryRepository.delete(category);
    }
    
    @Transactional
    public void reorderCategories(ReorderCategoriesRequest request) {
        Long adminId = authorizationService.getCurrentUserId();
        if (adminId == null) {
            throw new RuntimeException("관리자 인증이 필요합니다");
        }
        
        List<Long> categoryIds = request.getCategoryIds();
        if (categoryIds == null || categoryIds.isEmpty()) {
            throw new RuntimeException("카테고리 ID 목록이 필요합니다");
        }
        
        // 모든 카테고리가 존재하는지 확인
        List<Category> categories = categoryRepository.findAllById(categoryIds);
        if (categories.size() != categoryIds.size()) {
            throw new RuntimeException("일부 카테고리를 찾을 수 없습니다");
        }
        
        // 순서대로 displayOrder 업데이트
        for (int i = 0; i < categoryIds.size(); i++) {
            Long categoryId = categoryIds.get(i);
            Category category = categories.stream()
                    .filter(c -> c.getId().equals(categoryId))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("카테고리를 찾을 수 없습니다: " + categoryId));
            category.setDisplayOrder(i + 1);
            categoryRepository.save(category);
        }
    }
}
