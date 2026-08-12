import { NextRequest, NextResponse } from "next/server";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const YahooFinanceClass = require("yahoo-finance2").default;
const yf = new YahooFinanceClass({ suppressNotices: ["yahooSurvey"] });

// Always serve live options data — never cache
export const dynamic = "force-dynamic";
export const revalidate = 0;

const EXPIRIES = 5;              // how many near-term expiries to aggregate
const DEFAULT_MULT = 100;        // shares per option contract

/* ── Black-Scholes gamma (same for call & put) ─────────────────────── */
function bsGamma(S: number, K: number, sigma: number, T: number, r = 0.02): number {
  if (S <= 0 || K <= 0 || sigma <= 0 || T <= 0) return 0;
  const sq = sigma * Math.sqrt(T);
  const d1 = (Math.log(S / K) + (r + sigma * sigma / 2) * T) / sq;
  const pdf = Math.exp(-0.5 * d1 * d1) / Math.sqrt(2 * Math.PI);
  return pdf / (S * sq);
}

export async function GET(req: NextRequest) {
  const symbol = (req.nextUrl.searchParams.get("symbol") ?? "SPY").toUpperCase().trim();

  try {
    const chain = await yf.options(symbol);
    const expirations: Date[] = (chain.expirationDates ?? [])
      .slice(0, EXPIRIES)
      .filter((d: Date) => +d > Date.now() - 86400_000);

    if (expirations.length === 0) {
      return NextResponse.json({ detail: `No options for '${symbol}'` }, { status: 404 });
    }

    const quote = chain.quote ?? {};
    const spot = +(quote.regularMarketPrice ?? quote.lastPrice ?? 0);
    if (!(spot > 0)) {
      return NextResponse.json({ detail: "No spot price" }, { status: 404 });
    }

    // Aggregate gamma exposure across expiries. gex(strike) = Σ(γ_call·OI + γ_put·OI)·100·S.
    // Positive bars = dealers long gamma at that strike; signed relative to spot shows
    // where convexity is concentrated (and where price compresses / expands).
    const minStrike = Math.min(...((chain.strikes ?? []) as number[]).slice(0, 1_000_000));
    const maxStrike = Math.max(...((chain.strikes ?? []) as number[]).slice(0, 1_000_000));

    const perStrike = new Map<number, { call: number; put: number; oi: number }>();

    for (const exp of expirations) {
      let res: any;
      try {
        res = await yf.options(symbol, { date: exp.toISOString().slice(0, 10) });
      } catch {
        continue;
      }
      const opt = (res.options ?? [])[0];
      if (!opt) continue;
      const T = Math.max(1 / 365, (exp.getTime() - Date.now()) / (365 * 86400_000));

      const bump = (strike: number, oi: number, iv: number, side: "call" | "put") => {
        if (!(strike > 0) || !(oi > 0) || !(iv > 0)) return;
        const g = bsGamma(spot, strike, iv, T);
        const dollar = g * oi * DEFAULT_MULT * spot;
        const e = perStrike.get(strike) ?? { call: 0, put: 0, oi: 0 };
        if (side === "call") e.call += dollar; else e.put += dollar;
        e.oi += oi;
        perStrike.set(strike, e);
      };

      for (const c of opt.calls ?? []) bump(c.strike, c.openInterest, c.impliedVolatility, "call");
      for (const p of opt.puts ?? [])   bump(p.strike, p.openInterest, p.impliedVolatility, "put");
    }

    if (perStrike.size === 0) {
      return NextResponse.json({ detail: "No open interest in chain" }, { status: 404 });
    }

    const rows = Array.from(perStrike.entries())
      .map(([strike, e]) => ({
        strike,
        gex: e.call + e.put,
        callGex: e.call,
        putGex: e.put,
        oi: e.oi,
      }))
      .sort((a, b) => a.strike - b.strike)
      .filter((r) => r.strike >= minStrike && r.strike <= maxStrike);

    const maxGex = Math.max(1, ...rows.map((r) => Math.abs(r.gex)));
    let pocStrike = rows[0]?.strike ?? spot;
    let poc = -1;
    for (const r of rows) {
      if (Math.abs(r.gex) > poc) { poc = Math.abs(r.gex); pocStrike = r.strike; }
    }

    return NextResponse.json({
      symbol,
      spot,
      expires: expirations.map((d) => d.toISOString().slice(0, 10)),
      maxGex,
      pocStrike,
      rows,
    });
  } catch (err: any) {
    return NextResponse.json(
      { detail: err?.message?.slice(0, 200) ?? "Options unavailable" },
      { status: 502 }
    );
  }
}