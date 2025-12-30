package com.example.jokerweb.community;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CommentDislikeRepository extends JpaRepository<CommentDislike, CommentDislike.CommentDislikeId> {
    
    @Query("SELECT cd FROM CommentDislike cd WHERE cd.comment.id = :commentId AND cd.member.id = :memberId")
    Optional<CommentDislike> findByCommentIdAndMemberId(@Param("commentId") Long commentId, @Param("memberId") Long memberId);
    
    @Query("SELECT COUNT(cd) FROM CommentDislike cd WHERE cd.comment.id = :commentId")
    long countByCommentId(@Param("commentId") Long commentId);
    
    boolean existsByCommentIdAndMemberId(Long commentId, Long memberId);
}

