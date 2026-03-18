from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, JSON, Float
from sqlalchemy.orm import relationship
from app.db.base import Base
from sqlalchemy.sql import func

class Decision(Base):
    __tablename__ = "decisions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    type = Column(String, nullable=False)
    context = Column(String)
    input = Column(JSON)
    intention = Column(String)
    execution = Column(String)
    emotion = Column(String)
    result = Column(String)
    created_at = Column(DateTime, server_default=func.now())

    insights = relationship("Insight", back_populates="decision")

class Insight(Base):
    __tablename__ = "insights"
    id = Column(Integer, primary_key=True, index=True)
    decision_id = Column(Integer, ForeignKey("decisions.id"), nullable=False, index=True)
    error_type = Column(String)
    confidence = Column(Float)
    evidence = Column(String)
    repetition = Column(String)
    impact = Column(String)
    corrective_rule = Column(String)
    created_at = Column(DateTime, server_default=func.now())

    decision = relationship("Decision", back_populates="insights")