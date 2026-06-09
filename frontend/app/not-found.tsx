import Link from "next/link";

/** Friendly 404 — no raw Next.js default page. */
export default function NotFound() {
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-6"
      style={{
        background:
          "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(34,211,238,0.06), transparent 60%), #070a12",
      }}
    >
      <div className="w-full max-w-md text-center">
        <p className="text-5xl font-semibold tracking-tight text-slate-100 tabular-nums">404</p>
        <h1 className="mt-3 text-lg font-semibold text-slate-200">Страница не найдена</h1>
        <p className="mt-2 text-sm text-slate-400 leading-relaxed">
          Возможно, ссылка устарела или раздел был перемещён.
        </p>
        <Link
          href="/app"
          className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-cyan-100 transition-all hover:brightness-110"
          style={{ background: "rgba(34,211,238,0.15)", border: "1px solid rgba(34,211,238,0.35)" }}
        >
          Вернуться в приложение
        </Link>
      </div>
    </div>
  );
}
