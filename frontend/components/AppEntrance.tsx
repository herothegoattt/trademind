"use client";

import { useState, useLayoutEffect, useRef } from "react";

// Orchestrated dashboard entrance — the app "powers on" out of the dark.
//
// The landing-page boot dives into a point of light and fades to the app
// background (#070a12). Because the dashboard shares that exact background, the
// route swap is invisible: there is no curtain to wipe. Instead each region of
// the interface resolves out of the dark in a staggered, choreographed sequence
// — top bar, then the rail, then the content — with a slow expo settle and a
// faint depth blur clearing. Restrained, not flashy.
//
// It plays once, only when arriving from a launch (sessionStorage flag set by
// the landing page), and is skipped under prefers-reduced-motion.
//
// IMPORTANT: the reveal is one-shot CSS scoped under `.tm-entering`. The class
// is removed the instant the sequence ends, so no inline transform/filter
// lingers on any region — a persistent transform would turn a region into a
// containing block and break the app's many `position: fixed` elements (the
// same constraint PageCurtain respects). Nothing here wraps content in a
// transformed node.

const DURATION = 1400; // must outlast the longest delay+duration below

export function AppEntrance({ children }: { children: React.ReactNode }) {
  const [entering, setEntering] = useState(false);
  const started = useRef(false);

  // useLayoutEffect (not useEffect) so the decision lands before the browser
  // paints — regions never flash fully-visible before fading in.
  useLayoutEffect(() => {
    if (started.current) return;
    started.current = true;
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("tm_enter") !== "1") return;
    sessionStorage.removeItem("tm_enter");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setEntering(true);
    const id = setTimeout(() => setEntering(false), DURATION);
    return () => clearTimeout(id);
  }, []);

  return (
    <>
      <div className={entering ? "tm-stage tm-entering" : "tm-stage"} style={{ height: "100%" }}>
        {children}
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .tm-stage { height: 100%; }

        /* faint ambient wash — the screen "warms up" once, then settles */
        .tm-stage.tm-entering::after {
          content: "";
          position: fixed; inset: 0; z-index: 9990; pointer-events: none;
          background:
            radial-gradient(120% 80% at 50% -10%, rgba(139,92,246,.14), transparent 60%),
            radial-gradient(90% 60% at 50% 110%, rgba(34,211,238,.07), transparent 60%);
          animation: tmEnterWash 1.15s cubic-bezier(0.16,1,0.3,1) both;
        }

        /* per-region staggered reveal — top bar → rail → content */
        .tm-entering [data-entrance="bar"]     { animation: tmEnterBar     .80s cubic-bezier(0.16,1,0.3,1) .06s both; }
        .tm-entering [data-entrance="rail"]    { animation: tmEnterRail    .85s cubic-bezier(0.16,1,0.3,1) .14s both; }
        .tm-entering [data-entrance="dock"]    { animation: tmEnterDock    .80s cubic-bezier(0.16,1,0.3,1) .14s both; }
        .tm-entering [data-entrance="content"] { animation: tmEnterContent .95s cubic-bezier(0.16,1,0.3,1) .24s both; }

        @keyframes tmEnterWash {
          0%   { opacity: 0; }
          35%  { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes tmEnterBar {
          from { opacity: 0; transform: translateY(-14px); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes tmEnterRail {
          from { opacity: 0; transform: translateX(-26px); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes tmEnterDock {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes tmEnterContent {
          from { opacity: 0; transform: translateY(24px) scale(.992); filter: blur(9px); }
          to   { opacity: 1; transform: none;                         filter: blur(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .tm-stage.tm-entering::after,
          .tm-entering [data-entrance] { animation: none !important; }
        }
      `,
        }}
      />
    </>
  );
}
