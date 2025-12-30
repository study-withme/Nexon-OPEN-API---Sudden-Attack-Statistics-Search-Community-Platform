package com.example.jokerweb.admin.role;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MemberGradeHistoryRepository extends JpaRepository<MemberGradeHistory, Long> {
    List<MemberGradeHistory> findByMemberIdOrderByChangedAtDesc(Long memberId);
}
