"""
Analysis service for processing decisions and generating insights.

This service contains the business logic for analyzing decisions
across different modes (trading, investing, business, personal).
"""

from datetime import datetime
from typing import Dict, List
from app.schemas.decision import Decision, Insight


class AnalysisService:
    """Service for analyzing decisions and generating insights."""
    
    @staticmethod
    def analyze_decision(decision: Decision) -> Insight:
        """
        Analyze a decision and generate insights based on its mode.
        
        Args:
            decision: The Decision object to analyze
            
        Returns:
            Insight: Generated insights with technical/psychological patterns
        """
        # Route to mode-specific analysis
        if decision.mode == "trading":
            return AnalysisService._analyze_trading(decision)
        elif decision.mode == "investing":
            return AnalysisService._analyze_investing(decision)
        elif decision.mode == "business":
            return AnalysisService._analyze_business(decision)
        else:  # personal
            return AnalysisService._analyze_personal(decision)
    
    @staticmethod
    def _analyze_trading(decision: Decision) -> Insight:
        """Analyze trading decisions."""
        technical_patterns = [
            "Entry timing may have been influenced by emotions",
            "Risk management parameters not followed"
        ] if decision.is_loss else [
            "Entry/exit executed according to plan"
        ]
        
        psychological_patterns = []
        if decision.trade_data:
            emotions = decision.trade_data.get("emotions", []) if isinstance(decision.trade_data, dict) else getattr(decision.trade_data, "emotions", None) or []
            if emotions and ("fear" in emotions or "fomo" in emotions):
                psychological_patterns.append("Emotional trading detected (fear/FOMO)")
        
        mistakes = [
            "Entered position without proper risk assessment",
            "Did not follow stop-loss discipline"
        ] if decision.is_loss else []
        
        recommendations = [
            "Stick to predefined risk management rules",
            "Avoid trading during high emotional states",
            "Review and backtest strategy before live trading"
        ]
        
        prevention_strategies = [
            "Set automated stop-loss orders",
            "Use trading journal to track emotional states",
            "Implement cooling-off period after losses"
        ]
        
        return AnalysisService._build_insight(
            decision=decision,
            technical_patterns=technical_patterns,
            psychological_patterns=psychological_patterns,
            mistakes=mistakes,
            recommendations=recommendations,
            prevention_strategies=prevention_strategies
        )
    
    @staticmethod
    def _analyze_investing(decision: Decision) -> Insight:
        """Analyze investment decisions."""
        technical_patterns = [
            "Entry/exit timing analysis",
            "Risk reassessment patterns"
        ]
        
        psychological_patterns = []
        if decision.investment_data:
            biases = decision.investment_data.get("biases", []) if isinstance(decision.investment_data, dict) else getattr(decision.investment_data, "biases", None) or []
            if biases:
                if "overconfidence" in biases:
                    psychological_patterns.append("Overconfidence bias detected")
                if "confirmation_bias" in biases:
                    psychological_patterns.append("Confirmation bias detected")
        
        mistakes = [
            "Did not reassess risk after market changes"
        ] if decision.is_loss else []
        
        recommendations = [
            "Regular portfolio rebalancing",
            "Diversification review",
            "Bias awareness training"
        ]
        
        prevention_strategies = [
            "Set quarterly review schedule",
            "Use contrarian analysis to counter biases"
        ]
        
        return AnalysisService._build_insight(
            decision=decision,
            technical_patterns=technical_patterns,
            psychological_patterns=psychological_patterns,
            mistakes=mistakes,
            recommendations=recommendations,
            prevention_strategies=prevention_strategies
        )
    
    @staticmethod
    def _analyze_business(decision: Decision) -> Insight:
        """Analyze business decisions."""
        technical_patterns = [
            "Decision-making process analysis",
            "Stress impact assessment"
        ]
        
        psychological_patterns = []
        if decision.business_data:
            stress_level = decision.business_data.get("stress_level", None) if isinstance(decision.business_data, dict) else getattr(decision.business_data, "stress_level", None)
            if stress_level:
                psychological_patterns.append("High-stress decision making detected")
        
        mistakes = [
            "Decision made under pressure without proper analysis"
        ] if decision.is_loss else []
        
        recommendations = [
            "Implement structured decision-making framework",
            "Create stress management protocols",
            "Document decision rationale for future reference"
        ]
        
        prevention_strategies = [
            "Delegate high-stress decisions when possible",
            "Use decision matrices for complex choices"
        ]
        
        return AnalysisService._build_insight(
            decision=decision,
            technical_patterns=technical_patterns,
            psychological_patterns=psychological_patterns,
            mistakes=mistakes,
            recommendations=recommendations,
            prevention_strategies=prevention_strategies
        )
    
    @staticmethod
    def _analyze_personal(decision: Decision) -> Insight:
        """Analyze personal decisions."""
        technical_patterns = [
            "Decision pattern analysis",
            "Habit formation assessment"
        ]
        
        psychological_patterns = [
            "Recurring error patterns identified"
        ] if decision.is_loss else []
        
        mistakes = [
            "Similar mistakes repeated from past decisions"
        ] if decision.is_loss else []
        
        recommendations = [
            "Break negative decision cycles",
            "Develop positive decision-making habits",
            "Seek external perspective on important choices"
        ]
        
        prevention_strategies = [
            "Create decision checklist",
            "Track decision outcomes over time"
        ]
        
        return AnalysisService._build_insight(
            decision=decision,
            technical_patterns=technical_patterns,
            psychological_patterns=psychological_patterns,
            mistakes=mistakes,
            recommendations=recommendations,
            prevention_strategies=prevention_strategies
        )
    
    @staticmethod
    def _build_insight(
        decision: Decision,
        technical_patterns: List[str],
        psychological_patterns: List[str],
        mistakes: List[str],
        recommendations: List[str],
        prevention_strategies: List[str]
    ) -> Insight:
        """Build Insight object from analysis results."""
        # Generate key insights
        key_insights = [
            f"Analyzed {decision.mode} decision: {decision.title}",
            "Post-mortem analysis completed"
        ]
        
        if decision.is_loss:
            key_insights.append("Loss pattern identified - actionable insights generated")
        
        # Calculate scores
        decision_quality_score = 0.3 if decision.is_loss else 0.7
        risk_score = 0.8 if decision.is_loss else 0.4
        
        return Insight(
            decision_id=decision.id,
            mode=decision.mode,
            key_insights=key_insights,
            technical_patterns=technical_patterns,
            psychological_patterns=psychological_patterns,
            mistakes=mistakes,
            strengths=[] if decision.is_loss else ["Decision was well-documented"],
            recommendations=recommendations,
            prevention_strategies=prevention_strategies,
            decision_quality_score=decision_quality_score,
            risk_score=risk_score,
            analysis_timestamp=datetime.now()
        )

