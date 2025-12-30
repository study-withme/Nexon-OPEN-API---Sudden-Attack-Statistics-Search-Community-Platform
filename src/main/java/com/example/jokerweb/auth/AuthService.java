package com.example.jokerweb.auth;

import com.example.jokerweb.admin.role.MemberRole;
import com.example.jokerweb.admin.role.MemberRoleRepository;
import com.example.jokerweb.admin.role.Role;
import com.example.jokerweb.admin.role.RoleRepository;
import com.example.jokerweb.auth.exception.DuplicateEmailException;
import com.example.jokerweb.auth.exception.DuplicateNicknameException;
import com.example.jokerweb.auth.exception.DuplicateOuidException;
import com.example.jokerweb.auth.exception.InvalidNicknameException;
import com.example.jokerweb.auth.exception.WeakPasswordException;
import com.example.jokerweb.auth.validation.NicknameValidator;
import com.example.jokerweb.auth.validation.PasswordValidator;
import com.example.jokerweb.member.Member;
import com.example.jokerweb.member.MemberRepository;
import com.example.jokerweb.nexon.NxOpenApiClient;
import com.example.jokerweb.nexon.dto.IdResponse;
import com.example.jokerweb.nexon.dto.UserBasicResponse;
import com.example.jokerweb.security.JwtTokenService;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenService jwtTokenService;
    private final MemberRoleRepository memberRoleRepository;
    private final RoleRepository roleRepository;
    private final NxOpenApiClient nxOpenApiClient;

    @Transactional(readOnly = true)
    public boolean checkEmailAvailability(String email) {
        if (email == null || email.trim().isEmpty()) {
            return false;
        }
        return !memberRepository.existsByEmail(email.trim());
    }

    @Transactional(readOnly = true)
    public boolean checkNicknameAvailability(String nickname) {
        if (nickname == null || nickname.trim().isEmpty()) {
            return false;
        }
        try {
            NicknameValidator.validate(nickname);
            return !memberRepository.existsByNickname(nickname.trim());
        } catch (Exception ex) {
            return false;
        }
    }

    @Transactional(readOnly = true)
    public boolean checkOuidAvailability(String ouid) {
        if (ouid == null || ouid.trim().isEmpty()) {
            return true; // OUID는 선택 항목이므로 비어 있어도 사용 가능
        }
        return !memberRepository.existsByOuid(ouid.trim());
    }

    @Transactional
    public Member register(RegisterRequest request) {
        // 이메일 중복 검사
        if (memberRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateEmailException("이미 사용 중인 이메일입니다.");
        }

        // 닉네임 검증 및 중복 검사
        if (request.getNickname() != null && !request.getNickname().trim().isEmpty()) {
            try {
                NicknameValidator.validate(request.getNickname());
            } catch (IllegalArgumentException ex) {
                throw new InvalidNicknameException(ex.getMessage());
            }
            
            if (memberRepository.existsByNickname(request.getNickname().trim())) {
                throw new DuplicateNicknameException("이미 사용 중인 닉네임입니다.");
            }
        }

        // 비밀번호 검증
        try {
            PasswordValidator.validate(request.getPassword());
        } catch (IllegalArgumentException ex) {
            throw new WeakPasswordException(ex.getMessage());
        }

        // OUID 중복 검사 (OUID가 제공된 경우에만)
        if (request.getOuid() != null && !request.getOuid().trim().isEmpty()) {
            if (memberRepository.existsByOuid(request.getOuid().trim())) {
                throw new DuplicateOuidException("이미 등록된 OUID입니다.");
            }
        }

        // 넥슨 프로필 정보 조회
        NexonProfile profile;
        try {
            profile = fetchNexonProfile(request.getOuid(), request.getNickname());
        } catch (Exception ex) {
            log.warn("넥슨 API 오류 발생, 기본 프로필로 진행: {}", ex.getMessage());
            profile = new NexonProfile(
                    request.getOuid(),
                    null,
                    null,
                    null,
                    false
            );
        }

        // 회원 생성
        Member member = Member.builder()
                .email(request.getEmail().trim())
                .nickname((request.getNickname() != null && !request.getNickname().trim().isEmpty())
                        ? request.getNickname().trim()
                        : "사용자")
                .ouid(profile.ouid() != null ? profile.ouid() : null)
                .clanName(profile.clanName())
                .titleName(profile.titleName())
                .mannerGrade(profile.mannerGrade())
                .nexonLinked(profile.linked())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .build();
        
        member = memberRepository.save(member);

        // 湲곕?�� �뿭�븷(USER) �옄�룞 �븷�떦
        assignDefaultRole(member.getId());

        return member;
    }

    private void assignDefaultRole(Long memberId) {
        try {
            Role userRole = roleRepository.findByName("USER")
                    .orElseThrow(() -> new RuntimeException("USER �뿭�븷�쓣 李얠?�� �닔 �뾾�뒿�땲�떎."));
            
            // �씠誘� �뿭�븷�씠 �엳�뒗吏� �솗�씤
            Optional<MemberRole> existingRole = memberRoleRepository.findByMemberIdAndRoleIdAndIsActiveTrue(memberId, userRole.getId());
            if (existingRole.isPresent()) {
                log.debug("�쉶�썝 {}�뒗 �씠誘� USER �뿭�븷�씠 �엳�뒿�땲�떎.", memberId);
                return;
            }

            MemberRole memberRole = MemberRole.builder()
                    .memberId(memberId)
                    .roleId(userRole.getId())
                    .role("USER") // 湲곗??? �샇�솚�꽦�쓣 �쐞�븳 �븘�뱶
                    .isActive(true)
                    .build();
            
            memberRoleRepository.save(memberRole);
            log.debug("�쉶�썝 {}�뿉 USER �뿭�븷�씠 �븷�떦�릺��??�뒿�땲�떎.", memberId);
        } catch (Exception ex) {
            log.error("湲곕?�� �뿭�븷 �븷�떦 �떎�뙣 (memberId: {}): {}", memberId, ex.getMessage(), ex);
            // �뿭�븷 �븷�떦 �떎�뙣�빐�룄 �쉶�썝媛��엯���? 吏꾪�? (湲곗??? �룞�옉 ��??吏�)
        }
    }

    @Transactional
    public LoginResponse login(LoginRequest request, String clientIp) {
        Member member = memberRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("�씠硫붿?�� �삉�뒗 ?��꾨��踰?��?��?���? �솗�씤�빐二쇱�?�슂."));

        if (!passwordEncoder.matches(request.getPassword(), member.getPasswordHash())) {
            throw new IllegalArgumentException("�씠硫붿?�� �삉�뒗 ?��꾨��踰?��?��?���? �솗�씤�빐二쇱�?�슂.");
        }

        // 濡쒓?���씤 �씠�젰 �뾽�뜲�씠�듃
        if (clientIp != null && !clientIp.isBlank()) {
            member.updateLoginInfo(clientIp);
        }

        // 濡쒓?���씤 �떆 Nexon �룞湲고?�� (�떎�뙣�빐�룄 濡쒓?���씤���? ��??�슜�븯�릺 nexonLinked �뵆�옒洹몃?�� 議곗?��)
        syncNexonIfPossible(member);

        // 蹂�寃쎌궗��? ����?��
        memberRepository.save(member);

        List<String> roles = getActiveRoleNames(member.getId());
        String token = jwtTokenService.generateToken(member.getId(), member.getEmail(), roles);

        return LoginResponse.builder()
                .token(token)
                .member(MemberResponse.from(member, roles))
                .build();
    }

    public Optional<Member> authenticate(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            return Optional.empty();
        }
        String token = authorizationHeader.substring("Bearer ".length());
        try {
            Long memberId = Long.parseLong(jwtTokenService.parse(token).getSubject());
            return memberRepository.findById(memberId);
        } catch (Exception ex) {
            return Optional.empty();
        }
    }

    @Transactional(readOnly = true)
    public Optional<MemberResponse> authenticateWithRoles(String authorizationHeader) {
        try {
            return authenticate(authorizationHeader)
                    .map(member -> {
                        try {
                            List<String> roles = getActiveRoleNames(member.getId());
                            return MemberResponse.from(member, roles);
                        } catch (Exception ex) {
                            log.error("�궗�슜�옄 �뿭�븷 議고?�� 以� �삤?���? 諛쒖�? (memberId: {})", member.getId(), ex);
                            // �뿭�븷 議고?�� �떎�뙣 �떆 湲곕?�� �뿭�븷濡� �쓳�떟
                            return MemberResponse.from(member, List.of("USER"));
                        }
                    });
        } catch (Exception ex) {
            log.error("�씤利� 泥섎?�� 以� �삤?���? 諛쒖�?", ex);
            return Optional.empty();
        }
    }

    @Transactional
    public Optional<MemberResponse> linkNexon(String authorizationHeader, LinkNexonRequest request) {
        Optional<Member> memberOpt = authenticate(authorizationHeader);
        if (memberOpt.isEmpty()) {
            return Optional.empty();
        }
        Member member = memberOpt.get();
        NexonProfile profile = fetchNexonProfile(request.getOuid(), request.getNickname());
        member.setOuid(profile.ouid());
        member.setClanName(profile.clanName());
        member.setTitleName(profile.titleName());
        member.setMannerGrade(profile.mannerGrade());
        member.setNexonLinked(profile.linked());
        memberRepository.save(member);
        return Optional.of(MemberResponse.from(member, getActiveRoleNames(member.getId())));
    }

    @Transactional(readOnly = true)
    public List<String> getActiveRoleNames(Long memberId) {
        try {
            List<MemberRole> roles = memberRoleRepository.findActiveRolesByMemberId(memberId);
            List<String> roleNames = roles.stream()
                    .map(role -> {
                        try {
                            // role_id媛� �엳�쑝硫� role ��?��?��?��붿뿉�꽌 �씠?���? 媛��졇�삤湲�
                            if (role.getRoleEntity() != null && role.getRoleEntity().getName() != null) {
                                return role.getRoleEntity().getName();
                            }
                            // role_id媛� �뾾�쑝硫� role ??�щ읆 吏곸?�� �궗�슜 (湲곗??? �샇�솚�꽦)
                            if (role.getRole() != null && !role.getRole().isBlank()) {
                                return role.getRole();
                            }
                            return null;
                        } catch (Exception ex) {
                            log.warn("�뿭�븷 �젙蹂� ?��붿텧 以� �삤?���? (memberId: {}, roleId: {})", memberId, role.getId(), ex);
                            return null;
                        }
                    })
                    .filter(name -> name != null && !name.isBlank())
                    .map(String::toUpperCase)
                    .distinct()
                    .collect(Collectors.toList());
            
            // �뿭�븷�씠 �뾾�쑝硫� 湲곕?�� USER �뿭�븷 ?��붽��?
            if (roleNames.isEmpty()) {
                roleNames.add("USER");
            }
            
            return roleNames;
        } catch (Exception ex) {
            log.error("�궗�슜�옄 �뿭�븷 議고?�� 以� �삤?���? 諛쒖�? (memberId: {})", memberId, ex);
            // �삁�쇅 諛쒖�? �떆 湲곕?�� �뿭�븷 諛섑?��
            return List.of("USER");
        }
    }

    private void syncNexonIfPossible(Member member) {
        try {
            NexonProfile profile = fetchNexonProfile(member.getOuid(), member.getNickname());
            if (profile.linked()) {
                member.setOuid(profile.ouid());
                member.setClanName(profile.clanName());
                member.setTitleName(profile.titleName());
                member.setMannerGrade(profile.mannerGrade());
                member.setNexonLinked(true);
                memberRepository.save(member);
            }
        } catch (Exception ignored) {
            // 濡쒓?���씤���? 吏꾪뻾��?�릺, �룞湲고?�� �떎�뙣 �떆 nexonLinked�뒗 湲곗??? 媛� ��??吏�
        }
    }

    private NexonProfile fetchNexonProfile(String ouid, String nickname) {
        // 회원가입 단계에서 사이트 닉네임만으로 서든어택 계정이 자동 연동되는 것을 막기 위해
        // 더 이상 닉네임으로 OUID를 역조회하지 않는다.
        // OUID가 명시적으로 제공된 경우에만 넥슨 프로필을 조회하고, 그렇지 않으면 "연동 안 됨" 상태로 처리한다.
        if (ouid == null || ouid.isBlank()) {
            return new NexonProfile(null, null, null, null, false);
        }

        String resolvedOuid = ouid;
        UserBasicResponse basic = nxOpenApiClient.getUserBasic(resolvedOuid);
        if (basic == null) {
            return new NexonProfile(resolvedOuid, null, null, null, false);
        }
        return new NexonProfile(
                resolvedOuid,
                basic.getClanName(),
                basic.getTitleName(),
                basic.getMannerGrade(),
                true
        );
    }

    private record NexonProfile(
            String ouid,
            String clanName,
            String titleName,
            String mannerGrade,
            boolean linked
    ) {}
}

