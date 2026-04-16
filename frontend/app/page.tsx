"use client";
import { useState, useEffect, useRef, useCallback } from "react";
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
function SlideHero({ onLaunch, active }: { onLaunch: ()=>void; active: boolean }) {
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
              background:"linear-gradient(155deg,#f1f5f9 20%,rgba(139,92,246,.9) 55%,rgba(34,211,238,.88) 90%)",
              WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
            {t("lp_hero_headline_1")}<br />{t("lp_hero_headline_2")}
          </motion.h1>

          <motion.p {...enter(.34)} style={{ margin:"0 0 36px", fontSize:"clamp(.9rem,1.8vw,1.1rem)", color:"rgba(148,163,184,.56)", lineHeight:1.72, maxWidth:520 }}>
            {t("lp_hero_subtitle")}
          </motion.p>

          {/* CTAs */}
          <motion.div {...enter(.42)} style={{ display:"flex", gap:12, flexWrap:"wrap", justifyContent:"center", marginBottom:44 }}>
            <motion.button whileHover={{ scale:1.05, boxShadow:`0 0 52px ${VIO}52` }} whileTap={{ scale:.97 }}
              onClick={onLaunch}
              style={{ height:52, padding:"0 36px", background:`linear-gradient(135deg,${VIO}48,${VIO}26)`, border:`1px solid ${VIO}68`, borderRadius:13, cursor:"pointer", display:"inline-flex", alignItems:"center", gap:10, fontSize:".85rem", fontFamily:"monospace", letterSpacing:".17em", color:"#e9d5ff", fontWeight:700, boxShadow:`0 0 28px ${VIO}28`, transition:"box-shadow .25s" }}>
              {t("initialize_system")}
              <motion.svg animate={{ x:[0,4,0] }} transition={{ duration:1.4, repeat:Infinity }} width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7h10M8 3l4 4-4 4" stroke="#e9d5ff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </motion.svg>
            </motion.button>
            <motion.button whileHover={{ borderColor:"rgba(255,255,255,.15)" }} whileTap={{ scale:.97 }}
              onClick={()=>document.getElementById("slide-problem")?.scrollIntoView({ behavior:"smooth" })}
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

// ═════════════════════════════════════════════════════════════════════════════
// SLIDE 2 — PROBLEM
// ═════════════════════════════════════════════════════════════════════════════
function SlideProblem({ active }: { active: boolean }) {
  const t = useT();
  const items = [
    { icon:"⚡", stat:"78%", key:"lp_problem_1_text" },
    { icon:"🧠", stat:"64%", key:"lp_problem_2_text" },
    { icon:"📉", stat:"55%", key:"lp_problem_3_text" },
    { icon:"🔍", stat:"82%", key:"lp_problem_4_text" },
  ];
  return (
    <Slide id="slide-problem" bg="rgba(5,6,15,1)">
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 60% 50% at 50% 100%,rgba(239,68,68,.05) 0%,transparent 70%)", pointerEvents:"none" }} />
      <div style={{ ...inner, ...px, zIndex:10 }}>
        <div style={{ textAlign:"center", marginBottom:40 }}>
          <motion.div initial={{ opacity:0, scale:.88 }} animate={active?{ opacity:1, scale:1 }:{}} transition={{ duration:.5, delay:.1 }}
            style={{ display:"inline-flex", alignItems:"center", gap:7, marginBottom:14, padding:"4px 14px", borderRadius:100, border:`1px solid ${RED}22`, background:`${RED}0c`, fontSize:".63rem", fontFamily:"monospace", letterSpacing:".22em", color:`${RED}bb` }}>
            <span style={{ width:4, height:4, borderRadius:"50%", background:RED, flexShrink:0 }} />{t("lp_problem_badge")}
          </motion.div>
          <motion.h2 initial={{ opacity:0, y:20 }} animate={active?{ opacity:1, y:0 }:{}} transition={{ duration:.6, delay:.18 }}
            style={{ margin:"0 0 12px", fontWeight:800, letterSpacing:"-.04em", fontSize:"clamp(1.8rem,3.5vw,2.6rem)", lineHeight:1.1 }}>
            {t("lp_problem_headline")}
          </motion.h2>
          <motion.p initial={{ opacity:0, y:14 }} animate={active?{ opacity:1, y:0 }:{}} transition={{ duration:.55, delay:.25 }}
            style={{ margin:0, fontSize:"clamp(.85rem,1.6vw,.95rem)", color:"rgba(148,163,184,.5)", maxWidth:480, marginLeft:"auto", marginRight:"auto", lineHeight:1.7 }}>
            {t("lp_problem_sub")}
          </motion.p>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:12 }}>
          {items.map((item,i)=>(
            <motion.div key={i} initial={{ opacity:0, y:28 }} animate={active?{ opacity:1, y:0 }:{}} transition={{ duration:.6, delay:.32+i*.08 }}
              whileHover={{ y:-4 }}
              style={{ background:"rgba(255,255,255,.025)", border:"1px solid rgba(239,68,68,.12)", borderRadius:16, padding:"22px 20px" }}>
              <div style={{ fontSize:"1.5rem", marginBottom:10 }}>{item.icon}</div>
              <div style={{ fontSize:"2rem", fontWeight:800, letterSpacing:"-.04em", color:RED, marginBottom:6, lineHeight:1 }}>{item.stat}</div>
              <p style={{ margin:"0 0 14px", fontSize:".81rem", color:"rgba(148,163,184,.6)", lineHeight:1.6 }}>{t(item.key)}</p>
              <div style={{ height:3, borderRadius:2, background:"rgba(255,255,255,.05)", overflow:"hidden" }}>
                <motion.div style={{ height:"100%", borderRadius:2, background:"linear-gradient(90deg,#ef4444,#f97316)", originX:0 }}
                  initial={{ scaleX:0 }} animate={active?{ scaleX:parseInt(item.stat)/100 }:{}} transition={{ duration:1.1, delay:.5+i*.09, ease:[.22,1,.36,1] }} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Slide>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SLIDE 3 — PLATFORM PREVIEW
// ═════════════════════════════════════════════════════════════════════════════
function SlidePreview({ active }: { active: boolean }) {
  const t = useT();
  const rows = [
    { sym:"EURUSD", dir:"L", pnl:"+$312", rr:"+2.3R", c:GRN },
    { sym:"NVDA",   dir:"L", pnl:"+$221", rr:"+1.8R", c:GRN },
    { sym:"BTCUSD", dir:"S", pnl:"-$135", rr:"-1.0R", c:RED },
    { sym:"TSLA",   dir:"S", pnl:"+$88",  rr:"+0.9R", c:GRN },
  ];
  return (
    <Slide id="slide-preview" bg="#05060f">
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 50% 60% at 70% 50%,rgba(139,92,246,.06) 0%,transparent 70%)", pointerEvents:"none" }} />
      <div style={{ ...inner, ...px, zIndex:10 }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1.3fr", gap:52, alignItems:"center" }}>
          {/* left */}
          <div>
            <motion.div initial={{ opacity:0, scale:.9 }} animate={active?{ opacity:1, scale:1 }:{}} transition={{ duration:.5, delay:.1 }}
              style={{ display:"inline-flex", alignItems:"center", gap:7, marginBottom:16, padding:"4px 14px", borderRadius:100, border:`1px solid ${VIO}22`, background:`${VIO}0c`, fontSize:".63rem", fontFamily:"monospace", letterSpacing:".22em", color:`${VIO}bb` }}>
              <span style={{ width:4, height:4, borderRadius:"50%", background:VIO, boxShadow:`0 0 6px ${VIO}`, flexShrink:0 }} />{t("lp_preview_badge")}
            </motion.div>
            <motion.h2 initial={{ opacity:0, y:20 }} animate={active?{ opacity:1, y:0 }:{}} transition={{ duration:.6, delay:.18 }}
              style={{ margin:"0 0 14px", fontWeight:800, letterSpacing:"-.04em", fontSize:"clamp(1.6rem,3vw,2.4rem)", lineHeight:1.12 }}>
              {t("lp_preview_headline")}
            </motion.h2>
            <motion.p initial={{ opacity:0, y:14 }} animate={active?{ opacity:1, y:0 }:{}} transition={{ duration:.55, delay:.26 }}
              style={{ margin:"0 0 28px", fontSize:".9rem", color:"rgba(148,163,184,.54)", lineHeight:1.72 }}>
              {t("lp_preview_sub")}
            </motion.p>
            {/* feature tags */}
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {([["📓","section_journal",VIO],["🎯","section_daily_bias",CYN],["📊","section_analytics_lab",AMB],["🛡️","risk_management",RED]] as [string,string,string][]).map(([ico,k,c],i)=>(
                <motion.div key={i} initial={{ opacity:0, x:-12 }} animate={active?{ opacity:1, x:0 }:{}} transition={{ duration:.45, delay:.38+i*.07 }}
                  style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 12px", borderRadius:8, background:`${c}10`, border:`1px solid ${c}22`, fontSize:".73rem", color:`${c}cc` }}>
                  <span>{ico}</span><span>{t(k)}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* right — mock window */}
          <motion.div initial={{ opacity:0, x:32, scale:.97 }} animate={active?{ opacity:1, x:0, scale:1 }:{}} transition={{ duration:.75, delay:.2 }}
            style={{ borderRadius:16, border:"1px solid rgba(255,255,255,.1)", overflow:"hidden", boxShadow:`0 0 60px ${VIO}12,0 24px 60px rgba(0,0,0,.5)` }}>
            {/* title bar */}
            <div style={{ padding:"10px 16px", background:"rgba(255,255,255,.04)", borderBottom:"1px solid rgba(255,255,255,.07)", display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ display:"flex", gap:5 }}>{[RED,AMB,GRN].map((c,i)=><div key={i} style={{ width:10, height:10, borderRadius:"50%", background:c, opacity:.7 }} />)}</div>
              <div style={{ flex:1, height:20, borderRadius:5, background:"rgba(255,255,255,.05)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <span style={{ fontSize:".6rem", fontFamily:"monospace", color:"rgba(100,116,139,.5)" }}>app.trademind.io</span>
              </div>
            </div>
            {/* app body */}
            <div style={{ display:"grid", gridTemplateColumns:"160px 1fr", background:"#07080f" }}>
              {/* sidebar */}
              <div style={{ borderRight:"1px solid rgba(255,255,255,.06)", padding:"14px 10px", display:"flex", flexDirection:"column", gap:3 }}>
                {([["📓","section_journal",true],["🎯","section_daily_bias",false],["🧬","section_trader_dna",false],["📊","section_analytics_lab",false],["🛡️","risk_management",false],["🌐","section_markets",false]] as [string,string,boolean][]).map(([ico,k,act],i)=>(
                  <motion.div key={i} initial={{ opacity:0, x:-10 }} animate={active?{ opacity:1, x:0 }:{}} transition={{ duration:.4, delay:.4+i*.05 }}
                    style={{ display:"flex", alignItems:"center", gap:7, padding:"7px 10px", borderRadius:7, background:act?`${VIO}18`:"transparent", border:act?`1px solid ${VIO}25`:"1px solid transparent" }}>
                    <span style={{ fontSize:".85rem" }}>{ico}</span>
                    <span style={{ fontSize:".7rem", color:act?"#f1f5f9":"rgba(148,163,184,.4)", fontWeight:act?600:400 }}>{t(k)}</span>
                  </motion.div>
                ))}
              </div>
              {/* main */}
              <div style={{ padding:16, display:"flex", flexDirection:"column", gap:12 }}>
                {/* stats row */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
                  {[["Win Rate","64%",GRN],["Avg R:R","1.8R",CYN],["Month","+$1 248",GRN],["Streak","6W",AMB]].map(([l,v,c],i)=>(
                    <motion.div key={i} initial={{ opacity:0, y:8 }} animate={active?{ opacity:1, y:0 }:{}} transition={{ duration:.4, delay:.5+i*.06 }}
                      style={{ background:"rgba(255,255,255,.04)", borderRadius:9, padding:"10px 12px" }}>
                      <div style={{ fontSize:".56rem", fontFamily:"monospace", color:"rgba(100,116,139,.45)", letterSpacing:".09em", marginBottom:4 }}>{(l as string).toUpperCase()}</div>
                      <div style={{ fontSize:"1.1rem", fontWeight:700, color:c as string, letterSpacing:"-.02em" }}>{v}</div>
                    </motion.div>
                  ))}
                </div>
                {/* ai insight */}
                <motion.div initial={{ opacity:0 }} animate={active?{ opacity:1 }:{}} transition={{ duration:.5, delay:.68 }}
                  style={{ background:`${VIO}0e`, border:`1px solid ${VIO}22`, borderRadius:9, padding:"10px 14px", display:"flex", gap:9, alignItems:"flex-start" }}>
                  <span style={{ fontSize:".85rem", flexShrink:0 }}>🤖</span>
                  <p style={{ margin:0, fontSize:".72rem", color:"rgba(148,163,184,.72)", lineHeight:1.55 }}>
                    {t("lp_preview_ai_pre")} <strong style={{ color:"#f1f5f9" }}>$847</strong> {t("lp_preview_ai_post")}
                  </p>
                </motion.div>
                {/* trades */}
                {rows.map((tr,i)=>(
                  <motion.div key={i} initial={{ opacity:0, x:10 }} animate={active?{ opacity:1, x:0 }:{}} transition={{ duration:.4, delay:.72+i*.06 }}
                    style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(255,255,255,.03)", borderRadius:8, padding:"8px 12px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                      <div style={{ width:26, height:26, borderRadius:6, background:`${VIO}12`, border:`1px solid ${VIO}1e`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:".58rem", fontFamily:"monospace", color:`${VIO}88` }}>{tr.dir}</div>
                      <div>
                        <div style={{ fontSize:".78rem", fontWeight:600 }}>{tr.sym}</div>
                        <div style={{ fontSize:".6rem", color:"rgba(100,116,139,.45)", marginTop:1 }}>{tr.dir==="L"?t("long"):t("short")}</div>
                      </div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:".78rem", fontWeight:600, color:tr.c }}>{tr.pnl}</div>
                      <div style={{ fontSize:".6rem", color:"rgba(100,116,139,.4)", marginTop:1 }}>{tr.rr}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Slide>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SLIDE 4 — ANALYTICS
// ═════════════════════════════════════════════════════════════════════════════
function SlideAnalytics({ active }: { active: boolean }) {
  const t = useT();
  const months = [t("month_0"),t("month_1"),t("month_2"),t("month_3"),t("month_4"),t("month_5")];
  return (
    <Slide id="slide-analytics" bg="#05060f">
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 50% 60% at 30% 50%,rgba(245,158,11,.05) 0%,transparent 70%)", pointerEvents:"none" }} />
      <div style={{ ...inner, ...px, zIndex:10 }}>
        <div style={{ display:"grid", gridTemplateColumns:"1.3fr 1fr", gap:52, alignItems:"center" }}>
          {/* left — mock */}
          <motion.div initial={{ opacity:0, x:-32 }} animate={active?{ opacity:1, x:0 }:{}} transition={{ duration:.72, delay:.2 }}
            style={{ background:"rgba(255,255,255,.025)", border:"1px solid rgba(255,255,255,.08)", borderRadius:18, padding:24, display:"flex", flexDirection:"column", gap:16 }}>
            <div>
              <div style={{ fontSize:".6rem", fontFamily:"monospace", color:"rgba(100,116,139,.45)", letterSpacing:".14em", marginBottom:10 }}>{t("lp_analytics_pnl_label")}</div>
              <div style={{ position:"relative", height:90 }}>
                <svg width="100%" height="90" viewBox="0 0 300 90" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="amg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={AMB} stopOpacity=".28"/>
                      <stop offset="100%" stopColor={AMB} stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                  <path d="M0 72 L50 58 L100 66 L150 36 L200 44 L250 18 L300 8 L300 90 L0 90Z" fill="url(#amg)"/>
                  <motion.path d="M0 72 L50 58 L100 66 L150 36 L200 44 L250 18 L300 8"
                    stroke={AMB} strokeWidth="2" fill="none" strokeLinecap="round"
                    initial={{ pathLength:0 }} animate={active?{ pathLength:1 }:{}} transition={{ duration:1.4, delay:.5 }} />
                </svg>
                <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
                  {months.map((m,i)=><span key={i} style={{ fontSize:".56rem", fontFamily:"monospace", color:"rgba(100,116,139,.38)" }}>{m}</span>)}
                </div>
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
              {[["Win Rate","64%",GRN],["Avg R:R","1.8",CYN],["P. Factor","1.42",AMB]].map(([l,v,c],i)=>(
                <motion.div key={i} initial={{ opacity:0, y:8 }} animate={active?{ opacity:1, y:0 }:{}} transition={{ duration:.4, delay:.6+i*.08 }}
                  style={{ background:"rgba(255,255,255,.04)", borderRadius:10, padding:"12px 10px", textAlign:"center" }}>
                  <div style={{ fontSize:".56rem", fontFamily:"monospace", color:"rgba(100,116,139,.4)", marginBottom:6, letterSpacing:".08em" }}>{l}</div>
                  <div style={{ fontSize:"1.05rem", fontWeight:700, color:c as string }}>{v}</div>
                </motion.div>
              ))}
            </div>
            <div>
              <div style={{ fontSize:".6rem", fontFamily:"monospace", color:"rgba(100,116,139,.45)", letterSpacing:".14em", marginBottom:10 }}>{t("lp_analytics_session_label")}</div>
              {[["London","71%",.71],["New York","58%",.58],["Asia","34%",.34]].map(([s,p,v],i)=>(
                <div key={i} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                  <span style={{ fontSize:".72rem", color:"rgba(148,163,184,.55)", width:68, flexShrink:0 }}>{s}</span>
                  <div style={{ flex:1, height:5, borderRadius:3, background:"rgba(255,255,255,.06)" }}>
                    <motion.div style={{ height:"100%", borderRadius:3, background:`linear-gradient(90deg,${AMB}90,${AMB}40)`, originX:0 }}
                      initial={{ scaleX:0 }} animate={active?{ scaleX:v as number }:{}} transition={{ duration:.9, delay:.55+i*.1 }} />
                  </div>
                  <span style={{ fontSize:".68rem", fontFamily:"monospace", color:AMB, width:28, flexShrink:0 }}>{p}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* right — text */}
          <div>
            <motion.div initial={{ opacity:0, scale:.9 }} animate={active?{ opacity:1, scale:1 }:{}} transition={{ duration:.5, delay:.1 }}
              style={{ display:"inline-flex", alignItems:"center", gap:7, marginBottom:16, padding:"4px 14px", borderRadius:100, border:`1px solid ${AMB}22`, background:`${AMB}0c`, fontSize:".63rem", fontFamily:"monospace", letterSpacing:".22em", color:`${AMB}bb` }}>
              <span style={{ width:4, height:4, borderRadius:"50%", background:AMB, flexShrink:0 }} />{t("lp_analytics_badge")}
            </motion.div>
            <motion.h2 initial={{ opacity:0, y:20 }} animate={active?{ opacity:1, y:0 }:{}} transition={{ duration:.6, delay:.18 }}
              style={{ margin:"0 0 14px", fontWeight:800, letterSpacing:"-.04em", fontSize:"clamp(1.6rem,3vw,2.4rem)", lineHeight:1.12 }}>
              {t("lp_analytics_headline")}
            </motion.h2>
            <motion.p initial={{ opacity:0, y:14 }} animate={active?{ opacity:1, y:0 }:{}} transition={{ duration:.55, delay:.26 }}
              style={{ margin:"0 0 24px", fontSize:".9rem", color:"rgba(148,163,184,.54)", lineHeight:1.72 }}>
              {t("lp_analytics_sub")}
            </motion.p>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {(["lp_analytics_feat_1","lp_analytics_feat_2","lp_analytics_feat_3","lp_analytics_feat_4"]).map((k,i)=>(
                <motion.div key={i} initial={{ opacity:0, x:16 }} animate={active?{ opacity:1, x:0 }:{}} transition={{ duration:.4, delay:.38+i*.07 }}
                  style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:18, height:18, borderRadius:5, background:`${AMB}18`, border:`1px solid ${AMB}28`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5 4.5-4.5" stroke={AMB} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <span style={{ fontSize:".83rem", color:"rgba(148,163,184,.65)" }}>{t(k)}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Slide>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SLIDE 5 — TRADER DNA
// ═════════════════════════════════════════════════════════════════════════════
function SlideDNA({ active }: { active: boolean }) {
  const t = useT();
  const traits = [
    { key:"lp_dna_trait_discipline", v:82, c:VIO },
    { key:"lp_dna_trait_patience",   v:64, c:CYN },
    { key:"lp_dna_trait_risk",       v:91, c:GRN },
    { key:"lp_dna_trait_consistency",v:73, c:AMB },
    { key:"lp_dna_trait_emotion",    v:58, c:RED },
  ];
  return (
    <Slide id="slide-dna" bg="#05060f">
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 50% 60% at 70% 50%,rgba(16,185,129,.05) 0%,transparent 70%)", pointerEvents:"none" }} />
      <div style={{ ...inner, ...px, zIndex:10 }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1.3fr", gap:52, alignItems:"center" }}>
          {/* left text */}
          <div>
            <motion.div initial={{ opacity:0, scale:.9 }} animate={active?{ opacity:1, scale:1 }:{}} transition={{ duration:.5, delay:.1 }}
              style={{ display:"inline-flex", alignItems:"center", gap:7, marginBottom:16, padding:"4px 14px", borderRadius:100, border:`1px solid ${GRN}22`, background:`${GRN}0c`, fontSize:".63rem", fontFamily:"monospace", letterSpacing:".22em", color:`${GRN}bb` }}>
              <span style={{ width:4, height:4, borderRadius:"50%", background:GRN, flexShrink:0 }} />{t("lp_dna_badge")}
            </motion.div>
            <motion.h2 initial={{ opacity:0, y:20 }} animate={active?{ opacity:1, y:0 }:{}} transition={{ duration:.6, delay:.18 }}
              style={{ margin:"0 0 14px", fontWeight:800, letterSpacing:"-.04em", fontSize:"clamp(1.6rem,3vw,2.4rem)", lineHeight:1.12 }}>
              {t("lp_dna_headline")}
            </motion.h2>
            <motion.p initial={{ opacity:0, y:14 }} animate={active?{ opacity:1, y:0 }:{}} transition={{ duration:.55, delay:.26 }}
              style={{ margin:"0 0 24px", fontSize:".9rem", color:"rgba(148,163,184,.54)", lineHeight:1.72 }}>
              {t("lp_dna_sub")}
            </motion.p>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {(["lp_dna_feat_1","lp_dna_feat_2","lp_dna_feat_3","lp_dna_feat_4"]).map((k,i)=>(
                <motion.div key={i} initial={{ opacity:0, x:-16 }} animate={active?{ opacity:1, x:0 }:{}} transition={{ duration:.4, delay:.36+i*.07 }}
                  style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:18, height:18, borderRadius:5, background:`${GRN}18`, border:`1px solid ${GRN}28`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5 4.5-4.5" stroke={GRN} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <span style={{ fontSize:".83rem", color:"rgba(148,163,184,.65)" }}>{t(k)}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* right mock */}
          <motion.div initial={{ opacity:0, x:32 }} animate={active?{ opacity:1, x:0 }:{}} transition={{ duration:.72, delay:.22 }}
            style={{ background:"rgba(255,255,255,.025)", border:"1px solid rgba(255,255,255,.08)", borderRadius:18, padding:24, display:"flex", flexDirection:"column", gap:16 }}>
            <div>
              <div style={{ fontSize:".6rem", fontFamily:"monospace", color:"rgba(100,116,139,.45)", letterSpacing:".14em", marginBottom:12 }}>{t("lp_dna_profile_label")}</div>
              {traits.map((tr,i)=>(
                <div key={i} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                  <span style={{ fontSize:".72rem", color:"rgba(148,163,184,.55)", width:106, flexShrink:0 }}>{t(tr.key)}</span>
                  <div style={{ flex:1, height:6, borderRadius:3, background:"rgba(255,255,255,.06)" }}>
                    <motion.div style={{ height:"100%", borderRadius:3, background:`linear-gradient(90deg,${tr.c}90,${tr.c}45)`, originX:0 }}
                      initial={{ scaleX:0 }} animate={active?{ scaleX:tr.v/100 }:{}} transition={{ duration:1, delay:.35+i*.09 }} />
                  </div>
                  <span style={{ fontSize:".68rem", fontFamily:"monospace", color:tr.c, width:24, flexShrink:0, textAlign:"right" }}>{tr.v}</span>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize:".6rem", fontFamily:"monospace", color:"rgba(100,116,139,.45)", letterSpacing:".14em", marginBottom:10 }}>{t("lp_dna_errors_label")}</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                {([["lp_dna_error_early_entry",14,RED],["error_fomo",9,AMB],["lp_dna_error_early_exit",22,AMB],["error_revenge",4,RED]] as [string,number,string][]).map(([k,n,c],i)=>(
                  <motion.div key={i} initial={{ opacity:0, scale:.92 }} animate={active?{ opacity:1, scale:1 }:{}} transition={{ duration:.4, delay:.6+i*.07 }}
                    style={{ background:`${c}0d`, border:`1px solid ${c}20`, borderRadius:10, padding:"12px 14px" }}>
                    <div style={{ fontSize:"1.2rem", fontWeight:800, color:c, marginBottom:4 }}>{n}</div>
                    <div style={{ fontSize:".68rem", color:"rgba(148,163,184,.5)", lineHeight:1.4 }}>{t(k)}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Slide>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SLIDE 6 — HOW IT WORKS
// ═════════════════════════════════════════════════════════════════════════════
function SlideHowItWorks({ active }: { active: boolean }) {
  const t = useT();
  const steps = [
    { n:"01", icon:"✏️", titleKey:"lp_how_step1_title", descKey:"lp_how_step1_desc" },
    { n:"02", icon:"🔬", titleKey:"lp_how_step2_title", descKey:"lp_how_step2_desc" },
    { n:"03", icon:"💡", titleKey:"lp_how_step3_title", descKey:"lp_how_step3_desc" },
    { n:"04", icon:"📈", titleKey:"lp_how_step4_title", descKey:"lp_how_step4_desc" },
  ];
  return (
    <Slide id="slide-how" bg="rgba(5,6,15,1)">
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 60% 40% at 50% 0%,rgba(34,211,238,.05) 0%,transparent 70%)", pointerEvents:"none" }} />
      <div style={{ ...inner, ...px, zIndex:10 }}>
        <div style={{ textAlign:"center", marginBottom:48 }}>
          <motion.div initial={{ opacity:0, scale:.9 }} animate={active?{ opacity:1, scale:1 }:{}} transition={{ duration:.5, delay:.08 }}
            style={{ display:"inline-flex", alignItems:"center", gap:7, marginBottom:14, padding:"4px 14px", borderRadius:100, border:`1px solid ${CYN}22`, background:`${CYN}0c`, fontSize:".63rem", fontFamily:"monospace", letterSpacing:".22em", color:`${CYN}bb` }}>
            <span style={{ width:4, height:4, borderRadius:"50%", background:CYN, flexShrink:0 }} />{t("lp_how_badge")}
          </motion.div>
          <motion.h2 initial={{ opacity:0, y:18 }} animate={active?{ opacity:1, y:0 }:{}} transition={{ duration:.6, delay:.16 }}
            style={{ margin:"0 0 12px", fontWeight:800, letterSpacing:"-.04em", fontSize:"clamp(1.8rem,3.5vw,2.6rem)" }}>
            {t("lp_how_headline")}
          </motion.h2>
          <motion.p initial={{ opacity:0, y:12 }} animate={active?{ opacity:1, y:0 }:{}} transition={{ duration:.5, delay:.24 }}
            style={{ margin:0, fontSize:".92rem", color:"rgba(148,163,184,.5)", maxWidth:460, marginLeft:"auto", marginRight:"auto", lineHeight:1.7 }}>
            {t("lp_how_sub")}
          </motion.p>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16 }}>
          {steps.map((s,i)=>(
            <motion.div key={i} initial={{ opacity:0, y:32 }} animate={active?{ opacity:1, y:0 }:{}} transition={{ duration:.6, delay:.3+i*.1 }}
              style={{ padding:"24px 20px", background:"rgba(255,255,255,.02)", border:"1px solid rgba(255,255,255,.06)", borderRadius:16 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
                <div style={{ width:40, height:40, borderRadius:10, background:`${VIO}12`, border:`1px solid ${VIO}26`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:".7rem", fontFamily:"monospace", color:`${VIO}cc`, fontWeight:700, flexShrink:0 }}>{s.n}</div>
                {i<steps.length-1&&<div style={{ height:1, flex:1, background:`linear-gradient(90deg,${VIO}28,transparent)` }} />}
              </div>
              <div style={{ fontSize:"1.4rem", marginBottom:12 }}>{s.icon}</div>
              <h4 style={{ margin:"0 0 8px", fontSize:".95rem", fontWeight:700, color:"#f1f5f9" }}>{t(s.titleKey)}</h4>
              <p style={{ margin:0, fontSize:".79rem", color:"rgba(148,163,184,.52)", lineHeight:1.65 }}>{t(s.descKey)}</p>
            </motion.div>
          ))}
        </div>
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

function SlideStats({ active }: { active: boolean }) {
  const t = useT();
  const reviews = [
    { name:"Алексей М.", role:"Forex · 4 года",  av:"АМ", grad:"135deg,#7c3aed,#4f46e5", c:VIO, key:"lp_review_1_text", img:"https://api.dicebear.com/9.x/avataaars/svg?seed=Alexey&backgroundColor=b6e3f4&backgroundType=gradientLinear" },
    { name:"Дина К.",    role:"Crypto · Almaty", av:"ДК", grad:"135deg,#0891b2,#06b6d4",  c:CYN, key:"lp_review_2_text", img:"https://api.dicebear.com/9.x/avataaars/svg?seed=Dina&backgroundColor=d1d4f9&backgroundType=gradientLinear" },
    { name:"Rustam T.",  role:"Stocks",           av:"RT", grad:"135deg,#059669,#10b981",  c:GRN, key:"lp_review_3_text", img:"https://api.dicebear.com/9.x/avataaars/svg?seed=Rustam&backgroundColor=c0aede&backgroundType=gradientLinear" },
  ];
  return (
    <Slide id="slide-stats" bg="#05060f">
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 60% 50% at 50% 50%,rgba(139,92,246,.05) 0%,transparent 70%)", pointerEvents:"none" }} />
      <div style={{ ...inner, ...px, zIndex:10 }}>
        {/* stats row — updated numbers */}
        <motion.div initial={{ opacity:0, y:24 }} animate={active?{ opacity:1, y:0 }:{}} transition={{ duration:.6, delay:.1 }}
          style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginBottom:40 }}>
          {([{to:120,suf:"+",labelKey:"lp_stats_traders_label",c:VIO},{to:3000,suf:"+",labelKey:"lp_stats_trades_label",c:CYN},{to:2.1,suf:"×",labelKey:"lp_stats_rr_label",c:AMB,dec:1}] as {to:number;suf:string;labelKey:string;c:string;dec?:number}[]).map((s,i)=>(
            <motion.div key={i} initial={{ opacity:0, y:16 }} animate={active?{ opacity:1, y:0 }:{}} transition={{ duration:.5, delay:.15+i*.08 }}
              style={{ textAlign:"center", padding:"24px 16px", background:"rgba(255,255,255,.025)", border:"1px solid rgba(255,255,255,.07)", borderRadius:14 }}>
              <div style={{ fontSize:"clamp(2rem,4vw,2.8rem)", fontWeight:800, letterSpacing:"-.04em", color:s.c, lineHeight:1, marginBottom:8 }}>
                <AnimNum to={s.to} suf={s.suf} dec={s.dec??0} active={active} />
              </div>
              <div style={{ fontSize:".62rem", fontFamily:"monospace", color:"rgba(100,116,139,.5)", letterSpacing:".09em", lineHeight:1.4 }}>{t(s.labelKey).toUpperCase()}</div>
            </motion.div>
          ))}
        </motion.div>
        {/* testimonials */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
          {reviews.map((r,i)=>(
            <motion.div key={i} initial={{ opacity:0, y:20 }} animate={active?{ opacity:1, y:0 }:{}} transition={{ duration:.55, delay:.38+i*.09 }}
              style={{ background:"rgba(255,255,255,.025)", border:"1px solid rgba(255,255,255,.065)", borderRadius:16, padding:"20px 18px", display:"flex", flexDirection:"column", gap:14 }}>
              <div style={{ color:AMB, fontSize:".82rem", letterSpacing:3 }}>★★★★★</div>
              <p style={{ margin:0, fontSize:".81rem", color:"rgba(148,163,184,.72)", lineHeight:1.68, flex:1 }}>&ldquo;{t(r.key)}&rdquo;</p>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginTop:"auto", paddingTop:4, borderTop:"1px solid rgba(255,255,255,.05)" }}>
                {/* avatar */}
                <div style={{ position:"relative", flexShrink:0 }}>
                  <div style={{
                    width:48, height:48, borderRadius:14, overflow:"hidden",
                    background:`linear-gradient(${r.grad})`,
                    boxShadow:`0 0 18px ${r.c}35`,
                    border:`1.5px solid ${r.c}40`,
                    flexShrink:0,
                  }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={r.img}
                      alt={r.name}
                      width={48} height={48}
                      style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display="none"; }}
                    />
                  </div>
                  {/* online dot */}
                  <div style={{ position:"absolute", bottom:1, right:1, width:11, height:11, borderRadius:"50%", background:GRN, border:"2px solid #07080f", boxShadow:`0 0 7px ${GRN}` }} />
                </div>
                <div>
                  <div style={{ fontSize:".84rem", fontWeight:600, color:"#f1f5f9", letterSpacing:"-.01em" }}>{r.name}</div>
                  <div style={{ fontSize:".65rem", color:"rgba(100,116,139,.5)", marginTop:2 }}>{r.role}</div>
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
// SLIDE 8 — PRICING
// ═════════════════════════════════════════════════════════════════════════════
function SlidePricing({ active, onLaunch }: { active: boolean; onLaunch: ()=>void }) {
  const t = useT();
  const [annual, setAnnual] = useState(false);
  const plans = [
    { key:"core", name:"Core", price:0,  color:CYN, popular:false, feats:[t("plan_core_feat1"),t("plan_core_feat2"),t("plan_core_feat3"),t("plan_core_feat4")] },
    { key:"edge", name:"Edge", price:29, color:VIO, popular:true,  feats:[t("plan_edge_feat1"),t("plan_edge_feat2"),t("plan_edge_feat3"),t("plan_edge_feat4"),t("plan_edge_feat5")] },
    { key:"apex", name:"Apex", price:79, color:AMB, popular:false, feats:[t("plan_apex_feat1"),t("plan_apex_feat2"),t("plan_apex_feat3"),t("plan_apex_feat4"),t("plan_apex_feat5")] },
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
                <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:.97 }} onClick={onLaunch}
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
function SlideCTA({ active, onLaunch }: { active: boolean; onLaunch: ()=>void }) {
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
            background:"linear-gradient(155deg,#f1f5f9 20%,rgba(139,92,246,.9) 55%,rgba(34,211,238,.88) 90%)",
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
          {t("lp_cta_headline_1")}<br />{t("lp_cta_headline_2")}
        </motion.h2>
        <motion.p initial={{ opacity:0, y:18 }} animate={active?{ opacity:1, y:0 }:{}} transition={{ duration:.6, delay:.28 }}
          style={{ margin:"0 0 40px", fontSize:"clamp(.9rem,1.8vw,1.1rem)", color:"rgba(148,163,184,.52)", maxWidth:500, lineHeight:1.72 }}>
          {t("lp_cta_sub")}
        </motion.p>
        <motion.div initial={{ opacity:0, y:16 }} animate={active?{ opacity:1, y:0 }:{}} transition={{ duration:.55, delay:.38 }}
          style={{ display:"flex", gap:12, flexWrap:"wrap", justifyContent:"center", marginBottom:32 }}>
          <motion.button whileHover={{ scale:1.05, boxShadow:`0 0 60px ${VIO}55` }} whileTap={{ scale:.97 }}
            onClick={onLaunch}
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
const SLIDE_IDS = ["slide-hero","slide-problem","slide-preview","slide-analytics","slide-dna","slide-how","slide-stats","slide-pricing","slide-cta"];
const SLIDE_LABEL_KEYS = ["lp_slide_hero","lp_slide_problem","lp_slide_preview","lp_slide_analytics","lp_slide_dna","lp_slide_how","lp_slide_stats","lp_slide_pricing","lp_slide_cta"];

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

// ═════════════════════════════════════════════════════════════════════════════
// ROOT
// ═════════════════════════════════════════════════════════════════════════════
export default function HomePage() {
  const router  = useRouter();
  const t = useT();
  const didLaunch = useRef(false);
  const [booting, setBooting] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const launch = useCallback(() => {
    if (didLaunch.current) return;
    didLaunch.current = true;
    setBooting(true);
  }, []);
  const onDone = useCallback(() => router.push("/app"), [router]);

  // track which slide is in view
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const idx = SLIDE_IDS.indexOf(entry.target.id);
            if (idx !== -1) setActiveSlide(idx);
          }
        });
      },
      { root: container, threshold: 0.6 }
    );
    SLIDE_IDS.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const goTo = (i: number) => {
    const el = document.getElementById(SLIDE_IDS[i]);
    el?.scrollIntoView({ behavior:"smooth" });
  };

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
          <span style={{ fontSize:".56rem", fontFamily:"monospace", letterSpacing:".14em", color:"rgba(100,116,139,.45)", border:"1px solid rgba(100,116,139,.12)", padding:"2px 6px", borderRadius:3 }}>ALPHA</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:20 }}>
          {([["slide-problem","lp_nav_problem"],["slide-how","lp_nav_how"],["slide-pricing","lp_nav_pricing"]] as [string,string][]).map(([id,k])=>(
            <button key={id} onClick={()=>{ const el=document.getElementById(id); el?.scrollIntoView({behavior:"smooth"}); }}
              style={{ fontSize:".78rem", color:"rgba(148,163,184,.45)", background:"none", border:"none", cursor:"pointer", transition:"color .2s", padding:0 }}
              onMouseEnter={e=>(e.currentTarget.style.color="#f1f5f9")} onMouseLeave={e=>(e.currentTarget.style.color="rgba(148,163,184,.45)")}>{t(k)}</button>
          ))}
          <motion.button whileHover={{ scale:1.04 }} whileTap={{ scale:.97 }} onClick={launch}
            style={{ height:34, padding:"0 16px", background:`${VIO}20`, border:`1px solid ${VIO}50`, borderRadius:8, cursor:"pointer", fontSize:".7rem", fontFamily:"monospace", letterSpacing:".13em", color:`${VIO}ee`, fontWeight:700 }}>
            {t("initialize_system")}
          </motion.button>
        </div>
      </motion.header>

      {/* nav dots */}
      <NavDots active={activeSlide} onGo={goTo} />

      {/* scroll container */}
      <div ref={containerRef}
        style={{ height:"100vh", overflowY:"scroll", scrollSnapType:"y mandatory", scrollBehavior:"smooth" }}>
        <SlideHero     onLaunch={launch} active={activeSlide===0} />
        <SlideProblem  active={activeSlide===1} />
        <SlidePreview  active={activeSlide===2} />
        <SlideAnalytics active={activeSlide===3} />
        <SlideDNA      active={activeSlide===4} />
        <SlideHowItWorks active={activeSlide===5} />
        <SlideStats    active={activeSlide===6} />
        <SlidePricing  active={activeSlide===7} onLaunch={launch} />
        <SlideCTA      active={activeSlide===8} onLaunch={launch} />
      </div>

      <style dangerouslySetInnerHTML={{ __html:`
        *, *::before, *::after { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; }
        a { text-decoration: none; color: inherit; }
        button { font-family: inherit; }
        @keyframes tmPulse { 0%,100%{opacity:1} 50%{opacity:.3} }
      `}} />
    </>
  );
}
