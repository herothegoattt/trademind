import { NextRequest, NextResponse } from "next/server";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const YahooFinanceClass = require("yahoo-finance2").default;
const yf = new YahooFinanceClass();

// Always serve the live quote — never cache
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const symbol = (req.nextUrl.searchParams.get("symbol") ?? "AAPL").toUpperCase().trim();

  try {
    const q = await yf.quote(symbol);
    const ts = q.regularMarketTime
      ? Math.floor(new Date(q.regularMarketTime).getTime() / 1000)
      : Math.floor(Date.now() / 1000);

    return NextResponse.json({
      price:     +(q.regularMarketPrice            ?? 0),
      open:      +(q.regularMarketOpen             ?? q.regularMarketPrice ?? 0),
      high:      +(q.regularMarketDayHigh          ?? q.regularMarketPrice ?? 0),
      low:       +(q.regularMarketDayLow           ?? q.regularMarketPrice ?? 0),
      volume:    Math.round(q.regularMarketVolume  ?? 0),
      time:      ts,
      change:    +(q.regularMarketChange           ?? 0),
      changePct: +(q.regularMarketChangePercent    ?? 0),
      marketState: q.marketState ?? "CLOSED",
    });
  } catch (err: any) {
    return NextResponse.json(
      { detail: err?.message?.slice(0, 200) ?? "Quote unavailable" },
      { status: 502 }
    );
  }
}
