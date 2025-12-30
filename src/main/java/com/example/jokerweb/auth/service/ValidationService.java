package com.example.jokerweb.auth.service;

import com.example.jokerweb.auth.exception.DuplicateEmailException;
import com.example.jokerweb.auth.exception.DuplicateNicknameException;
import com.example.jokerweb.auth.exception.DuplicateOuidException;
import com.example.jokerweb.auth.exception.InvalidNicknameException;
import com.example.jokerweb.auth.exception.WeakPasswordException;
import com.example.jokerweb.auth.validation.NicknameValidator;
import com.example.jokerweb.auth.validation.PasswordValidator;
import com.example.jokerweb.member.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ValidationService {

    private final MemberRepository memberRepository;

    @Transactional(readOnly = true)
    public void validateEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("이메일을 입력해주세요.");
        }
        
        String trimmed = email.trim();
        if (memberRepository.existsByEmail(trimmed)) {
            throw new DuplicateEmailException("이미 사용 중인 이메일입니다.");
        }
    }

    @Transactional(readOnly = true)
    public void validateNickname(String nickname) {
        if (nickname == null || nickname.trim().isEmpty()) {
            return; // 닉네임은 선택사항
        }
        
        String trimmed = nickname.trim();
        try {
            NicknameValidator.validate(trimmed);
        } catch (IllegalArgumentException ex) {
            throw new InvalidNicknameException(ex.getMessage());
        }
        
        if (memberRepository.existsByNickname(trimmed)) {
            throw new DuplicateNicknameException("이미 사용 중인 닉네임입니다.");
        }
    }

    @Transactional(readOnly = true)
    public void validatePassword(String password) {
        try {
            PasswordValidator.validate(password);
        } catch (IllegalArgumentException ex) {
            throw new WeakPasswordException(ex.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public void validateOuid(String ouid) {
        if (ouid == null || ouid.trim().isEmpty()) {
            return; // OUID는 선택사항
        }
        
        String trimmed = ouid.trim();
        if (memberRepository.existsByOuid(trimmed)) {
            throw new DuplicateOuidException("이미 등록된 서든어택 계정입니다.");
        }
    }

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
            return true; // OUID는 선택사항이므로 빈 값은 사용 가능
        }
        return !memberRepository.existsByOuid(ouid.trim());
    }
}
