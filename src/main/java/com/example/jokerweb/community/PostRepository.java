package com.example.jokerweb.community;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {

    Page<Post> findByCategoryAndIsDeletedFalse(String category, Pageable pageable);

    Page<Post> findByIsDeletedFalse(Pageable pageable);

    List<Post> findByCategoryAndIsDeletedFalse(String category, Sort sort);

    List<Post> findByIsDeletedFalse(Sort sort);

    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    long countByCategoryAndCreatedAtBetween(String category, LocalDateTime start, LocalDateTime end);

    @Query("SELECT p.category, COUNT(p) FROM Post p WHERE p.isDeleted = false GROUP BY p.category")
    List<Object[]> countByCategory();

    @Query(value = "SELECT COALESCE(m.nickname, '익명'), p.created_at FROM post p LEFT JOIN member m ON p.author_id = m.id WHERE p.is_deleted = false ORDER BY p.created_at DESC LIMIT :limit", nativeQuery = true)
    List<Object[]> findRecentPosts(@Param("limit") int limit);

    @Query("SELECT p FROM Post p WHERE p.isDeleted = false AND " +
           "(:category IS NULL OR p.category = :category) AND " +
           "(:search IS NULL OR p.title LIKE %:search% OR p.content LIKE %:search% OR (p.author IS NOT NULL AND p.author.nickname LIKE %:search%))")
    Page<Post> searchPosts(@Param("category") String category, @Param("search") String search, Pageable pageable);

    @Query("SELECT COUNT(p) FROM Post p WHERE p.author IS NOT NULL AND p.author.id = :authorId")
    long countByAuthorId(@Param("authorId") Long authorId);

    @Query("SELECT COALESCE(SUM(p.likes), 0) FROM Post p WHERE p.author IS NOT NULL AND p.author.id = :authorId")
    Long sumLikesByAuthorId(@Param("authorId") Long authorId);
    
    // author를 fetch join으로 가져오는 메서드 (author가 null일 수 있으므로 LEFT JOIN 사용)
    @Query("SELECT p FROM Post p LEFT JOIN FETCH p.author WHERE p.id = :id")
    java.util.Optional<Post> findByIdWithAuthor(@Param("id") Long id);
    
    // author를 EntityGraph로 가져오는 페이징 메서드들
    @EntityGraph(attributePaths = {"author"})
    @Query("SELECT p FROM Post p WHERE p.category = :category AND p.isDeleted = false")
    Page<Post> findByCategoryAndIsDeletedFalseWithAuthor(@Param("category") String category, Pageable pageable);
    
    @EntityGraph(attributePaths = {"author"})
    @Query("SELECT p FROM Post p WHERE p.isDeleted = false")
    Page<Post> findByIsDeletedFalseWithAuthor(Pageable pageable);
    
    @EntityGraph(attributePaths = {"author"})
    @Query("SELECT p FROM Post p WHERE p.isDeleted = false AND " +
           "(:category IS NULL OR p.category = :category) AND " +
           "(:search IS NULL OR p.title LIKE %:search% OR p.content LIKE %:search% OR (p.author IS NOT NULL AND p.author.nickname LIKE %:search%))")
    Page<Post> searchPostsWithAuthor(@Param("category") String category, @Param("search") String search, Pageable pageable);
    
    // 조회수 원자적 증가 (동시성 문제 방지)
    @Query("UPDATE Post p SET p.views = COALESCE(p.views, 0) + 1 WHERE p.id = :id AND (p.isDeleted = false OR p.isDeleted IS NULL)")
    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true)
    @org.springframework.transaction.annotation.Transactional
    int incrementViews(@Param("id") Long id);
}
