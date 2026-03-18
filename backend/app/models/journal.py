from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from app.db.base import Base
from sqlalchemy.sql import func

class Page(Base):
    __tablename__ = "pages"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    blocks = relationship("Block", back_populates="page", order_by="Block.order")

class Block(Base):
    __tablename__ = "blocks"
    id = Column(Integer, primary_key=True, index=True)
    page_id = Column(Integer, ForeignKey("pages.id"), nullable=False, index=True)
    order = Column(Integer, nullable=False, default=0, index=True)
    content = Column(JSON, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    page = relationship("Page", back_populates="blocks")