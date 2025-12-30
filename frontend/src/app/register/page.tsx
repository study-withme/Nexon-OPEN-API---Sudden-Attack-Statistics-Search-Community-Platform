"use client";

import { FormEvent, useMemo, useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { login, register, checkEmailAvailability, checkNicknameAvailability, checkOuidAvailability } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { getOuidByNickname, getProfile, PlayerProfileResponse } from "@/lib/playerApi";
import Link from "next/link";
import { emitToast } from "@/lib/toast";

type Step = "basic" | "suddenattack" | "confirm";

type ValidationState = {
  checking: boolean;
  available: boolean | null;
  message: string;
};

type PasswordStrength = "weak" | "medium" | "strong";

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthed } = useAuth();
  const [step, setStep] = useState<Step>("basic");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [nickname, setNickname] = useState("");
  const [gameNickname, setGameNickname] = useState("");
  const [barracksAddress, setBarracksAddress] = useState("");
  const [useBarracksDirect, setUseBarracksDirect] = useState(false);
  const [skipSuddenAttack, setSkipSuddenAttack] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playerInfo, setPlayerInfo] = useState<PlayerProfileResponse | null>(null);
  const [ouid, setOuid] = useState<string | null>(null);

  const [emailValidation, setEmailValidation] = useState<ValidationState>({
    checking: false,
    available: null,
    message: "",
  });
  const [nicknameValidation, setNicknameValidation] = useState<ValidationState>({
    checking: false,
    available: null,
    message: "",
  });
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null);
  const [passwordMatch, setPasswordMatch] = useState<boolean | null>(null);

  const emailCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const nicknameCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const nextPath = useMemo(() => {
    const fromQuery = searchParams.get("next");
    if (fromQuery && fromQuery.startsWith("/")) return fromQuery;
    return "/";
  }, [searchParams]);

  // 이미 로그인된 경우 회원가입 페이지 접근 차단
  useEffect(() => {
    if (isAuthed) {
      emitToast({ message: "이미 로그인된 상태입니다.", type: "info" });
      router.replace(nextPath);
    }
  }, [isAuthed, router, nextPath]);

  // 비밀번호 강도 계산
  useEffect(() => {
    if (!password) {
      setPasswordStrength(null);
      return;
    }

    let strength: PasswordStrength = "weak";
    let score = 0;

    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password)) score++;
    if (password.length >= 12) score++;

    if (score >= 5) strength = "strong";
    else if (score >= 3) strength = "medium";
    else strength = "weak";

    setPasswordStrength(strength);
  }, [password]);

  // 비밀번호 확인 일치 여부
  useEffect(() => {
    if (!passwordConfirm) {
      setPasswordMatch(null);
      return;
    }
    setPasswordMatch(password === passwordConfirm);
  }, [password, passwordConfirm]);

  // 이메일 중복/형식 검사
  useEffect(() => {
    if (emailCheckTimeoutRef.current) {
      clearTimeout(emailCheckTimeoutRef.current);
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailValidation({ checking: false, available: null, message: "" });
      return;
    }

    emailCheckTimeoutRef.current = setTimeout(async () => {
      setEmailValidation({ checking: true, available: null, message: "" });
      try {
        const result = await checkEmailAvailability(email);
        setEmailValidation({
          checking: false,
          available: result.available,
          message: result.message,
        });
      } catch (err) {
        setEmailValidation({
          checking: false,
          available: null,
          message: "",
        });
      }
    }, 500);

    return () => {
      if (emailCheckTimeoutRef.current) {
        clearTimeout(emailCheckTimeoutRef.current);
      }
    };
  }, [email]);

  // 닉네임 중복 검사
  useEffect(() => {
    if (nicknameCheckTimeoutRef.current) {
      clearTimeout(nicknameCheckTimeoutRef.current);
    }

    if (!nickname || nickname.trim().length < 2) {
      setNicknameValidation({ checking: false, available: null, message: "" });
      return;
    }

    nicknameCheckTimeoutRef.current = setTimeout(async () => {
      setNicknameValidation({ checking: true, available: null, message: "" });
      try {
        const result = await checkNicknameAvailability(nickname);
        setNicknameValidation({
          checking: false,
          available: result.available,
          message: result.message,
        });
      } catch (err) {
        setNicknameValidation({
          checking: false,
          available: null,
          message: "",
        });
      }
    }, 500);

    return () => {
      if (nicknameCheckTimeoutRef.current) {
        clearTimeout(nicknameCheckTimeoutRef.current);
      }
    };
  }, [nickname]);

  const getPasswordStrengthColor = (strength: PasswordStrength | null) => {
    if (!strength) return "bg-slate-700";
    if (strength === "weak") return "bg-red-500";
    if (strength === "medium") return "bg-yellow-500";
    return "bg-green-500";
  };

  const getPasswordStrengthText = (strength: PasswordStrength | null) => {
    if (!strength) return "";
    if (strength === "weak") return "약함";
    if (strength === "medium") return "보통";
    return "강함";
  };

  async function handleBasicSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email || !password || !passwordConfirm) {
      setError("이메일과 비밀번호를 모두 입력해 주세요.");
      return;
    }

    if (emailValidation.available === false) {
      setError("이미 사용 중인 이메일입니다.");
      return;
    }

    if (nickname && nicknameValidation.available === false) {
      setError("이미 사용 중인 닉네임입니다.");
      return;
    }

    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (passwordStrength === "weak") {
      setError("비밀번호 보안 수준이 너무 낮습니다. 영문 대소문자, 숫자, 특수문자를 조합해 주세요.");
      return;
    }

    if (skipSuddenAttack) {
      // 서든어택 연동 없이 바로 가입 시 약관 동의 필요
      if (!agreeTerms || !agreePrivacy) {
        setError("약관과 개인정보 처리방침에 모두 동의해 주세요.");
        return;
      }
      handleFinalSubmit();
    } else {
      setStep("suddenattack");
    }
  }

  function extractOuid(input: string): string | null {
    if (!input) return null;
    const trimmed = input.trim();
    const urlMatch = trimmed.match(/barracks\.sa\.nexon\.com\/([^\/\s?#]+)(?:[\/?#]|$)/i);
    if (urlMatch?.[1]) {
      return urlMatch[1];
    }
    return trimmed;
  }

  async function handleSearchPlayer() {
    if (!gameNickname.trim() && !barracksAddress.trim()) {
      setError("게임 닉네임 또는 부대 홈페이지 주소를 입력해 주세요.");
      return;
    }

    setError(null);
    setSearching(true);

    try {
      let foundOuid: string | null = null;

      if (useBarracksDirect && barracksAddress.trim()) {
        foundOuid = extractOuid(barracksAddress);
        setOuid(foundOuid);
        try {
          if (foundOuid) {
            const profile = await getProfile(foundOuid);
            setPlayerInfo(profile);
          }
        } catch (err) {
          setPlayerInfo(null);
        }
      } else if (gameNickname.trim()) {
        const idResponse = await getOuidByNickname(gameNickname.trim());
        foundOuid = idResponse.ouid;
        setOuid(foundOuid);
        const profile = await getProfile(foundOuid);
        setPlayerInfo(profile);
      }

      if (foundOuid) {
        // OUID 중복 확인
        try {
          const ouidCheck = await checkOuidAvailability(foundOuid);
          if (!ouidCheck.available) {
            setError("이미 다른 계정에 등록된 캐릭터입니다.");
            return;
          }
        } catch (err) {
          // ?? ?? ?? ??? ?? ?? ??
        }
        setStep("confirm");
      } else {
        setError("해당 플레이어를 찾을 수 없습니다.");
      }
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
        (err as { message?: string })?.message ||
        "플레이어 정보를 조회하지 못했습니다.";
      setError(msg);
    } finally {
      setSearching(false);
    }
  }

  async function handleFinalSubmit() {
    setError(null);
    setLoading(true);

    try {
      await register({
        email,
        password,
        nickname: nickname || gameNickname || "익명 유저",
        ouid: ouid || undefined,
      });
      await login({ email, password });
      emitToast({ message: "회원가입이 완료되었습니다. 환영합니다.", type: "success" });
      router.replace(nextPath || "/");
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
        (err as { message?: string })?.message ||
        "회원가입 중 오류가 발생했습니다.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmSubmit(confirmed: boolean) {
    if (!confirmed) {
      setStep("suddenattack");
      setPlayerInfo(null);
      setOuid(null);
      return;
    }

    if (!agreeTerms || !agreePrivacy) {
      setError("약관과 개인정보 처리방침에 모두 동의해 주세요.");
      return;
    }

    handleFinalSubmit();
  }

  const stepProgress = step === "basic" ? 33 : step === "suddenattack" ? 66 : 100;

  return (
    <div className="mx-auto max-w-md px-4 pb-16 pt-12 space-y-6 animate-in fade-in duration-500">
      <div className="space-y-2 text-center">
        <p className="text-sm text-emerald-300 animate-in slide-in-from-top-4 duration-700">회원가입</p>
        <h1 className="text-3xl font-semibold text-emerald-100 animate-in slide-in-from-top-4 duration-700 delay-100">
          SA DATABASE
        </h1>
        <p className="text-sm text-slate-400 animate-in fade-in duration-700 delay-200">
          {step === "basic" && "기본 정보를 입력해 주세요."}
          {step === "suddenattack" && "서든어택 계정을 연동해 주세요. (선택)"}
          {step === "confirm" && "연동할 계정을 다시 한 번 확인해 주세요."}
        </p>

        {/* 진행률 표시 바 */}
        <div className="mt-4 w-full bg-slate-800 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-500 ease-out rounded-full"
            style={{ width: `${stepProgress}%` }}
          />
        </div>
        <p className="text-xs text-slate-500">{stepProgress}% 완료</p>
      </div>

      {/* 기본 정보 입력 */}
      {step === "basic" && (
        <form onSubmit={handleBasicSubmit} className="card p-6 space-y-4 animate-in slide-in-from-bottom-4 duration-500">
          <div className="space-y-2">
            <label className="text-sm text-slate-200 flex items-center justify-between">
              이메일 <span className="text-red-400">*</span>
              {emailValidation.checking && (
                <span className="text-xs text-slate-400 animate-pulse">중복 확인 중...</span>
              )}
              {!emailValidation.checking && emailValidation.available === true && (
                <span className="text-xs text-green-400">사용 가능한 이메일입니다</span>
              )}
              {!emailValidation.checking && emailValidation.available === false && (
                <span className="text-xs text-red-400">이미 사용 중인 이메일입니다</span>
              )}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일 주소를 입력해 주세요"
              className={`w-full rounded-lg border px-3 py-2 text-sm transition-all duration-200 bg-slate-950/70 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 ${
                emailValidation.available === false
                  ? "border-red-500 focus:border-red-500"
                  : emailValidation.available === true
                  ? "border-green-500 focus:border-green-500"
                  : "border-slate-800 focus:border-emerald-500"
              }`}
              required
            />
            {emailValidation.message && (
              <p
                className={`text-xs transition-all duration-200 ${
                  emailValidation.available ? "text-green-400" : "text-red-400"
                }`}
              >
                {emailValidation.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-200">
              비밀번호 <span className="text-red-400">*</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호 (최소 8자)"
              className="w-full rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              required
              minLength={8}
            />
            {password && (
              <div className="space-y-1">
                <div className="flex gap-1 h-1.5">
                  <div
                    className={`flex-1 rounded-full transition-all duration-300 ${getPasswordStrengthColor(
                      passwordStrength
                    )}`}
                  />
                  {passwordStrength !== "weak" && (
                    <div
                      className={`flex-1 rounded-full transition-all duration-300 ${getPasswordStrengthColor(
                        passwordStrength
                      )}`}
                    />
                  )}
                  {passwordStrength === "strong" && (
                    <div
                      className={`flex-1 rounded-full transition-all duration-300 ${getPasswordStrengthColor(
                        passwordStrength
                      )}`}
                    />
                  )}
                </div>
                <p
                  className={`text-xs ${
                    passwordStrength === "weak"
                      ? "text-red-400"
                      : passwordStrength === "medium"
                      ? "text-yellow-400"
                      : "text-green-400"
                  }`}
                >
                  비밀번호 보안 수준: {getPasswordStrengthText(passwordStrength)}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-200">
              비밀번호 확인 <span className="text-red-400">*</span>
            </label>
            <input
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="비밀번호를 한 번 더 입력해 주세요"
              className={`w-full rounded-lg border px-3 py-2 text-sm transition-all duration-200 bg-slate-950/70 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 ${
                passwordMatch === false
                  ? "border-red-500 focus:border-red-500"
                  : passwordMatch === true
                  ? "border-green-500 focus:border-green-500"
                  : "border-slate-800 focus:border-emerald-500"
              }`}
              required
            />
            {passwordConfirm && (
              <p
                className={`text-xs transition-all duration-200 ${
                  passwordMatch === false ? "text-red-400" : passwordMatch === true ? "text-green-400" : "text-slate-400"
                }`}
              >
                {passwordMatch === false
                  ? "비밀번호가 일치하지 않습니다."
                  : passwordMatch === true
                  ? "비밀번호가 일치합니다."
                  : ""}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-200 flex items-center justify-between">
              닉네임 (선택)
              {nicknameValidation.checking && (
                <span className="text-xs text-slate-400 animate-pulse">중복 확인 중...</span>
              )}
              {!nicknameValidation.checking && nickname && nicknameValidation.available === true && (
                <span className="text-xs text-green-400">사용 가능한 닉네임입니다</span>
              )}
              {!nicknameValidation.checking && nickname && nicknameValidation.available === false && (
                <span className="text-xs text-red-400">이미 사용 중인 닉네임입니다</span>
              )}
            </label>
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="사이트에서 사용할 별명 (한글, 영문, 숫자, 2-16자)"
              maxLength={16}
              className={`w-full rounded-lg border px-3 py-2 text-sm transition-all duration-200 bg-slate-950/70 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 ${
                nicknameValidation.available === false
                  ? "border-red-500 focus:border-red-500"
                  : nicknameValidation.available === true
                  ? "border-green-500 focus:border-green-500"
                  : "border-slate-800 focus:border-emerald-500"
              }`}
            />
            {nicknameValidation.message && (
              <p
                className={`text-xs transition-all duration-200 ${
                  nicknameValidation.available ? "text-green-400" : "text-red-400"
                }`}
              >
                {nicknameValidation.message}
              </p>
            )}
          </div>

          {/* 서든어택 계정 연동 생략 옵션 */}
          <label className="flex items-start gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={skipSuddenAttack}
              onChange={(e) => setSkipSuddenAttack(e.target.checked)}
              className="mt-1 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500 transition-all duration-200 group-hover:border-emerald-500"
            />
            <span className="text-sm text-slate-300">서든어택 연동 없이 먼저 가입하기</span>
          </label>

          {/* 서든어택 연동 없이 가입 시 약관 동의 필요 */}
          {skipSuddenAttack && (
            <div className="space-y-3 pt-2 border-t border-slate-800 animate-in slide-in-from-top-2 duration-300">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-1 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-300">
                  서비스 이용약관에 동의합니다 <span className="text-red-400">(필수)</span>
                </span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreePrivacy}
                  onChange={(e) => setAgreePrivacy(e.target.checked)}
                  className="mt-1 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-300">
                  개인정보 처리방침에 동의합니다 <span className="text-red-400">(필수)</span>
                </span>
              </label>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200 animate-in slide-in-from-top-2 duration-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || emailValidation.checking || nicknameValidation.checking}
            className="w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900 transition-all duration-200 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? "처리 중..." : skipSuddenAttack ? "약관 동의 후 가입하기" : "다음 단계로"}
          </button>
        </form>
      )}

      {/* 서든어택 계정 연동 단계 */}
      {step === "suddenattack" && (
        <div className="card p-6 space-y-4 animate-in slide-in-from-bottom-4 duration-500">
          <div className="space-y-2">
            <label className="text-sm text-slate-200">서든어택 계정 연동 (선택)</label>
            <p className="text-xs text-slate-400 mb-4">
              서든어택 계정을 연동하면 전적 정보를 불러와 다양한 기능을 사용할 수 있습니다.
            </p>

            <div className="flex items-center gap-2 mb-4">
              <button
                type="button"
                onClick={() => setUseBarracksDirect(false)}
                className={`flex-1 rounded-lg px-3 py-2 text-sm transition-all duration-300 transform hover:scale-[1.02] ${
                  !useBarracksDirect
                    ? "bg-emerald-500/20 text-emerald-200 border border-emerald-500/30"
                    : "bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-600"
                }`}
              >
                닉네임으로 검색
              </button>
              <button
                type="button"
                onClick={() => setUseBarracksDirect(true)}
                className={`flex-1 rounded-lg px-3 py-2 text-sm transition-all duration-300 transform hover:scale-[1.02] ${
                  useBarracksDirect
                    ? "bg-emerald-500/20 text-emerald-200 border border-emerald-500/30"
                    : "bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-600"
                }`}
              >
                부대 홈페이지 주소로 검색
              </button>
            </div>

            {!useBarracksDirect ? (
              <input
                type="text"
                value={gameNickname}
                onChange={(e) => setGameNickname(e.target.value)}
                placeholder="서든어택 게임 닉네임을 입력해 주세요"
                className="w-full rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all duration-200"
              />
            ) : (
              <input
                type="text"
                value={barracksAddress}
                onChange={(e) => setBarracksAddress(e.target.value)}
                placeholder="부대 홈페이지 전체 주소를 입력해 주세요"
                className="w-full rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all duration-200"
              />
            )}
          </div>

          {/* 약관 동의 */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-1 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
              />
              <span className="text-sm text-slate-300">
                서비스 이용약관에 동의합니다 <span className="text-red-400">(필수)</span>
              </span>
            </label>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={agreePrivacy}
                onChange={(e) => setAgreePrivacy(e.target.checked)}
                className="mt-1 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
              />
              <span className="text-sm text-slate-300">
                개인정보 처리방침에 동의합니다 <span className="text-red-400">(필수)</span>
              </span>
            </label>
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200 animate-in slide-in-from-top-2 duration-200">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setStep("basic");
                setError(null);
              }}
              className="flex-1 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              이전
            </button>
            <button
              type="button"
              onClick={handleSearchPlayer}
              disabled={searching || (!gameNickname.trim() && !barracksAddress.trim())}
              className="flex-1 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900 transition-all duration-200 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {searching ? "검색 중..." : "검색"}
            </button>
          </div>

          {/* ???? ?? */}
          <button
            type="button"
            onClick={() => {
              if (!agreeTerms || !agreePrivacy) {
                  setError("약관과 개인정보 처리방침에 모두 동의해 주세요.");
                return;
              }
              handleFinalSubmit();
            }}
            disabled={loading}
            className="w-full text-sm text-slate-400 hover:text-slate-300 transition-colors duration-200 py-2"
          >
            서든어택 연동 없이 바로 가입하기
          </button>
        </div>
      )}

      {/* 연동 계정 확인 단계 */}
      {step === "confirm" && (
        <div className="card p-6 space-y-4 animate-in slide-in-from-bottom-4 duration-500">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-semibold text-emerald-200 mb-2">연동 계정 확인</h2>
          </div>

          {playerInfo ? (
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-6 space-y-4 animate-in fade-in duration-500">
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-lg text-emerald-300">
                  <span className="text-base text-slate-400">클랜</span>
                  <span className="text-lg font-semibold text-emerald-200">
                    {playerInfo.clanName ? `[${playerInfo.clanName}]` : "없음"}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-emerald-100">{playerInfo.userName}</h3>
                <div className="flex items-center justify-center gap-3 text-sm text-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">계급</span>
                    {playerInfo.gradeImage ? (
                      <img
                        src={playerInfo.gradeImage}
                        alt={playerInfo.grade || "계급 정보 없음"}
                        className="h-6 w-6 rounded"
                      />
                    ) : (
                      <span className="text-emerald-200">{playerInfo.grade || "계급 정보 없음"}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">칭호</span>
                    <span className="text-emerald-200">{playerInfo.titleName || "없음"}</span>
                  </div>
                </div>
              </div>

              <div className="text-center">
                {playerInfo.ouid ? (
                  <a
                    href={`https://barracks.sa.nexon.com/${playerInfo.ouid}/match`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-emerald-400 hover:text-emerald-300 transition-colors duration-200"
                  >
                    부대 홈페이지에서 전적 보기
                  </a>
                ) : (
                  <p className="text-sm text-slate-400">부대 홈페이지 정보를 불러오지 못했습니다.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-6 text-center space-y-2 animate-in fade-in duration-500">
              <p className="text-slate-300">플레이어 OUID: {ouid || "없음"}</p>
              <p className="text-sm text-slate-400">프로필 정보를 찾지 못했습니다.</p>
              {ouid && (
                <a
                  href={`https://barracks.sa.nexon.com/${ouid}/match`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-emerald-400 hover:text-emerald-300 transition-colors duration-200"
                >
                  부대 홈페이지에서 전적 보기
                </a>
              )}
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200 animate-in slide-in-from-top-2 duration-200">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => handleConfirmSubmit(false)}
              disabled={loading}
              className="flex-1 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 transition-all duration-200 disabled:opacity-60 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              아니요 (다시 선택)
            </button>
            <button
              type="button"
              onClick={() => handleConfirmSubmit(true)}
              disabled={loading || !agreeTerms || !agreePrivacy}
              className="flex-1 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900 transition-all duration-200 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? "처리 중..." : "네 (이 계정 사용)"}
            </button>
          </div>
        </div>
      )}

      <p className="text-center text-sm text-slate-400 animate-in fade-in duration-700 delay-300">
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className="text-emerald-300 hover:text-emerald-200 transition-colors duration-200">
          로그인
        </Link>
        .
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
              <p className="text-white text-lg">불러오는 중...</p>
          </div>
        </div>
      }
    >
      <RegisterPageContent />
    </Suspense>
  );
}
