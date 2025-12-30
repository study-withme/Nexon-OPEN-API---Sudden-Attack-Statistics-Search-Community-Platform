package com.example.jokerweb.clan;

import com.example.jokerweb.auth.AuthService;
import com.example.jokerweb.member.Member;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ClanService {

    private final ClanRepository clanRepository;
    private final ClanMemberRepository clanMemberRepository;
    private final ClanVerificationRequestRepository verificationRepository;
    private final AuthService authService;

    @Transactional
    public Clan create(String authorization, String clanName, String barracksAddress, String description, String contact) {
        Member master = authService.authenticate(authorization)
                .orElseThrow(() -> new IllegalArgumentException("로그인이 필요합니다."));
        if (clanRepository.existsByClanName(clanName)) {
            throw new IllegalArgumentException("이미 존재하는 클랜명입니다.");
        }
        if (clanRepository.existsByBarracksAddress(barracksAddress)) {
            throw new IllegalArgumentException("이미 존재하는 병영주소입니다.");
        }
        Clan clan = Clan.builder()
                .clanName(clanName)
                .barracksAddress(barracksAddress)
                .master(master)
                .description(description)
                .contact(contact)
                .status("active")
                .memberCount(1)
                .build();
        Clan saved = clanRepository.save(clan);
        clanMemberRepository.save(ClanMember.builder()
                .clan(saved)
                .member(master)
                .role("master")
                .isActive(true)
                .build());
        return saved;
    }

    @Transactional(readOnly = true)
    public List<Clan> list() {
        return clanRepository.findAll().stream()
                .filter(c -> !"deleted".equalsIgnoreCase(c.getStatus()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Clan detail(Long id) {
        return clanRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("클랜을 찾을 수 없습니다."));
    }

    @Transactional
    public ClanVerificationRequest requestVerification(String authorization, Long clanId, String reason) {
        Member requester = authService.authenticate(authorization)
                .orElseThrow(() -> new IllegalArgumentException("로그인이 필요합니다."));
        Clan clan = detail(clanId);
        ClanVerificationRequest req = ClanVerificationRequest.builder()
                .clan(clan)
                .requestedBy(requester)
                .reason(reason)
                .status("pending")
                .build();
        return verificationRepository.save(req);
    }

    @Transactional
    public void approveVerification(Long requestId, Member admin) {
        ClanVerificationRequest req = verificationRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("검증 요청을 찾을 수 없습니다."));
        req.setStatus("approved");
        req.setProcessedBy(admin);
        req.setProcessedAt(LocalDateTime.now());
        Clan clan = req.getClan();
        clan.setIsVerified(true);
        clan.setVerifiedBy(admin);
        clan.setVerifiedAt(LocalDateTime.now());
        verificationRepository.save(req);
        clanRepository.save(clan);
    }
}
