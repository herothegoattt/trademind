"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowUp, FileText, Shield } from "lucide-react";

export interface LegalSection {
  id: string;
  num: string;
  title: string;
  content: React.ReactNode;
}

interface LegalLayoutProps {
  type: "terms" | "privacy";
  title: string;
  subtitle: string;
  updated: string;
  sections: LegalSection[];
}

export function LegalLayout({ type, title, subtitle, updated, sections }: LegalLayoutProps) {
  const [progress, setProgress]         = useState(0);
  const [activeId, setActiveId]         = useState(sections[0]?.id ?? "");
  const [showTop, setShowTop]           = useState(false);
  const [headerSolid, setHeaderSolid]   = useState(false);
  const observerRef                     = useRef<IntersectionObserver | null>(null);
  const sectionRefs                     = useRef<Map<string, HTMLElement>>(new Map());

  // ── Scroll progress + show-top + header opacity ──────────────────────────
  useEffect(() => {
    const onScroll = () => {
      const el  = document.documentElement;
      const pct = (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100;
      setProgress(Math.min(100, pct));
      setShowTop(el.scrollTop > 400);
      setHeaderSolid(el.scrollTop > 10);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Active section via IntersectionObserver ───────────────────────────────
  useEffect(() => {
    observerRef.current?.disconnect();
    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the topmost visible section
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 }
    );
    sectionRefs.current.forEach((el) => observer.observe(el));
    observerRef.current = observer;
    return () => observer.disconnect();
  }, [sections]);

  const registerRef = useCallback((id: string) => (el: HTMLElement | null) => {
    if (el) sectionRefs.current.set(id, el);
    else    sectionRefs.current.delete(id);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const accent      = type === "terms" ? "#2dd4bf" : "#8b5cf6";
  const accentAlpha = type === "terms" ? "rgba(45,212,191," : "rgba(139,92,246,";
  const Icon        = type === "terms" ? FileText : Shield;
  const crossLink   = type === "terms"
    ? { href: "/privacy", label: "Privacy Policy" }
    : { href: "/terms",   label: "Terms of Service" };

  return (
    <div className="min-h-screen bg-[#07080f] text-gray-300 scroll-smooth">

      {/* ── Reading progress bar ─────────────────────────────────────────── */}
      <div className="fixed top-0 left-0 right-0 z-50 h-[2px] bg-white/[0.04]">
        <div
          className="h-full transition-all duration-100"
          style={{
            width: `${progress}%`,
            background: `linear-gradient(90deg, ${accent}, ${accentAlpha}0.5)`,
            boxShadow: `0 0 8px ${accentAlpha}0.6)`,
          }}
        />
      </div>

      {/* ── Sticky header ────────────────────────────────────────────────── */}
      <header
        className="fixed top-[2px] left-0 right-0 z-40 transition-all duration-300"
        style={{
          background: headerSolid ? "rgba(7,9,18,0.95)" : "transparent",
          borderBottom: headerSolid ? "1px solid rgba(255,255,255,0.05)" : "1px solid transparent",
          backdropFilter: headerSolid ? "blur(16px)" : "none",
        }}
      >
        <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-full overflow-hidden border border-white/10 group-hover:border-white/20 transition-colors">
              <Image src="/logo.jpg" alt="TradeMind" width={28} height={28} className="w-full h-full object-cover" />
            </div>
            <span className="text-sm font-semibold text-white/80 group-hover:text-white transition-colors">
              TradeMind AI
            </span>
          </Link>

          {/* Progress % */}
          <span
            className="text-[10px] font-mono tracking-widest hidden sm:block"
            style={{ color: `${accentAlpha}0.5)` }}
          >
            {Math.round(progress)}%
          </span>

          {/* Back */}
          <Link
            href="/"
            className="flex items-center gap-1.5 text-[11px] font-mono tracking-wider transition-colors"
            style={{ color: `${accentAlpha}0.5)` }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = accent; }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = `${accentAlpha}0.5)`; }}
          >
            <ArrowLeft className="w-3 h-3" />
            HOME
          </Link>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="pt-24 pb-14 px-6 max-w-6xl mx-auto">
        <div className="flex items-start gap-4">
          <div
            className="mt-1 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: `${accentAlpha}0.08)`,
              border: `1px solid ${accentAlpha}0.2)`,
              boxShadow: `0 0 24px ${accentAlpha}0.1)`,
            }}
          >
            <Icon className="w-4.5 h-4.5" style={{ color: accent, width: 18, height: 18 }} />
          </div>
          <div>
            <p
              className="text-[10px] font-mono tracking-[0.2em] mb-2"
              style={{ color: `${accentAlpha}0.5)` }}
            >
              LEGAL DOCUMENT
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-2">
              {title}
            </h1>
            <p className="text-sm text-white/30">{subtitle}</p>
            <p className="text-[11px] font-mono text-white/20 mt-3">{updated}</p>
          </div>
        </div>

        {/* Thin separator */}
        <div
          className="mt-10 h-px"
          style={{ background: `linear-gradient(90deg, ${accentAlpha}0.15), transparent)` }}
        />
      </div>

      {/* ── Body: TOC + Content ───────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 pb-24 flex gap-12 items-start">

        {/* TOC — sticky left column */}
        <aside className="hidden lg:flex flex-col gap-0.5 w-48 flex-shrink-0 sticky top-20">
          <p
            className="text-[9px] font-mono tracking-[0.22em] mb-3 px-2"
            style={{ color: `${accentAlpha}0.35)` }}
          >
            CONTENTS
          </p>
          {sections.map((s) => {
            const isActive = activeId === s.id;
            return (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-left transition-all duration-150 group"
                style={{
                  background: isActive ? `${accentAlpha}0.06)` : "transparent",
                }}
              >
                <span
                  className="text-[9px] font-mono w-4 flex-shrink-0 transition-colors"
                  style={{ color: isActive ? accent : "rgba(100,116,139,0.35)" }}
                >
                  {s.num}
                </span>
                <span
                  className="text-[11px] leading-snug transition-colors truncate"
                  style={{ color: isActive ? "rgba(226,232,240,0.9)" : "rgba(100,116,139,0.5)" }}
                >
                  {s.title}
                </span>
                {isActive && (
                  <div
                    className="absolute left-0 w-0.5 h-5 rounded-full"
                    style={{ background: accent, boxShadow: `0 0 6px ${accent}` }}
                  />
                )}
              </button>
            );
          })}

          {/* Cross-link */}
          <div className="mt-6 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <Link
              href={crossLink.href}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] transition-colors"
              style={{ color: "rgba(100,116,139,0.4)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = accent; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(100,116,139,0.4)"; }}
            >
              <span>→</span>
              <span>{crossLink.label}</span>
            </Link>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 max-w-2xl">
          <div className="space-y-0">
            {sections.map((s, idx) => (
              <section
                key={s.id}
                id={s.id}
                ref={registerRef(s.id)}
                className="relative"
                style={{
                  paddingTop: idx === 0 ? 0 : 40,
                  paddingBottom: 40,
                  borderBottom: idx < sections.length - 1
                    ? "1px solid rgba(255,255,255,0.04)"
                    : "none",
                }}
              >
                {/* Section heading */}
                <div className="flex items-baseline gap-3 mb-5">
                  <span
                    className="text-[11px] font-mono flex-shrink-0 w-6 text-right"
                    style={{ color: `${accentAlpha}0.3)` }}
                  >
                    {s.num}
                  </span>
                  <h2 className="text-base font-semibold text-white/90 tracking-tight">
                    {s.title}
                  </h2>
                </div>

                {/* Content indented to align with title */}
                <div
                  className="pl-9 text-sm leading-7 text-white/45 space-y-4"
                  style={{ lineHeight: "1.85" }}
                >
                  {s.content}
                </div>
              </section>
            ))}
          </div>

          {/* Bottom footer */}
          <div
            className="mt-16 pt-8 flex items-center justify-between"
            style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
          >
            <Link
              href={crossLink.href}
              className="text-xs transition-colors"
              style={{ color: "rgba(100,116,139,0.4)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = accent; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(100,116,139,0.4)"; }}
            >
              {crossLink.label} →
            </Link>
            <button
              onClick={scrollTop}
              className="flex items-center gap-1.5 text-xs transition-colors"
              style={{ color: "rgba(100,116,139,0.4)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = accent; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(100,116,139,0.4)"; }}
            >
              Back to top
              <ArrowUp className="w-3 h-3" />
            </button>
          </div>
        </main>
      </div>

      {/* ── Scroll-to-top FAB ─────────────────────────────────────────────── */}
      <button
        onClick={scrollTop}
        className="fixed bottom-8 right-8 z-40 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300"
        style={{
          background: `${accentAlpha}0.1)`,
          border: `1px solid ${accentAlpha}0.25)`,
          boxShadow: showTop ? `0 0 20px ${accentAlpha}0.15)` : "none",
          opacity: showTop ? 1 : 0,
          pointerEvents: showTop ? "auto" : "none",
          transform: showTop ? "translateY(0)" : "translateY(12px)",
        }}
        aria-label="Scroll to top"
      >
        <ArrowUp className="w-3.5 h-3.5" style={{ color: accent }} />
      </button>
    </div>
  );
}
