"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuthStore } from "@/lib/auth-store";
import { useT } from "@/lib/i18n";

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

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 40,
  padding: "0 12px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
  color: "#e2e8f0",
  fontSize: "0.875rem",
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
};

export default function LoginPage() {
  const t = useT();
  const router = useRouter();
  const { login, register, loginWithGoogle, isLoading, isAuthenticated } = useAuthStore();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthenticated) router.replace("/app");
  }, [isAuthenticated, router]);

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setError("");
      try {
        await loginWithGoogle(tokenResponse.access_token);
        router.push("/app");
      } catch (err) {
        setError(err instanceof Error ? err.message : t('google_signin_failed'));
      }
    },
    onError: () => setError(t('google_signin_failed')),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (mode === "login") {
        if (!email || !password) { setError(t('fill_all_fields')); return; }
        await login(email, password);
        router.push("/app");
      } else {
        if (!name || !email || !password || !confirmPassword) { setError(t('fill_all_fields')); return; }
        if (password !== confirmPassword) { setError(t('passwords_dont_match')); return; }
        if (password.length < 6) { setError(t('password_min_6')); return; }
        await register(email, password, name);
        router.push("/app");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('something_went_wrong'));
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#07080f",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "0 16px",
      fontFamily: "inherit",
    }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 60% 40% at 50% 30%, rgba(124,111,224,0.06) 0%, transparent 70%)" }} />

      <div style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: 380 }}>

        {/* Logo */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, marginBottom: 32 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 13,
            border: "1px solid rgba(124,111,224,0.2)",
            background: "rgba(10,8,26,0.9)",
            display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden",
            boxShadow: "0 0 24px rgba(124,111,224,0.1)",
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.jpg" alt="TradeMind" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div style={{ textAlign: "center" }}>
            <h1 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 600, color: "#e2e8f0", letterSpacing: "-0.025em" }}>TradeMind</h1>
            <p style={{ margin: "4px 0 0", fontSize: "0.7rem", fontFamily: "monospace", letterSpacing: "0.2em", color: "rgba(100,116,139,0.45)" }}>{t('ai_powered_trading')}</p>
          </div>
        </div>

        {/* Card */}
        <div style={{ background: "#0b0a18", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden" }}>

          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            {(["login", "signup"] as const).map((m) => (
              <button key={m} onClick={() => { setMode(m); setError(""); }} style={{
                flex: 1, height: 44, background: "none", border: "none", cursor: "pointer",
                fontFamily: "inherit", fontSize: "0.85rem", fontWeight: 500,
                color: mode === m ? "#e2e8f0" : "rgba(100,116,139,0.6)",
                borderBottom: mode === m ? "2px solid rgba(124,111,224,0.7)" : "2px solid transparent",
                transition: "all 0.15s",
              }}>
                {m === "login" ? t('sign_in_tab') : t('sign_up_tab')}
              </button>
            ))}
          </div>

          <div style={{ padding: "24px" }}>

            {/* Error */}
            {error && (
              <div style={{ marginBottom: 16, padding: "10px 12px", borderRadius: 7, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", fontSize: "0.78rem", color: "rgba(252,165,165,0.85)" }}>
                {error}
              </div>
            )}

            {/* Google button */}
            <button
              onClick={() => handleGoogleLogin()}
              disabled={isLoading}
              style={{
                width: "100%", height: 42, display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8,
                cursor: isLoading ? "default" : "pointer", color: "#e2e8f0", fontSize: "0.875rem",
                fontFamily: "inherit", fontWeight: 500, transition: "all 0.15s ease", opacity: isLoading ? 0.6 : 1,
              }}
            >
              <GoogleLogo />
              {t('continue_with_google')}
            </button>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
              <span style={{ fontSize: "0.72rem", color: "rgba(100,116,139,0.4)", letterSpacing: "0.05em" }}>OR</span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
            </div>

            {/* Email/password form */}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {mode === "signup" && (
                <input
                  style={inputStyle}
                  type="text"
                  placeholder={t('full_name_ph')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              )}
              <input
                style={inputStyle}
                type="email"
                placeholder={t('email_ph')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                style={inputStyle}
                type="password"
                placeholder={t('password_ph')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {mode === "signup" && (
                <input
                  style={inputStyle}
                  type="password"
                  placeholder={t('confirm_password_ph')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              )}
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  marginTop: 4, width: "100%", height: 42, display: "flex", alignItems: "center", justifyContent: "center",
                  background: "rgba(124,111,224,0.15)", border: "1px solid rgba(124,111,224,0.3)", borderRadius: 8,
                  cursor: isLoading ? "default" : "pointer", color: "#c4b5fd", fontSize: "0.875rem",
                  fontFamily: "inherit", fontWeight: 500, transition: "all 0.15s ease", opacity: isLoading ? 0.6 : 1,
                }}
              >
                {isLoading ? t('please_wait') : mode === "login" ? t('sign_in_tab') : t('create_account_btn')}
              </button>
            </form>

            <p style={{ margin: "16px 0 0", fontSize: "0.7rem", textAlign: "center", color: "rgba(100,116,139,0.4)", lineHeight: 1.6 }}>
              {t('agree_terms_prefix')}{" "}
              <a href="/terms" style={{ color: "rgba(124,111,224,0.55)", textDecoration: "none" }}>{t('terms_link')}</a>{" "}{t('and_word')}{" "}
              <a href="/privacy" style={{ color: "rgba(124,111,224,0.55)", textDecoration: "none" }}>{t('privacy_link')}</a>
            </p>
          </div>
        </div>

        <p style={{ margin: "24px 0 0", textAlign: "center", fontSize: "0.65rem", fontFamily: "monospace", letterSpacing: "0.15em", color: "rgba(71,85,105,0.4)" }}>
          v1.0 · ALPHA
        </p>
      </div>

      <style>{`
        input::placeholder { color: rgba(100,116,139,0.4); }
        input:focus { border-color: rgba(124,111,224,0.4) !important; box-shadow: 0 0 0 2px rgba(124,111,224,0.1); }
      `}</style>
    </div>
  );
}
