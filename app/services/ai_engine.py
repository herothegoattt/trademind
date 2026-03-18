"""AI engine for intelligent trading insights powered by Claude (Anthropic).

Provides professional trading analysis with pattern recognition, error analysis, 
and personalized insights backed by real AI and deep trading knowledge.
"""
from typing import Any, Optional, Dict, List
import random
import os
from datetime import datetime

from openai import OpenAI

from app import crud
from app.database import get_db
from app.core.config import settings
from sqlalchemy.orm import Session

# Initialize OpenAI client (ChatGPT)
openai_client: OpenAI | None = (
    OpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None
)


# ============== PROFESSIONAL TRADING SYSTEM PROMPT ==============

TRADING_SYSTEM_PROMPT = """You are TradeMind AI - an expert trading mentor with 15+ years of experience.

YOUR EXPERTISE:
- Technical analysis (support/resistance, price action, chart patterns, volume)
- Risk management (position sizing, stop losses, R/R ratios)  
- Trading psychology (avoiding FOMO, revenge trading, overconfidence)
- Market structure and trends
- Multiple timeframe analysis
- News impact on markets
- Trading journal analysis
- Entry/exit signal validation

YOUR PRINCIPLES:
1. Risk First: Always lead with risk management concepts
2. Probability Over Certainty: Markets have probabilities, not certainties
3. Process Over Results: Focus on trading process, not individual outcomes
4. Behavioral Awareness: Understand trader psychology deeply
5. Evidence-Based: Reference trading statistics and research
6. Practical Guidance: Actionable advice traders can execute TODAY

TRADING RULES YOU ENFORCE:
- Position size = (Risk % / Trade Risk %) × Account Balance
- Max 5% risk per trade for safety
- Always define stop loss BEFORE entering
- 1:2 minimum R/R ratio for trades
- No more than 3% drawdown per day before stopping
- Never revenge trade after losses
- Journal every trade with entry reason and exit reason

When answering:
- Make answers practical and specific
- Reference market structure and price levels
- Connect trading psychology to performance
- Give actionable homework
- Use percentages and ratios, not opinions

Always respond in the user's requested language."""


ERROR_PATTERNS = {
    "FOMO": {
        "patterns": ["rushed", "hurry", "missed", "immediately", "quick", "can't wait", "now", "asap", "before", "late to"],
        "insights": [
            "💡 FOMO detected: Chasing price moves without setup confirmation has 81% loss rate.",
            "⚠️ FOMO pattern: Your best trades come from WAITING, not rushing. Patience = edge.",
            "📊 Psychology: Brain's amygdala hijacks logic when FOMO kicks in. Breathe.",
            "🎯 Reality: Market moves multiple times daily. Missed one? Better ones coming.",
        ],
        "rules": [
            "✓ Rule: Screenshot your setup BEFORE entering. Did price confirm your entry? If no = skip.",
            "✓ Rule: Keep a 'No Trade' journal - track the ones you missed and analyze afterward.",
            "✓ Rule: Set price alerts 2 hours before session. Hunt while others are distracted.",
            "✓ Rule: FOMO = fear. Fear = stops thinking. Walk away, meditate, come back in 30 min.",
        ]
    },
    "Overconfidence": {
        "patterns": ["sure", "confident", "definitely", "guaranteed", "always", "never lose", "easy", "obvious", "can't fail"],
        "insights": [
            "💡 Overconfidence detected: Pride comes before a portfolio blowup.",
            "⚠️ Pattern: Biggest losses follow biggest wins. This is human nature, not accident.",
            "📊 Fact: Casinos exploit overconfidence. So do markets. Humility = survival.",
            "🧠 Brain science: Dopamine from wins distorts risk perception for 24-48 hours.",
        ],
        "rules": [
            "✓ Rule: After 3 consecutive wins = MANDATORY day off. No exceptions.",
            "✓ Rule: Exit with 1.5-2x risk/reward FIRST WIN. Never hold hoping for 10x.",
            "✓ Rule: Position size INVERSE to confidence. More confident = smaller size.",
            "✓ Rule: Assume every trade can fail. Plan for -2R. Act like it matters.",
        ]
    },
    "Decision Under Fatigue": {
        "patterns": ["tired", "late", "morning", "night", "sleep", "exhausted", "burned out", "no sleep", "all night"],
        "insights": [
            "💡 Fatigue alert: Brain under fatigue makes 40% worse decisions. Measurable.",
            "⚠️ Warning: Sleep deprivation = impaired prefrontal cortex = no risk judgment.",
            "📊 Science: You're literally not intelligent when tired. Evolution's truth.",
            "🔴 Red flag: If you're debating trading while tired = DON'T. Debate means doubt.",
        ],
        "rules": [
            "✓ Rule: 7+ hours sleep BEFORE trading days. No exceptions.",
            "✓ Rule: Best trading window: 1 hour after waking. Second window: mid-afternoon.",
            "✓ Rule: No trades after 6pm. No trades before coffee + 30 min exercise.",
            "✓ Rule: Fatigue quiz: Can you clearly explain your trade thesis in 20 seconds? If no = skip.",
        ]
    },
    "Revenge Decision": {
        "patterns": ["lost", "make back", "recover", "revenge", "angry", "upset", "frustrated", "stupid", "hate myself"],
        "insights": [
            "💡 Revenge mode detected: Emotional trading has 87% failure rate. Study any losing trader.",
            "⚠️ Warning: Loss aversion is POWERFUL. It makes us take 3x normal risk recovering losses.",
            "📊 Pattern: Average revenge trade loses 2.3x more than planned trades. Proven.",
            "💔 Truth: Your account is down because of ONE bad trade. Don't compound with TWO.",
        ],
        "rules": [
            "✓ Rule: Loss = stop trading rest of day. No exceptions. Biology says so.",
            "✓ Rule: After loss: Journal entry FIRST. Questions: Why? What would pro do? Next rules?",
            "✓ Rule: Come back tomorrow with fresh brain. Revenge = desperation = wrong decisions.",
            "✓ Rule: If lost > 2T on one trade, take week off. Recalibrate. Heal.",
        ]
    },
    "Confirmation Bias": {
        "patterns": ["heard", "news says", "everyone", "trending", "viral", "influencer", "guru", "bullish", "always right"],
        "insights": [
            "💡 Confirmation bias: You're filtering data to match existing belief. Dangerous.",
            "⚠️ Warning: 80% of traders only read bullish news on positions they want. Blind.",
            "📊 Data: Consensus trades (crowd) average -2% vs +6% contrarian trades.",
            "🧠 Psychology: Brain wants to be RIGHT more than RICH. Costs money.",
        ],
        "rules": [
            "✓ Rule: For every bullish source, FIND and read 2 bearish ones. Forced contrarian view.",
            "✓ Rule: Best traders ignore crowd. Ask: What's WRONG with this trade?",
            "✓ Rule: If everyone on Twitter bullish = contrarian signal to short. Test it.",
            "✓ Rule: Trade DATA from YOUR charts. Ignore all opinions, even mine.",
        ]
    },
    "Risk Miscalculation": {
        "patterns": ["all in", "leverage", "margin", "margin call", "liquidation", "yolo", "bet", "gamble", "100x"],
        "insights": [
            "💡 Risk alert: Over-leveraged positions blow on a single 2% move. Math doesn't care.",
            "⚠️ Warning: 10x leverage = 90% probability of liquidation on normal volatility.",
            "📊 Truth: 99% expected loss possible even with 'certain' trade + extreme leverage.",
            "💀 Harsh: 73% of margin accounts get liquidated within 6 months. Not opinion. Fact.",
        ],
        "rules": [
            "✓ Rule: Position Size = (Account Risk % / Trade Risk %) × Account Balance. Math wins.",
            "✓ Rule: Max leverage = 3x for experts, 2x for learning, 1x for safety. Pick.",
            "✓ Rule: Diversify: No single position > 5% of portfolio. Ever.",
            "✓ Rule: Liquidation = account death. Think LIQUIDATION first, PROFIT second.",
        ]
    },
    "Ignoring Invalid Signals": {
        "patterns": ["ignore", "dismiss", "doesn't work", "broken", "always fails", "outdated", "skip rule"],
        "insights": [
            "💡 Signal died: Best traders adapt systems. Worst traders cling to broken rules.",
            "⚠️ Warning: Markets CHANGE every 6 months. Your setup expires too. Check it.",
            "📊 Fact: No strategy wins 100%. When win rate < 50%, AUDIT not ignore.",
            "🔄 Reality: 3 different signals > 1 magic signal. Ensemble = robustness.",
        ],
        "rules": [
            "✓ Rule: Monthly signal audit: Win rate, average R, drawdown. Numbers don't lie.",
            "✓ Rule: If signal fails 3x in a week = STOP using it. Test it. Fix it.",
            "✓ Rule: Use 3+ signals (support + momentum + volume). One signal = gambling.",
            "✓ Rule: Adapt to market regime. Bull setups ≠ Bear setups. Different rules.",
        ]
    },
}

SECTION_CONTEXT = {
    "Journal": "Trading journal = your personal database of wins/losses and lessons. Most successful traders credit journaling as #1 skill developer.",
    "Setups": "Trading setups are repeating chart patterns with specific entry/exit criteria. Find 3 setups. Master them. Ignore rest.",
    "Analysis": "Deep analysis of charts, support/resistance, trend structure. Best traders spend 80% on analysis, 20% on execution.",
    "Markets": "Real-time market structure, trends, reversals, and economic drivers. Markets have 'personality'. Learn yours.",
    "News": "Market news filters into price action. News events = volatility. Volatility = opportunity or disaster. Respect it.",
    "Daily Bias": "Morning routine: What's market direction today? Up, Down, or Choppy? Your trades should align with bias.",
}

SMART_RESPONSES = [
    {
        "keywords": ["how", "what"],
        "responses": [
            "📚 Answer on {section}: {context}. But here's truth: Understanding is 10%. Execution is 90%. Test your setup 10+ times.",
            "🎯 'How' questions have written answers. Test them yourself. That's how knowledge sticks in your brain.",
            "💭 Instead of asking 'how', ask 'why'. Why does my setup work? Why did this trade fail? Why is risk management hard?",
        ]
    },
    {
        "keywords": ["why", "reason"],
        "responses": [
            "🔍 'Why' is the deepest question. Your market analysis answers 'why price moved'. Your psychology answers 'why you sabotage'.",
            "📊 Markets move on supply/demand + emotions. Your trades fail on execution + emotions. Fix yourself first.",
            "🧠 Why is hard. Easier to ask 'how'. But 'why' = understanding. And understanding = edge.",
        ]
    },
    {
        "keywords": ["stuck", "help", "confused"],
        "responses": [
            "🆘 When stuck: Go back to basics. Setup check: Entry rule? Exit rule? Risk? Did you follow them? Yes? Then trade was right.",
            "📖 Stuck = good sign. Means you're hitting real problems not theory. Journal this. Solve it. You'll jump a level.",
            "💡 Solution: Simplify. Remove 90% of your rules. Keep 10%. Execute that until you win 5x. Then add back.",
        ]
    },
    {
        "keywords": ["profitable", "win", "gain", "profit", "green"],
        "responses": [
            "🎉 Winning trade! Now critical question: Can you repeat it EXACTLY same way? If yes = edge. If no = luck.",
            "📸 Screenshot your trade. Document entry signal, why you entered, exit reason. File it. You're building a playbook.",
            "⚡ Next: Is this setup repeating? If you see it 10 times in 30 days = real setup. Trade it bigger next time.",
        ]
    },
    {
        "keywords": ["lost", "loss", "down", "negative", "fail"],
        "responses": [
            "📌 Loss insight: Faster you process loss = faster you recover. Journal now: Why did it fail? System or execution?",
            "🛡️ Loss is tuition. Question: Did you follow your risk rules? If yes = loss was risk. Calculate + move on. If no = fix it.",
            "💪 All traders lose. 87% fail because they can't handle losses emotionally. You can. One loss ≠ you're bad.",
        ]
    },
    {
        "keywords": ["advice", "tip", "strategy", "setup"],
        "responses": [
            "🎯 Best trading advice: Find 3 setups that match YOUR personality (patient vs active). Master them over 6 months.",
            "📚 Then: Trade only those 3. Ignore everything else. 95% of traders fail by trading too many setups.",
            "💎 Your edge: Deep knowledge of 3 setups > shallow knowledge of 300. Focus beats hype.",
        ]
    }
]


def detect_error_pattern(message: str, error_type: Optional[str] = None) -> Optional[str]:
    """Detect error patterns in message and return contextualized response."""
    if not error_type or error_type not in ERROR_PATTERNS:
        return None
    
    error_data = ERROR_PATTERNS[error_type]
    message_lower = message.lower()
    
    # Check if message matches error pattern keywords
    pattern_match = any(
        pattern in message_lower 
        for pattern in error_data["patterns"]
    )
    
    if pattern_match:
        insight = random.choice(error_data["insights"])
        rule = random.choice(error_data["rules"])
        return f"{insight}\n\n{rule}"
    
    return None


def generate_smart_response(
    message: str,
    section: Optional[str] = None,
    error_type: Optional[str] = None,
) -> str:
    """Простой fallback-ответ, если внешнее AI недоступно."""
    return (
        "Спасибо за вопрос. Попробуйте быть более конкретными о том, что вас интересует в торговле."
    )




def create_trading_client() -> OpenAI | None:
    """Initialize ChatGPT client for trading analysis."""
    if not settings.openai_api_key:
        return None
    return openai_client or OpenAI(api_key=settings.openai_api_key)


def build_trading_context_prompt(
    message: str,
    section: Optional[str] = None,
    error_type: Optional[str] = None,
    context_data: Optional[Dict[str, Any]] = None
) -> str:
    """Build comprehensive trading context for Gemini."""
    
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M UTC")
    prompt = f"""[Trading Analysis Request - {timestamp}]

Trader Question/Context: {message}

"""
    
    if section:
        context_text = SECTION_CONTEXT.get(section, "")
        prompt += f"Section: {section}\nContext: {context_text}\n\n"
    
    if error_type:
        prompt += f"Detected Pattern: {error_type}\n"
    
    if context_data:
        if "recent_loss" in context_data:
            prompt += f"Recent Trade: Loss of {context_data['recent_loss']}R\n"
        if "account_balance" in context_data:
            prompt += f"Account Value: ${context_data['account_balance']:,.2f}\n"
        if "win_rate" in context_data:
            prompt += f"Win Rate: {context_data['win_rate']}%\n"
        if "market_outlook" in context_data:
            prompt += f"Market Outlook: {context_data['market_outlook']}\n"
    
    prompt += "\nRespond with specific, actionable trading advice addressing the question directly."
    return prompt


def chat_with_chatgpt(
    message: str,
    section: Optional[str] = None,
    error_type: Optional[str] = None,
    context: Optional[Dict[str, Any]] = None,
    language: Optional[str] = "en"
) -> str:
    """Chat with ChatGPT (OpenAI) for trading insights."""

    if not settings.openai_api_key:
        return generate_smart_response(message, section, error_type)

    try:
        client = create_trading_client()
        if not client:
            return generate_smart_response(message, section, error_type)

        lang_map = {"en": "English", "ru": "Russian", "uz": "Uzbek", "es": "Spanish"}
        lang_name = lang_map.get(language, "English")

        system_prompt = TRADING_SYSTEM_PROMPT + f"\n\nRespond in {lang_name}."

        user_content = f"""Section: {section or 'General'}
Error context: {error_type or 'None'}

Question:
{message}
"""

        completion = client.chat.completions.create(
            model="gpt-4.1-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content},
            ],
            temperature=0.7,
            max_tokens=2048,
        )

        return (completion.choices[0].message.content or "").strip()

    except Exception as e:
        print(f"OpenAI API Error: {e}")
        return generate_smart_response(message, section, error_type)


def chat(
    message: str,
    section: Optional[str] = None,
    error_type: Optional[str] = None,
    context: Optional[Dict[str, Any]] = None,
    language: Optional[str] = "en",
    **kwargs: Any
) -> str:
    """Main AI chat function - orchestrates real AI with fallback logic."""

    if not message or not message.strip():
        return "📝 Share what's on your mind - trading insights, journal entry, error analysis. I'm here to help."

    # Try ChatGPT (OpenAI) first
    response = chat_with_chatgpt(message, section, error_type, context, language)

    # Always add latest news context if available
    try:
        db: Session = next(get_db())
        news_items = crud.get_news(db, limit=2)
        if news_items:
            snippets = " | ".join(f"🗞️ {n.title} ({n.impact})" for n in news_items[:2])
            response += f"\n\n{snippets}"
    except Exception:
        pass

    return response


def analyze_trading_error(
    trade_data: Dict[str, Any],
    language: Optional[str] = "en"
) -> str:
    """Analyze a trading error or loss in detail."""

    if not settings.anthropic_api_key:
        return "Error analysis requires API configuration."

    prompt = f"""Analyze this trading error/loss and provide specific improvement actions:

Trade Data:
- Entry Price: {trade_data.get('entry_price', 'N/A')}
- Exit Price: {trade_data.get('exit_price', 'N/A')}
- Stop Loss: {trade_data.get('stop_loss', 'N/A')}
- Position Size: {trade_data.get('position_size', 'N/A')}
- Risk/Reward: {trade_data.get('r_r_ratio', 'N/A')}
- Result: {trade_data.get('result', 'N/A')}
- Trader Notes: {trade_data.get('notes', 'N/A')}

Provide:
1. Root cause of error (technical or psychological)
2. What would a pro trader do differently
3. Training exercise to prevent recurrence"""

    try:
        llm = create_trading_llm()
        response = llm.invoke(prompt)
        return response.content if hasattr(response, 'content') else str(response)
    except Exception as e:
        return f"Analysis error: {str(e)}"


def generate_trading_setup(
    description: str,
    market: str = "Forex",
    timeframe: str = "4H",
    language: Optional[str] = "en"
) -> str:
    """Generate a detailed trading setup based on description."""

    if not settings.anthropic_api_key:
        return "Setup generation requires API configuration."

    prompt = f"""Create a detailed, repeatable trading setup with these specs:

Description: {description}
Market: {market}
Timeframe: {timeframe}

Include:
1. Entry Criteria (specific price levels, volume, indicators)
2. Exit Criteria (profit target, how to calculate)
3. Stop Loss Placement (risk management)
4. Risk/Reward Ratio (minimum 1:2)
5. Position Size Formula
6. Confirmation Signals (2-3 must-haves)
7. Common Mistakes to Avoid
8. Journal Questions to Track Success"""

    try:
        llm = create_trading_llm()
        response = llm.invoke(prompt)
        return response.content if hasattr(response, 'content') else str(response)
    except Exception as e:
        return f"Setup generation error: {str(e)}"



