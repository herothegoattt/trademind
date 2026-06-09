"use client";
import { useState, useEffect, useRef, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useT } from "../lib/i18n";

const VIO = "#8b5cf6";
const CYN = "#22d3ee";
const GRN = "#10b981";
const AMB = "#f59e0b";
const RED = "#ef4444";
const TOTAL_MS = 2600;

// ─── slide animation helper ───────────────────────────────────────────────────
const enter = (delay = 0, y = 24) => ({
  initial: { opacity: 0, y } as const,
  animate: { opacity: 1, y: 0 } as const,
  transition: { duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] as const },
});

// ═════════════════════════════════════════════════════════════════════════════
// BOOT SCREEN
// ═════════════════════════════════════════════════════════════════════════════
function BootScreen({ onDone }: { onDone: () => void }) {
  const t = useT();
  const [pct, setPct] = useState(0);
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(false);
  const MODS = [t("module_neural"), t("module_market_data"), t("module_risk"),
                t("module_ai_core"), t("module_bias_filter"), t("module_signals")];
  useEffect(() => {
    const STEP = TOTAL_MS / MODS.length;
    const ts = MODS.map((_, i) => i > 0 ? setTimeout(() => setIdx(i), i * STEP) : null)
      .filter(Boolean) as ReturnType<typeof setTimeout>[];
    const s = Date.now();
    const iv = setInterval(() => {
      const p = Math.min(100, ((Date.now() - s) / TOTAL_MS) * 100);
      setPct(p);
      if (p >= 100) { clearInterval(iv); setDone(true); }
    }, 16);
    return () => { ts.forEach(clearTimeout); clearInterval(iv); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { if (done) { const id = setTimeout(onDone, 800); return () => clearTimeout(id); } }, [done, onDone]);
  return (
    <div style={{ height:"100vh", background:"#05060f", display:"flex", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 70% 40% at 50% 0%, rgba(139,92,246,0.1) 0%, transparent 70%)", pointerEvents:"none" }} />
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:36, width:"100%", maxWidth:380, padding:"0 24px", zIndex:10 }}>
        <div style={{ width:70, height:70, borderRadius:18, border:`1px solid ${VIO}40`, overflow:"hidden", boxShadow:`0 0 32px ${VIO}22` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.jpg" alt="TradeMind" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
        </div>
        <div style={{ textAlign:"center" }}>
          <h1 style={{ margin:0, fontSize:"2.3rem", fontWeight:700, letterSpacing:"-.025em", color:"#f1f5f9" }}>TradeMind</h1>
          <p style={{ margin:"8px 0 0", fontSize:"9px", fontFamily:"monospace", letterSpacing:".3em", color:"rgba(100,116,139,.55)" }}>{t("ai_powered_trading")}</p>
        </div>
        <div style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", minHeight:32 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ width:5, height:5, borderRadius:"50%", background:CYN, boxShadow:`0 0 7px ${CYN}`, display:"inline-block", animation:"tmPulse 1s infinite" }} />
            <span style={{ fontSize:"10px", fontFamily:"monospace", letterSpacing:".16em", color:"rgba(148,163,184,.8)" }}>{MODS[idx]}</span>
          </div>
          <span style={{ fontSize:"9px", fontFamily:"monospace", color:"rgba(100,116,139,.45)" }}>{idx+1} / {MODS.length}</span>
        </div>
        <div style={{ width:"100%", height:48, border:`1px solid ${done?"rgba(52,211,153,.35)":"rgba(34,211,238,.2)"}`, borderRadius:9, position:"relative", overflow:"hidden", transition:"border-color .4s" }}>
          <div style={{ position:"absolute", inset:"0 auto 0 0", width:`${pct}%`, background:done?"linear-gradient(90deg,rgba(52,211,153,.2),rgba(52,211,153,.08))":"linear-gradient(90deg,rgba(139,92,246,.2),rgba(34,211,238,.12))", transition:"width .08s linear,background .4s" }} />
          <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 16px" }}>
            <span style={{ fontSize:"10px", fontFamily:"monospace", letterSpacing:".2em", color:done?"#34d399":"rgba(148,163,184,.4)", transition:"color .3s" }}>{done?t("access_granted"):t("loading_text")}</span>
            <span style={{ fontSize:"10px", fontFamily:"monospace", color:done?"rgba(52,211,153,.8)":"rgba(100,116,139,.5)", transition:"color .3s", fontVariantNumeric:"tabular-nums" }}>{Math.round(pct)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SLIDE WRAPPER — full-height, snap point
// ═════════════════════════════════════════════════════════════════════════════
function Slide({ id, children, bg = "#05060f", style = {} }: {
  id: string; children: React.ReactNode; bg?: string; style?: React.CSSProperties;
}) {
  return (
    <section id={id} style={{
      height:"100vh", minHeight:"100vh", width:"100%", position:"relative",
      overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center",
      background:bg, scrollSnapAlign:"start", flexShrink:0, ...style,
    }}>
      {children}
    </section>
  );
}

// ─── container = px/py helper ─────────────────────────────────────────────────
const px = { padding:"0 clamp(16px,5vw,64px)" };
const inner = { width:"100%", maxWidth:1040, margin:"0 auto" } as React.CSSProperties;

// ═════════════════════════════════════════════════════════════════════════════
// SLIDE 1 — HERO
// ═════════════════════════════════════════════════════════════════════════════
function SlideHero({ onLaunch, onNext, active }: { onLaunch: (plan?: string, billing?: string)=>void; onNext?: ()=>void; active: boolean }) {
  const t = useT();
  const [spot, setSpot] = useState({ x:50, y:45 });
  const mouse = useRef({ x:50, y:45 });
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const fn = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      mouse.current = { x:((e.clientX-r.left)/r.width)*100, y:((e.clientY-r.top)/r.height)*100 };
    };
    el.addEventListener("mousemove", fn, { passive:true });
    const id = setInterval(() => setSpot(p=>({ x:p.x+(mouse.current.x-p.x)*.07, y:p.y+(mouse.current.y-p.y)*.07 })),16);
    return () => { el.removeEventListener("mousemove", fn); clearInterval(id); };
  },[]);

  return (
    <Slide id="slide-hero" bg="#05060f">
      <section ref={ref} style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>
        {/* dot grid */}
        <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(rgba(148,163,184,.065) 1px,transparent 1px)", backgroundSize:"30px 30px", maskImage:"radial-gradient(ellipse 80% 70% at 50% 50%,black 30%,transparent 100%)", pointerEvents:"none" }} />
        {/* spotlight */}
        <div style={{ position:"absolute", inset:0, pointerEvents:"none", transition:"background .1s ease", background:`radial-gradient(700px circle at ${spot.x}% ${spot.y}%,rgba(139,92,246,.11) 0%,transparent 55%)` }} />
        {/* orbs */}
        <motion.div animate={{ x:[0,40,-20,0], y:[0,-28,18,0] }} transition={{ duration:20, repeat:Infinity, ease:"easeInOut" }} style={{ position:"absolute", width:640, height:640, borderRadius:"50%", top:"-20%", right:"-8%", background:"radial-gradient(circle,rgba(139,92,246,.07) 0%,transparent 70%)", filter:"blur(40px)", pointerEvents:"none" }} />
        <motion.div animate={{ x:[0,-30,12,0], y:[0,36,-14,0] }} transition={{ duration:28, repeat:Infinity, ease:"easeInOut" }} style={{ position:"absolute", width:480, height:480, borderRadius:"50%", bottom:"-10%", left:"-6%", background:"radial-gradient(circle,rgba(34,211,238,.055) 0%,transparent 70%)", filter:"blur(48px)", pointerEvents:"none" }} />

        <div style={{ ...inner, ...px, textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:0, position:"relative", zIndex:10 }}>
          {/* pill */}
          <motion.div {...enter(.1)} style={{ display:"inline-flex", alignItems:"center", gap:7, marginBottom:28, padding:"5px 16px", borderRadius:100, border:`1px solid ${CYN}22`, background:`${CYN}08`, fontSize:".65rem", fontFamily:"monospace", letterSpacing:".22em", color:`${CYN}88` }}>
            <span style={{ width:5, height:5, borderRadius:"50%", background:CYN, boxShadow:`0 0 7px ${CYN}`, animation:"tmPulse 1.8s infinite", flexShrink:0 }} />
            {t("ai_powered_trading")}
          </motion.div>

          {/* logo */}
          <motion.div {...enter(.18)} transition={{ delay:.18, duration:.7, type:"spring", stiffness:160 } as never}
            style={{ width:88, height:88, borderRadius:24, marginBottom:28, border:`1px solid ${VIO}35`, background:"rgba(10,8,26,0.9)", overflow:"hidden", boxShadow:`0 0 60px ${VIO}22,inset 0 1px 0 rgba(255,255,255,.07)` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.jpg" alt="TradeMind" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          </motion.div>

          {/* headline */}
          <motion.h1 {...enter(.26)}
            style={{ margin:"0 0 18px", fontWeight:800, letterSpacing:"-.045em", lineHeight:1.06,
              fontSize:"clamp(2.6rem,7.5vw,5.2rem)",
              background:"linear-gradient(135deg, #f8fafc 0%, #bfdbfe 18%, #818cf8 36%, #7c3aed 54%, #4c1d95 68%, #7c3aed 80%, #bfdbfe 92%, #f8fafc 100%)",
              backgroundSize:"300% auto",
              WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
              animation:"heroShimmer 8s linear infinite" }}>
            {t("lp_hero_headline_1")}<br />{t("lp_hero_headline_2")}
          </motion.h1>

          <motion.p {...enter(.34)} style={{ margin:"0 0 36px", fontSize:"clamp(.9rem,1.8vw,1.1rem)", color:"rgba(148,163,184,.56)", lineHeight:1.72, maxWidth:520 }}>
            {t("lp_hero_subtitle")}
          </motion.p>

          {/* CTAs */}
          <motion.div {...enter(.42)} style={{ display:"flex", gap:12, flexWrap:"wrap", justifyContent:"center", marginBottom:44 }}>
            <motion.button whileHover={{ scale:1.05, boxShadow:`0 0 52px ${VIO}52` }} whileTap={{ scale:.97 }}
              onClick={() => onLaunch()}
              style={{ height:52, padding:"0 36px", background:`linear-gradient(135deg,${VIO}48,${VIO}26)`, border:`1px solid ${VIO}68`, borderRadius:13, cursor:"pointer", display:"inline-flex", alignItems:"center", gap:10, fontSize:".85rem", fontFamily:"monospace", letterSpacing:".17em", color:"#e9d5ff", fontWeight:700, boxShadow:`0 0 28px ${VIO}28`, transition:"box-shadow .25s" }}>
              {t("initialize_system")}
              <motion.svg animate={{ x:[0,4,0] }} transition={{ duration:1.4, repeat:Infinity }} width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7h10M8 3l4 4-4 4" stroke="#e9d5ff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </motion.svg>
            </motion.button>
            <motion.button whileHover={{ borderColor:"rgba(255,255,255,.15)" }} whileTap={{ scale:.97 }}
              onClick={()=>onNext?.()}
              style={{ height:52, padding:"0 28px", background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)", borderRadius:13, cursor:"pointer", display:"inline-flex", alignItems:"center", gap:8, fontSize:".85rem", color:"rgba(148,163,184,.6)", transition:"border-color .2s" }}>
              {t("lp_hero_learn_more")}
            </motion.button>
          </motion.div>

          {/* stats strip */}
          <motion.div {...enter(.52)} style={{ display:"flex", flexWrap:"wrap", justifyContent:"center", padding:"18px 32px", borderRadius:14, background:"rgba(255,255,255,.02)", border:"1px solid rgba(255,255,255,.05)", gap:0 }}>
            {[["120+","lp_stat_traders"],["3 000+","lp_stat_trades"],["24/7","lp_stat_support"]].map(([v,k],i,a)=>(
              <div key={i} style={{ textAlign:"center", padding:"0 20px", borderRight:i<a.length-1?"1px solid rgba(255,255,255,.05)":"none" }}>
                <div style={{ fontSize:"1.3rem", fontWeight:700, letterSpacing:"-.03em", color:"#f1f5f9", lineHeight:1 }}>{v}</div>
                <div style={{ fontSize:".62rem", fontFamily:"monospace", letterSpacing:".07em", color:"rgba(100,116,139,.5)", marginTop:4 }}>{t(k).toUpperCase()}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>
    </Slide>
  );
}

// ─── animated counter (used in problem + stats slides) ────────────────────────
function CountUp({ to, active, delay=0 }: { to:number; active:boolean; delay?:number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!active) return;
    const t0 = setTimeout(() => {
      const dur = 1300, s = Date.now();
      const iv = setInterval(() => {
        const p = Math.min(1, (Date.now()-s)/dur);
        setN(Math.round((1-Math.pow(1-p,3))*to));
        if (p>=1) clearInterval(iv);
      }, 16);
      return () => clearInterval(iv);
    }, delay*1000);
    return () => clearTimeout(t0);
  }, [active, to, delay]);
  return <>{n}</>;
}

// ═════════════════════════════════════════════════════════════════════════════
// SLIDE 2 — PROBLEM
// ═════════════════════════════════════════════════════════════════════════════
function SlideProblem({ active }: { active: boolean }) {
  const t = useT();
  const mistakes = [
    { icon:"⚡", pct:78, key:"lp_problem_1_text", color:"#ef4444", glow:"239,68,68"  },
    { icon:"🧠", pct:64, key:"lp_problem_2_text", color:"#f97316", glow:"249,115,22" },
    { icon:"📉", pct:55, key:"lp_problem_3_text", color:"#eab308", glow:"234,179,8"  },
  ];
  return (
    <Slide id="slide-problem" bg="rgba(5,6,15,1)">
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 70% 60% at 30% 100%,rgba(239,68,68,.06) 0%,transparent 65%)", pointerEvents:"none" }} />
      <div style={{ ...inner, ...px, zIndex:10 }}>
        {/* header */}
        <div style={{ textAlign:"center", marginBottom:44 }}>
          <motion.div initial={{ opacity:0, scale:.88 }} animate={active?{ opacity:1, scale:1 }:{}} transition={{ duration:.5, delay:.1 }}
            style={{ display:"inline-flex", alignItems:"center", gap:7, marginBottom:14, padding:"4px 14px", borderRadius:100, border:`1px solid ${RED}22`, background:`${RED}0c`, fontSize:".63rem", fontFamily:"monospace", letterSpacing:".22em", color:`${RED}bb` }}>
            <span style={{ width:4, height:4, borderRadius:"50%", background:RED, flexShrink:0 }} />{t("lp_problem_badge")}
          </motion.div>
          <motion.h2 initial={{ opacity:0, y:20 }} animate={active?{ opacity:1, y:0 }:{}} transition={{ duration:.6, delay:.18 }}
            style={{ margin:"0 0 12px", fontWeight:800, letterSpacing:"-.04em", fontSize:"clamp(1.8rem,3.5vw,2.6rem)", lineHeight:1.1 }}>
            {t("lp_problem_headline")}
          </motion.h2>
          <motion.p initial={{ opacity:0, y:14 }} animate={active?{ opacity:1, y:0 }:{}} transition={{ duration:.55, delay:.25 }}
            style={{ margin:0, fontSize:"clamp(.85rem,1.6vw,.95rem)", color:"rgba(148,163,184,.5)", maxWidth:520, marginLeft:"auto", marginRight:"auto", lineHeight:1.7 }}>
            {t("lp_problem_sub")}
          </motion.p>
        </div>

        {/* 3 horizontal mistake bars */}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {mistakes.map((m, i) => (
            <motion.div key={i}
              initial={{ opacity:0, x:-40 }}
              animate={active ? { opacity:1, x:0 } : {}}
              transition={{ duration:.7, delay:.3+i*.13, ease:[0.22,1,0.36,1] }}
              style={{
                display:"flex", alignItems:"center", gap:24,
                padding:"22px 28px",
                background:`linear-gradient(90deg,rgba(${m.glow},.1) 0%,rgba(5,6,15,.96) 58%)`,
                border:`1px solid rgba(${m.glow},.22)`,
                borderRadius:16, position:"relative", overflow:"hidden",
              }}
            >
              {/* left accent strip */}
              <div style={{ position:"absolute", left:0, top:0, bottom:0, width:3, borderRadius:"4px 0 0 4px", background:m.color, boxShadow:`0 0 18px ${m.color}80` }} />
              {/* top-left radial */}
              <div style={{ position:"absolute", top:0, left:0, width:180, height:"100%", background:`radial-gradient(ellipse at left,rgba(${m.glow},.07) 0%,transparent 70%)`, pointerEvents:"none" }} />

              {/* icon */}
              <div style={{ fontSize:"2rem", flexShrink:0, marginLeft:8 }}>{m.icon}</div>

              {/* animated % */}
              <div style={{ fontSize:"3.2rem", fontWeight:900, letterSpacing:"-.05em", color:m.color, flexShrink:0, lineHeight:1, minWidth:100, textShadow:`0 0 28px rgba(${m.glow},.55)` }}>
                <CountUp to={m.pct} active={active} delay={.48+i*.11} />%
              </div>

              {/* description */}
              <p style={{ margin:0, flex:1, fontSize:".88rem", color:"rgba(148,163,184,.72)", lineHeight:1.65 }}>{t(m.key)}</p>

              {/* fill bar */}
              <div style={{ width:140, flexShrink:0 }}>
                <div style={{ marginBottom:5, display:"flex", justifyContent:"flex-end" }}>
                  <span style={{ fontSize:".6rem", fontFamily:"monospace", color:`rgba(${m.glow},.55)`, letterSpacing:".1em" }}>{m.pct}%</span>
                </div>
                <div style={{ height:4, borderRadius:2, background:"rgba(255,255,255,.06)", overflow:"hidden" }}>
                  <motion.div style={{ height:"100%", borderRadius:2, background:m.color, boxShadow:`0 0 10px ${m.color}`, originX:0 }}
                    initial={{ scaleX:0 }} animate={active?{ scaleX:m.pct/100 }:{}} transition={{ duration:1.3, delay:.48+i*.11, ease:[.22,1,.36,1] }} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Slide>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SLIDE 3 — PLATFORM: HOW IT WORKS + HOW IT LOOKS
// ═════════════════════════════════════════════════════════════════════════════
const STEP_COLORS = [CYN, VIO, AMB, GRN];
const STEP_RGB    = ["34,211,238","139,92,246","245,158,11","16,185,129"];

function SlidePreview({ active }: { active: boolean }) {
  const t = useT();
  const [activeStep, setActiveStep] = useState(0);
  const stageRef  = useRef<HTMLDivElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const mouseRef  = useRef({ x:0, y:0 });
  const curRef    = useRef({ x:0, y:0 });
  const rafRef    = useRef(0);

  const stepColor = STEP_COLORS[activeStep];
  const stepRgb   = STEP_RGB[activeStep];

  // auto-cycle steps
  useEffect(() => {
    if (!active) { setActiveStep(0); return; }
    const id = setInterval(() => setActiveStep(p => (p + 1) % 4), 3200);
    return () => clearInterval(id);
  }, [active]);

  // mouse-driven 3D tilt — direct DOM mutation, zero re-renders
  useEffect(() => {
    const el = stageRef.current; if (!el) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      mouseRef.current = {
        x: ((e.clientX - r.left) / r.width  - 0.5) * 2,
        y: ((e.clientY - r.top)  / r.height - 0.5) * 2,
      };
    };
    el.addEventListener("mousemove", onMove, { passive:true });
    const tick = () => {
      curRef.current.x += (mouseRef.current.x - curRef.current.x) * 0.07;
      curRef.current.y += (mouseRef.current.y - curRef.current.y) * 0.07;
      if (windowRef.current)
        windowRef.current.style.transform =
          `rotateY(${curRef.current.x * 13}deg) rotateX(${-curRef.current.y * 7}deg)`;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { el.removeEventListener("mousemove", onMove); cancelAnimationFrame(rafRef.current); };
  }, []);

  const steps = [
    { n:"01", ico:"✏️", titleKey:"lp_how_step1_title", descKey:"lp_how_step1_desc" },
    { n:"02", ico:"🔬", titleKey:"lp_how_step2_title", descKey:"lp_how_step2_desc" },
    { n:"03", ico:"💡", titleKey:"lp_how_step3_title", descKey:"lp_how_step3_desc" },
    { n:"04", ico:"📈", titleKey:"lp_how_step4_title", descKey:"lp_how_step4_desc" },
  ];

  const sidebarItems = [
    { ico:"✏️", label:"section_journal",      si:0 },
    { ico:"🤖", label:"lp_how_step2_title",   si:1 },
    { ico:"🧬", label:"section_trader_dna",   si:2 },
    { ico:"📊", label:"section_analytics_lab",si:3 },
  ];

  return (
    <Slide id="slide-preview" bg="#030410">
      {/* === LAYERED BACKGROUND === */}
      {/* dynamic ambient glow — color morphs with active step */}
      <div style={{ position:"absolute", inset:0, pointerEvents:"none",
        background:`radial-gradient(ellipse 78% 65% at 65% 50%, rgba(${stepRgb},.07) 0%, transparent 58%)`,
        transition:"background 1.4s ease" }} />
      {/* dot grid masked to right */}
      <div style={{ position:"absolute", inset:0, pointerEvents:"none",
        backgroundImage:"radial-gradient(rgba(148,163,184,.055) 1px,transparent 1px)",
        backgroundSize:"30px 30px",
        maskImage:"radial-gradient(ellipse 90% 80% at 65% 50%,black 15%,transparent 100%)",
        WebkitMaskImage:"radial-gradient(ellipse 90% 80% at 65% 50%,black 15%,transparent 100%)" }} />
      {/* deep corner accent */}
      <div style={{ position:"absolute", top:0, left:0, width:320, height:320, pointerEvents:"none",
        background:`radial-gradient(circle at 0% 0%,rgba(${stepRgb},.06),transparent 65%)`,
        transition:"background 1.4s" }} />
      {/* horizontal scan line */}
      <motion.div
        style={{ position:"absolute", left:0, right:0, height:2, pointerEvents:"none", zIndex:1,
          background:`linear-gradient(90deg,transparent 0%,rgba(${stepRgb},.55) 40%,rgba(${stepRgb},.55) 60%,transparent 100%)`,
          filter:"blur(1px)" }}
        animate={{ y:["-4vh","104vh"] }}
        transition={{ duration:5, repeat:Infinity, ease:"linear" }}
      />

      {/* === MAIN CONTENT === */}
      <div ref={stageRef} style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", zIndex:10 }}>
        <div style={{ ...inner, ...px, display:"grid", gridTemplateColumns:"1fr 1.65fr", gap:44, alignItems:"center" }}>

          {/* ── LEFT: How It Works ── */}
          <div>
            <motion.div initial={{ opacity:0, x:-20 }} animate={active?{opacity:1,x:0}:{}} transition={{ duration:.6, delay:.1 }}
              style={{ display:"inline-flex", alignItems:"center", gap:7, marginBottom:20, padding:"4px 14px", borderRadius:100,
                border:`1px solid ${CYN}22`, background:`${CYN}0c`, fontSize:".63rem", fontFamily:"monospace", letterSpacing:".22em", color:`${CYN}bb` }}>
              <span style={{ width:4, height:4, borderRadius:"50%", background:CYN, boxShadow:`0 0 6px ${CYN}`, flexShrink:0, animation:"tmPulse 2s infinite" }} />
              {t("lp_how_badge")} · {t("lp_preview_badge")}
            </motion.div>

            <motion.h2 initial={{ opacity:0, y:20 }} animate={active?{opacity:1,y:0}:{}} transition={{ duration:.65, delay:.18 }}
              style={{ margin:"0 0 10px", fontWeight:800, letterSpacing:"-.04em", fontSize:"clamp(1.6rem,3vw,2.4rem)", lineHeight:1.12,
                background:"linear-gradient(135deg,#f8fafc 0%,#bfdbfe 25%,#818cf8 50%,#7c3aed 70%,#f8fafc 100%)",
                backgroundSize:"250% auto", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
                animation:"heroShimmer 8s linear infinite" }}>
              {t("lp_how_headline")}
            </motion.h2>

            <motion.p initial={{ opacity:0, y:12 }} animate={active?{opacity:1,y:0}:{}} transition={{ duration:.55, delay:.26 }}
              style={{ margin:"0 0 28px", fontSize:".88rem", color:"rgba(148,163,184,.5)", lineHeight:1.7 }}>
              {t("lp_how_sub")}
            </motion.p>

            {/* Steps timeline */}
            <div style={{ position:"relative" }}>
              {/* static track */}
              <div style={{ position:"absolute", left:17, top:36, bottom:36, width:2,
                background:"rgba(255,255,255,.06)", borderRadius:1 }} />
              {/* animated fill */}
              <motion.div
                style={{ position:"absolute", left:17, top:36, width:2, borderRadius:1, originY:0,
                  background:`linear-gradient(to bottom, ${STEP_COLORS[0]}, ${stepColor})`,
                  boxShadow:`0 0 12px ${stepColor}` }}
                animate={{ scaleY:(activeStep+1)/4 }}
                transition={{ duration:1.3, ease:[.22,1,.36,1] }}
              />

              {steps.map((s, i) => {
                const col = STEP_COLORS[i];
                const rgb = STEP_RGB[i];
                const cur = activeStep === i;
                return (
                  <motion.div key={i}
                    initial={{ opacity:0, x:-28 }} animate={active?{opacity:1,x:0}:{}}
                    transition={{ duration:.6, delay:.32+i*.1, ease:[.22,1,.36,1] }}
                    onClick={() => setActiveStep(i)}
                    style={{ display:"flex", gap:16, marginBottom:i<3?18:0, cursor:"pointer", position:"relative", zIndex:2 }}>
                    {/* step orb */}
                    <div style={{ width:36, height:36, borderRadius:"50%", flexShrink:0,
                      background: cur ? `radial-gradient(circle,rgba(${rgb},.35),rgba(${rgb},.1))` : "rgba(255,255,255,.04)",
                      border:`2px solid ${cur ? col : "rgba(255,255,255,.1)"}`,
                      display:"flex", alignItems:"center", justifyContent:"center", fontSize:".9rem",
                      boxShadow: cur ? `0 0 0 6px rgba(${rgb},.12),0 0 22px rgba(${rgb},.5)` : "none",
                      transition:"all .5s cubic-bezier(.22,1,.36,1)" }}>
                      {s.ico}
                    </div>
                    {/* step text */}
                    <div style={{ paddingTop:5, flex:1 }}>
                      <div style={{ fontSize:".52rem", fontFamily:"monospace", letterSpacing:".18em",
                        color:cur?col:"rgba(100,116,139,.4)", marginBottom:2, transition:"color .4s" }}>
                        STEP {s.n}
                      </div>
                      <div style={{ fontSize:".88rem", fontWeight:700, lineHeight:1.2, transition:"color .4s",
                        color:cur?"#f1f5f9":"rgba(148,163,184,.45)" }}>
                        {t(s.titleKey)}
                      </div>
                      <AnimatePresence>
                        {cur && (
                          <motion.p key="d"
                            initial={{ opacity:0, y:4, height:0 }} animate={{ opacity:1, y:0, height:"auto" }}
                            exit={{ opacity:0, y:-4, height:0 }} transition={{ duration:.35 }}
                            style={{ margin:"5px 0 0", fontSize:".72rem", color:"rgba(148,163,184,.65)", lineHeight:1.5 }}>
                            {t(s.descKey)}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* ── RIGHT: 3D floating app window ── */}
          <motion.div
            initial={{ opacity:0, x:44, scale:.95 }}
            animate={active?{opacity:1,x:0,scale:1}:{}}
            transition={{ duration:.9, delay:.22, type:"spring", stiffness:110, damping:17 }}
            style={{ perspective:1100, perspectiveOrigin:"50% 50%" }}>

            <div ref={windowRef} style={{
              transformStyle:"preserve-3d",
              borderRadius:18,
              border:"1px solid rgba(255,255,255,.1)",
              overflow:"hidden",
              background:"#07080f",
              boxShadow:`0 0 0 1px rgba(255,255,255,.05),0 32px 80px rgba(0,0,0,.65),0 0 100px rgba(${stepRgb},.13)`,
              transition:"box-shadow 1.2s ease",
            }}>

              {/* title bar */}
              <div style={{ padding:"10px 16px", background:"rgba(255,255,255,.04)", borderBottom:"1px solid rgba(255,255,255,.07)",
                display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ display:"flex", gap:5 }}>
                  {[RED,AMB,GRN].map((c,i)=><div key={i} style={{ width:10,height:10,borderRadius:"50%",background:c,opacity:.7 }} />)}
                </div>
                <div style={{ flex:1, height:20, borderRadius:5, background:"rgba(255,255,255,.05)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <span style={{ fontSize:".6rem", fontFamily:"monospace", color:"rgba(100,116,139,.5)" }}>app.trademind.io</span>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                  <span style={{ width:5,height:5,borderRadius:"50%",background:stepColor,boxShadow:`0 0 6px ${stepColor}`,
                    animation:"tmPulse 1.4s infinite",flexShrink:0,transition:"background .8s,box-shadow .8s" }} />
                  <span style={{ fontSize:".56rem",fontFamily:"monospace",letterSpacing:".1em",
                    color:`${stepColor}99`,transition:"color .8s" }}>LIVE</span>
                </div>
              </div>

              {/* app body: sidebar + main */}
              <div style={{ display:"grid", gridTemplateColumns:"148px 1fr" }}>
                {/* sidebar */}
                <div style={{ borderRight:"1px solid rgba(255,255,255,.06)", padding:"12px 8px",
                  display:"flex", flexDirection:"column", gap:2, minHeight:388 }}>
                  {sidebarItems.map(({ ico, label, si }) => {
                    const isA = activeStep === si;
                    const rgb = STEP_RGB[si];
                    return (
                      <div key={si} onClick={() => setActiveStep(si)}
                        style={{ display:"flex", alignItems:"center", gap:7, padding:"8px 10px", borderRadius:7, cursor:"pointer",
                          background:isA?`rgba(${rgb},.14)`:"transparent",
                          border:isA?`1px solid rgba(${rgb},.28)`:"1px solid transparent",
                          transition:"all .4s cubic-bezier(.22,1,.36,1)" }}>
                        <span style={{ fontSize:".85rem" }}>{ico}</span>
                        <span style={{ fontSize:".68rem", fontWeight:isA?600:400, transition:"color .4s",
                          color:isA?`rgb(${rgb})`:"rgba(148,163,184,.32)" }}>
                          {t(label)}
                        </span>
                      </div>
                    );
                  })}
                  {/* user chip */}
                  <div style={{ marginTop:"auto", padding:"10px 8px 2px", borderTop:"1px solid rgba(255,255,255,.05)" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                      <div style={{ width:26,height:26,borderRadius:7,background:`${VIO}18`,border:`1px solid ${VIO}28`,
                        display:"flex",alignItems:"center",justifyContent:"center",fontSize:".7rem" }}>🤝</div>
                      <div>
                        <div style={{ fontSize:".65rem",fontWeight:600,color:"rgba(241,245,249,.45)" }}>Alex M.</div>
                        <div style={{ fontSize:".52rem",color:"rgba(100,116,139,.38)",letterSpacing:".08em" }}>EDGE PLAN</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* main — switches between 4 screens */}
                <div style={{ padding:14, overflow:"hidden", minHeight:388, position:"relative" }}>
                  <AnimatePresence mode="wait">

                    {/* SCREEN 0: Journal — log your trades */}
                    {activeStep === 0 && (
                      <motion.div key="s0"
                        initial={{ opacity:0, y:14, filter:"blur(5px)" }}
                        animate={{ opacity:1, y:0, filter:"blur(0px)" }}
                        exit={{ opacity:0, y:-14, filter:"blur(5px)" }}
                        transition={{ duration:.32 }}
                        style={{ display:"flex", flexDirection:"column", gap:9 }}>
                        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4 }}>
                          <span style={{ fontSize:".8rem",fontWeight:700,color:"#f1f5f9" }}>Trading Journal</span>
                          <div style={{ display:"inline-flex",alignItems:"center",gap:5,fontSize:".56rem",fontFamily:"monospace",
                            background:`${CYN}18`,border:`1px solid ${CYN}30`,color:CYN,padding:"3px 9px",borderRadius:100 }}>
                            + NEW TRADE
                          </div>
                        </div>
                        {[
                          { sym:"EURUSD",dir:"L",pnl:"+$312",rr:"+2.3R",emo:"😤",c:GRN,rgb:"16,185,129" },
                          { sym:"NVDA",  dir:"L",pnl:"+$221",rr:"+1.8R",emo:"😊",c:GRN,rgb:"16,185,129" },
                          { sym:"BTCUSD",dir:"S",pnl:"-$135",rr:"-1.0R",emo:"😰",c:RED,rgb:"239,68,68"  },
                          { sym:"TSLA",  dir:"L",pnl:"+$88", rr:"+0.9R",emo:"🙂",c:GRN,rgb:"16,185,129" },
                        ].map((tr,i)=>(
                          <motion.div key={i}
                            initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*.06, duration:.28 }}
                            style={{ display:"flex",alignItems:"center",justifyContent:"space-between",
                              background:"rgba(255,255,255,.035)",borderRadius:9,padding:"9px 11px",border:"1px solid rgba(255,255,255,.06)" }}>
                            <div style={{ display:"flex",gap:8,alignItems:"center" }}>
                              <div style={{ width:26,height:26,borderRadius:7,background:`rgba(${tr.rgb},.12)`,
                                border:`1px solid rgba(${tr.rgb},.24)`,display:"flex",alignItems:"center",
                                justifyContent:"center",fontSize:".6rem",fontFamily:"monospace",
                                color:`rgb(${tr.rgb})`,fontWeight:700 }}>{tr.dir}</div>
                              <div>
                                <div style={{ fontSize:".78rem",fontWeight:600,color:"#f1f5f9" }}>{tr.sym}</div>
                                <div style={{ fontSize:".58rem",color:"rgba(100,116,139,.45)" }}>{tr.emo} {tr.dir==="L"?"Long":"Short"}</div>
                              </div>
                            </div>
                            <div style={{ textAlign:"right" }}>
                              <div style={{ fontSize:".78rem",fontWeight:700,color:tr.c }}>{tr.pnl}</div>
                              <div style={{ fontSize:".6rem",color:"rgba(100,116,139,.38)" }}>{tr.rr}</div>
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}

                    {/* SCREEN 1: AI analysis */}
                    {activeStep === 1 && (
                      <motion.div key="s1"
                        initial={{ opacity:0, y:14, filter:"blur(5px)" }}
                        animate={{ opacity:1, y:0, filter:"blur(0px)" }}
                        exit={{ opacity:0, y:-14, filter:"blur(5px)" }}
                        transition={{ duration:.32 }}
                        style={{ display:"flex", flexDirection:"column", gap:10 }}>
                        <span style={{ fontSize:".8rem",fontWeight:700,color:"#f1f5f9",display:"block",marginBottom:4 }}>AI Analysis</span>
                        <div style={{ background:`${VIO}0e`,border:`1px solid ${VIO}25`,borderRadius:11,padding:"11px 13px" }}>
                          <div style={{ display:"flex",gap:9,alignItems:"flex-start" }}>
                            <span style={{ fontSize:".9rem",flexShrink:0 }}>🤖</span>
                            <div>
                              <p style={{ margin:"0 0 8px",fontSize:".73rem",color:"rgba(148,163,184,.85)",lineHeight:1.5 }}>
                                Found <strong style={{ color:"#f1f5f9" }}>3 key patterns</strong> across your last 28 trades.
                              </p>
                              {[{t:"Early exits in profit",c:RED},{t:"FOMO on NY open",c:AMB},{t:"Over-leverage Fridays",c:RED}].map((p,i)=>(
                                <div key={i} style={{ display:"flex",alignItems:"center",gap:6,marginBottom:i<2?4:0 }}>
                                  <div style={{ width:5,height:5,borderRadius:"50%",background:p.c,boxShadow:`0 0 5px ${p.c}`,flexShrink:0 }} />
                                  <span style={{ fontSize:".67rem",color:`${p.c}cc` }}>{p.t}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        {[
                          { l:"Emotional exits",p:"78%",v:.78,rgb:"239,68,68"  },
                          { l:"FOMO entries",   p:"64%",v:.64,rgb:"249,115,22" },
                          { l:"Friday risk",    p:"55%",v:.55,rgb:"234,179,8"  },
                        ].map(({l,p,v,rgb},i)=>(
                          <div key={i}>
                            <div style={{ display:"flex",justifyContent:"space-between",marginBottom:4 }}>
                              <span style={{ fontSize:".66rem",color:"rgba(148,163,184,.55)" }}>{l}</span>
                              <span style={{ fontSize:".62rem",fontFamily:"monospace",color:`rgb(${rgb})` }}>{p}</span>
                            </div>
                            <div style={{ height:4,borderRadius:2,background:"rgba(255,255,255,.07)",overflow:"hidden" }}>
                              <motion.div initial={{ scaleX:0 }} animate={{ scaleX:v }} transition={{ duration:1.1,delay:.15+i*.12,ease:[.22,1,.36,1] }}
                                style={{ height:"100%",borderRadius:2,background:`rgb(${rgb})`,boxShadow:`0 0 8px rgba(${rgb},.6)`,originX:0 }} />
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}

                    {/* SCREEN 2: Trader DNA */}
                    {activeStep === 2 && (
                      <motion.div key="s2"
                        initial={{ opacity:0, y:14, filter:"blur(5px)" }}
                        animate={{ opacity:1, y:0, filter:"blur(0px)" }}
                        exit={{ opacity:0, y:-14, filter:"blur(5px)" }}
                        transition={{ duration:.32 }}
                        style={{ display:"flex", flexDirection:"column", gap:10 }}>
                        <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:4 }}>
                          <span style={{ fontSize:".8rem",fontWeight:700,color:"#f1f5f9" }}>Trader DNA</span>
                          <div style={{ display:"inline-flex",alignItems:"center",gap:4,fontSize:".5rem",fontFamily:"monospace",
                            letterSpacing:".14em",color:`${AMB}cc`,background:`${AMB}10`,border:`1px solid ${AMB}28`,
                            padding:"2px 7px",borderRadius:100 }}>
                            <span style={{ width:4,height:4,borderRadius:"50%",background:AMB,animation:"tmPulse 1.5s infinite",flexShrink:0 }} />LIVE
                          </div>
                        </div>
                        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
                          {[
                            { l:"WIN RATE",  v:"64%",     c:GRN, rgb:"16,185,129" },
                            { l:"TOTAL P&L", v:"+$1,248", c:GRN, rgb:"16,185,129" },
                            { l:"RISK",      v:"Medium",  c:AMB, rgb:"245,158,11" },
                            { l:"AVG R:R",   v:"1.8",     c:CYN, rgb:"34,211,238" },
                          ].map(({l,v,c,rgb},i)=>(
                            <motion.div key={i} initial={{ opacity:0,scale:.9 }} animate={{ opacity:1,scale:1 }} transition={{ delay:i*.07 }}
                              style={{ background:"rgba(255,255,255,.04)",borderRadius:10,padding:"10px",border:`1px solid rgba(${rgb},.14)`,position:"relative",overflow:"hidden" }}>
                              <div style={{ position:"absolute",inset:0,background:`radial-gradient(ellipse at center,rgba(${rgb},.08),transparent 70%)`,pointerEvents:"none" }} />
                              <div style={{ fontSize:".5rem",fontFamily:"monospace",color:"rgba(100,116,139,.45)",letterSpacing:".1em",marginBottom:5 }}>{l}</div>
                              <div style={{ fontSize:"1.08rem",fontWeight:800,color:c }}>{v}</div>
                            </motion.div>
                          ))}
                        </div>
                        <div style={{ background:"rgba(168,85,247,.07)",border:"1px solid rgba(168,85,247,.2)",borderRadius:10,padding:"10px 12px" }}>
                          <div style={{ fontSize:".55rem",fontFamily:"monospace",letterSpacing:".14em",color:"rgba(168,85,247,.8)",marginBottom:8,fontWeight:700 }}>BEHAVIORAL INSIGHTS</div>
                          {[
                            "You exit winners 23% early — costs ~$847/mo in forgone profit",
                            "Early entries detected in 64% of losing trades",
                          ].map((m,i)=>(
                            <div key={i} style={{ display:"flex",gap:7,marginBottom:i<1?6:0 }}>
                              <span style={{ color:"#a855f7",fontSize:".7rem",lineHeight:1,marginTop:1 }}>•</span>
                              <p style={{ margin:0,fontSize:".67rem",color:"rgba(203,213,225,.72)",lineHeight:1.5 }}>{m}</p>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* SCREEN 3: Analytics Lab */}
                    {activeStep === 3 && (
                      <motion.div key="s3"
                        initial={{ opacity:0, y:14, filter:"blur(5px)" }}
                        animate={{ opacity:1, y:0, filter:"blur(0px)" }}
                        exit={{ opacity:0, y:-14, filter:"blur(5px)" }}
                        transition={{ duration:.32 }}
                        style={{ display:"flex", flexDirection:"column", gap:10 }}>
                        <span style={{ fontSize:".8rem",fontWeight:700,color:"#f1f5f9",display:"block",marginBottom:4 }}>Analytics Lab</span>
                        {/* P&L growth chart */}
                        <div style={{ position:"relative",height:82,background:"rgba(255,255,255,.025)",borderRadius:10,overflow:"hidden" }}>
                          <svg width="100%" height="82" viewBox="0 0 300 82" preserveAspectRatio="none" style={{ position:"absolute",inset:0 }}>
                            <defs>
                              <linearGradient id="pvSlGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={GRN} stopOpacity=".3"/>
                                <stop offset="100%" stopColor={GRN} stopOpacity=".01"/>
                              </linearGradient>
                            </defs>
                            <path d="M0 66 L50 54 L100 60 L150 32 L200 40 L250 16 L300 6 L300 82 L0 82Z" fill="url(#pvSlGrad)"/>
                            <motion.path d="M0 66 L50 54 L100 60 L150 32 L200 40 L250 16 L300 6"
                              stroke={GRN} strokeWidth="2" fill="none" strokeLinecap="round"
                              initial={{ pathLength:0 }} animate={{ pathLength:1 }} transition={{ duration:1.5,ease:[.22,1,.36,1] }} />
                          </svg>
                          <div style={{ position:"absolute",top:8,left:12 }}>
                            <div style={{ fontSize:".5rem",fontFamily:"monospace",color:"rgba(100,116,139,.45)",letterSpacing:".1em" }}>P&L GROWTH</div>
                            <div style={{ fontSize:"1.08rem",fontWeight:800,color:GRN }}>+$1,248</div>
                          </div>
                        </div>
                        <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8 }}>
                          {[["Win Rate","64%",GRN,"16,185,129"],["Avg R:R","1.8",CYN,"34,211,238"],["P.Factor","1.42",AMB,"245,158,11"]].map(([l,v,c,rgb],i)=>(
                            <div key={i} style={{ background:"rgba(255,255,255,.04)",borderRadius:9,padding:"10px 8px",textAlign:"center",border:`1px solid rgba(${rgb},.12)` }}>
                              <div style={{ fontSize:".5rem",fontFamily:"monospace",color:"rgba(100,116,139,.4)",letterSpacing:".08em",marginBottom:4 }}>{l}</div>
                              <div style={{ fontSize:"1rem",fontWeight:700,color:c as string }}>{v}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{ fontSize:".58rem",fontFamily:"monospace",color:"rgba(100,116,139,.45)",letterSpacing:".12em" }}>SESSION WIN RATE</div>
                        {[["London","71%",.71],["New York","58%",.58],["Asia","34%",.34]].map(([s,p,v],i)=>(
                          <div key={i} style={{ display:"flex",alignItems:"center",gap:8,marginTop:i===0?4:0 }}>
                            <span style={{ fontSize:".66rem",color:"rgba(148,163,184,.5)",width:64,flexShrink:0 }}>{s}</span>
                            <div style={{ flex:1,height:4,borderRadius:2,background:"rgba(255,255,255,.06)",overflow:"hidden" }}>
                              <motion.div initial={{ scaleX:0 }} animate={{ scaleX:v as number }}
                                transition={{ duration:.9,delay:.1+i*.1,ease:[.22,1,.36,1] }}
                                style={{ height:"100%",borderRadius:2,background:`linear-gradient(90deg,${GRN}90,${GRN}40)`,originX:0 }} />
                            </div>
                            <span style={{ fontSize:".62rem",fontFamily:"monospace",color:GRN,width:26 }}>{p}</span>
                          </div>
                        ))}
                      </motion.div>
                    )}

                  </AnimatePresence>
                </div>
              </div>

              {/* status bar */}
              <div style={{ padding:"7px 16px",background:"rgba(0,0,0,.3)",borderTop:"1px solid rgba(255,255,255,.05)",
                display:"flex",alignItems:"center",gap:12 }}>
                <div style={{ display:"flex",alignItems:"center",gap:5 }}>
                  <span style={{ width:5,height:5,borderRadius:"50%",background:GRN,boxShadow:`0 0 6px ${GRN}`,animation:"tmPulse 2s infinite" }} />
                  <span style={{ fontSize:".56rem",fontFamily:"monospace",letterSpacing:".1em",color:"rgba(100,116,139,.4)" }}>ALL SYSTEMS OPERATIONAL</span>
                </div>
                <div style={{ marginLeft:"auto",fontSize:".56rem",fontFamily:"monospace",color:"rgba(100,116,139,.28)",letterSpacing:".08em" }}>
                  AI ENGINE v2.4
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </Slide>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SLIDE 4 — ANALYTICS LAB  (cinematic / cursor-physics / impossible layout)
// ═════════════════════════════════════════════════════════════════════════════

// Static constants outside component — stable across renders
const AG_DOTS = [
  { x:0,   y:66 }, { x:50,  y:54 }, { x:100, y:60 },
  { x:150, y:30 }, { x:200, y:38 }, { x:250, y:14 }, { x:300, y:6 },
] as { x:number; y:number }[];

const AG_CARDS = [
  { label:"WIN RATE",  val:"+64%",   color:GRN, rgb:"16,185,129",  rot:-7, lp:.40, tp:.12 },
  { label:"TOTAL P&L", val:"+$1.2K", color:AMB, rgb:"245,158,11",  rot: 5, lp:.62, tp:.08 },
  { label:"AVG R:R",   val:"1.8",    color:CYN, rgb:"34,211,238",   rot:-4, lp:.57, tp:.60 },
  { label:"P.FACTOR",  val:"1.42",   color:VIO, rgb:"139,92,246",   rot: 8, lp:.37, tp:.72 },
];

function SlideAnalytics({ active }: { active: boolean }) {
  const t = useT();

  // ── Physics refs — all mutations bypass React re-renders ──
  const stageRef    = useRef<HTMLDivElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);
  const lightRef    = useRef<HTMLDivElement>(null);
  const dotRefs     = useRef<(SVGCircleElement | null)[]>([]);
  const linePathRef = useRef<SVGPathElement>(null);
  const fillPathRef = useRef<SVGPathElement>(null);
  const cardRefs    = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef      = useRef(0);

  const mouseRaw = useRef({ x:720, y:450 });
  const mouseSpr = useRef({ x:720, y:450 });
  const velSpr   = useRef({ x:0,   y:0 });
  const dotPos   = useRef(AG_DOTS.map(d => ({ x:d.x, y:d.y })));

  useEffect(() => {
    if (!active) {
      // reset dots when slide leaves
      dotPos.current = AG_DOTS.map(d => ({ x:d.x, y:d.y }));
      cancelAnimationFrame(rafRef.current);
      return;
    }
    const el = stageRef.current; if (!el) return;
    const sw = el.clientWidth, sh = el.clientHeight;

    // Pre-compute card centres from % layout (avoids getBoundingClientRect per frame)
    const CARD_W = 150, CARD_H = 88;
    const cardCenters = AG_CARDS.map(c => ({
      cx: c.lp * sw + CARD_W / 2,
      cy: c.tp * sh + CARD_H / 2,
    }));

    let svgBounds = { x:0, y:0, w:1, h:1 };
    let svgReady  = false;

    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      mouseRaw.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    el.addEventListener("mousemove", onMove, { passive:true });

    const tick = () => {
      // spring toward raw mouse
      velSpr.current.x = velSpr.current.x * 0.76 + (mouseRaw.current.x - mouseSpr.current.x) * 0.1;
      velSpr.current.y = velSpr.current.y * 0.76 + (mouseRaw.current.y - mouseSpr.current.y) * 0.1;
      mouseSpr.current.x += velSpr.current.x;
      mouseSpr.current.y += velSpr.current.y;
      const sx = mouseSpr.current.x, sy = mouseSpr.current.y;

      // ── cursor orb ──
      if (followerRef.current)
        followerRef.current.style.transform = `translate(${sx-22}px,${sy-22}px)`;

      // ── ambient light bloom ──
      if (lightRef.current)
        lightRef.current.style.background =
          `radial-gradient(350px circle at ${mouseRaw.current.x}px ${mouseRaw.current.y}px,rgba(245,158,11,.12) 0%,transparent 52%)`;

      // ── measure SVG once after first render ──
      if (!svgReady && linePathRef.current?.ownerSVGElement) {
        const r  = linePathRef.current.ownerSVGElement.getBoundingClientRect();
        const er = el.getBoundingClientRect();
        svgBounds = { x:r.left-er.left, y:r.top-er.top, w:r.width||1, h:r.height||1 };
        svgReady = true;
      }

      // ── dot-repulsion physics ──
      if (svgReady) {
        const mx = ((mouseRaw.current.x - svgBounds.x) / svgBounds.w) * 300;
        const my = ((mouseRaw.current.y - svgBounds.y) / svgBounds.h) * 82;

        for (let i = 0; i < AG_DOTS.length; i++) {
          const dot = dotRefs.current[i]; if (!dot) continue;
          const { x:ox, y:oy } = AG_DOTS[i];
          let { x:nx, y:ny }   = dotPos.current[i];

          const ddx = nx - mx, ddy = ny - my;
          const dist = Math.sqrt(ddx * ddx + ddy * ddy);

          if (dist < 55) {
            // repulse — quadratic falloff
            const f   = ((1 - dist / 55) ** 2) * 22;
            const ang = Math.atan2(ddy, ddx);
            nx += Math.cos(ang) * f * 0.22;
            ny += Math.sin(ang) * f * 0.22;
          }
          // spring back to origin
          nx += (ox - nx) * 0.09;
          ny += (oy - ny) * 0.09;
          ny  = Math.max(2, Math.min(79, ny));

          dotPos.current[i] = { x:nx, y:ny };
          dot.setAttribute("cx", nx.toFixed(1));
          dot.setAttribute("cy", ny.toFixed(1));

          const glo = Math.max(0, 1 - dist / 80);
          dot.style.filter = `drop-shadow(0 0 ${3 + glo * 14}px rgba(245,158,11,${.4 + glo * .6}))`;
        }

        // rebuild SVG path from displaced dots
        const pts = dotPos.current;
        const ld  = `M${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`
          + pts.slice(1).map(p => ` L${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join("");
        linePathRef.current?.setAttribute("d", ld);
        fillPathRef.current?.setAttribute("d", ld + " L300 82 L0 82Z");
      }

      // ── card 3D tilt (cursor proximity) ──
      cardRefs.current.forEach((card, i) => {
        if (!card) return;
        const { cx, cy } = cardCenters[i];
        const rot = AG_CARDS[i].rot;
        const rgb = AG_CARDS[i].rgb;
        const dx = mouseRaw.current.x - cx;
        const dy = mouseRaw.current.y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 220) {
          const tx  = (dx / 220) * 16;
          const ty  = (dy / 220) * 11;
          const glo = 1 - dist / 220;
          card.style.transform  = `perspective(700px) rotate(${rot}deg) rotateY(${tx}deg) rotateX(${-ty}deg) translateZ(6px)`;
          card.style.boxShadow  = `0 0 0 1px rgba(${rgb},.12),0 28px 70px rgba(0,0,0,.7),0 0 ${28+glo*48}px rgba(${rgb},${.06+glo*.18})`;
        } else {
          card.style.transform  = `perspective(700px) rotate(${rot}deg)`;
          card.style.boxShadow  = `0 0 0 1px rgba(${rgb},.05),0 20px 50px rgba(0,0,0,.55),0 0 24px rgba(${rgb},.05)`;
        }
      });

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { el.removeEventListener("mousemove", onMove); cancelAnimationFrame(rafRef.current); };
  }, [active]);

  const headline = t("lp_analytics_headline");

  return (
    <Slide id="slide-analytics" bg="#020309">

      {/* ══ BACKGROUND LAYERS ══ */}
      {/* deep gradient nebula */}
      <div style={{ position:"absolute", inset:0, pointerEvents:"none",
        background:"radial-gradient(ellipse 110% 65% at 78% 105%,rgba(245,158,11,.055) 0%,transparent 52%), radial-gradient(ellipse 55% 55% at 12% 12%,rgba(34,211,238,.03) 0%,transparent 50%)" }} />
      {/* fine grid */}
      <div style={{ position:"absolute", inset:0, pointerEvents:"none", opacity:.09,
        backgroundImage:"linear-gradient(rgba(245,158,11,.35) 1px,transparent 1px),linear-gradient(90deg,rgba(245,158,11,.35) 1px,transparent 1px)",
        backgroundSize:"56px 56px" }} />
      {/* cursor-driven ambient light (DOM mutated) */}
      <div ref={lightRef} style={{ position:"absolute", inset:0, pointerEvents:"none" }} />
      {/* horizontal scan line */}
      <motion.div
        style={{ position:"absolute", left:0, right:0, height:1.5, pointerEvents:"none", zIndex:1,
          background:"linear-gradient(90deg,transparent,rgba(245,158,11,.7) 35%,rgba(245,158,11,.7) 65%,transparent)",
          filter:"blur(.6px)" }}
        animate={{ y:["-3vh","103vh"] }}
        transition={{ duration:7, repeat:Infinity, ease:"linear" }}
      />
      {/* slow diagonal accent */}
      <motion.div
        style={{ position:"absolute", top:0, left:0, right:0, bottom:0, pointerEvents:"none", zIndex:0,
          background:"linear-gradient(135deg,transparent 0%,rgba(245,158,11,.03) 48%,transparent 52%)",
          backgroundSize:"200% 200%" }}
        animate={{ backgroundPosition:["0% 0%","200% 200%"] }}
        transition={{ duration:12, repeat:Infinity, ease:"linear" }}
      />

      {/* ══ CURSOR ORB (spring physics) ══ */}
      <div ref={followerRef} style={{ position:"absolute", top:0, left:0, pointerEvents:"none", zIndex:60,
        width:44, height:44, borderRadius:"50%",
        border:"1px solid rgba(245,158,11,.5)",
        background:"radial-gradient(circle,rgba(245,158,11,.2) 0%,transparent 65%)",
        boxShadow:"0 0 22px rgba(245,158,11,.3),0 0 8px rgba(245,158,11,.5)",
        mixBlendMode:"screen" }} />

      {/* ══ STAGE ══ */}
      <div ref={stageRef} style={{ position:"absolute", inset:0, zIndex:10 }}>

        {/* ── LEFT TEXT BLOCK ── */}
        <div style={{ position:"absolute", top:"8%", left:"clamp(28px,4.5vw,68px)", width:"clamp(260px,34%,400px)" }}>

          {/* badge */}
          <motion.div initial={{ opacity:0, x:-22 }} animate={active?{opacity:1,x:0}:{}} transition={{ duration:.55, delay:.14 }}
            style={{ display:"inline-flex", alignItems:"center", gap:7, marginBottom:20, padding:"4px 14px", borderRadius:100,
              border:`1px solid ${AMB}22`, background:`${AMB}0c`, fontSize:".63rem", fontFamily:"monospace",
              letterSpacing:".22em", color:`${AMB}bb` }}>
            <span style={{ width:4, height:4, borderRadius:"50%", background:AMB, boxShadow:`0 0 6px ${AMB}`,
              flexShrink:0, animation:"tmPulse 1.8s infinite" }} />
            {t("lp_analytics_badge")}
          </motion.div>

          {/* headline — word-by-word cinematic drop */}
          <h2 style={{ margin:"0 0 18px", fontWeight:900, letterSpacing:"-.055em", lineHeight:1.04,
            fontSize:"clamp(2rem,4.2vw,3.2rem)" }}>
            {headline.split(" ").map((word, wi) => (
              <span key={wi} style={{ display:"inline-block", overflow:"hidden",
                marginRight:".2em", marginBottom:".06em" }}>
                <motion.span
                  initial={{ y:"115%", opacity:0 }}
                  animate={active ? { y:0, opacity:1 } : {}}
                  transition={{ duration:.78, delay:.22 + wi * .13, ease:[.22,1,.36,1] }}
                  style={{ display:"inline-block",
                    background:"linear-gradient(135deg,#f8fafc 0%,#fde68a 28%,#f59e0b 50%,#d97706 70%,#f8fafc 100%)",
                    backgroundSize:"220% auto", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
                    animation:"heroShimmer 7s linear infinite" }}>
                  {word}
                </motion.span>
              </span>
            ))}
          </h2>

          <motion.p initial={{ opacity:0, y:14 }} animate={active?{opacity:1,y:0}:{}} transition={{ duration:.55, delay:.5 }}
            style={{ margin:"0 0 28px", fontSize:".9rem", color:"rgba(148,163,184,.5)", lineHeight:1.72 }}>
            {t("lp_analytics_sub")}
          </motion.p>

          {/* feature list */}
          <div style={{ display:"flex", flexDirection:"column", gap:11 }}>
            {(["lp_analytics_feat_1","lp_analytics_feat_2","lp_analytics_feat_3","lp_analytics_feat_4"] as const).map((k,i)=>(
              <motion.div key={i}
                initial={{ opacity:0, x:-22 }} animate={active?{opacity:1,x:0}:{}}
                transition={{ duration:.48, delay:.58+i*.1, ease:[.22,1,.36,1] }}
                style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:18, height:18, borderRadius:5, background:`${AMB}16`, border:`1px solid ${AMB}26`,
                  display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:`0 0 8px ${AMB}24` }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke={AMB} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span style={{ fontSize:".83rem", color:"rgba(148,163,184,.65)" }}>{t(k)}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── IMPOSSIBLE FLOATING STAT CARDS ── */}
        {AG_CARDS.map((c, i) => (
          <motion.div key={i}
            initial={{ opacity:0, scale:.45, y:28 }}
            animate={active ? { opacity:1, scale:1, y:0 } : {}}
            transition={{ duration:.85, delay:.26+i*.12, type:"spring", stiffness:150, damping:15 }}
            style={{ position:"absolute", left:`${c.lp*100}%`, top:`${c.tp*100}%`, zIndex:30 }}>
            <div
              ref={el => { cardRefs.current[i] = el; }}
              style={{ padding:"14px 20px", borderRadius:16, minWidth:150, cursor:"default",
                background:`linear-gradient(145deg,rgba(${c.rgb},.14) 0%,rgba(2,3,9,.92) 60%)`,
                border:`1px solid rgba(${c.rgb},.26)`,
                backdropFilter:"blur(24px)",
                transform:`perspective(700px) rotate(${c.rot}deg)`,
                transition:"transform .15s ease, box-shadow .15s ease",
                boxShadow:`0 0 0 1px rgba(${c.rgb},.05),0 20px 50px rgba(0,0,0,.6)`,
              }}>
              <div style={{ fontSize:".52rem", fontFamily:"monospace", letterSpacing:".16em",
                color:`rgba(${c.rgb},.55)`, marginBottom:9 }}>
                {c.label}
              </div>
              <div style={{ fontSize:"1.55rem", fontWeight:900, letterSpacing:"-.05em", color:c.color, lineHeight:1,
                textShadow:`0 0 24px rgba(${c.rgb},.6)` }}>
                {c.val}
              </div>
            </div>
          </motion.div>
        ))}

        {/* ── RIGHT: MASSIVE INTERACTIVE CHART ── */}
        <motion.div
          initial={{ opacity:0, x:70, scale:.9 }}
          animate={active ? { opacity:1, x:0, scale:1 } : {}}
          transition={{ duration:1.05, delay:.16, type:"spring", stiffness:85, damping:18 }}
          style={{ position:"absolute", right:"-2%", top:"6%", bottom:"6%", width:"58%", zIndex:15 }}>

          <div style={{ height:"100%", display:"flex", flexDirection:"column", gap:14, padding:22,
            background:"linear-gradient(155deg,rgba(245,158,11,.055) 0%,rgba(2,3,9,.95) 52%)",
            border:"1px solid rgba(245,158,11,.1)", borderRadius:22,
            backdropFilter:"blur(14px)",
            boxShadow:"0 0 0 1px rgba(245,158,11,.04),0 52px 110px rgba(0,0,0,.75),0 0 90px rgba(245,158,11,.04)" }}>

            {/* chart header */}
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexShrink:0 }}>
              <div>
                <div style={{ fontSize:".55rem", fontFamily:"monospace", letterSpacing:".16em",
                  color:"rgba(100,116,139,.38)", marginBottom:7 }}>
                  {t("lp_analytics_pnl_label")}
                </div>
                <motion.div initial={{ opacity:0 }} animate={active?{opacity:1}:{}} transition={{ delay:.65 }}
                  style={{ fontSize:"2rem", fontWeight:900, letterSpacing:"-.055em", color:AMB, lineHeight:1,
                    textShadow:"0 0 38px rgba(245,158,11,.55)" }}>
                  +$1,248
                  <span style={{ fontSize:".75rem", fontWeight:500, color:"rgba(245,158,11,.5)", marginLeft:10 }}>↑ 34%</span>
                </motion.div>
              </div>
              <div style={{ display:"flex", gap:3, paddingTop:4 }}>
                {["1W","1M","3M","6M"].map((l,i)=>(
                  <div key={i} style={{ padding:"4px 9px", borderRadius:6, fontSize:".58rem", fontFamily:"monospace",
                    cursor:"pointer",
                    background:i===1?"rgba(245,158,11,.18)":"transparent",
                    border:i===1?`1px solid rgba(245,158,11,.35)`:"1px solid rgba(255,255,255,.06)",
                    color:i===1?AMB:"rgba(100,116,139,.38)" }}>
                    {l}
                  </div>
                ))}
              </div>
            </div>

            {/* interactive SVG chart */}
            <div style={{ flex:1, minHeight:0, position:"relative" }}>
              <svg width="100%" height="100%" viewBox="0 0 300 82"
                preserveAspectRatio="xMidYMid meet" style={{ overflow:"visible" }}>
                <defs>
                  <linearGradient id="agFillGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={AMB} stopOpacity=".24"/>
                    <stop offset="72%"  stopColor={AMB} stopOpacity=".02"/>
                    <stop offset="100%" stopColor={AMB} stopOpacity="0"/>
                  </linearGradient>
                  <linearGradient id="agLineGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%"   stopColor={CYN} stopOpacity=".5"/>
                    <stop offset="50%"  stopColor={AMB} stopOpacity="1"/>
                    <stop offset="100%" stopColor={GRN} stopOpacity=".65"/>
                  </linearGradient>
                  <filter id="agGlw" x="-15%" y="-15%" width="130%" height="130%">
                    <feGaussianBlur stdDeviation="2.2" result="b"/>
                    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                </defs>

                {/* guide lines */}
                {[16,32,48,64].map(y=>(
                  <line key={y} x1="0" y1={y} x2="300" y2={y}
                    stroke="rgba(255,255,255,.045)" strokeWidth=".5" strokeDasharray="3 8"/>
                ))}
                {[60,120,180,240].map(x=>(
                  <line key={x} x1={x} y1="0" x2={x} y2="82"
                    stroke="rgba(255,255,255,.025)" strokeWidth=".5"/>
                ))}

                {/* ── PHYSICS PATHS (DOM-mutated by RAF) ── */}
                <path ref={fillPathRef}
                  d="M0 66 L50 54 L100 60 L150 30 L200 38 L250 14 L300 6 L300 82 L0 82Z"
                  fill="url(#agFillGrad)" />
                <path ref={linePathRef}
                  d="M0 66 L50 54 L100 60 L150 30 L200 38 L250 14 L300 6"
                  stroke="url(#agLineGrad)" strokeWidth="2.2" fill="none"
                  strokeLinecap="round" filter="url(#agGlw)" />

                {/* ── PHYSICS DATA POINTS ── */}
                {AG_DOTS.map((d, i) => (
                  <circle key={i} ref={el => { dotRefs.current[i] = el; }}
                    cx={d.x} cy={d.y} r="5"
                    fill="#020309" stroke={AMB} strokeWidth="1.8"
                    style={{ filter:"drop-shadow(0 0 4px rgba(245,158,11,.7))", cursor:"none" }}
                  />
                ))}

                {/* month labels */}
                {["JAN","FEB","MAR","APR","MAY","JUN"].map((m,i)=>(
                  <text key={i} x={i*60} y="79" fill="rgba(100,116,139,.35)"
                    fontSize="6" fontFamily="monospace" letterSpacing="1">{m}</text>
                ))}
              </svg>
            </div>

            {/* stats row */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, flexShrink:0 }}>
              {[["Win Rate","64%",GRN],["Avg R:R","1.8",CYN],["P.Factor","1.42",AMB]].map(([l,v,c],i)=>(
                <motion.div key={i}
                  initial={{ opacity:0, y:10 }} animate={active?{opacity:1,y:0}:{}}
                  transition={{ duration:.4, delay:.9+i*.08 }}
                  style={{ background:"rgba(255,255,255,.04)", borderRadius:11, padding:"12px 14px",
                    textAlign:"center", border:"1px solid rgba(255,255,255,.06)" }}>
                  <div style={{ fontSize:".54rem", fontFamily:"monospace", color:"rgba(100,116,139,.38)",
                    letterSpacing:".09em", marginBottom:5 }}>{(l as string).toUpperCase()}</div>
                  <div style={{ fontSize:"1.2rem", fontWeight:800, color:c as string, letterSpacing:"-.03em" }}>{v}</div>
                </motion.div>
              ))}
            </div>

            {/* session bars */}
            <div style={{ flexShrink:0 }}>
              <div style={{ fontSize:".54rem", fontFamily:"monospace", color:"rgba(100,116,139,.38)",
                letterSpacing:".14em", marginBottom:10 }}>
                {t("lp_analytics_session_label")}
              </div>
              {[["London","71%",.71],["New York","58%",.58],["Asia","34%",.34]].map(([s,p,v],i)=>(
                <div key={i} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:7 }}>
                  <span style={{ fontSize:".7rem", color:"rgba(148,163,184,.5)", width:72, flexShrink:0 }}>{s}</span>
                  <div style={{ flex:1, height:4, borderRadius:2, background:"rgba(255,255,255,.06)", overflow:"hidden" }}>
                    <motion.div style={{ height:"100%", borderRadius:2,
                      background:`linear-gradient(90deg,${AMB}88,${AMB}40)`, originX:0 }}
                      initial={{ scaleX:0 }} animate={active?{scaleX:v as number}:{}}
                      transition={{ duration:1.15, delay:.95+i*.12, ease:[.22,1,.36,1] }} />
                  </div>
                  <span style={{ fontSize:".66rem", fontFamily:"monospace", color:AMB, width:28, flexShrink:0 }}>{p}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

      </div>
    </Slide>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SLIDE 5 — TRADER DNA
// ═════════════════════════════════════════════════════════════════════════════
function SlideDNA({ active }: { active: boolean }) {
  const t = useT();
  const BLU = "#3b82f6", PUR = "#a855f7", YLW = "#eab308";
  const bestPairs = [
    { pair:"EURUSD", trades:12, wr:67, pnl:"+$487" },
    { pair:"NVDA",   trades: 8, wr:75, pnl:"+$312" },
    { pair:"BTCUSD", trades: 6, wr:50, pnl:"+$148" },
  ];
  const insights = [t("lp_dna_error_early_exit"), t("lp_dna_error_early_entry")];
  const spring  = { type:"spring", stiffness:220, damping:22 } as const;
  const springS = { type:"spring", stiffness:160, damping:20 } as const;
  const play    = active ? "running" : "paused";

  return (
    <Slide id="slide-dna" bg="#05060f">
      {/* ambient cyan tint + dot grid */}
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 60% 60% at 72% 50%,rgba(34,211,238,.07) 0%,transparent 70%)", pointerEvents:"none" }} />
      <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(rgba(148,163,184,.05) 1px,transparent 1px)", backgroundSize:"28px 28px", maskImage:"radial-gradient(ellipse 70% 70% at 65% 50%,black,transparent 85%)", WebkitMaskImage:"radial-gradient(ellipse 70% 70% at 65% 50%,black,transparent 85%)", pointerEvents:"none" }} />

      {/* animated DNA double-helix backdrop */}
      <div aria-hidden style={{ position:"absolute", left:"3%", top:"50%", transform:"translateY(-50%)", width:"clamp(140px,12vw,200px)", height:"70%", opacity:.55, pointerEvents:"none" }}>
        <svg viewBox="0 0 180 600" preserveAspectRatio="none" width="100%" height="100%"
          style={{ animation:"tmDnaDrift 14s ease-in-out infinite", animationPlayState:play, overflow:"visible" }}>
          <defs>
            <linearGradient id="dnaA" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"  stopColor="#22d3ee" stopOpacity="0"/>
              <stop offset="50%" stopColor="#22d3ee" stopOpacity=".95"/>
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0"/>
            </linearGradient>
            <linearGradient id="dnaB" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"  stopColor="#a855f7" stopOpacity="0"/>
              <stop offset="50%" stopColor="#a855f7" stopOpacity=".95"/>
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0"/>
            </linearGradient>
          </defs>
          <path d="M 30 0 Q 150 60 30 120 Q -90 180 30 240 Q 150 300 30 360 Q -90 420 30 480 Q 150 540 30 600"
            fill="none" stroke="url(#dnaA)" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="6 8"
            style={{ animation:"tmDash 14s linear infinite", animationPlayState:play }} />
          <path d="M 150 0 Q 30 60 150 120 Q 270 180 150 240 Q 30 300 150 360 Q 270 420 150 480 Q 30 540 150 600"
            fill="none" stroke="url(#dnaB)" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="6 8"
            style={{ animation:"tmDashRev 14s linear infinite", animationPlayState:play }} />
          {Array.from({ length:9 }).map((_, i) => {
            const y = 24 + i * 68;
            return (
              <g key={i}>
                <line x1="30" y1={y} x2="150" y2={y} stroke={i % 2 ? CYN : "#a855f7"} strokeOpacity=".22" strokeWidth="1" />
                <circle cx="30"  cy={y} r="3.4" fill={CYN} style={{ animation:`tmNode 2.4s ease-in-out ${i * 0.18}s infinite`, animationPlayState:play }} />
                <circle cx="150" cy={y} r="3.4" fill="#a855f7" style={{ animation:`tmNode 2.4s ease-in-out ${i * 0.18 + 1.2}s infinite`, animationPlayState:play }} />
              </g>
            );
          })}
        </svg>
      </div>

      <div style={{ ...inner, ...px, zIndex:10, position:"relative" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1.3fr", gap:52, alignItems:"center" }}>

          {/* LEFT — text */}
          <div>
            <motion.div initial={{ opacity:0, scale:.85 }} animate={active ? { opacity:1, scale:1 } : {}} transition={spring}
              style={{ display:"inline-flex", alignItems:"center", gap:7, marginBottom:16, padding:"4px 14px", borderRadius:100, border:`1px solid ${CYN}22`, background:`${CYN}0c`, fontSize:".63rem", fontFamily:"monospace", letterSpacing:".22em", color:`${CYN}bb` }}>
              <span style={{ width:4, height:4, borderRadius:"50%", background:CYN, boxShadow:`0 0 6px ${CYN}`, flexShrink:0 }} />{t("lp_dna_badge")}
            </motion.div>
            <motion.h2 initial={{ opacity:0, y:18 }} animate={active ? { opacity:1, y:0 } : {}} transition={{ ...spring, delay:.08 }}
              style={{ margin:"0 0 14px", fontWeight:800, letterSpacing:"-.04em", fontSize:"clamp(1.6rem,3vw,2.4rem)", lineHeight:1.12,
                background:"linear-gradient(135deg,#f8fafc 0%,#67e8f9 35%,#22d3ee 55%,#a78bfa 80%,#f8fafc 100%)",
                backgroundSize:"260% auto", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
                animation:"heroShimmer 9s linear infinite" }}>
              {t("lp_dna_headline")}
            </motion.h2>
            <motion.p initial={{ opacity:0, y:14 }} animate={active ? { opacity:1, y:0 } : {}} transition={{ duration:.55, delay:.2 }}
              style={{ margin:"0 0 24px", fontSize:".9rem", color:"rgba(148,163,184,.54)", lineHeight:1.72 }}>
              {t("lp_dna_sub")}
            </motion.p>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {(["lp_dna_feat_1","lp_dna_feat_2","lp_dna_feat_3","lp_dna_feat_4"]).map((k,i) => (
                <motion.div key={i} initial={{ opacity:0, x:-16 }} animate={active ? { opacity:1, x:0 } : {}} transition={{ type:"spring", stiffness:240, damping:22, delay:.28 + i*.08 }}
                  style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:18, height:18, borderRadius:5, background:`${CYN}18`, border:`1px solid ${CYN}30`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:`0 0 8px ${CYN}30` }}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5 4.5-4.5" stroke={CYN} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <span style={{ fontSize:".83rem", color:"rgba(148,163,184,.7)" }}>{t(k)}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* RIGHT — realistic Trader DNA mock */}
          <motion.div initial={{ opacity:0, x:32, scale:.96 }} animate={active ? { opacity:1, x:0, scale:1 } : {}} transition={{ type:"spring", stiffness:140, damping:18, delay:.18 }}
            style={{ position:"relative" }}>
            <div style={{
              animation:"tmFloat 6.5s ease-in-out infinite", animationPlayState:play,
              borderRadius:18, border:`1px solid ${CYN}22`,
              background:"linear-gradient(180deg,rgba(8,18,30,.92) 0%,rgba(5,6,15,.94) 100%)",
              padding:"18px 18px 20px", display:"flex", flexDirection:"column", gap:14,
              boxShadow:`0 0 0 1px ${CYN}08, 0 30px 80px rgba(0,0,0,.45)`,
            }}>
              {/* header — Brain + gradient title */}
              <div style={{ display:"flex", alignItems:"center", gap:12, paddingBottom:12, borderBottom:`1px solid ${CYN}14` }}>
                <div style={{ position:"relative", width:38, height:38, flexShrink:0 }}>
                  <div style={{ position:"absolute", inset:-6, borderRadius:"50%", background:"radial-gradient(circle,rgba(34,211,238,.55) 0%,transparent 70%)", filter:"blur(8px)", animation:"tmGlowPulse 3s ease-in-out infinite", animationPlayState:play }} />
                  <div style={{ position:"relative", width:38, height:38, borderRadius:10, background:`linear-gradient(135deg,${CYN}28,${CYN}10)`, border:`1px solid ${CYN}50`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#67e8f9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 5a3 3 0 1 0-5.997.142 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 0 0 12 18Z"/>
                      <path d="M12 5a3 3 0 1 1 5.997.142 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 0 1 12 18Z"/>
                    </svg>
                  </div>
                </div>
                <h3 style={{ margin:0, fontSize:"1.1rem", fontWeight:800, letterSpacing:"-.02em",
                  background:"linear-gradient(135deg,#f8fafc 0%,#67e8f9 45%,#22d3ee 70%,#f8fafc 100%)",
                  backgroundSize:"220% auto", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
                  animation:"heroShimmer 7s linear infinite" }}>Trader DNA</h3>
                <span style={{ marginLeft:"auto", display:"inline-flex", alignItems:"center", gap:6, fontSize:".55rem", fontFamily:"monospace", letterSpacing:".18em", color:`${CYN}cc`, padding:"3px 9px", borderRadius:100, border:`1px solid ${CYN}30`, background:`${CYN}0c` }}>
                  <span style={{ width:5, height:5, borderRadius:"50%", background:CYN, boxShadow:`0 0 6px ${CYN}`, animation:"tmPulse 1.6s infinite" }} />LIVE
                </span>
              </div>

              {/* P&L + Win Rate */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                {[
                  { label:"TOTAL P&L", val:1248, prefix:"+$", color:GRN },
                  { label:"WIN RATE",  val:64,   suffix:"%",  color:CYN },
                ].map((m, i) => (
                  <motion.div key={i} initial={{ opacity:0, y:14, scale:.9 }} animate={active ? { opacity:1, y:0, scale:1 } : {}} transition={{ type:"spring", stiffness:200, damping:18, delay:.36 + i*.08 }}
                    style={{ background:"rgba(255,255,255,.025)", border:`1px solid ${m.color}22`, borderRadius:12, padding:"14px 12px", textAlign:"center", position:"relative", overflow:"hidden" }}>
                    <div style={{ position:"absolute", inset:0, background:`radial-gradient(ellipse at center,${m.color}12 0%,transparent 70%)`, pointerEvents:"none" }} />
                    <div style={{ position:"relative", fontSize:".56rem", fontFamily:"monospace", color:"rgba(100,116,139,.55)", letterSpacing:".14em", marginBottom:6 }}>{m.label}</div>
                    <div style={{ position:"relative", fontSize:"1.7rem", fontWeight:800, color:m.color, letterSpacing:"-.03em", lineHeight:1, textShadow:`0 0 18px ${m.color}55` }}>
                      {m.prefix}<CountUp to={m.val} active={active} delay={.5 + i*.08} />{m.suffix}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* 3-col Trades / PF / Avg W/L */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
                {[
                  { label:"TRADES",        val:"28",   sub:"18W / 10L", color:BLU },
                  { label:"PROFIT FACTOR", val:"1.8",  color:GRN },
                  { label:"AVG W/L",       val:"+$87", sub:"-$48",     color:PUR },
                ].map((c, i) => (
                  <motion.div key={i} initial={{ opacity:0, y:10 }} animate={active ? { opacity:1, y:0 } : {}} transition={{ type:"spring", stiffness:220, damping:20, delay:.5 + i*.06 }}
                    style={{ background:`${c.color}0a`, border:`1px solid ${c.color}26`, borderRadius:10, padding:"10px 8px", textAlign:"center" }}>
                    <div style={{ fontSize:".5rem", fontFamily:"monospace", color:"rgba(100,116,139,.55)", letterSpacing:".12em", marginBottom:4 }}>{c.label}</div>
                    <div style={{ fontSize:"1.05rem", fontWeight:800, color:c.color, lineHeight:1.1 }}>{c.val}</div>
                    {c.sub && <div style={{ fontSize:".58rem", color:c.color, opacity:.72, marginTop:2 }}>{c.sub}</div>}
                  </motion.div>
                ))}
              </div>

              {/* Risk Profile bar */}
              <motion.div initial={{ opacity:0, y:10 }} animate={active ? { opacity:1, y:0 } : {}} transition={{ type:"spring", stiffness:200, damping:20, delay:.66 }}
                style={{ background:`${YLW}0a`, border:`1px solid ${YLW}28`, borderRadius:12, padding:"12px 14px" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={YLW} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                    <span style={{ fontSize:".56rem", fontFamily:"monospace", letterSpacing:".14em", color:"rgba(148,163,184,.6)" }}>RISK PROFILE</span>
                  </div>
                  <span style={{ fontSize:".95rem", fontWeight:800, color:YLW, letterSpacing:"-.02em" }}>Medium</span>
                </div>
                <div style={{ fontSize:".62rem", color:"rgba(148,163,184,.5)", marginBottom:6 }}>
                  Avg exposure <span style={{ color:YLW, fontWeight:700 }}>1.8%</span> per trade
                </div>
                <div style={{ height:5, borderRadius:3, background:"rgba(255,255,255,.06)", overflow:"hidden" }}>
                  <motion.div style={{ height:"100%", borderRadius:3, background:`linear-gradient(90deg,${YLW},${AMB})`, originX:0, boxShadow:`0 0 8px ${YLW}` }}
                    initial={{ scaleX:0 }} animate={active ? { scaleX:.5 } : {}} transition={{ type:"spring", stiffness:110, damping:16, delay:.84 }} />
                </div>
              </motion.div>

              {/* Best pairs */}
              <motion.div initial={{ opacity:0, y:10 }} animate={active ? { opacity:1, y:0 } : {}} transition={{ ...springS, delay:.78 }}
                style={{ background:`${CYN}0a`, border:`1px solid ${CYN}22`, borderRadius:12, padding:"12px 14px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:10 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={CYN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
                  <span style={{ fontSize:".56rem", fontFamily:"monospace", letterSpacing:".14em", color:`${CYN}cc`, fontWeight:700 }}>BEST PERFORMING PAIRS</span>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  {bestPairs.map((p, i) => (
                    <motion.div key={p.pair} initial={{ opacity:0, x:-14 }} animate={active ? { opacity:1, x:0 } : {}} transition={{ type:"spring", stiffness:240, damping:22, delay:.9 + i*.07 }}
                      style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:"rgba(0,0,0,.28)", border:`1px solid ${CYN}18`, borderRadius:8, padding:"7px 10px" }}>
                      <div>
                        <div style={{ fontSize:".78rem", fontWeight:700, color:`${CYN}e6` }}>{p.pair}</div>
                        <div style={{ fontSize:".58rem", color:"rgba(100,116,139,.55)", marginTop:1 }}>{p.trades} trades · {p.wr}% WR</div>
                      </div>
                      <div style={{ fontSize:".88rem", fontWeight:800, color:GRN }}>{p.pnl}</div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Behavioral analysis */}
              <motion.div initial={{ opacity:0, y:10 }} animate={active ? { opacity:1, y:0 } : {}} transition={{ ...springS, delay:1.06 }}
                style={{ background:`${PUR}0a`, border:`1px solid ${PUR}22`, borderRadius:12, padding:"12px 14px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:9 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={PUR} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                  <span style={{ fontSize:".56rem", fontFamily:"monospace", letterSpacing:".14em", color:`${PUR}cc`, fontWeight:700 }}>BEHAVIORAL ANALYSIS</span>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  {insights.map((m, i) => (
                    <motion.div key={i} initial={{ opacity:0, x:-12 }} animate={active ? { opacity:1, x:0 } : {}} transition={{ type:"spring", stiffness:240, damping:22, delay:1.12 + i*.08 }}
                      style={{ display:"flex", gap:8, padding:"7px 9px", background:"rgba(0,0,0,.25)", border:`1px solid ${PUR}18`, borderRadius:8 }}>
                      <span style={{ color:PUR, marginTop:1, fontSize:".7rem", lineHeight:1 }}>•</span>
                      <p style={{ margin:0, fontSize:".68rem", color:"rgba(203,213,225,.78)", lineHeight:1.45 }}>{m}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

            </div>
          </motion.div>

        </div>
      </div>
    </Slide>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SLIDE 6 — HOW IT WORKS  (isometric orbital roadmap)
// ═════════════════════════════════════════════════════════════════════════════
function SlideHowItWorks({ active }: { active: boolean }) {
  const t = useT();

  const TILT = 60; // base ground-plane tilt for the 3D scene

  // mouse-parallax tilt — mutates the scene transform directly (no React re-renders)
  const stageRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const stage = stageRef.current; if (!stage) return;
    const target = { x:0, y:0 }, cur = { x:0, y:0 };
    const onMove = (e: MouseEvent) => {
      const r = stage.getBoundingClientRect();
      target.x = ((e.clientX - r.left) / r.width  - 0.5) * 2;
      target.y = ((e.clientY - r.top)  / r.height - 0.5) * 2;
    };
    stage.addEventListener("mousemove", onMove, { passive:true });
    let raf = 0;
    const tick = () => {
      cur.x += (target.x - cur.x) * 0.06;
      cur.y += (target.y - cur.y) * 0.06;
      if (sceneRef.current)
        sceneRef.current.style.transform = `rotateX(${TILT - cur.y * 7}deg) rotateZ(${cur.x * 6}deg)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { stage.removeEventListener("mousemove", onMove); cancelAnimationFrame(raf); };
  }, []);

  const steps = [
    { n:"01", icon:"✏️", titleKey:"lp_how_step1_title", descKey:"lp_how_step1_desc", glow:"34,211,238"  },
    { n:"02", icon:"🔬", titleKey:"lp_how_step2_title", descKey:"lp_how_step2_desc", glow:"139,92,246" },
    { n:"03", icon:"💡", titleKey:"lp_how_step3_title", descKey:"lp_how_step3_desc", glow:"245,158,11" },
    { n:"04", icon:"📈", titleKey:"lp_how_step4_title", descKey:"lp_how_step4_desc", glow:"16,185,129" },
  ];
  // concentric 3D orbit rings — each carries one glowing step-orb
  const rings = [
    { r:96,  dur:20, dir: 1, glow:"34,211,238"  },
    { r:152, dur:28, dir:-1, glow:"139,92,246" },
    { r:214, dur:36, dir: 1, glow:"245,158,11" },
    { r:280, dur:46, dir:-1, glow:"16,185,129" },
  ];
  const cardPos: React.CSSProperties[] = [
    { left:"clamp(16px,5vw,72px)",  top:"20%"    },
    { right:"clamp(16px,5vw,72px)", top:"20%"    },
    { left:"clamp(16px,5vw,72px)",  bottom:"14%" },
    { right:"clamp(16px,5vw,72px)", bottom:"14%" },
  ];
  const play = active ? "running" : "paused";

  return (
    <Slide id="slide-how" bg="rgba(4,4,20,1)">
      {/* deep indigo bg glow */}
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 95% 85% at 50% 72%,rgba(38,14,95,.6) 0%,rgba(4,4,20,1) 66%)", pointerEvents:"none" }} />

      {/* ── 3D orbital stage (perspective + preserve-3d) ── */}
      <div ref={stageRef} style={{ position:"absolute", inset:0, overflow:"hidden", zIndex:5 }}>
        <div style={{ position:"absolute", left:"50%", top:"57%", width:0, height:0, perspective:"1400px" }}>
          <div ref={sceneRef} style={{ position:"absolute", transformStyle:"preserve-3d", transform:`rotateX(${TILT}deg)`, willChange:"transform" }}>

            {/* perspective floor grid */}
            <div style={{ position:"absolute", top:0, left:0, width:820, height:820, marginLeft:-410, marginTop:-410,
              backgroundImage:"radial-gradient(rgba(124,58,237,.32) 1px,transparent 1px)", backgroundSize:"40px 40px",
              maskImage:"radial-gradient(circle at center,black 0%,transparent 60%)",
              WebkitMaskImage:"radial-gradient(circle at center,black 0%,transparent 60%)", opacity:.55 }} />

            {/* ground glow */}
            <div style={{ position:"absolute", top:0, left:0, width:560, height:560, marginLeft:-280, marginTop:-280,
              borderRadius:"50%", background:"radial-gradient(circle,rgba(124,58,237,.32) 0%,transparent 64%)", filter:"blur(18px)" }} />

            {/* orbit rings, each carrying a glowing orb */}
            {rings.map((r, i) => (
              <div key={i} style={{
                position:"absolute", top:0, left:0, width:r.r*2, height:r.r*2, marginLeft:-r.r, marginTop:-r.r,
                borderRadius:"50%", border:`1px solid rgba(${r.glow},.5)`,
                boxShadow:`0 0 18px rgba(${r.glow},.22), inset 0 0 30px rgba(${r.glow},.1)`,
                transformStyle:"preserve-3d",
                animation:`${r.dir > 0 ? "tmSpin" : "tmSpinRev"} ${r.dur}s linear infinite`,
                animationPlayState:play,
              }}>
                <div style={{ position:"absolute", left:"50%", top:0, transform:"translate(-50%,-50%)", transformStyle:"preserve-3d" }}>
                  <div style={{
                    transform:`rotateX(-${TILT}deg)`, width:18, height:18, borderRadius:"50%",
                    background:`radial-gradient(circle at 34% 30%,#fff 0%,rgba(${r.glow},1) 46%,rgba(${r.glow},.25) 100%)`,
                    boxShadow:`0 0 16px rgba(${r.glow},.95), 0 0 34px rgba(${r.glow},.5)`,
                  }} />
                </div>
              </div>
            ))}

            {/* central platform disk */}
            <div style={{ position:"absolute", top:0, left:0, width:118, height:118, marginLeft:-59, marginTop:-59,
              borderRadius:"50%", background:"radial-gradient(circle,rgba(76,29,149,.7) 0%,rgba(76,29,149,.15) 70%,transparent 100%)",
              border:"1px solid rgba(124,58,237,.55)" }} />

            {/* upright billboard: floating 3D core crystal */}
            <div style={{ position:"absolute", top:0, left:0, transform:`rotateX(-${TILT}deg)`, transformStyle:"preserve-3d" }}>
              <div style={{ position:"relative", width:0, height:0, animation:"tmCoreFloat 5s ease-in-out infinite", animationPlayState:play }}>
                {/* light beam */}
                <div style={{ position:"absolute", left:-2, top:-132, width:4, height:120,
                  background:"linear-gradient(to top,rgba(168,85,247,.75),transparent)", filter:"blur(2px)",
                  animation:"tmBeam 3.6s ease-in-out infinite", animationPlayState:play }} />
                {/* glow halo */}
                <div style={{ position:"absolute", left:-78, top:-120, width:156, height:156, borderRadius:"50%",
                  background:"radial-gradient(circle,rgba(168,85,247,.55) 0%,transparent 70%)", filter:"blur(6px)",
                  animation:"tmGlowPulse 3s ease-in-out infinite", animationPlayState:play }} />
                {/* crystal */}
                <svg width="110" height="150" viewBox="0 0 110 150" style={{ position:"absolute", left:-55, top:-118, overflow:"visible" }}>
                  <defs>
                    <linearGradient id="tmCoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#e9d5ff"/>
                      <stop offset="48%"  stopColor="#7c3aed"/>
                      <stop offset="100%" stopColor="#2e1065"/>
                    </linearGradient>
                  </defs>
                  <polygon points="55,4 92,68 55,128 18,68" fill="url(#tmCoreGrad)"
                    style={{ filter:"drop-shadow(0 0 14px rgba(124,58,237,.85))" }} />
                  <polygon points="55,4 55,128 18,68" fill="rgba(255,255,255,.14)" />
                  <polygon points="55,4 70,40 55,60 40,40" fill="rgba(233,213,255,.55)" />
                </svg>
                {/* label */}
                <div style={{ position:"absolute", left:-60, top:20, width:120, textAlign:"center",
                  fontSize:"9px", fontFamily:"monospace", letterSpacing:"3px", fontWeight:700,
                  color:"#c4b5fd", textShadow:"0 0 12px rgba(168,85,247,.9)" }}>REAL EDGE</div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── floating step cards ── */}
      {steps.map((s, i) => (
        <motion.div key={i}
          initial={{ opacity:0, y:18, scale:.92 }}
          animate={active ? { opacity:1, y:0, scale:1 } : {}}
          transition={{ duration:.6, delay:.45+i*.12, ease:[.22,1,.36,1] }}
          style={{ position:"absolute", ...cardPos[i], width:"clamp(190px,21vw,244px)", zIndex:25 }}
        >
          <div style={{
            animation:`tmFloat ${5+i}s ease-in-out infinite`, animationPlayState:play,
            padding:"14px 16px",
            background:`linear-gradient(150deg,rgba(${s.glow},.16) 0%,rgba(6,6,22,.92) 70%)`,
            border:`1px solid rgba(${s.glow},.4)`,
            borderRadius:14, backdropFilter:"blur(14px)",
            boxShadow:`0 0 0 1px rgba(${s.glow},.05),0 14px 40px rgba(0,0,0,.5)`,
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:9 }}>
              <div style={{
                width:34, height:34, borderRadius:"50%", flexShrink:0,
                background:`rgba(${s.glow},.16)`, border:`1.5px solid rgba(${s.glow},.46)`,
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1rem",
                boxShadow:`0 0 14px rgba(${s.glow},.4)`,
              }}>{s.icon}</div>
              <div>
                <div style={{ fontSize:".52rem", fontFamily:"monospace", letterSpacing:".18em", color:`rgba(${s.glow},.8)`, fontWeight:700 }}>STEP {s.n}</div>
                <div style={{ fontSize:".86rem", fontWeight:700, color:"#f1f5f9", lineHeight:1.15, marginTop:1 }}>{t(s.titleKey)}</div>
              </div>
            </div>
            <p style={{ margin:"0 0 11px", fontSize:".7rem", color:"rgba(148,163,184,.62)", lineHeight:1.5 }}>{t(s.descKey)}</p>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ flex:1, height:3, borderRadius:2, background:"rgba(255,255,255,.07)", overflow:"hidden" }}>
                <motion.div
                  style={{ height:"100%", borderRadius:2, background:`rgb(${s.glow})`, boxShadow:`0 0 8px rgb(${s.glow})`, originX:0 }}
                  initial={{ scaleX:0 }}
                  animate={active ? { scaleX:1 } : {}}
                  transition={{ duration:1.2, delay:.7+i*.12, ease:[.22,1,.36,1] }}
                />
              </div>
              <span style={{ fontSize:".55rem", fontFamily:"monospace", color:`rgba(${s.glow},.7)`, fontWeight:600 }}>100%</span>
            </div>
          </div>
        </motion.div>
      ))}

      {/* ── header (top, centred) ── */}
      <div style={{ position:"absolute", top:0, left:0, right:0, zIndex:30, pointerEvents:"none", textAlign:"center", padding:"64px clamp(16px,5vw,64px) 0" }}>
        <motion.div initial={{ opacity:0, scale:.9 }} animate={active?{opacity:1,scale:1}:{}} transition={{ duration:.5, delay:.08 }}
          style={{ display:"inline-flex", alignItems:"center", gap:7, marginBottom:12, padding:"4px 14px", borderRadius:100, border:`1px solid ${CYN}22`, background:`${CYN}0c`, fontSize:".63rem", fontFamily:"monospace", letterSpacing:".22em", color:`${CYN}bb` }}>
          <span style={{ width:4, height:4, borderRadius:"50%", background:CYN, flexShrink:0 }} />{t("lp_how_badge")}
        </motion.div>
        <motion.h2 initial={{ opacity:0, y:14 }} animate={active?{opacity:1,y:0}:{}} transition={{ duration:.6, delay:.14 }}
          style={{ margin:"0 0 8px", fontWeight:800, letterSpacing:"-.04em", fontSize:"clamp(1.7rem,3vw,2.4rem)", lineHeight:1.1 }}>
          {t("lp_how_headline")}
        </motion.h2>
        <motion.p initial={{ opacity:0, y:10 }} animate={active?{opacity:1,y:0}:{}} transition={{ duration:.5, delay:.22 }}
          style={{ margin:"0 auto", fontSize:".88rem", color:"rgba(148,163,184,.48)", maxWidth:440, lineHeight:1.7 }}>
          {t("lp_how_sub")}
        </motion.p>
      </div>
    </Slide>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SLIDE 7 — STATS + TESTIMONIALS
// ═════════════════════════════════════════════════════════════════════════════
function AnimNum({ to, suf="", dec=0, active }: { to:number; suf?:string; dec?:number; active:boolean }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!active) return;
    const dur = 1600, s = Date.now();
    const iv = setInterval(() => {
      const p = Math.min(1,(Date.now()-s)/dur);
      const e = 1-Math.pow(1-p,3);
      setN(parseFloat((e*to).toFixed(dec)));
      if (p>=1) clearInterval(iv);
    },16);
    return ()=>clearInterval(iv);
  },[active,to,dec]);
  return <span>{dec>0?n.toFixed(dec):Math.round(n).toLocaleString()}{suf}</span>;
}

// plan badge styling — matches the pricing slide (Core/Edge/Apex)
const PLAN_STYLE: Record<string, { label:string; c:string }> = {
  core: { label:"Core", c:CYN },
  edge: { label:"Edge", c:VIO },
  apex: { label:"Apex", c:AMB },
};

const ALL_REVIEWS = [
  { name:"Алексей М.",  role:"Forex · 4 года", plan:"apex", c:VIO, img:"https://randomuser.me/api/portraits/men/32.jpg",   text:"TradeMind показал, что бóльшая часть убытков копилась в лондонско-нью-йоркском оверлапе. Убрал эту сессию — и впервые за полгода закрыл месяц в плюсе." },
  { name:"@kriptodina", role:"Crypto",         plan:"edge", c:CYN, img:"https://randomuser.me/api/portraits/women/44.jpg", text:"Trader DNA показал, что я слишком рано фиксирую прибыль, а убыткам даю разрастись. Поправила правило выхода — и всё поменялось." },
  { name:"Marcus L.",   role:"Futures",        plan:"edge", c:GRN, img:"https://randomuser.me/api/portraits/men/52.jpg",   text:"Daily Bias alone pays for the subscription. I stopped fading the trend every morning and my open has been so much cleaner." },
  { name:"Sarah W.",    role:"Options",        plan:"apex", c:AMB, img:"https://randomuser.me/api/portraits/women/68.jpg", text:"The Setups journal replaced my messy spreadsheet completely. Every entry now has AI notes and a tagged thesis — my reviews take half the time." },
  { name:"@scalp_mike", role:"Stocks",         plan:"edge", c:RED, img:"https://randomuser.me/api/portraits/men/45.jpg",   text:"In two months my win-rate went from 38% to 52%. The AI flagged that I was entering before confirmation on almost every losing trade." },
  { name:"Дмитрий В.",  role:"Forex",          plan:"apex", c:VIO, img:"https://randomuser.me/api/portraits/men/15.jpg",   text:"Risk-анализатор вскрыл мои привычки в управлении размером позиции, которые я годами игнорировал. Просадки стали заметно меньше и контролируемее." },
  { name:"Yuki T.",     role:"Crypto",         plan:"edge", c:CYN, img:"https://randomuser.me/api/portraits/women/65.jpg", text:"TradeMind proved I revenge-trade right after a loss. A simple cooling-off rule killed those trades — best month I've ever logged." },
  { name:"@nika_fx",    role:"Forex",          plan:"core", c:AMB, img:"https://randomuser.me/api/portraits/women/29.jpg", text:"Раздел по психологии — золото. Даже не подозревала, сколько мне стоили входы на FOMO, пока не увидела всё в цифрах." },
  { name:"James K.",    role:"Equities",       plan:"apex", c:GRN, img:"https://randomuser.me/api/portraits/men/64.jpg",   text:"Community Edge signals have been far more reliable than the paid Telegram group I left. Genuinely worth it." },
  { name:"Игорь С.",    role:"Crypto",         plan:"edge", c:RED, img:"https://randomuser.me/api/portraits/men/76.jpg",   text:"AI-коуч заметил, что я перегружаю плечо по пятницам. Одно правило — и пятница из худшего дня стала безубыточной." },
];

function ReviewCard({ r }: { r: typeof ALL_REVIEWS[0] }) {
  const initials = r.name.replace(/^@/,"").split(/[\s_]+/).map(w => w[0]).filter(Boolean).join("").slice(0,2).toUpperCase();
  const plan = PLAN_STYLE[r.plan] ?? PLAN_STYLE.edge;
  return (
    <div style={{
      position:"relative", flex:"0 0 340px",
      background:"linear-gradient(165deg,rgba(255,255,255,.05) 0%,rgba(255,255,255,.018) 100%)",
      border:"1px solid rgba(255,255,255,.08)", borderRadius:18,
      padding:"24px 22px 20px", display:"flex", flexDirection:"column", gap:16, overflow:"hidden",
    }}>
      {/* accent glow + top hairline in the card's color */}
      <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,transparent,${r.c}aa,transparent)` }} />
      <div style={{ position:"absolute", top:-60, right:-60, width:160, height:160, borderRadius:"50%", background:`radial-gradient(circle,${r.c}1f,transparent 70%)`, pointerEvents:"none" }} />

      {/* header: avatar + identity + stars */}
      <div style={{ display:"flex", alignItems:"center", gap:13, position:"relative" }}>
        <div style={{ position:"relative", flexShrink:0 }}>
          <div style={{ width:48, height:48, borderRadius:"50%", overflow:"hidden", border:`2px solid ${r.c}55`, boxShadow:`0 0 16px ${r.c}33`, display:"flex", alignItems:"center", justifyContent:"center", background:`${r.c}22`, fontSize:".82rem", fontWeight:700, color:`${r.c}dd` }}>
            {initials}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={r.img} alt={r.name} width={48} height={48} loading="lazy" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", display:"block" }}
              onError={e => { (e.currentTarget as HTMLImageElement).style.display="none"; }} />
          </div>
          {/* verified badge */}
          <div style={{ position:"absolute", bottom:-2, right:-2, width:17, height:17, borderRadius:"50%", background:CYN, border:"2.5px solid #07080f", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#07080f" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          </div>
        </div>
        <div style={{ minWidth:0, flex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ fontSize:".88rem", fontWeight:700, color:"#f1f5f9", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{r.name}</span>
            <span style={{ fontSize:".5rem", fontFamily:"monospace", letterSpacing:".06em", color:`${CYN}cc`, background:`${CYN}1a`, border:`1px solid ${CYN}33`, padding:"1px 5px", borderRadius:20, flexShrink:0 }}>VERIFIED</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:7, marginTop:4, flexWrap:"wrap" }}>
            <span style={{ fontSize:".66rem", color:"rgba(148,163,184,.6)" }}>{r.role}</span>
            <span style={{ width:3, height:3, borderRadius:"50%", background:"rgba(148,163,184,.35)" }} />
            <span style={{ display:"inline-flex", alignItems:"center", gap:4, fontSize:".58rem", fontWeight:700, fontFamily:"monospace", letterSpacing:".06em", color:plan.c, background:`${plan.c}16`, border:`1px solid ${plan.c}33`, padding:"1px 7px", borderRadius:20 }}>
              <span style={{ width:5, height:5, borderRadius:"50%", background:plan.c, boxShadow:`0 0 5px ${plan.c}` }} />
              {plan.label.toUpperCase()}
            </span>
          </div>
        </div>
        <div style={{ color:AMB, fontSize:".72rem", letterSpacing:1.5, flexShrink:0, alignSelf:"flex-start" }}>★★★★★</div>
      </div>

      {/* quote */}
      <p style={{ margin:0, fontSize:".82rem", color:"rgba(203,213,225,.82)", lineHeight:1.7, flex:1 }}>
        &ldquo;{r.text}&rdquo;
      </p>
    </div>
  );
}

function SlideStats({ active }: { active: boolean }) {
  const t = useT();
  const doubled = [...ALL_REVIEWS, ...ALL_REVIEWS];
  const CARD_W = 340 + 14; // card width + gap
  const totalPx = ALL_REVIEWS.length * CARD_W;

  return (
    <Slide id="slide-stats" bg="#05060f">
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 60% 50% at 50% 50%,rgba(139,92,246,.05) 0%,transparent 70%)", pointerEvents:"none" }} />
      <div style={{ width:"100%", zIndex:10 }}>
        {/* stats row */}
        <div style={{ ...inner, ...px, marginBottom:44 }}>
          <motion.div initial={{ opacity:0, y:24 }} animate={active?{ opacity:1, y:0 }:{}} transition={{ duration:.6, delay:.1 }}
            style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
            {([{to:120,suf:"+",labelKey:"lp_stats_traders_label",c:VIO},{to:3000,suf:"+",labelKey:"lp_stats_trades_label",c:CYN},{to:2.1,suf:"×",labelKey:"lp_stats_rr_label",c:AMB,dec:1}] as {to:number;suf:string;labelKey:string;c:string;dec?:number}[]).map((s,i)=>(
              <motion.div key={i} initial={{ opacity:0, y:16 }} animate={active?{ opacity:1, y:0 }:{}} transition={{ duration:.5, delay:.15+i*.08 }}
                style={{ textAlign:"center", padding:"22px 16px", background:"rgba(255,255,255,.025)", border:"1px solid rgba(255,255,255,.07)", borderRadius:14 }}>
                <div style={{ fontSize:"clamp(2rem,4vw,2.8rem)", fontWeight:800, letterSpacing:"-.04em", color:s.c, lineHeight:1, marginBottom:8 }}>
                  <AnimNum to={s.to} suf={s.suf} dec={s.dec??0} active={active} />
                </div>
                <div style={{ fontSize:".62rem", fontFamily:"monospace", color:"rgba(100,116,139,.5)", letterSpacing:".09em" }}>{t(s.labelKey).toUpperCase()}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* section label */}
        <motion.div initial={{ opacity:0 }} animate={active?{ opacity:1 }:{}} transition={{ duration:.5, delay:.3 }}
          style={{ textAlign:"center", marginBottom:24 }}>
          <span style={{ fontSize:".62rem", fontFamily:"monospace", letterSpacing:".22em", color:`${VIO}88`, textTransform:"uppercase" }}>
            — Traders about TradeMind —
          </span>
        </motion.div>

        {/* Marquee carousel */}
        <motion.div initial={{ opacity:0 }} animate={active?{ opacity:1 }:{}} transition={{ duration:.6, delay:.4 }}
          style={{ overflow:"hidden", maskImage:"linear-gradient(90deg,transparent,black 5%,black 95%,transparent)", WebkitMaskImage:"linear-gradient(90deg,transparent,black 5%,black 95%,transparent)" }}>
          <motion.div
            style={{ display:"flex", gap:14, width:"max-content" }}
            animate={active ? { x: [0, -totalPx] } : false}
            transition={{ duration: 35, repeat: Infinity, ease:"linear" }}
          >
            {doubled.map((r, i) => <ReviewCard key={i} r={r} />)}
          </motion.div>
        </motion.div>
      </div>
    </Slide>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SLIDE 8 — PRICING
// ═════════════════════════════════════════════════════════════════════════════
function SlidePricing({ active, onLaunch }: { active: boolean; onLaunch: (plan?: string, billing?: string)=>void }) {
  const t = useT();
  const [annual, setAnnual] = useState(false);
  const plans = [
    { key:"core", name:"Core", price:0,  color:CYN, popular:false, feats:[t("plan_core_feat1"),t("plan_core_feat2"),t("plan_core_feat3"),t("plan_core_feat4"),t("plan_core_feat5")] },
    { key:"edge", name:"Edge", price:29, color:VIO, popular:true,  feats:[t("plan_edge_feat1"),t("plan_edge_feat2"),t("plan_edge_feat3"),t("plan_edge_feat4"),t("plan_edge_feat5"),t("plan_edge_feat6")] },
    { key:"apex", name:"Apex", price:79, color:AMB, popular:false, feats:[t("plan_apex_feat1"),t("plan_apex_feat2"),t("plan_apex_feat3"),t("plan_apex_feat4"),t("plan_apex_feat5"),t("plan_apex_feat6")] },
  ];
  return (
    <Slide id="slide-pricing" bg="rgba(5,6,15,1)">
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 50% 60% at 50% 100%,rgba(139,92,246,.06) 0%,transparent 70%)", pointerEvents:"none" }} />
      <div style={{ ...inner, ...px, zIndex:10 }}>
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <motion.div initial={{ opacity:0, scale:.9 }} animate={active?{ opacity:1, scale:1 }:{}} transition={{ duration:.5, delay:.08 }}
            style={{ display:"inline-flex", alignItems:"center", gap:7, marginBottom:14, padding:"4px 14px", borderRadius:100, border:`1px solid ${VIO}22`, background:`${VIO}0c`, fontSize:".63rem", fontFamily:"monospace", letterSpacing:".22em", color:`${VIO}bb` }}>
            <span style={{ width:4, height:4, borderRadius:"50%", background:VIO, flexShrink:0 }} />{t("lp_pricing_badge")}
          </motion.div>
          <motion.h2 initial={{ opacity:0, y:18 }} animate={active?{ opacity:1, y:0 }:{}} transition={{ duration:.6, delay:.16 }}
            style={{ margin:"0 0 10px", fontWeight:800, letterSpacing:"-.04em", fontSize:"clamp(1.8rem,3.5vw,2.4rem)" }}>
            {t("lp_pricing_headline")}
          </motion.h2>
          <motion.div initial={{ opacity:0 }} animate={active?{ opacity:1 }:{}} transition={{ duration:.5, delay:.26 }}
            style={{ display:"inline-flex", alignItems:"center", gap:3, padding:4, background:"rgba(255,255,255,.04)", borderRadius:9, border:"1px solid rgba(255,255,255,.07)", marginTop:14 }}>
            {([t("lp_pricing_monthly"), t("lp_pricing_annual")] as string[]).map((b,i)=>(
              <button key={i} onClick={()=>setAnnual(i===1)}
                style={{ padding:"6px 16px", borderRadius:6, cursor:"pointer", border:"none", fontSize:".74rem", fontFamily:"inherit", background:annual===(i===1)?"rgba(255,255,255,.08)":"transparent", color:annual===(i===1)?"#f1f5f9":"rgba(100,116,139,.55)", transition:"background .2s,color .2s", display:"inline-flex", alignItems:"center", gap:5 }}>
                {b}{i===1&&<span style={{ fontSize:".56rem", fontFamily:"monospace", color:GRN }}>−20%</span>}
              </button>
            ))}
          </motion.div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
          {plans.map((pl,i)=>{
            const price = pl.price===0?0:annual?Math.round(pl.price*.8):pl.price;
            return (
              <motion.div key={pl.key} initial={{ opacity:0, y:28 }} animate={active?{ opacity:1, y:0 }:{}} transition={{ duration:.6, delay:.32+i*.1 }}
                whileHover={{ y:-4 }}
                style={{ borderRadius:18, padding:"24px 22px", position:"relative", overflow:"hidden",
                  background:pl.popular?`linear-gradient(160deg,${VIO}10,${VIO}04)`:"rgba(255,255,255,.025)",
                  border:pl.popular?`1px solid ${VIO}38`:"1px solid rgba(255,255,255,.07)", display:"flex", flexDirection:"column" }}>
                {pl.popular&&<div style={{ position:"absolute", top:14, right:14, fontSize:".56rem", fontFamily:"monospace", letterSpacing:".16em", color:`${VIO}ee`, background:`${VIO}1e`, border:`1px solid ${VIO}30`, padding:"2px 9px", borderRadius:100 }}>POPULAR</div>}
                <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:12 }}>
                  <div style={{ width:7, height:7, borderRadius:"50%", background:pl.color, boxShadow:`0 0 7px ${pl.color}` }} />
                  <span style={{ fontSize:".66rem", fontFamily:"monospace", letterSpacing:".2em", color:`${pl.color}bb` }}>{pl.name.toUpperCase()}</span>
                </div>
                <div style={{ display:"flex", alignItems:"baseline", gap:4, marginBottom:16 }}>
                  <span style={{ fontSize:"2.2rem", fontWeight:800, letterSpacing:"-.04em", color:"#f1f5f9" }}>{pl.price===0?"Free":`$${price}`}</span>
                  {pl.price>0&&<span style={{ fontSize:".74rem", color:"rgba(100,116,139,.45)" }}>{t("lp_pricing_per_mo")}</span>}
                </div>
                <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:.97 }} onClick={()=>onLaunch(pl.key, annual?"annual":"monthly")}
                  style={{ width:"100%", height:40, borderRadius:9, cursor:"pointer", marginBottom:18, fontFamily:"monospace", fontSize:".7rem", letterSpacing:".13em", fontWeight:700, background:pl.popular?`linear-gradient(135deg,${VIO}48,${VIO}26)`:"rgba(255,255,255,.06)", border:pl.popular?`1px solid ${VIO}62`:"1px solid rgba(255,255,255,.09)", color:pl.popular?"#e9d5ff":"rgba(148,163,184,.65)" }}>
                  {pl.price===0?t("lp_pricing_cta_free"):t("lp_pricing_cta_paid")}
                </motion.button>
                <div style={{ display:"flex", flexDirection:"column", gap:7, marginTop:"auto" }}>
                  {pl.feats.map((f,j)=>(
                    <div key={j} style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
                      <div style={{ width:14, height:14, borderRadius:4, flexShrink:0, marginTop:1, display:"flex", alignItems:"center", justifyContent:"center", background:`${pl.color}14`, border:`1px solid ${pl.color}22` }}>
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 4l2 2 4-4" stroke={pl.color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                      <span style={{ fontSize:".73rem", color:"rgba(148,163,184,.55)", lineHeight:1.45 }}>{f}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Slide>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SLIDE 9 — FINAL CTA
// ═════════════════════════════════════════════════════════════════════════════
function SlideCTA({ active, onLaunch }: { active: boolean; onLaunch: (plan?: string, billing?: string)=>void }) {
  const t = useT();
  return (
    <Slide id="slide-cta" bg="#05060f">
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 70% 60% at 50% 50%,rgba(139,92,246,.08) 0%,transparent 65%)", pointerEvents:"none" }} />
      <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(rgba(148,163,184,.055) 1px,transparent 1px)", backgroundSize:"28px 28px", maskImage:"radial-gradient(ellipse 70% 60% at 50% 50%,black 30%,transparent 100%)", pointerEvents:"none" }} />
      <div style={{ ...inner, ...px, zIndex:10, textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center" }}>
        <motion.div initial={{ opacity:0, scale:.88 }} animate={active?{ opacity:1, scale:1 }:{}} transition={{ duration:.6, delay:.1 }}
          style={{ display:"inline-flex", alignItems:"center", gap:7, marginBottom:24, padding:"5px 16px", borderRadius:100, border:`1px solid ${VIO}22`, background:`${VIO}0c`, fontSize:".65rem", fontFamily:"monospace", letterSpacing:".22em", color:`${VIO}bb` }}>
          <span style={{ width:5, height:5, borderRadius:"50%", background:VIO, boxShadow:`0 0 7px ${VIO}`, animation:"tmPulse 1.8s infinite", flexShrink:0 }} />
          {t("lp_cta_badge")}
        </motion.div>
        <motion.h2 initial={{ opacity:0, y:28 }} animate={active?{ opacity:1, y:0 }:{}} transition={{ duration:.7, delay:.18 }}
          style={{ margin:"0 0 18px", fontWeight:800, letterSpacing:"-.045em", lineHeight:1.08,
            fontSize:"clamp(2.4rem,6vw,4.8rem)",
            background:"linear-gradient(135deg, #f8fafc 0%, #bfdbfe 18%, #818cf8 36%, #7c3aed 54%, #4c1d95 68%, #7c3aed 80%, #bfdbfe 92%, #f8fafc 100%)",
            backgroundSize:"300% auto",
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
            animation:"heroShimmer 8s linear infinite" }}>
          {t("lp_cta_headline_1")}<br />{t("lp_cta_headline_2")}
        </motion.h2>
        <motion.p initial={{ opacity:0, y:18 }} animate={active?{ opacity:1, y:0 }:{}} transition={{ duration:.6, delay:.28 }}
          style={{ margin:"0 0 40px", fontSize:"clamp(.9rem,1.8vw,1.1rem)", color:"rgba(148,163,184,.52)", maxWidth:500, lineHeight:1.72 }}>
          {t("lp_cta_sub")}
        </motion.p>
        <motion.div initial={{ opacity:0, y:16 }} animate={active?{ opacity:1, y:0 }:{}} transition={{ duration:.55, delay:.38 }}
          style={{ display:"flex", gap:12, flexWrap:"wrap", justifyContent:"center", marginBottom:32 }}>
          <motion.button whileHover={{ scale:1.05, boxShadow:`0 0 60px ${VIO}55` }} whileTap={{ scale:.97 }}
            onClick={() => onLaunch()}
            style={{ height:58, padding:"0 48px", background:`linear-gradient(135deg,${VIO}50,${VIO}2e)`, border:`1px solid ${VIO}72`, borderRadius:14, cursor:"pointer", display:"inline-flex", alignItems:"center", gap:12, fontSize:".9rem", fontFamily:"monospace", letterSpacing:".2em", color:"#e9d5ff", fontWeight:700, boxShadow:`0 0 40px ${VIO}35`, transition:"box-shadow .25s" }}>
            {t("initialize_system")}
            <motion.svg animate={{ x:[0,4,0] }} transition={{ duration:1.5, repeat:Infinity }} width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M2 7.5h11M9 3.5l4 4-4 4" stroke="#e9d5ff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </motion.svg>
          </motion.button>
        </motion.div>
        <motion.p initial={{ opacity:0 }} animate={active?{ opacity:1 }:{}} transition={{ duration:.5, delay:.52 }}
          style={{ margin:0, fontSize:".65rem", fontFamily:"monospace", letterSpacing:".12em", color:"rgba(100,116,139,.38)" }}>
          {t("lp_cta_fine")}
        </motion.p>
        {/* footer row */}
        <motion.div initial={{ opacity:0 }} animate={active?{ opacity:1 }:{}} transition={{ duration:.5, delay:.62 }}
          style={{ position:"absolute", bottom:28, left:0, right:0, display:"flex", justifyContent:"center", alignItems:"center", gap:20 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:22, height:22, borderRadius:6, overflow:"hidden", border:`1px solid ${VIO}24` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.jpg" alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
            </div>
            <span style={{ fontSize:".75rem", fontWeight:700, color:"rgba(241,245,249,.4)" }}>TradeMind</span>
          </div>
          <span style={{ color:"rgba(100,116,139,.25)", fontSize:".7rem" }}>·</span>
          {[["privacy","Privacy"],["terms","Terms"]].map(([h,l])=>(
            <a key={h} href={`/${h}`} style={{ fontSize:".7rem", color:"rgba(100,116,139,.35)", transition:"color .2s" }}
              onMouseEnter={e=>(e.currentTarget.style.color="rgba(148,163,184,.6)")} onMouseLeave={e=>(e.currentTarget.style.color="rgba(100,116,139,.35)")}>{l}</a>
          ))}
          <span style={{ color:"rgba(100,116,139,.25)", fontSize:".7rem" }}>·</span>
          <span style={{ fontSize:".65rem", fontFamily:"monospace", color:"rgba(100,116,139,.28)", letterSpacing:".07em" }}>© 2025 TRADEMIND</span>
        </motion.div>
      </div>
    </Slide>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// NAV DOTS
// ═════════════════════════════════════════════════════════════════════════════
const SLIDE_IDS = ["slide-hero","slide-problem","slide-preview","slide-analytics","slide-dna","slide-how","slide-stats","slide-cta"];
const SLIDE_LABEL_KEYS = ["lp_slide_hero","lp_slide_problem","lp_slide_preview","lp_slide_analytics","lp_slide_dna","lp_slide_how","lp_slide_stats","lp_slide_cta"];

function NavDots({ active, onGo }: { active: number; onGo: (i: number)=>void }) {
  const t = useT();
  return (
    <div style={{ position:"fixed", right:20, top:"50%", transform:"translateY(-50%)", zIndex:300,
      display:"flex", flexDirection:"column", gap:10 }}>
      {SLIDE_IDS.map((_,i)=>(
        <button key={i} onClick={()=>onGo(i)} title={t(SLIDE_LABEL_KEYS[i])}
          style={{ width:i===active?24:6, height:6, borderRadius:3, cursor:"pointer", border:"none", padding:0,
            background: i===active?VIO:"rgba(148,163,184,.25)", transition:"all .3s ease",
            boxShadow: i===active?`0 0 8px ${VIO}80`:"none" }} />
      ))}
    </div>
  );
}

// memo wrappers — slides with only `active: boolean` prop benefit fully:
// React skips re-rendering them whenever the parent state changes but their
// own prop didn't change (i.e. every slide except the two involved in a transition)
const MSlideProblem    = memo(SlideProblem);
const MSlidePreview    = memo(SlidePreview);
const MSlideAnalytics  = memo(SlideAnalytics);
const MSlideDNA        = memo(SlideDNA);
const MSlideHowItWorks = memo(SlideHowItWorks);
const MSlideStats      = memo(SlideStats);

// ═════════════════════════════════════════════════════════════════════════════
// ROOT
// ═════════════════════════════════════════════════════════════════════════════
export default function HomePage() {
  const router  = useRouter();
  const t = useT();
  const didLaunch = useRef(false);
  const [booting, setBooting] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  // liveSlide fires after the CSS transition lands so Framer Motion content
  // animations never compete with the sliding transform
  const [liveSlide, setLiveSlide] = useState(0);
  const transRef = useRef(false);
  const touchStartY = useRef(0);

  const [launchPlan, setLaunchPlan] = useState<string | null>(null);
  const [launchBilling, setLaunchBilling] = useState<string | null>(null);

  const launch = useCallback((plan?: string, billing?: string) => {
    if (didLaunch.current) return;
    didLaunch.current = true;
    if (plan && plan !== "core") {
      setLaunchPlan(plan);
      setLaunchBilling(billing || "monthly");
    }
    setBooting(true);
  }, []);
  const onDone = useCallback(() => {
    const params = new URLSearchParams();
    if (launchPlan) { params.set("upgrade_plan", launchPlan); if (launchBilling) params.set("billing", launchBilling); }
    router.push("/app" + (params.toString() ? `?${params}` : ""));
  }, [router, launchPlan, launchBilling]);

  const TOTAL = SLIDE_IDS.length;

  const navigate = useCallback((dir: 1 | -1) => {
    if (transRef.current) return;
    setActiveSlide(prev => {
      const next = prev + dir;
      if (next < 0 || next >= TOTAL) return prev;
      transRef.current = true;
      setTimeout(() => { transRef.current = false; }, 820);
      return next;
    });
  }, [TOTAL]);

  const goTo = useCallback((i: number) => {
    if (transRef.current) return;
    setActiveSlide(prev => {
      if (i === prev) return prev;
      transRef.current = true;
      setTimeout(() => { transRef.current = false; }, 820);
      return i;
    });
  }, []);

  // update liveSlide after slide has fully settled (matches CSS transition duration)
  useEffect(() => {
    const id = setTimeout(() => setLiveSlide(activeSlide), 600);
    return () => clearTimeout(id);
  }, [activeSlide]);

  useEffect(() => {
    // momentum guard: one slide per gesture — the wheel must rest briefly before it fires again
    let wheelReady = true;
    let restId: ReturnType<typeof setTimeout>;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      clearTimeout(restId);
      restId = setTimeout(() => { wheelReady = true; }, 160);
      if (!wheelReady || Math.abs(e.deltaY) < 16) return;
      wheelReady = false;
      navigate(e.deltaY > 0 ? 1 : -1);
    };
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowDown","PageDown"].includes(e.key)) { e.preventDefault(); navigate(1); }
      else if (["ArrowUp","PageUp"].includes(e.key)) { e.preventDefault(); navigate(-1); }
    };
    const onTouchStart = (e: TouchEvent) => { touchStartY.current = e.touches[0].clientY; };
    const onTouchEnd = (e: TouchEvent) => {
      const dy = touchStartY.current - e.changedTouches[0].clientY;
      if (Math.abs(dy) > 50) navigate(dy > 0 ? 1 : -1);
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      clearTimeout(restId);
    };
  }, [navigate]);

  return (
    <>
      <AnimatePresence>
        {booting && (
          <motion.div key="boot" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:"fixed", inset:0, zIndex:9999 }}>
            <BootScreen onDone={onDone} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* fixed nav */}
      <motion.header initial={{ opacity:0, y:-16 }} animate={{ opacity:1, y:0 }} transition={{ duration:.5 }}
        style={{ position:"fixed", top:0, left:0, right:0, zIndex:200, height:56,
          padding:"0 clamp(16px,4vw,48px)", display:"flex", alignItems:"center", justifyContent:"space-between",
          background:"rgba(5,6,15,.8)", backdropFilter:"blur(18px)", borderBottom:"1px solid rgba(255,255,255,.06)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:9 }}>
          <div style={{ width:28, height:28, borderRadius:7, overflow:"hidden", border:`1px solid ${VIO}35`, flexShrink:0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.jpg" alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          </div>
          <span style={{ fontWeight:700, fontSize:".9rem", letterSpacing:"-.02em" }}>TradeMind</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:20 }}>
          {([["slide-problem","lp_nav_problem"],["slide-how","lp_nav_how"]] as [string,string][]).map(([id,k])=>(
            <button key={id} onClick={()=>goTo(SLIDE_IDS.indexOf(id))}
              style={{ fontSize:".78rem", color:"rgba(148,163,184,.45)", background:"none", border:"none", cursor:"pointer", transition:"color .2s", padding:0 }}
              onMouseEnter={e=>(e.currentTarget.style.color="#f1f5f9")} onMouseLeave={e=>(e.currentTarget.style.color="rgba(148,163,184,.45)")}>{t(k)}</button>
          ))}
          <motion.button whileHover={{ scale:1.04 }} whileTap={{ scale:.97 }} onClick={() => launch()}
            style={{ height:34, padding:"0 16px", background:`${VIO}20`, border:`1px solid ${VIO}50`, borderRadius:8, cursor:"pointer", fontSize:".7rem", fontFamily:"monospace", letterSpacing:".13em", color:`${VIO}ee`, fontWeight:700 }}>
            {t("initialize_system")}
          </motion.button>
        </div>
      </motion.header>

      {/* nav dots */}
      <NavDots active={activeSlide} onGo={goTo} />

      {/* fullscreen slide container — CSS transform on compositor thread, zero JS overhead */}
      <div style={{ position:"fixed", inset:0, overflow:"hidden" }}>
        <div
          style={{
            width: "100%",
            transform: `translateY(calc(${-activeSlide} * 100vh))`,
            transition: "transform 0.78s cubic-bezier(0.76, 0, 0.24, 1)",
            willChange: "transform",
          }}
        >
          <SlideHero        onLaunch={launch} onNext={() => goTo(1)} active={liveSlide===0} />
          <MSlideProblem    active={liveSlide===1} />
          <MSlidePreview    active={liveSlide===2} />
          <MSlideAnalytics  active={liveSlide===3} />
          <MSlideDNA        active={liveSlide===4} />
          <MSlideHowItWorks active={liveSlide===5} />
          <MSlideStats      active={liveSlide===6} />
          <SlideCTA         active={liveSlide===7} onLaunch={launch} />
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html:`
        *, *::before, *::after { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; overflow: hidden; height: 100%; }
        a { text-decoration: none; color: inherit; }
        button { font-family: inherit; }
        @keyframes tmPulse { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes heroShimmer {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        @keyframes tmSpin    { to { transform: rotateZ(360deg); } }
        @keyframes tmSpinRev { to { transform: rotateZ(-360deg); } }
        @keyframes tmFloat     { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-9px); } }
        @keyframes tmCoreFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        @keyframes tmGlowPulse { 0%,100% { opacity:.5; transform:scale(1); } 50% { opacity:.95; transform:scale(1.14); } }
        @keyframes tmBeam      { 0% { opacity:0; transform: translateY(0) scaleY(.7); } 35% { opacity:.75; } 100% { opacity:0; transform: translateY(-90px) scaleY(1.1); } }
        @keyframes tmDnaDrift  { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes tmDash      { to { stroke-dashoffset: -56; } }
        @keyframes tmDashRev   { to { stroke-dashoffset:  56; } }
        @keyframes tmNode      { 0%,100% { opacity:.3; } 50% { opacity:1; } }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: .001ms !important; animation-iteration-count: 1 !important; transition-duration: .001ms !important; }
        }
      `}} />
    </>
  );
}
