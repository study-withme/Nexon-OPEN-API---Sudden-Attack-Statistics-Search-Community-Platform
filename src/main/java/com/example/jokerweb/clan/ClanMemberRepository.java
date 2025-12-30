package com.example.jokerweb.clan;

import com.example.jokerweb.member.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ClanMemberRepository extends JpaRepository<ClanMember, Long> {
    boolean existsByClanAndMemberAndIsActiveTrue(Clan clan, Member member);
}
