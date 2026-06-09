"use client";

import { useEffect } from "react";
import { RefreshCw } from "lucide-react";

/**
 * Error boundary scoped to the dashboard. Renders inside the app shell (sidebar
 * stays intact) so a failing category never takes down the whole app.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="h-full w-full flex items-center justify-center px-6 page-bg">
      <div className="w-full max-w-md text-center">
        <div
          className="mx-auto mb-5 grid place-items-center w-12 h-12 rounded-2xl"
          style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)" }}
        >
          <RefreshCw size={22} className="text-rose-400" />
        </div>
        <h2 className="text-lg font-semibold tracking-tight text-slate-100">Не удалось загрузить раздел</h2>
        <p className="mt-2 text-sm text-slate-400 leading-relaxed">
          Временная ошибка. Попробуйте ещё раз или откройте другой раздел в меню.
        </p>
        <button
          onClick={() => reset()}
          className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-cyan-100 transition-all hover:brightness-110"
          style={{ background: "rgba(34,211,238,0.15)", border: "1px solid rgba(34,211,238,0.35)" }}
        >
          <RefreshCw size={15} /> Повторить
        </button>
      </div>
    </div>
  );
}
