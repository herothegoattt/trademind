"""
Market Data Service - Fetch real-time market data from OANDA.
Supports multiple instruments: Forex, Stocks, Commodities, Indices.
"""

import httpx
from datetime import datetime, timezone
from typing import List, Dict, Optional
from app.core.config import settings


# Mock market data fallback
MOCK_MARKET_DATA = [
    {
        "instrument": "EUR/USD",
        "bid": 1.0845,
        "ask": 1.0847,
        "high": 1.0912,
        "low": 1.0798,
        "change": 0.0042,
        "change_pct": 0.39,
        "volume": 245600000,
        "category": "Forex",
    },
    {
        "instrument": "GBP/USD",
        "bid": 1.2634,
        "ask": 1.2636,
        "high": 1.2721,
        "low": 1.2567,
        "change": -0.0028,
        "change_pct": -0.22,
        "volume": 156800000,
        "category": "Forex",
    },
    {
        "instrument": "USD/JPY",
        "bid": 149.34,
        "ask": 149.36,
        "high": 150.12,
        "low": 148.56,
        "change": 0.65,
        "change_pct": 0.44,
        "volume": 328900000,
        "category": "Forex",
    },
    {
        "instrument": "SPY (S&P 500)",
        "bid": 578.42,
        "ask": 578.44,
        "high": 582.15,
        "low": 574.32,
        "change": 3.18,
        "change_pct": 0.55,
        "volume": 67230000,
        "category": "Stocks",
    },
    {
        "instrument": "Gold (XAU/USD)",
        "bid": 2087.50,
        "ask": 2087.75,
        "high": 2095.30,
        "low": 2068.45,
        "change": 12.50,
        "change_pct": 0.60,
        "volume": 125600000,
        "category": "Commodities",
    },
    {
        "instrument": "Crude Oil (WTI)",
        "bid": 89.45,
        "ask": 89.67,
        "high": 91.23,
        "low": 87.89,
        "change": 2.12,
        "change_pct": 2.42,
        "volume": 2340000,
        "category": "Commodities",
    },
    {
        "instrument": "AAPL",
        "bid": 182.35,
        "ask": 182.37,
        "high": 184.92,
        "low": 180.54,
        "change": 1.82,
        "change_pct": 1.01,
        "volume": 52341000,
        "category": "Stocks",
    },
]


async def fetch_oanda_rates(
    instruments: List[str] = None, 
    api_key: str | None = None
) -> Optional[List[Dict]]:
    """
    Fetch real-time forex rates from OANDA v20 API.
    Supports all OANDA instruments.
    """
    if not api_key:
        return None
    
    if not instruments:
        instruments = ["EUR_USD", "GBP_USD", "USD_JPY", "AUD_USD"]
    
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            # OANDA v20 API endpoint for prices
            response = await client.get(
                "https://api-fxpractice.oanda.com/v3/accounts/instruments",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                    "AcceptDatetimeFormat": "UNIX",
                },
                params={
                    "instruments": ",".join(instruments),
                },
            )
            
            if response.status_code == 200:
                data = response.json()
                items = []
                
                for instrument in data.get("instruments", []):
                    # Transform OANDA format to our format
                    inst_name = instrument.get("name", "").replace("_", "/")
                    bid = float(instrument.get("bid", {}).get("price", 0))
                    ask = float(instrument.get("ask", {}).get("price", 0))
                    
                    items.append({
                        "instrument": inst_name,
                        "bid": bid,
                        "ask": ask,
                        "category": "Forex",
                        "updated_at": datetime.now(timezone.utc).isoformat(),
                    })
                
                return items if items else None
    except Exception as e:
        print(f"OANDA API error: {e}")
    
    return None


async def fetch_market_data(limit: int = 10) -> List[Dict]:
    """
    Fetch market data from multiple sources:
    1. OANDA for forex and CFDs
    2. Fallback to mock data
    """
    oanda_key = getattr(settings, "oanda_api_key", None)
    
    if oanda_key:
        try:
            # Try to fetch from OANDA
            forex_instruments = [
                "EUR_USD", "GBP_USD", "USD_JPY", "AUD_USD", 
                "USD_CAD", "EUR_GBP", "GBP_JPY"
            ]
            data = await fetch_oanda_rates(forex_instruments, oanda_key)
            if data:
                return data[:limit]
        except Exception as e:
            print(f"Error fetching from OANDA: {e}")
    
    # Fall back to mock data
    return MOCK_MARKET_DATA[:limit]


async def fetch_instruments_by_category(
    category: str = None,
    api_key: str | None = None
) -> List[Dict]:
    """
    Fetch instruments filtered by category (Forex, Stocks, Commodities, Indices).
    """
    all_data = await fetch_market_data(100)
    
    if category:
        return [item for item in all_data if item.get("category", "").lower() == category.lower()]
    
    return all_data
