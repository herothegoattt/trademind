import { NextResponse } from 'next/server';

const YF = 'https://query1.finance.yahoo.com/v8/finance/chart';

async function yf(symbol: string) {
  try {
    const r = await fetch(`${YF}/${encodeURIComponent(symbol)}?interval=1d&range=5d`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TradeMind/1.0)' },
      next: { revalidate: 300 },
    });
    if (!r.ok) return null;
    const d = await r.json();
    const res = d?.chart?.result?.[0];
    if (!res) return null;
    const closes: number[] = res.indicators?.quote?.[0]?.close ?? [];
    const valid = closes.filter(Boolean);
    if (valid.length < 2) return null;
    const current = valid[valid.length - 1];
    const prev    = valid[valid.length - 2];
    const change  = ((current - prev) / prev) * 100;
    return { current: parseFloat(current.toFixed(2)), prev: parseFloat(prev.toFixed(2)), change: parseFloat(change.toFixed(2)) };
  } catch {
    return null;
  }
}

export async function GET() {
  const [sp500R, vixR, dxyR, goldR, btcR, tnxR] = await Promise.allSettled([
    yf('^GSPC'),
    yf('^VIX'),
    yf('DX-Y.NYB'),
    yf('GC=F'),
    yf('BTC-USD'),
    yf('^TNX'),
  ]);

  let fearGreed: { value: number; classification: string } | null = null;
  try {
    const r = await fetch('https://api.alternative.me/fng/?limit=1');
    const d = await r.json();
    if (d.data?.[0]?.value) {
      fearGreed = { value: parseInt(d.data[0].value), classification: d.data[0].value_classification };
    }
  } catch {}

  const pick = <T,>(r: PromiseSettledResult<T>) => r.status === 'fulfilled' ? r.value : null;

  return NextResponse.json({
    sp500:     pick(sp500R),
    vix:       pick(vixR),
    dxy:       pick(dxyR),
    gold:      pick(goldR),
    btc:       pick(btcR),
    tnx:       pick(tnxR),
    fearGreed,
    updatedAt: new Date().toISOString(),
  });
}
