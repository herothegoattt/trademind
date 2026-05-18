// lib/api.ts
import {
  TopError,
  DailyBias,
  Section,
  ErrorType,
  ErrorDetails,
} from "./types";
import * as mock from "./mock";

// Backend API базовый URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Функция для обработки ошибок API
async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `API error: ${response.statusText}`);
  }
  return response.json();
}

// ===== ANALYSIS & ERRORS =====
export async function getTopErrors(): Promise<TopError[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/analysis/top-errors`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
    return await handleApiResponse(response);
  } catch (error) {
    console.warn("Failed to fetch top errors from API, using mock:", error);
    return mock.topErrors;
  }
}

// ===== DAILY BIAS =====
export async function getDailyBias(): Promise<DailyBias> {
  try {
    // Fetch crypto fear index which is reliable and CORS-friendly
    const response = await fetch("https://api.alternative.me/fng/?limit=1", {
      headers: { "Content-Type": "application/json" },
    });
    
    if (!response.ok) throw new Error("Fear index fetch failed");
    const data = await response.json();
    
    if (data.data && data.data.length > 0) {
      const fearValue = parseInt(data.data[0].value, 10);
      let tone: "Bullish" | "Neutral" | "Bearish" = "Neutral";
      let confidence = 0.5;
      let summary = "Markets balanced";
      
      if (fearValue > 70) {
        tone = "Bullish";
        confidence = 0.75;
        summary = `🟢 Extreme Fear (${fearValue}): Major Buy Opportunity - Capitulation detected`;
      } else if (fearValue > 55) {
        tone = "Bullish";
        confidence = 0.65;
        summary = `🔵 Fear (${fearValue}): Accumulation Phase - Risk/reward favorable for longs`;
      } else if (fearValue < 30) {
        tone = "Bearish";
        confidence = 0.75;
        summary = `🔴 Extreme Greed (${fearValue}): Profit Taking Recommended`;
      } else if (fearValue < 45) {
        tone = "Bearish";
        confidence = 0.65;
        summary = `🟠 Greed (${fearValue}): Distribution Phase - Market overheated`;
      } else {
        tone = "Neutral";
        confidence = 0.55;
        summary = `⚪ Neutral (${fearValue}): Trade structure only`;
      }
      
      return { tone, confidence, summary };
    }
  } catch (error) {
    console.warn("Failed to fetch daily bias, using fallback:", error);
  }
  
  return {
    tone: "Neutral",
    confidence: 0.58,
    summary: "Europe consolidating. Watch US session breakout.",
  };
}

// ===== SETUPS =====
export async function getSuggestedQuestions(section: Section): Promise<string[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/setups/suggested-questions?section=${section}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );
    const data = await handleApiResponse<{ questions: string[] }>(response);
    return data.questions || [];
  } catch (error) {
    console.warn("Failed to fetch suggested questions, using mock:", error);
    return mock.suggestedQuestionsBySection[section] || [];
  }
}

export async function getWarningZones(section: Section): Promise<string[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/setups/warning-zones?section=${section}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );
    const data = await handleApiResponse<{ zones: string[] }>(response);
    return data.zones || [];
  } catch (error) {
    console.warn("Failed to fetch warning zones, using mock:", error);
    return mock.warningZonesBySection[section] || [];
  }
}

// ===== ERROR ANALYSIS =====
export async function getErrorDetails(
  errorType: ErrorType
): Promise<ErrorDetails> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/analysis/error-details/${errorType}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );
    return await handleApiResponse(response);
  } catch (error) {
    console.warn("Failed to fetch error details, using mock:", error);
    return mock.errorDetails[errorType];
  }
}

// ===== USER PROFILE =====
export async function getUserProfile(): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
    return await handleApiResponse(response);
  } catch (error) {
    console.warn("Failed to fetch profile, using defaults:", error);
    // Fallback mock profile
    return {
      id: "user-123",
      email: "user@trademind.io",
      name: "Trader",
      avatar_url: null,
      verified: true,
      created_at: new Date().toISOString(),
      stats: {
        decisions_count: 247,
        accuracy_rate: 0.68,
        favorite_markets: ["EURUSD", "AAPL", "BTC"],
      },
    };
  }
}

// ===== AI CHAT =====
export interface SendChatPayload {
  section: Section;
  errorType?: ErrorType | null;
  message: string;
  context?: any;
  language?: 'en' | 'ru' | 'uz';
}

// ===== NEWS =====
export interface NewsItem {
  id: number;
  title: string;
  source: string | null;
  summary: string | null;
  impact: string;
  fetched_at: string | null;
}

export async function getNews(limit: number = 20): Promise<NewsItem[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/news?limit=${limit}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    return await handleApiResponse<NewsItem[]>(response);
  } catch (error) {
    console.warn("Failed to fetch news from API, returning empty list", error);
    return [];
  }
}

export async function sendChatMessage(
  payload: SendChatPayload
): Promise<{ reply: string }> {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(`/api/chat`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      message: payload.message,
      section: payload.section,
      error_type: payload.errorType ?? null,
      language: payload.language ?? "en",
    }),
  });

  if (response.status === 429) {
    const data = await response.json().catch(() => ({}));
    const err = new Error("ai_quota_exceeded") as any;
    err.code = "ai_quota_exceeded";
    err.limit = data.limit;
    err.resets_at = data.resets_at;
    throw err;
  }

  return await handleApiResponse<{ reply: string }>(response);
}

