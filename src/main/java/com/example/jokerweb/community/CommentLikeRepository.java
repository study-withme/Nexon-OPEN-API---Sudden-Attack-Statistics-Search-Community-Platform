package com.example.jokerweb.community;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CommentLikeRepository extends JpaRepository<CommentLike, CommentLike.CommentLikeId> {
    
    @Query("SELECT cl FROM CommentLike cl WHERE cl.comment.id = :commentId AND cl.member.id = :memberId")
    Optional<CommentLike> findByCommentIdAndMemberId(@Param("commentId") Long commentId, @Param("memberId") Long memberId);
    
    @Query("SELECT COUNT(cl) FROM CommentLike cl WHERE cl.comment.id = :commentId")
    long countByCommentId(@Param("commentId") Long commentId);
    
    boolean existsByCommentIdAndMemberId(Long commentId, Long memberId);
}

