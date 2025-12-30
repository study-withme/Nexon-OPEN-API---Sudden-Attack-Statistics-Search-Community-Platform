package com.example.jokerweb.community;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PostDislikeRepository extends JpaRepository<PostDislike, PostDislike.PostDislikeId> {
    
    @Query("SELECT pd FROM PostDislike pd WHERE pd.post.id = :postId AND pd.member.id = :memberId")
    Optional<PostDislike> findByPostIdAndMemberId(@Param("postId") Long postId, @Param("memberId") Long memberId);
    
    @Query("SELECT COUNT(pd) FROM PostDislike pd WHERE pd.post.id = :postId")
    long countByPostId(@Param("postId") Long postId);
    
    boolean existsByPostIdAndMemberId(Long postId, Long memberId);
}

