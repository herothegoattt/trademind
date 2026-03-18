"""
News fetcher with support for multiple sources.
Supports real APIs (NewsData.io, NewsAPI, Trading Economics, ForexFactory) + fallback to mock data.
"""

import httpx
from datetime import datetime, timezone
from typing import List
from app.core.config import settings


# Mock data fallback
MOCK_NEWS = [
    {
        "title": "Federal Reserve Holds Interest Rates Steady",
        "source": "Reuters",
        "url": None,
        "summary": "Powell emphasizes data-dependent approach. Current inflation remains above 2% target.",
        "impact": "high",
        "published_at": datetime.now(timezone.utc).isoformat(),
        "date": "Mar 1, 2026",
    },
    {
        "title": "Tech Sector Earnings Beat Q4 Expectations",
        "source": "Bloomberg",
        "url": None,
        "summary": "NVIDIA, Microsoft and Apple report strong results. AI investments paying off.",
        "impact": "medium",
        "published_at": datetime.now(timezone.utc).isoformat(),
        "date": "Feb 28, 2026",
    },
    {
        "title": "Oil Prices Spike on Middle East Tensions",
        "source": "CNBC",
        "url": None,
        "summary": "Energy markets react sharply to geopolitical developments. Crude up 3.5%, expect continued volatility.",
        "impact": "high",
        "published_at": datetime.now(timezone.utc).isoformat(),
        "date": "Feb 27, 2026",
    },
    {
        "title": "EUR/USD Technical Break Above 1.08",
        "source": "Trading Economics",
        "url": None,
        "summary": "Euro strengthens on better-than-expected EU manufacturing data.",
        "impact": "medium",
        "published_at": datetime.now(timezone.utc).isoformat(),
        "date": "Feb 26, 2026",
    },
    {
        "title": "Consumer Confidence Falls in Major Markets",
        "source": "MarketWatch",
        "url": None,
        "summary": "US consumer sentiment index drops to 6-month low. Implications for spending patterns.",
        "impact": "medium",
        "published_at": datetime.now(timezone.utc).isoformat(),
        "date": "Feb 25, 2026",
    },
]


async def fetch_from_newsdata(api_key: str | None = None, limit: int = 10) -> List[dict] | None:
    """
    Fetch from NewsData.io (free tier available).
    Requires NEWSDATA_API_KEY environment variable.
    """
    if not api_key:
        return None
    
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            # Financial news query for forex/trading topics
            response = await client.get(
                "https://newsdata.io/api/1/news",
                params={
                    "apikey": api_key,
                    "q": "forex OR trading OR market OR finance",
                    "language": "en",
                    "sort": "recent",
                    "limit": min(limit, 50),
                },
            )
            
            if response.status_code == 200:
                data = response.json()
                items = []
                for article in data.get("results", [])[:limit]:
                    impact = "medium"
                    # Heuristic: higher impact keywords
                    if any(kw in article.get("title", "").lower() for kw in 
                           ["fed", "central bank", "crash", "surge", "crisis", "emergency"]):
                        impact = "high"
                    
                    items.append({
                        "title": article.get("title", ""),
                        "source": article.get("source_id", "NewsData"),
                        "url": article.get("link"),
                        "summary": article.get("description", ""),
                        "impact": impact,
                        "published_at": article.get("pubDate", datetime.now(timezone.utc).isoformat()),
                    })
                
                return items if items else None
    except Exception as e:
        # Silently fail and use fallback
        print(f"NewsData API error: {e}")
    
    return None


async def fetch_from_newsapi(api_key: str | None = None, limit: int = 10) -> List[dict] | None:
    """
    Fetch from NewsAPI.org (requires API key).
    Requires NEWSAPI_API_KEY environment variable.
    """
    if not api_key:
        return None
    
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            # Use business category which includes financial news
            response = await client.get(
                "https://newsapi.org/v2/top-headlines",
                params={
                    "apiKey": api_key,
                    "category": "business",
                    "language": "en",
                    "sortBy": "publishedAt",
                    "pageSize": min(limit, 100),
                },
            )
            
            if response.status_code == 200:
                data = response.json()
                items = []
                for article in data.get("articles", [])[:limit]:
                    impact = "medium"
                    # Heuristic: higher impact keywords
                    if any(kw in article.get("title", "").lower() for kw in 
                           ["fed", "central bank", "crash", "surge", "crisis", "emergency"]):
                        impact = "high"
                    
                    items.append({
                        "title": article.get("title", ""),
                        "source": article.get("source", {}).get("name", "NewsAPI"),
                        "url": article.get("url"),
                        "summary": article.get("description", ""),
                        "impact": impact,
                        "published_at": article.get("publishedAt", datetime.now(timezone.utc).isoformat()),
                    })
                
                return items if items else None
    except Exception as e:
        # Silently fail and use fallback
        print(f"NewsAPI error: {e}")
    
    return None


async def fetch_from_trading_economics(api_key: str | None = None, limit: int = 10) -> List[dict] | None:
    """
    Fetch from Trading Economics (economic calendar and news).
    Requires TRADING_ECONOMICS_API_KEY environment variable.
    """
    if not api_key:
        return None
    
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            # Trading Economics API endpoint for economic calendar
            response = await client.get(
                "https://api.tradingeconomics.com/calendar",
                params={
                    "api_key": api_key,
                    "format": "json",
                },
            )
            
            if response.status_code == 200:
                data = response.json()
                items = []
                for event in data[:limit]:
                    impact = "medium"
                    # Map importance to impact level
                    if event.get("importance") == "3":
                        impact = "high"
                    elif event.get("importance") == "1":
                        impact = "low"
                    
                    items.append({
                        "title": f"{event.get('country', '')} - {event.get('event', '')}",
                        "source": "Trading Economics",
                        "url": None,
                        "summary": f"Forecast: {event.get('forecast', 'N/A')} | Previous: {event.get('previous', 'N/A')}",
                        "impact": impact,
                        "published_at": event.get("date", datetime.now(timezone.utc).isoformat()),
                        "date": event.get("date", ""),
                    })
                
                return items if items else None
    except Exception as e:
        print(f"Trading Economics API error: {e}")
    
    return None


async def fetch_from_forexfactory(api_url: str | None = None, api_key: str | None = None, limit: int = 10) -> List[dict] | None:
    """
    Fetch from ForexFactory API or proxy that returns JSON economic calendar/events.
    The project does not ship an official ForexFactory API key — set `forexfactory_api_url`
    in settings to enable.
    """
    if not api_url:
        return None

    headers = {}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            # If a custom API URL is provided, prefer it (proxy that returns JSON)
            if api_url:
                resp = await client.get(api_url, headers=headers, params={"limit": limit})
                if resp.status_code == 200:
                    data = resp.json()
                    items = []
                    for article in (data if isinstance(data, list) else data.get("events", []))[:limit]:
                        title = article.get("title") or article.get("event") or article.get("headline")
                        summary = article.get("summary") or article.get("description") or article.get("impact")
                        impact = article.get("impact_level") or article.get("impact") or "medium"
                        items.append({
                            "title": title or "ForexFactory Event",
                            "source": "ForexFactory",
                            "url": article.get("url"),
                            "summary": summary,
                            "impact": impact,
                            "published_at": article.get("date") or article.get("published_at") or datetime.now(timezone.utc).isoformat(),
                        })
                    if items:
                        return items

            # If no API URL provided, attempt to fetch ForexFactory's public JSON calendar (CDN)
            # This endpoint is not guaranteed, but often exists as ff_calendar_thisweek.json
            try:
                cdn_resp = await client.get("https://cdn-nfs.forexfactory.net/ff_calendar_thisweek.json")
                if cdn_resp.status_code == 200:
                    cj = cdn_resp.json()
                    items = []
                    # cj may be dict with 'events' or list of events
                    events = []
                    if isinstance(cj, dict):
                        # try common keys
                        events = cj.get("events") or cj.get("calendar") or cj.get("data") or []
                    elif isinstance(cj, list):
                        events = cj

                    for ev in events[:limit]:
                        # Defensive parsing for known FF fields
                        title = ev.get("title") or ev.get("event") or f"{ev.get('currency','')} - Economic Event"
                        impact_raw = ev.get("impact") or ev.get("importance") or ev.get("impact_level") or ev.get("impact_type")
                        impact = "medium"
                        if isinstance(impact_raw, (int, float)):
                            if int(impact_raw) >= 2:
                                impact = "high"
                        elif isinstance(impact_raw, str):
                            if impact_raw.lower() in ("high", "h", "3"):
                                impact = "high"
                            elif impact_raw.lower() in ("low", "l", "1"):
                                impact = "low"

                        summary_parts = []
                        for k in ("actual", "forecast", "previous", "consensus"):
                            if ev.get(k) is not None:
                                summary_parts.append(f"{k.capitalize()}: {ev.get(k)}")

                        summary = ev.get("summary") or ev.get("description") or (" | ".join(summary_parts) if summary_parts else None)
                        items.append({
                            "title": title,
                            "source": "ForexFactory",
                            "url": ev.get("url") or ev.get("link"),
                            "summary": summary,
                            "impact": impact,
                            "published_at": ev.get("date") or ev.get("time") or datetime.now(timezone.utc).isoformat(),
                        })

                    if items:
                        return items
            except Exception:
                # ignore CDN attempt failures and fall through to return None
                pass
    except Exception as e:
        print(f"ForexFactory fetch error: {e}")

    return None


async def fetch_combined_financial_news(limit: int = 20) -> List[dict]:
    """
    Fetch from multiple financial news sources:
    1. Trading Economics for economic calendar
    2. NewsAPI for business news
    3. NewsData for market news
    4. Fallback to mock data
    """
    all_news = []
    
    # Try Trading Economics first
    te_key = getattr(settings, "trading_economics_api_key", None)
    if te_key:
        try:
            news = await fetch_from_trading_economics(te_key, limit // 3)
            if news:
                all_news.extend(news)
        except Exception as e:
            print(f"Error fetching from Trading Economics: {e}")
    
    # Try NewsAPI
    newsapi_key = getattr(settings, "newsapi_api_key", None)
    if newsapi_key:
        try:
            news = await fetch_from_newsapi(newsapi_key, limit // 3)
            if news:
                all_news.extend(news)
        except Exception as e:
            print(f"Error fetching from NewsAPI: {e}")
    
    # Try NewsData
    newsdata_key = getattr(settings, "newsdata_api_key", None)
    if newsdata_key:
        try:
            news = await fetch_from_newsdata(newsdata_key, limit // 3)
            if news:
                all_news.extend(news)
        except Exception as e:
            print(f"Error fetching from NewsData: {e}")

    # Try ForexFactory (proxy/API)
    ff_url = getattr(settings, "forexfactory_api_url", None)
    ff_key = getattr(settings, "forexfactory_api_key", None)
    if ff_url:
        try:
            news = await fetch_from_forexfactory(ff_url, ff_key, limit // 3)
            if news:
                all_news.extend(news)
        except Exception as e:
            print(f"Error fetching from ForexFactory: {e}")
    
    # If we have some news, return sorted by importance
    if all_news:
        # Sort by impact level (high -> medium -> low)
        impact_order = {"high": 0, "medium": 1, "low": 2}
        all_news.sort(key=lambda x: (impact_order.get(x.get("impact", "medium"), 3), 
                                      x.get("published_at", "")), reverse=True)
        return all_news[:limit]
    
    # Fall back to mock data
    return MOCK_NEWS[:limit]

