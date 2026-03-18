import { NextRequest, NextResponse } from 'next/server';
import { fetchEconomicCalendar } from '../../../lib/newsProvider';

export async function GET(req: NextRequest) {
  const limitParam = req.nextUrl.searchParams.get('limit');
  const limit = limitParam ? parseInt(limitParam, 10) : 20;
  const result = await fetchEconomicCalendar(limit);
  return NextResponse.json(result);
}
