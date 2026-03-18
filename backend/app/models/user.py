from sqlalchemy import Column, Integer, String, DateTime, func, Boolean
from sqlalchemy.orm import relationship
from app.db.base import Base
from app.core.security import hash_password, verify_password

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)

    profiles = relationship("Profile", back_populates="user")
    accounts = relationship("Account", back_populates="user")
    trades = relationship("Trade", back_populates="user")
    def verify_password(self, password: str) -> bool:
        return verify_password(password, self.hashed_password)
