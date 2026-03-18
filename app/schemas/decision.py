"""
Pydantic schemas for Decision and Insight models.

TradeMind analyzes losing trades and decisions by technical and psychological
patterns to help traders and decision-makers understand their mistakes.
"""

from datetime import datetime
from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field


class TradeData(BaseModel):
    """Trading-specific data."""
    entry_price: Optional[float] = None
    exit_price: Optional[float] = None
    position_size: Optional[float] = None
    emotions: Optional[List[str]] = None
    strategy: Optional[str] = None


class InvestmentData(BaseModel):
    """Investment-specific data."""
    entry_point: Optional[str] = None
    exit_point: Optional[str] = None
    biases: Optional[List[str]] = None


class BusinessData(BaseModel):
    """Business-specific data."""
    stress_level: Optional[str] = None
    decision_type: Optional[str] = None


class PersonalData(BaseModel):
    """Personal decision-specific data."""
    decision_type: Optional[str] = None
    context: Optional[str] = None


class DecisionCreate(BaseModel):
    """
    Schema for creating a new decision.
    """
    mode: Literal["trading", "investing", "business", "personal"] = Field(
        ...,
        description="Decision mode: trading, investing, business, or personal"
    )
    title: str = Field(..., description="Brief title or summary of the decision/trade")
    description: str = Field(..., description="Detailed description of the decision")
    outcome: Optional[str] = Field(None, description="The actual outcome (loss, gain, result)")
    is_loss: bool = Field(False, description="Whether this was a losing trade/decision")
    
    # Mode-specific fields
    trade_data: Optional[TradeData] = None
    investment_data: Optional[InvestmentData] = None
    business_data: Optional[BusinessData] = None
    personal_data: Optional[PersonalData] = None


class Decision(BaseModel):
    """
    Represents a past decision or trade that needs to be analyzed.
    
    This is the core entity of TradeMind - a decision that was made
    in the past and requires post-mortem analysis to identify patterns
    and prevent repeating mistakes.
    """
    id: Optional[int] = Field(None, description="Unique identifier for the decision")
    mode: Literal["trading", "investing", "business", "personal"] = Field(
        ...,
        description="Decision mode: trading, investing, business, or personal"
    )
    title: str = Field(..., description="Brief title or summary of the decision/trade")
    description: Optional[str] = Field(None, description="Detailed description of the decision")
    outcome: Optional[str] = Field(None, description="The actual outcome (loss, gain, result)")
    is_loss: bool = Field(False, description="Whether this was a losing trade/decision")
    
    # Mode-specific fields stored as JSON in DB
    trade_data: Optional[Dict[str, Any]] = None
    investment_data: Optional[Dict[str, Any]] = None
    business_data: Optional[Dict[str, Any]] = None
    personal_data: Optional[Dict[str, Any]] = None
    
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class Insight(BaseModel):
    """
    Represents AI-generated insights from analyzing a decision.
    
    This object contains the post-mortem analysis results including
    technical patterns, psychological patterns, and actionable recommendations
    to prevent repeating mistakes.
    """
    decision_id: Optional[int] = Field(None, description="ID of the analyzed decision")
    mode: str = Field(..., description="Mode of the analyzed decision")
    
    # Core insights
    key_insights: List[str] = Field(
        default_factory=list,
        description="Main insights from the analysis"
    )
    
    # Pattern analysis
    technical_patterns: List[str] = Field(
        default_factory=list,
        description="Identified technical patterns (entry/exit mistakes, risk management, etc.)"
    )
    psychological_patterns: List[str] = Field(
        default_factory=list,
        description="Identified psychological patterns (emotions, biases, stress responses)"
    )
    
    # Detailed analysis
    mistakes: List[str] = Field(
        default_factory=list,
        description="Specific mistakes identified in the decision"
    )
    strengths: List[str] = Field(
        default_factory=list,
        description="What was done correctly (if any)"
    )
    
    # Actionable recommendations
    recommendations: List[str] = Field(
        default_factory=list,
        description="Actionable recommendations to prevent repeating mistakes"
    )
    prevention_strategies: List[str] = Field(
        default_factory=list,
        description="Specific strategies to prevent similar mistakes in the future"
    )
    
    # Scoring
    decision_quality_score: Optional[float] = Field(
        None,
        ge=0.0,
        le=1.0,
        description="Overall decision quality score (0-1)"
    )
    risk_score: Optional[float] = Field(
        None,
        ge=0.0,
        le=1.0,
        description="Risk assessment score (0-1, higher = riskier)"
    )
    
    analysis_timestamp: datetime = Field(
        default_factory=datetime.now,
        description="When the analysis was performed"
    )
    
    class Config:
        from_attributes = True

