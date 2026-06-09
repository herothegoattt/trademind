"use client";

import { useEffect } from "react";

/**
 * Top-level error boundary — catches failures in the root layout itself.
 * Must render its own <html>/<body>. This is the last line of defence against
 * a white screen.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="ru">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#070a12",
          color: "#e2e8f0",
          fontFamily:
            "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          padding: "24px",
        }}
      >
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <h1 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.01em", margin: 0 }}>
            Приложение временно недоступно
          </h1>
          <p style={{ marginTop: 10, fontSize: 14, lineHeight: 1.6, color: "#94a3b8" }}>
            Произошла непредвиденная ошибка. Попробуйте перезагрузить страницу.
          </p>
          <button
            onClick={() => reset()}
            style={{
              marginTop: 24,
              padding: "10px 18px",
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              color: "#cffafe",
              background: "rgba(34,211,238,0.15)",
              border: "1px solid rgba(34,211,238,0.35)",
              cursor: "pointer",
            }}
          >
            Перезагрузить
          </button>
        </div>
      </body>
    </html>
  );
}
