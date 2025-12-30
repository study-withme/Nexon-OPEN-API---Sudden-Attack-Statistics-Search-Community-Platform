package com.example.jokerweb.community;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PostLikeRepository extends JpaRepository<PostLike, PostLike.PostLikeId> {
    
    @Query("SELECT pl FROM PostLike pl WHERE pl.post.id = :postId AND pl.member.id = :memberId")
    Optional<PostLike> findByPostIdAndMemberId(@Param("postId") Long postId, @Param("memberId") Long memberId);
    
    @Query("SELECT COUNT(pl) FROM PostLike pl WHERE pl.post.id = :postId")
    long countByPostId(@Param("postId") Long postId);
    
    boolean existsByPostIdAndMemberId(Long postId, Long memberId);
}

