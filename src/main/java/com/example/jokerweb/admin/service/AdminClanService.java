package com.example.jokerweb.admin.service;

import com.example.jokerweb.admin.dto.ChangeClanMasterRequest;
import com.example.jokerweb.admin.dto.ClanDetailResponse;
import com.example.jokerweb.admin.dto.ClanListResponse;
import com.example.jokerweb.admin.dto.SuspendClanRequest;
import com.example.jokerweb.clan.Clan;
import com.example.jokerweb.clan.ClanRepository;
import com.example.jokerweb.member.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AdminClanService {
    
    private final ClanRepository clanRepository;
    private final MemberRepository memberRepository;
    private final AuthorizationService authorizationService;
    
    public Page<ClanListResponse> getClans(
            String status, // active, deleted, suspended
            String search, // 클랜명 또는 병영주소 검색
            Pageable pageable
    ) {
        Specification<Clan> spec = Specification.where(null);
        
        if (status != null && !status.isEmpty()) {
            spec = spec.and((root, query, cb) -> 
                cb.equal(root.get("status"), status)
            );
        }
        
        if (search != null && !search.isEmpty()) {
            Specification<Clan> searchSpec = (root, query, cb) -> 
                cb.or(
                    cb.like(cb.lower(root.get("clanName")), "%" + search.toLowerCase() + "%"),
                    cb.like(cb.lower(root.get("barracksAddress")), "%" + search.toLowerCase() + "%")
                );
            spec = spec.and(searchSpec);
        }
        
        Page<Clan> clans = clanRepository.findAll(spec, pageable);
        
        return clans.map(clan -> ClanListResponse.builder()
                .id(clan.getId())
                .clanName(clan.getClanName())
                .barracksAddress(clan.getBarracksAddress())
                .master(clan.getMaster() != null ? clan.getMaster().getNickname() : "알 수 없음")
                .memberCount(clan.getMemberCount() != null ? clan.getMemberCount() : 0)
                .isVerified(clan.getIsVerified() != null ? clan.getIsVerified() : false)
                .status(clan.getStatus())
                .createdAt(clan.getCreatedAt())
                .build());
    }
    
    public ClanDetailResponse getClanDetail(Long clanId) {
        Clan clan = clanRepository.findById(clanId)
                .orElseThrow(() -> new RuntimeException("클랜을 찾을 수 없습니다: " + clanId));
        
        return ClanDetailResponse.builder()
                .id(clan.getId())
                .clanName(clan.getClanName())
                .barracksAddress(clan.getBarracksAddress())
                .master(clan.getMaster() != null ? clan.getMaster().getNickname() : "알 수 없음")
                .masterEmail(clan.getMaster() != null ? clan.getMaster().getEmail() : null)
                .description(clan.getDescription())
                .contact(clan.getContact())
                .isVerified(clan.getIsVerified() != null ? clan.getIsVerified() : false)
                .verifiedBy(clan.getVerifiedBy() != null ? clan.getVerifiedBy().getNickname() : null)
                .verifiedAt(clan.getVerifiedAt())
                .isSuspicious(clan.getIsSuspicious() != null ? clan.getIsSuspicious() : false)
                .suspiciousReason(clan.getSuspiciousReason())
                .memberCount(clan.getMemberCount() != null ? clan.getMemberCount() : 0)
                .status(clan.getStatus())
                .deletedAt(clan.getDeletedAt())
                .createdAt(clan.getCreatedAt())
                .updatedAt(clan.getUpdatedAt())
                .build();
    }
    
    @Transactional
    public void suspendClan(Long clanId, SuspendClanRequest request) {
        Clan clan = clanRepository.findById(clanId)
                .orElseThrow(() -> new RuntimeException("클랜을 찾을 수 없습니다: " + clanId));
        
        Long adminId = authorizationService.getCurrentUserId();
        if (adminId == null) {
            throw new RuntimeException("관리자 인증이 필요합니다");
        }
        
        clan.setStatus("suspended");
        clan.setSuspiciousReason(request.getReason());
        clan.setIsSuspicious(true);
        
        // 정지 기간이 설정된 경우 (향후 스케줄러로 해제 처리 가능)
        // 현재는 영구 정지로 처리
        
        clanRepository.save(clan);
    }
    
    @Transactional
    public void releaseClan(Long clanId) {
        Clan clan = clanRepository.findById(clanId)
                .orElseThrow(() -> new RuntimeException("클랜을 찾을 수 없습니다: " + clanId));
        
        Long adminId = authorizationService.getCurrentUserId();
        if (adminId == null) {
            throw new RuntimeException("관리자 인증이 필요합니다");
        }
        
        clan.setStatus("active");
        clan.setIsSuspicious(false);
        clan.setSuspiciousReason(null);
        
        clanRepository.save(clan);
    }
    
    @Transactional
    public void deleteClan(Long clanId, String reason) {
        Clan clan = clanRepository.findById(clanId)
                .orElseThrow(() -> new RuntimeException("클랜을 찾을 수 없습니다: " + clanId));
        
        Long adminId = authorizationService.getCurrentUserId();
        if (adminId == null) {
            throw new RuntimeException("관리자 인증이 필요합니다");
        }
        
        clan.setStatus("deleted");
        clan.setDeletedAt(LocalDateTime.now());
        clan.setSuspiciousReason(reason);
        
        clanRepository.save(clan);
    }
    
    @Transactional
    public void changeMaster(Long clanId, ChangeClanMasterRequest request) {
        Clan clan = clanRepository.findById(clanId)
                .orElseThrow(() -> new RuntimeException("클랜을 찾을 수 없습니다: " + clanId));
        
        Long adminId = authorizationService.getCurrentUserId();
        if (adminId == null) {
            throw new RuntimeException("관리자 인증이 필요합니다");
        }
        
        com.example.jokerweb.member.Member newMaster = memberRepository.findById(request.getNewMasterId())
                .orElseThrow(() -> new RuntimeException("새 마스터를 찾을 수 없습니다: " + request.getNewMasterId()));
        
        // 새 마스터가 클랜 멤버인지 확인 (선택적)
        // 여기서는 단순히 마스터만 변경
        
        clan.setMaster(newMaster);
        
        clanRepository.save(clan);
    }
}
