package com.example.jokerweb.admin.controller;

import com.example.jokerweb.admin.dto.CategoryListResponse;
import com.example.jokerweb.admin.dto.CreateCategoryRequest;
import com.example.jokerweb.admin.dto.ReorderCategoriesRequest;
import com.example.jokerweb.admin.dto.UpdateCategoryRequest;
import com.example.jokerweb.admin.service.AdminCategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/categories")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminCategoryController {
    
    private final AdminCategoryService categoryService;
    
    @GetMapping
    public ResponseEntity<List<CategoryListResponse>> getAllCategories() {
        List<CategoryListResponse> categories = categoryService.getAllCategories();
        return ResponseEntity.ok(categories);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<CategoryListResponse> getCategory(@PathVariable Long id) {
        CategoryListResponse category = categoryService.getCategory(id);
        return ResponseEntity.ok(category);
    }
    
    @PostMapping
    public ResponseEntity<CategoryListResponse> createCategory(@RequestBody CreateCategoryRequest request) {
        CategoryListResponse category = categoryService.createCategory(request);
        return ResponseEntity.ok(category);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<CategoryListResponse> updateCategory(
            @PathVariable Long id,
            @RequestBody UpdateCategoryRequest request
    ) {
        CategoryListResponse category = categoryService.updateCategory(id, request);
        return ResponseEntity.ok(category);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.ok().build();
    }
    
    @PostMapping("/reorder")
    public ResponseEntity<Void> reorderCategories(@RequestBody ReorderCategoriesRequest request) {
        categoryService.reorderCategories(request);
        return ResponseEntity.ok().build();
    }
}
