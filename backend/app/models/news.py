from sqlalchemy import Column, Integer, String, DateTime, Float, Text
from app.db.base import Base
from sqlalchemy.sql import func

class NewsEvent(Base):
    __tablename__ = "news_events"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    currency = Column(String, index=True)
    impact = Column(String)
    event_time = Column(DateTime, index=True)
    actual = Column(String)
    forecast = Column(String)
    previous = Column(String)
    created_at = Column(DateTime, server_default=func.now())