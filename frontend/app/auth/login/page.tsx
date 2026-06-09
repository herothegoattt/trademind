"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useGoogleLogin } from "@react-oauth/google";
import { AnimatePresence, motion } from "framer-motion";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User as UserIcon,
  Check,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Sparkles,
  LineChart,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { useT } from "@/lib/i18n";

type Mode = "login" | "signup";

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335" />
    </svg>
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function passwordScore(pw: string): number {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 6) s++;
  if (pw.length >= 10) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(4, s);
}

export default function LoginPage() {
  const t = useT();
  const router = useRouter();
  const { login, register, loginWithGoogle, isLoading, isAuthenticated } = useAuthStore();

  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isAuthenticated) router.replace("/app");
  }, [isAuthenticated, router]);

  const emailValid = EMAIL_RE.test(email);
  const score = useMemo(() => passwordScore(password), [password]);
  const pwMatch = confirmPassword.length > 0 && password === confirmPassword;

  const switchMode = (m: Mode) => {
    setMode(m);
    setError("");
    setTouched({});
  };

  const applyStoredReferral = async () => {
    try {
      const code = localStorage.getItem("tm_ref_code");
      if (!code) return;
      const token = localStorage.getItem("access_token");
      if (!token) return;
      await fetch(`/api/v1/referral/register-referral?ref_code=${encodeURIComponent(code)}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      localStorage.removeItem("tm_ref_code");
    } catch {}
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setError("");
      try {
        await loginWithGoogle(tokenResponse.access_token);
        await applyStoredReferral();
        router.push("/app");
      } catch (err) {
        setError(err instanceof Error ? err.message : t("google_signin_failed"));
      }
    },
    onError: () => setError(t("google_signin_failed")),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setTouched({ name: true, email: true, password: true, confirm: true });
    try {
      if (mode === "login") {
        if (!email || !password) return setError(t("fill_all_fields"));
        await login(email, password);
        router.push("/app");
      } else {
        if (!name || !email || !password || !confirmPassword) return setError(t("fill_all_fields"));
        if (!emailValid) return setError(t("email_invalid"));
        if (password.length < 6) return setError(t("password_min_6"));
        if (password !== confirmPassword) return setError(t("passwords_dont_match"));
        await register(email, password, name);
        await applyStoredReferral();
        setSuccess(true);
        setTimeout(() => router.push("/app"), 700);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("something_went_wrong"));
    }
  };

  const strengthLabels = [t("pwd_weak"), t("pwd_weak"), t("pwd_fair"), t("pwd_good"), t("pwd_strong")];
  const strengthColors = ["bg-red-500", "bg-red-500", "bg-amber-500", "bg-cyan-500", "bg-emerald-500"];

  return (
    <div className="min-h-screen flex bg-[#06070d] text-white">
      {/* ── Left brand panel (desktop) ─────────────────────────────────── */}
      <div className="hidden lg:flex w-[44%] relative overflow-hidden border-r border-white/[0.06]">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 30% 20%, rgba(124,111,224,0.18) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 90%, rgba(34,211,238,0.10) 0%, transparent 60%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl overflow-hidden border border-purple-500/20 shadow-[0_0_24px_rgba(124,111,224,0.18)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.jpg" alt="TradeMind" className="w-full h-full object-cover" />
            </div>
            <span className="text-lg font-semibold tracking-tight">TradeMind</span>
          </div>

          <div className="space-y-8 max-w-sm">
            <h2 className="text-3xl font-bold leading-tight tracking-tight">
              The AI edge for
              <br />
              <span className="bg-gradient-to-r from-purple-300 to-cyan-300 bg-clip-text text-transparent">
                serious traders
              </span>
            </h2>
            <ul className="space-y-4">
              {[
                { icon: Sparkles, text: "AI-powered decision analysis" },
                { icon: LineChart, text: "Journal, setups & daily bias" },
                { icon: ShieldCheck, text: "Your data, private and secure" },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-sm text-gray-300">
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                    <Icon className="w-4 h-4 text-purple-300" />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-[11px] font-mono tracking-[0.2em] text-gray-700">v1.0 · ALPHA</p>
        </div>
      </div>

      {/* ── Right form ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex flex-col items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-purple-500/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.jpg" alt="TradeMind" className="w-full h-full object-cover" />
            </div>
            <span className="text-lg font-semibold tracking-tight">TradeMind</span>
          </div>

          {/* Heading */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight">
              {mode === "login" ? t("welcome_back") : t("create_account_heading")}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {mode === "login" ? t("login_subtitle") : t("signup_subtitle")}
            </p>
          </div>

          {/* Tabs */}
          <div className="relative grid grid-cols-2 p-1 rounded-xl bg-white/[0.03] border border-white/[0.07] mb-6">
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`relative z-10 py-2 text-sm font-medium rounded-lg transition-colors ${
                  mode === m ? "text-white" : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {m === "login" ? t("sign_in_tab") : t("sign_up_tab")}
              </button>
            ))}
            <motion.div
              layout
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg bg-gradient-to-r from-purple-600/30 to-purple-500/20 border border-purple-500/30"
              style={{ left: mode === "login" ? 4 : "calc(50% + 0px)" }}
            />
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-500/[0.08] border border-red-500/20 text-[13px] text-red-300">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Google */}
          <button
            onClick={() => handleGoogleLogin()}
            disabled={isLoading}
            className="w-full h-11 flex items-center justify-center gap-2.5 rounded-xl bg-white/[0.05] border border-white/[0.1] text-sm font-medium hover:bg-white/[0.08] transition-colors disabled:opacity-60"
          >
            <GoogleLogo />
            {t("continue_with_google")}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/[0.07]" />
            <span className="text-[11px] uppercase tracking-wider text-gray-600">
              {t("or_continue_with_email")}
            </span>
            <div className="flex-1 h-px bg-white/[0.07]" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <AnimatePresence initial={false}>
              {mode === "signup" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <Field
                    icon={<UserIcon className="w-4 h-4" />}
                    type="text"
                    placeholder={t("full_name_ph")}
                    value={name}
                    autoComplete="name"
                    onChange={setName}
                    onBlur={() => setTouched((s) => ({ ...s, name: true }))}
                  />
                </motion.div>
              )}

              <Field
                key="email"
                icon={<Mail className="w-4 h-4" />}
                type="email"
                placeholder={t("email_ph")}
                value={email}
                autoComplete="email"
                onChange={setEmail}
                onBlur={() => setTouched((s) => ({ ...s, email: true }))}
                invalid={touched.email && email.length > 0 && !emailValid}
                valid={emailValid}
              />
              {touched.email && email.length > 0 && !emailValid && (
                <p className="text-[11px] text-red-400 pl-1 -mt-1">{t("email_invalid")}</p>
              )}

              <Field
                key="password"
                icon={<Lock className="w-4 h-4" />}
                type={showPwd ? "text" : "password"}
                placeholder={t("password_ph")}
                value={password}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                onChange={setPassword}
                onBlur={() => setTouched((s) => ({ ...s, password: true }))}
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    aria-label={showPwd ? t("hide_pwd") : t("show_pwd")}
                    className="text-gray-500 hover:text-gray-300"
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />

              {/* Password strength (signup) */}
              {mode === "signup" && password.length > 0 && (
                <div className="flex items-center gap-2 pl-1">
                  <div className="flex gap-1 flex-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          i < score ? strengthColors[score] : "bg-white/[0.08]"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] text-gray-500 w-12 text-right">
                    {strengthLabels[score]}
                  </span>
                </div>
              )}

              {mode === "signup" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <Field
                    icon={<Lock className="w-4 h-4" />}
                    type={showPwd ? "text" : "password"}
                    placeholder={t("confirm_password_ph")}
                    value={confirmPassword}
                    autoComplete="new-password"
                    onChange={setConfirmPassword}
                    onBlur={() => setTouched((s) => ({ ...s, confirm: true }))}
                    invalid={touched.confirm && confirmPassword.length > 0 && !pwMatch}
                    valid={pwMatch}
                    trailing={
                      pwMatch ? <Check className="w-4 h-4 text-emerald-400" /> : undefined
                    }
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={isLoading || success}
              className="w-full h-11 mt-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 text-white text-sm font-semibold shadow-[0_4px_20px_rgba(124,111,224,0.25)] hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-70"
            >
              {success ? (
                <>
                  <Check className="w-4 h-4" /> {t("account_created")}
                </>
              ) : isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> {t("please_wait")}
                </>
              ) : mode === "login" ? (
                t("sign_in_tab")
              ) : (
                t("create_account_btn")
              )}
            </button>
          </form>

          {/* Terms */}
          <p className="mt-5 text-[11px] leading-relaxed text-center text-gray-600">
            {t("agree_terms_prefix")}{" "}
            <a href="/terms" className="text-purple-400/70 hover:text-purple-400">{t("terms_link")}</a>{" "}
            {t("and_word")}{" "}
            <a href="/privacy" className="text-purple-400/70 hover:text-purple-400">{t("privacy_link")}</a>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  icon,
  trailing,
  type,
  placeholder,
  value,
  autoComplete,
  onChange,
  onBlur,
  invalid,
  valid,
}: {
  icon: React.ReactNode;
  trailing?: React.ReactNode;
  type: string;
  placeholder: string;
  value: string;
  autoComplete?: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  invalid?: boolean;
  valid?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2.5 h-11 px-3 rounded-xl bg-white/[0.04] border transition-colors focus-within:border-purple-500/50 focus-within:bg-white/[0.06] ${
        invalid ? "border-red-500/40" : valid ? "border-emerald-500/30" : "border-white/[0.09]"
      }`}
    >
      <span className={invalid ? "text-red-400/70" : "text-gray-500"}>{icon}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className="flex-1 bg-transparent text-sm text-gray-100 placeholder-gray-600 outline-none"
      />
      {trailing}
    </div>
  );
}
