"use client";

import { useState, useRef, useEffect, CSSProperties } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Mail, HelpCircle, Search, Send } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

// ─── Constants ──────────────────────────────────────────────────────────────────
const ACCENT = "#7C6FE0";

// ─── FAQ data ───────────────────────────────────────────────────────────────────
const FAQ: { q: string; a: string }[] = [
  {
    q: "What is Trader DNA?",
    a: "Trader DNA is your personalised psychological trading profile. It builds automatically after you log 5 trades — analysing patterns in your entries, exits, P&L, and behaviour to surface recurring biases and strengths.",
  },
  {
    q: "How do I log a trade?",
    a: "Go to Journal in the sidebar → click 'Add Trade'. Fill in symbol, direction (long/short), entry, exit, and P&L. Notes and tags are optional. Your trade is analysed immediately for psychological patterns.",
  },
  {
    q: "How does AI bias detection work?",
    a: "The AI monitors 7 psychological error types — FOMO, Overconfidence, Decision Under Fatigue, Revenge Trading, Confirmation Bias, Risk Miscalculation, and Ignoring Invalid Signals — and flags them in real time based on your trade data.",
  },
  {
    q: "What markets are supported?",
    a: "TradeMind supports Forex, Crypto, Stocks, Futures, and Other. You can set your preferred market in your profile to personalise Daily Bias and AI coaching responses.",
  },
  {
    q: "How do I connect TradingView?",
    a: "Open your Profile (top-right icon) → scroll to 'TradingView Integration' → enter your TradingView username and click Connect. Once linked, your public charts and watchlist data sync automatically.",
  },
  {
    q: "Is my data secure?",
    a: "All data is stored with JWT-authenticated sessions. We never share your trading data with third parties. Your trade journal and profile are private and only accessible with your account.",
  },
  {
    q: "What's the difference between plans?",
    a: "Core (free) gives access to the journal, basic AI analysis, and community. Edge and Apex unlock advanced Trader DNA reports, unlimited AI coaching, priority support, and deeper analytics. See pricing for full details.",
  },
  {
    q: "Why isn't my Trader DNA activating?",
    a: "Trader DNA requires at least 5 logged trades to generate a meaningful profile. Once you hit 5 trades, it activates automatically. Make sure trades have P&L data filled in for the best analysis.",
  },
];

type Tab = "faq" | "ai" | "contact";

interface ChatMsg {
  role: "user" | "ai";
  text: string;
  loading?: boolean;
}

// ─── Input base ──────────────────────────────────────────────────────────────────
const inputBase: CSSProperties = {
  width: "100%",
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--text-strong)",
  fontSize: "0.85rem",
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.15s",
};

// ─── FAQ ────────────────────────────────────────────────────────────────────────
function FAQPanel() {
  const [open, setOpen] = useState<number | null>(null);
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? FAQ.filter(
        (f) =>
          f.q.toLowerCase().includes(query.toLowerCase()) ||
          f.a.toLowerCase().includes(query.toLowerCase())
      )
    : FAQ;

  return (
    <div>
      {/* Search */}
      <div style={{ position: "relative", marginBottom: 16 }}>
        <Search
          size={14}
          style={{
            position: "absolute", left: 12, top: "50%",
            transform: "translateY(-50%)",
            color: "rgba(100,116,139,0.4)",
            pointerEvents: "none",
          }}
        />
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(null); }}
          placeholder="Search questions…"
          style={{
            ...inputBase,
            height: 38,
            paddingLeft: 36,
            paddingRight: 12,
          }}
        />
      </div>

      {/* Items */}
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {filtered.length === 0 ? (
          <p style={{ fontSize: "0.82rem", color: "rgba(100,116,139,0.45)", textAlign: "center", padding: "24px 0" }}>
            No results for &ldquo;{query}&rdquo;
          </p>
        ) : filtered.map((item, i) => {
          const isOpen = open === i;
          return (
            <div
              key={i}
              style={{
                borderRadius: 8,
                border: `1px solid ${isOpen ? `${ACCENT}25` : "var(--border)"}`,
                background: isOpen ? `${ACCENT}08` : "transparent",
                overflow: "hidden",
                transition: "border-color 0.18s, background 0.18s",
              }}
            >
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  gap: 12,
                }}
              >
                <span style={{
                  fontSize: "0.83rem",
                  fontWeight: 500,
                  color: isOpen ? "var(--text-strong)" : "var(--text-muted)",
                  lineHeight: 1.45,
                  fontFamily: "inherit",
                  transition: "color 0.15s",
                }}>
                  {item.q}
                </span>
                <span style={{
                  flexShrink: 0,
                  fontSize: 16,
                  lineHeight: 1,
                  color: isOpen ? ACCENT : "rgba(100,116,139,0.35)",
                  transition: "transform 0.2s, color 0.15s",
                  transform: isOpen ? "rotate(45deg)" : "none",
                  display: "inline-block",
                }}>
                  +
                </span>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    style={{ overflow: "hidden" }}
                  >
                    <p style={{
                      margin: 0,
                      padding: "2px 14px 14px",
                      fontSize: "0.8rem",
                      color: "rgba(148,163,184,0.72)",
                      lineHeight: 1.75,
                    }}>
                      {item.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── AI Chat ─────────────────────────────────────────────────────────────────────
function AIChat() {
  const [msgs, setMsgs] = useState<ChatMsg[]>([
    { role: "ai", text: "Hi! Ask me anything about TradeMind — features, getting started, or troubleshooting." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const send = async () => {
    const q = input.trim();
    if (!q || busy) return;
    setInput("");
    setMsgs((prev) => [
      ...prev,
      { role: "user", text: q },
      { role: "ai", text: "", loading: true },
    ]);
    setBusy(true);

    try {
      const res = await fetch("/api/support/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      setMsgs((prev) => [...prev.slice(0, -1), { role: "ai", text: data.answer }]);
    } catch {
      setMsgs((prev) => [
        ...prev.slice(0, -1),
        { role: "ai", text: "Couldn't reach the AI right now. Please try the Contact form." },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: 460 }}>
      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        paddingRight: 2,
        marginBottom: 14,
      }}>
        {msgs.map((m, i) => (
          <div key={i} style={{
            display: "flex",
            justifyContent: m.role === "user" ? "flex-end" : "flex-start",
            alignItems: "flex-end",
            gap: 8,
          }}>
            {m.role === "ai" && (
              <div style={{
                width: 24, height: 24, borderRadius: 6,
                background: `${ACCENT}18`,
                border: `1px solid ${ACCENT}35`,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, fontSize: "0.55rem", color: ACCENT,
                fontWeight: 700, letterSpacing: "0.03em",
              }}>
                AI
              </div>
            )}
            <div style={{
              maxWidth: "75%",
              padding: "9px 13px",
              borderRadius: m.role === "user" ? "12px 12px 3px 12px" : "12px 12px 12px 3px",
              background: m.role === "user"
                ? `${ACCENT}16`
                : "var(--card)",
              border: `1px solid ${m.role === "user" ? `${ACCENT}28` : "var(--border)"}`,
              fontSize: "0.81rem",
              color: m.role === "user" ? "var(--text-strong)" : "var(--text-muted)",
              lineHeight: 1.65,
            }}>
              {m.loading ? (
                <span style={{ display: "flex", gap: 4, alignItems: "center", padding: "2px 0" }}>
                  {[0, 1, 2].map((j) => (
                    <span key={j} style={{
                      width: 4, height: 4, borderRadius: "50%",
                      background: ACCENT,
                      animation: `tmDot 1.2s ${j * 0.2}s infinite ease-in-out`,
                      display: "inline-block",
                    }} />
                  ))}
                </span>
              ) : m.text}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input row */}
      <div style={{
        display: "flex",
        gap: 8,
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        padding: "6px 6px 6px 12px",
        alignItems: "center",
      }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Ask a question…"
          disabled={busy}
          style={{
            flex: 1,
            background: "none",
            border: "none",
            outline: "none",
            color: "var(--text-strong)",
            fontSize: "0.84rem",
            fontFamily: "inherit",
            opacity: busy ? 0.5 : 1,
          }}
        />
        <button
          onClick={send}
          disabled={!input.trim() || busy}
          style={{
            width: 32, height: 32,
            borderRadius: 7,
            background: input.trim() && !busy ? ACCENT : "var(--card-hover)",
            border: "none",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: input.trim() && !busy ? "pointer" : "default",
            transition: "background 0.15s",
            flexShrink: 0,
          }}
        >
          <Send size={13} color={input.trim() && !busy ? "#fff" : "rgba(100,116,139,0.4)"} />
        </button>
      </div>

      <p style={{
        margin: "8px 0 0",
        fontSize: "0.68rem",
        color: "rgba(100,116,139,0.3)",
        textAlign: "center",
      }}>
        AI · TradeMind features only
      </p>
    </div>
  );
}

// ─── Contact Form ─────────────────────────────────────────────────────────────────
function ContactForm() {
  const user = useAuthStore((s) => s.user);
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [ticketId, setTicketId] = useState<number | null>(null);

  const valid = name.trim() && email.trim() && message.trim();

  const send = async () => {
    if (!valid || status === "sending") return;
    setStatus("sending");
    try {
      const res = await fetch("/api/support/ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      setTicketId(data.ticket_id);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  };

  if (status === "done") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          gap: 14, padding: "48px 0", textAlign: "center",
        }}
      >
        <div style={{
          width: 48, height: 48, borderRadius: "50%",
          background: "rgba(52,211,153,0.08)",
          border: "1px solid rgba(52,211,153,0.22)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, color: "rgba(52,211,153,0.9)",
        }}>
          ✓
        </div>
        <div>
          <p style={{ margin: 0, fontSize: "0.92rem", fontWeight: 600, color: "var(--text-strong)" }}>
            Message sent
          </p>
          <p style={{ margin: "6px 0 0", fontSize: "0.78rem", color: "rgba(100,116,139,0.5)", lineHeight: 1.6 }}>
            Ticket #{ticketId} created<br />
            We&apos;ll reply to <span style={{ color: "rgba(148,163,184,0.6)" }}>{email}</span> within 24h
          </p>
        </div>
        <button
          onClick={() => { setStatus("idle"); setMessage(""); setSubject(""); }}
          style={{
            background: "none", border: "1px solid var(--border)",
            borderRadius: 7, cursor: "pointer",
            fontSize: "0.76rem", color: "rgba(100,116,139,0.45)",
            fontFamily: "inherit", padding: "6px 14px",
            transition: "border-color 0.15s, color 0.15s",
          }}
        >
          Send another
        </button>
      </motion.div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
      {status === "error" && (
        <div style={{
          padding: "10px 13px", borderRadius: 7,
          background: "rgba(239,68,68,0.05)",
          border: "1px solid rgba(239,68,68,0.13)",
          fontSize: "0.78rem", color: "rgba(252,165,165,0.75)",
        }}>
          Something went wrong. Please try again or email us directly.
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Field label="Name">
          <input value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            style={{ ...inputBase, height: 38, padding: "0 11px" }} />
        </Field>
        <Field label="Email">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            style={{ ...inputBase, height: 38, padding: "0 11px" }} />
        </Field>
      </div>

      <Field label="Subject">
        <input value={subject} onChange={(e) => setSubject(e.target.value)}
          placeholder="What's this about? (optional)"
          style={{ ...inputBase, height: 38, padding: "0 11px" }} />
      </Field>

      <Field label="Message">
        <textarea value={message} onChange={(e) => setMessage(e.target.value)}
          placeholder="Describe your issue or question…"
          rows={5}
          style={{ ...inputBase, resize: "vertical", padding: 11, lineHeight: 1.6, minHeight: 110 }} />
      </Field>

      <button
        onClick={send}
        disabled={!valid || status === "sending"}
        style={{
          height: 40, borderRadius: 8,
          background: valid ? ACCENT : "var(--card)",
          border: `1px solid ${valid ? "transparent" : "var(--border)"}`,
          color: valid ? "#fff" : "rgba(100,116,139,0.4)",
          fontSize: "0.84rem", fontFamily: "inherit", fontWeight: 500,
          cursor: valid ? "pointer" : "default",
          transition: "background 0.15s, color 0.15s",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}
      >
        {status === "sending" ? (
          <>
            <span style={{
              width: 12, height: 12, borderRadius: "50%",
              border: "1.5px solid rgba(255,255,255,0.25)",
              borderTopColor: "#fff",
              animation: "tmSpin 0.7s linear infinite",
              display: "inline-block",
            }} />
            Sending…
          </>
        ) : "Send message"}
      </button>

      <p style={{
        margin: 0, fontSize: "0.7rem", textAlign: "center",
        color: "rgba(100,116,139,0.3)", lineHeight: 1.6,
      }}>
        Or reach us at{" "}
        <a href="mailto:support@trademind.ai"
          style={{ color: `${ACCENT}70`, textDecoration: "none" }}>
          support@trademind.ai
        </a>
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{
        fontSize: "0.67rem", letterSpacing: "0.09em",
        color: "rgba(100,116,139,0.4)", textTransform: "uppercase",
        fontFamily: "inherit", fontWeight: 500,
      }}>
        {label}
      </span>
      {children}
    </label>
  );
}

// ─── Tab config ───────────────────────────────────────────────────────────────────
const TABS: { id: Tab; label: string; Icon: React.ElementType }[] = [
  { id: "faq",     label: "FAQ",     Icon: HelpCircle    },
  { id: "ai",      label: "Ask AI",  Icon: MessageSquare },
  { id: "contact", label: "Contact", Icon: Mail          },
];

// ─── Page ──────────────────────────────────────────────────────────────────────────
export default function SupportPage() {
  const [activeTab, setActiveTab] = useState<Tab>("faq");

  return (
    <div style={{ padding: "28px 28px 52px", fontFamily: "inherit", minHeight: "100%" }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          margin: 0, fontSize: "1.15rem", fontWeight: 600,
          color: "var(--text-strong)", letterSpacing: "-0.02em",
        }}>
          Help &amp; Support
        </h1>
        <p style={{ margin: "5px 0 0", fontSize: "0.77rem", color: "rgba(100,116,139,0.48)" }}>
          Find answers, ask the AI, or reach our team
        </p>
      </div>

      <div style={{ maxWidth: 680 }}>
        {/* Tab bar */}
        <div style={{
          display: "flex",
          gap: 1,
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          padding: 3,
          marginBottom: 18,
          width: "fit-content",
        }}>
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "7px 16px",
                  borderRadius: 7,
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: "0.81rem",
                  fontWeight: active ? 500 : 400,
                  background: active ? "var(--accent-dim)" : "transparent",
                  color: active ? "var(--text-strong)" : "var(--text-muted)",
                  boxShadow: active ? "0 1px 4px rgba(15,23,42,0.12)" : "none",
                  transition: "all 0.15s ease",
                  whiteSpace: "nowrap",
                }}
              >
                <tab.Icon
                  size={13}
                  color={active ? ACCENT : "rgba(100,116,139,0.4)"}
                  style={{ flexShrink: 0 }}
                />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            transition={{ duration: 0.13 }}
          >
            <div style={{
              background: "var(--bg-modal)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: "22px 22px 24px",
            }}>
              {activeTab === "faq"     && <FAQPanel />}
              {activeTab === "ai"      && <AIChat />}
              {activeTab === "contact" && <ContactForm />}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <style>{`
        @keyframes tmDot {
          0%, 80%, 100% { opacity: 0.15; transform: scale(0.8); }
          40%            { opacity: 1;    transform: scale(1); }
        }
        @keyframes tmSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
