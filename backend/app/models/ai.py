from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from app.db.base import Base
from sqlalchemy.sql import func

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    role = Column(String)
    text = Column(Text)
    ts = Column(DateTime, server_default=func.now())

class SearchResult(Base):
    __tablename__ = "search_results"
    id = Column(Integer, primary_key=True, index=True)
    page_id = Column(Integer, ForeignKey("pages.id"))
    block_id = Column(Integer, ForeignKey("blocks.id"))
    score = Column(Float)
    created_at = Column(DateTime, server_default=func.now())