import { NextRequest, NextResponse } from "next/server";

const TRADING_SYSTEM_PROMPT = `You are TradeMind AI - an expert trading mentor with 15+ years of experience.

YOUR EXPERTISE:
- Technical analysis (support/resistance, price action, chart patterns, volume)
- Risk management (position sizing, stop losses, R/R ratios)
- Trading psychology (avoiding FOMO, revenge trading, overconfidence)
- Market structure and trends
- Multiple timeframe analysis

YOUR PRINCIPLES:
1. Risk First: Always lead with risk management concepts
2. Probability Over Certainty: Markets have probabilities, not certainties
3. Process Over Results: Focus on trading process, not individual outcomes
4. Behavioral Awareness: Understand trader psychology deeply
5. Practical Guidance: Actionable advice traders can execute TODAY

TRADING RULES YOU ENFORCE:
- Position size = (Risk % / Trade Risk %) × Account Balance
- Max 5% risk per trade for safety
- Always define stop loss BEFORE entering
- 1:2 minimum R/R ratio for trades
- Never revenge trade after losses
- Journal every trade with entry reason and exit reason

Make answers practical, specific, and actionable. Use percentages and ratios, not vague opinions.`;

const LANG_MAP: Record<string, string> = {
  en: "English",
  ru: "Russian",
  uz: "Uzbek",
  es: "Spanish",
};

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, section, error_type, language } = body;

    if (!message?.trim()) {
      return NextResponse.json({ reply: "Please enter a message." }, { status: 400 });
    }

    // Extract auth token — client sends it in Authorization header
    const authHeader = request.headers.get("authorization") || "";

    // ── Quota enforcement via FastAPI ──────────────────────────────────────
    if (authHeader) {
      const quotaRes = await fetch(`${BACKEND_URL}/api/v1/ai/quota/consume`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
      }).catch(() => null);

      if (quotaRes && quotaRes.status === 429) {
        const detail = await quotaRes.json().catch(() => ({}));
        return NextResponse.json(
          {
            error: "ai_quota_exceeded",
            limit: detail?.detail?.limit ?? 3,
            resets_at: detail?.detail?.resets_at ?? null,
          },
          { status: 429 }
        );
      }

      if (quotaRes && !quotaRes.ok && quotaRes.status !== 401) {
        console.error("Quota check failed with status:", quotaRes.status);
      }
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { reply: "AI service not configured. Please set ANTHROPIC_API_KEY in frontend/.env.local" },
        { status: 500 }
      );
    }

    const langName = LANG_MAP[language || "en"] || "English";
    const systemPrompt = `${TRADING_SYSTEM_PROMPT}\n\nAlways respond in ${langName}.`;
    const userPrompt = `Section: ${section || "General"}${error_type ? `\nError context: ${error_type}` : ""}\n\n${message}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error("Claude API error:", error);
      return NextResponse.json(
        { reply: "AI service temporarily unavailable. Please try again." },
        { status: 502 }
      );
    }

    const data = await response.json();
    const reply = data.content?.[0]?.text ?? "No response from AI.";
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Chat route error:", error);
    return NextResponse.json(
      { reply: "Internal server error. Please try again." },
      { status: 500 }
    );
  }
}
