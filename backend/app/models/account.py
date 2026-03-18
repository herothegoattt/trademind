from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Numeric
from sqlalchemy.orm import relationship
from app.db.base import Base
from sqlalchemy.sql import func

class Account(Base):
    __tablename__ = "accounts"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    base_currency = Column(String(10), nullable=False)
    starting_balance = Column(Numeric(18, 4), nullable=False)
    current_balance = Column(Numeric(18, 4))
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="accounts")
    trades = relationship("Trade", back_populates="account")
