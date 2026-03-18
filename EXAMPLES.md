# TradeMind AI - Примеры использования

## Примеры запросов для каждого режима

### 1. Trading Mode (Основной)

**Запрос:**
```bash
curl -X POST "http://localhost:8000/api/v1/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "trading",
    "title": "EUR/USD Long Position",
    "description": "Opened long position during news event without proper risk assessment",
    "is_loss": true,
    "outcome": "Lost 2% of account balance",
    "trade_data": {
      "entry_price": 1.0850,
      "exit_price": 1.0820,
      "position_size": 0.1,
      "stop_loss": null,
      "take_profit": 1.0900,
      "emotions": ["fear", "fomo"],
      "strategy": "breakout",
      "timeframe": "H1",
      "market_conditions": "high_volatility"
    },
    "context": {
      "market_session": "London",
      "news_event": true
    },
    "timestamp": "2024-01-15T10:30:00"
  }'
```

**Ответ:**
```json
{
  "decision_id": null,
  "mode": "trading",
  "key_insights": [
    "Analyzed trading decision: EUR/USD Long Position",
    "Post-mortem analysis completed",
    "Loss pattern identified - actionable insights generated"
  ],
  "technical_patterns": [
    "Entry timing may have been influenced by emotions",
    "Risk management parameters not followed"
  ],
  "psychological_patterns": [
    "Emotional trading detected (fear/FOMO)"
  ],
  "mistakes": [
    "Entered position without proper risk assessment",
    "Did not follow stop-loss discipline"
  ],
  "strengths": [],
  "recommendations": [
    "Stick to predefined risk management rules",
    "Avoid trading during high emotional states",
    "Review and backtest strategy before live trading"
  ],
  "prevention_strategies": [
    "Set automated stop-loss orders",
    "Use trading journal to track emotional states",
    "Implement cooling-off period after losses"
  ],
  "decision_quality_score": 0.3,
  "risk_score": 0.8,
  "analysis_timestamp": "2024-01-15T11:00:00"
}
```

### 2. Investing Mode

**Запрос:**
```bash
curl -X POST "http://localhost:8000/api/v1/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "investing",
    "title": "Tech Portfolio Allocation",
    "description": "Increased tech allocation to 60% based on recent gains",
    "is_loss": false,
    "outcome": "Portfolio down 15% after tech correction",
    "investment_data": {
      "entry_point": "2024-01-01",
      "allocation_percentage": 60,
      "previous_allocation": 30,
      "biases": ["overconfidence", "confirmation_bias"],
      "risk_reassessment": false,
      "diversification": "low"
    },
    "context": {
      "market_phase": "bull_market",
      "previous_performance": "strong"
    }
  }'
```

### 3. Business Mode

**Запрос:**
```bash
curl -X POST "http://localhost:8000/api/v1/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "business",
    "title": "Hiring Decision - CTO Position",
    "description": "Hired CTO candidate after only one interview due to urgent need",
    "is_loss": true,
    "outcome": "Candidate left after 3 months, project delayed",
    "business_data": {
      "decision_type": "hiring",
      "stress_level": "high",
      "time_pressure": true,
      "interviews_conducted": 1,
      "reference_checks": false
    },
    "context": {
      "company_stage": "startup",
      "urgency": "critical"
    }
  }'
```

### 4. Personal Mode

**Запрос:**
```bash
curl -X POST "http://localhost:8000/api/v1/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "personal",
    "title": "Career Change Decision",
    "description": "Switched jobs impulsively after conflict with manager",
    "is_loss": true,
    "outcome": "New job worse than previous, regret decision",
    "personal_data": {
      "decision_type": "career",
      "emotional_state": "angry",
      "previous_similar_decisions": 2,
      "consultation": false
    },
    "context": {
      "life_stage": "mid_career",
      "financial_situation": "stable"
    }
  }'
```

## Python примеры

### Использование с requests

```python
import requests
from datetime import datetime

# Trading decision example
decision = {
    "mode": "trading",
    "title": "GBP/USD Short",
    "description": "Short position during Brexit news",
    "is_loss": True,
    "outcome": "Lost 1.5%",
    "trade_data": {
        "entry_price": 1.2500,
        "exit_price": 1.2550,
        "position_size": 0.2,
        "emotions": ["fear"],
        "strategy": "news_trading"
    },
    "timestamp": datetime.now().isoformat()
}

response = requests.post(
    "http://localhost:8000/api/v1/analyze",
    json=decision
)

insight = response.json()
print(f"Decision Quality Score: {insight['decision_quality_score']}")
print(f"Risk Score: {insight['risk_score']}")
print("\nTechnical Patterns:")
for pattern in insight['technical_patterns']:
    print(f"  - {pattern}")
print("\nRecommendations:")
for rec in insight['recommendations']:
    print(f"  - {rec}")
```

### Использование с FastAPI клиентом

```python
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

# Test health endpoint
response = client.get("/api/v1/health")
print(response.json())

# Test analyze endpoint
decision = {
    "mode": "trading",
    "title": "Test Trade",
    "description": "Test description",
    "is_loss": True,
    "trade_data": {"emotions": ["fomo"]}
}

response = client.post("/api/v1/analyze", json=decision)
insight = response.json()
print(insight)
```

## Интеграция в приложение

### Базовая обертка

```python
class TradeMindClient:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.analyze_endpoint = f"{base_url}/api/v1/analyze"
    
    def analyze_trade(
        self,
        title: str,
        description: str,
        entry_price: float,
        exit_price: float,
        is_loss: bool,
        emotions: list = None
    ):
        """Analyze a trading decision."""
        decision = {
            "mode": "trading",
            "title": title,
            "description": description,
            "is_loss": is_loss,
            "trade_data": {
                "entry_price": entry_price,
                "exit_price": exit_price,
                "emotions": emotions or []
            }
        }
        
        response = requests.post(self.analyze_endpoint, json=decision)
        response.raise_for_status()
        return response.json()

# Usage
client = TradeMindClient()
insight = client.analyze_trade(
    title="EUR/USD Trade",
    description="Long position",
    entry_price=1.0850,
    exit_price=1.0820,
    is_loss=True,
    emotions=["fear", "fomo"]
)
```

