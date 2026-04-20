"use client";
/**
 * /ref/[code] — referral landing page.
 * Tracks the click, saves the code to localStorage, then redirects to signup.
 */
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ReferralLandingPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params?.code as string || "").toUpperCase();

  useEffect(() => {
    if (!code) { router.replace("/auth/signup"); return; }

    // Save the code so it can be applied after signup
    try { localStorage.setItem("tm_ref_code", code); } catch {}

    // Track the click (fire-and-forget)
    fetch("/api/v1/referral/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    }).catch(() => {});

    // Short delay then redirect
    const t = setTimeout(() => router.replace("/auth/signup"), 800);
    return () => clearTimeout(t);
  }, [code, router]);

  return (
    <div
      className="h-screen w-screen flex items-center justify-center"
      style={{ background: "#020308" }}
    >
      <div className="text-center space-y-4">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
          style={{
            background: "linear-gradient(135deg, rgba(167,139,250,0.2), rgba(34,211,238,0.15))",
            border: "1px solid rgba(167,139,250,0.3)",
          }}
        >
          <span className="text-2xl">🎁</span>
        </div>
        <div>
          <div className="text-white font-bold text-lg">You&apos;ve been invited!</div>
          <div className="text-gray-400 text-sm mt-1">
            Use code <span className="text-violet-300 font-mono font-bold">{code}</span> for 15% off
          </div>
        </div>
        <div className="text-gray-600 text-xs">Redirecting to sign up…</div>
      </div>
    </div>
  );
}
