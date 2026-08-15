import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

const SUPPORT_SYSTEM = `You are TradeMind's support assistant. You help users with questions about the TradeMind platform.

PLATFORM OVERVIEW:
- TradeMind AI is a neural trading platform with AI decision analysis, bias detection, and personalized insights
- Features: AI Trading Coach (chat), Trading Journal, Trader DNA (psychological profile), Daily Bias & News, Community Edge, Setups, Analytics Lab, Investing section
- Trader DNA activates after logging 5 trades — it builds a psychological profile from trade patterns
- The platform supports Forex, Crypto, Stocks, Futures

KEY FACTS:
- Trades are logged in the Journal section with symbol, direction (long/short), entry/exit, P&L, notes
- TradingView can be connected via Profile → Connect TradingView
- AI bias detection identifies: FOMO, Overconfidence, Decision Under Fatigue, Revenge Trading, Confirmation Bias, Risk Miscalculation, Ignoring Invalid Signals
- Community Edge lets users share setups and trade ideas
- Daily Bias gives morning market direction + warning zones
- Plans: Core (free), Edge, Apex

TONE:
- Friendly, concise, helpful
- If you don't know something platform-specific, say "Our support team can help — use the contact form below"
- Never invent features that don't exist
- Keep answers under 120 words unless the question requires more detail
- Respond in the same language the user writes in`;

export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json();
    if (!question?.trim()) {
      return NextResponse.json({ answer: "Please enter a question." }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { answer: "AI is currently unavailable. Please use the contact form below." },
        { status: 200 },
      );
    }

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 400,
        system: SUPPORT_SYSTEM,
        messages: [{ role: "user", content: question.trim() }],
      }),
    });

    if (!res.ok) {
      return NextResponse.json(
        { answer: "AI is temporarily unavailable. Please use the contact form to reach our team." },
        { status: 200 },
      );
    }

    const data = await res.json();
    const answer = data.content?.[0]?.text ?? "I couldn't generate a response. Please contact support.";
    return NextResponse.json({ answer });
  } catch (err) {
    console.error("Support ask error:", err);
    return NextResponse.json(
      { answer: "Something went wrong. Please use the contact form below." },
      { status: 200 },
    );
  }
}
