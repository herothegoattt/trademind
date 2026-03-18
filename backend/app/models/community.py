from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Enum, Text
from sqlalchemy.orm import relationship
from app.db.base import Base
from sqlalchemy.sql import func
import enum

class ContentStatus(enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"

class CommunityPost(Base):
    __tablename__ = "community_posts"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    tags = Column(String)  # comma-separated
    symbol = Column(String(20))
    anonymous = Column(Boolean, default=False)
    status = Column(Enum(ContentStatus), default=ContentStatus.pending)
    moderation_reason = Column(String)
    reviewed_by_admin_id = Column(Integer, ForeignKey("users.id"))
    reviewed_at = Column(DateTime)
    flagged = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", foreign_keys=[user_id])
    reviews = relationship("PostComment", back_populates="post")
    likes = relationship("PostLike", back_populates="post")

class CommunityReview(Base):
    __tablename__ = "community_reviews"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    rating = Column(Integer, nullable=False)
    short_title = Column(String, nullable=False)
    text = Column(Text, nullable=False)
    experience_level = Column(String)
    anonymous = Column(Boolean, default=False)
    status = Column(Enum(ContentStatus), default=ContentStatus.pending)
    moderation_reason = Column(String)
    reviewed_by_admin_id = Column(Integer, ForeignKey("users.id"))
    reviewed_at = Column(DateTime)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", foreign_keys=[user_id])

class PostLike(Base):
    __tablename__ = "post_likes"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    post_id = Column(Integer, ForeignKey("community_posts.id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    post = relationship("CommunityPost", back_populates="likes")

class PostComment(Base):
    __tablename__ = "post_comments"
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("community_posts.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    anonymous = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())

    post = relationship("CommunityPost", back_populates="reviews")
    user = relationship("User")
