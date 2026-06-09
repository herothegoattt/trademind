"use client";

import { useEffect } from "react";
import { RefreshCw, Home } from "lucide-react";

/**
 * Route-level error boundary. Catches any render/runtime error inside a page so
 * the user gets a recoverable screen instead of a white page or a raw crash.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface for debugging without crashing the UI.
    console.error("Route error:", error);
  }, [error]);

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-6"
      style={{
        background:
          "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(34,211,238,0.06), transparent 60%), #070a12",
      }}
    >
      <div className="w-full max-w-md text-center">
        <div
          className="mx-auto mb-6 grid place-items-center w-14 h-14 rounded-2xl"
          style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)" }}
        >
          <RefreshCw size={24} className="text-rose-400" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-100">Что-то пошло не так</h1>
        <p className="mt-2 text-sm text-slate-400 leading-relaxed">
          Произошла временная ошибка на этой странице. Можно попробовать снова — ваши данные в безопасности.
        </p>
        <div className="mt-7 flex items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-cyan-100 transition-all hover:brightness-110"
            style={{ background: "rgba(34,211,238,0.15)", border: "1px solid rgba(34,211,238,0.35)" }}
          >
            <RefreshCw size={15} /> Повторить
          </button>
          <a
            href="/app"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 transition-colors hover:text-slate-100"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <Home size={15} /> На главную
          </a>
        </div>
      </div>
    </div>
  );
}
