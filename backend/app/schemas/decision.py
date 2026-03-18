from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class DecisionCreate(BaseModel):
    type: str
    context: Optional[str] = None
    input: Optional[dict] = None
    intention: Optional[str] = None
    execution: Optional[str] = None
    emotion: Optional[str] = None
    result: Optional[str] = None

class DecisionOut(DecisionCreate):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        orm_mode = True

class InsightOut(BaseModel):
    id: int
    decision_id: int
    error_type: Optional[str]
    confidence: Optional[float]
    evidence: Optional[str]
    repetition: Optional[str]
    impact: Optional[str]
    corrective_rule: Optional[str]
    created_at: datetime

    class Config:
        orm_mode = True