package com.example.jokerweb.community;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {

    @Query("SELECT c FROM Comment c WHERE c.post.id = :postId AND c.isDeleted = false ORDER BY c.createdAt ASC")
    List<Comment> findByPostIdAndIsDeletedFalseOrderByCreatedAtAsc(@Param("postId") Long postId);
    
    // author를 fetch join으로 가져오는 메서드 (author가 null일 수 있으므로 LEFT JOIN 사용)
    @Query("SELECT c FROM Comment c LEFT JOIN FETCH c.author WHERE c.post.id = :postId AND c.isDeleted = false ORDER BY c.createdAt ASC")
    List<Comment> findByPostIdAndIsDeletedFalseWithAuthor(@Param("postId") Long postId);
    
    // parent_id를 직접 조회하는 쿼리 (Lazy loading 문제 방지)
    // parent가 null인 경우를 처리하기 위해 LEFT JOIN 사용
    @Query("SELECT c.id, COALESCE(c.parent.id, NULL) FROM Comment c LEFT JOIN c.parent WHERE c.post.id = :postId AND c.isDeleted = false")
    List<Object[]> findCommentIdsWithParentIds(@Param("postId") Long postId);

    @Query("SELECT COUNT(c) FROM Comment c WHERE c.post.id = :postId AND c.isDeleted = false")
    long countByPostIdAndIsDeletedFalse(@Param("postId") Long postId);

    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    @Query("SELECT CASE WHEN c.author IS NOT NULL THEN c.author.nickname ELSE '익명' END, c.createdAt FROM Comment c WHERE c.isDeleted = false ORDER BY c.createdAt DESC")
    List<Object[]> findRecentComments(int limit);

    @Query("SELECT COUNT(c) FROM Comment c WHERE c.author IS NOT NULL AND c.author.id = :authorId")
    long countByAuthorId(@Param("authorId") Long authorId);

    @Query("SELECT COALESCE(SUM(c.likes), 0) FROM Comment c WHERE c.author IS NOT NULL AND c.author.id = :authorId")
    Long sumLikesByAuthorId(@Param("authorId") Long authorId);
}
