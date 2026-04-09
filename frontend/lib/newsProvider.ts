
export interface NewsItem {
  id: string;
  time: string; // ISO
  title: string;
  country?: string;
  impact?: 'low' | 'medium' | 'high';
  actual?: string;
  forecast?: string;
  previous?: string;
  sourceUrl?: string;
}

// ForexFactory public JSON feed (via faireconomy.media CDN)
const FF_THIS_WEEK = 'https://nfs.faireconomy.media/ff_calendar_thisweek.json?version=1';
const FF_NEXT_WEEK = 'https://nfs.faireconomy.media/ff_calendar_nextweek.json?version=1';

function mapImpact(raw: string): 'low' | 'medium' | 'high' {
  const s = (raw || '').toLowerCase();
  if (s === 'high') return 'high';
  if (s === 'medium') return 'medium';
  return 'low';
}

async function fetchForexFactory(url: string): Promise<any[]> {
  const res = await fetch(url, {
    headers: { 'Accept': 'application/json' },
    next: { revalidate: 900 }, // cache for 15 minutes
  });
  if (!res.ok) throw new Error(`ForexFactory responded ${res.status}`);
  return res.json();
}

export async function fetchEconomicCalendar(limit: number = 50): Promise<{ items: NewsItem[]; warning?: string }> {
  // Try TradingEconomics first if key is configured
  const teKey = process.env.TRADING_ECONOMICS_KEY;
  if (teKey) {
    try {
      const url = `https://api.tradingeconomics.com/calendar?c=${teKey}`;
      const res = await fetch(url, { next: { revalidate: 900 } });
      if (res.ok) {
        const data = await res.json();
        const items: NewsItem[] = (data || []).slice(0, limit).map((ev: any, idx: number) => {
          let impact: 'low' | 'medium' | 'high' = 'medium';
          if (ev.importance === '3' || ev.importance === 3) impact = 'high';
          if (ev.importance === '1' || ev.importance === 1) impact = 'low';
          return {
            id: String(ev.id || idx),
            time: ev.date || new Date().toISOString(),
            title: ev.event || '',
            country: ev.country,
            impact,
            actual: ev.actual ? String(ev.actual) : undefined,
            forecast: ev.forecast ? String(ev.forecast) : undefined,
            previous: ev.previous ? String(ev.previous) : undefined,
            sourceUrl: ev.url,
          };
        });
        return { items };
      }
    } catch {
      // fall through to ForexFactory
    }
  }

  // Fetch from ForexFactory (this week + next week)
  try {
    const [thisWeek, nextWeek] = await Promise.allSettled([
      fetchForexFactory(FF_THIS_WEEK),
      fetchForexFactory(FF_NEXT_WEEK),
    ]);

    const raw: any[] = [
      ...(thisWeek.status === 'fulfilled' ? thisWeek.value : []),
      ...(nextWeek.status === 'fulfilled' ? nextWeek.value : []),
    ];

    if (raw.length === 0) throw new Error('No data from ForexFactory');

    // Filter out holidays and non-economic events, keep meaningful ones
    const filtered = raw.filter(ev => {
      const impact = (ev.impact || '').toLowerCase();
      return impact === 'high' || impact === 'medium' || impact === 'low';
    });

    const items: NewsItem[] = filtered.slice(0, limit).map((ev: any, idx: number) => ({
      id: String(ev.id || idx),
      time: ev.date || new Date().toISOString(),
      title: ev.title || '',
      country: ev.country,
      impact: mapImpact(ev.impact),
      actual: ev.actual && ev.actual !== '' ? String(ev.actual) : undefined,
      forecast: ev.forecast && ev.forecast !== '' ? String(ev.forecast) : undefined,
      previous: ev.previous && ev.previous !== '' ? String(ev.previous) : undefined,
      sourceUrl: 'https://www.forexfactory.com/calendar',
    }));

    return { items };
  } catch (e: any) {
    return { items: [], warning: `Could not load calendar: ${e?.message || 'unknown error'}` };
  }
}
