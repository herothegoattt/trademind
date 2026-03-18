from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum

class ContentStatus(str, Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"

class PostBase(BaseModel):
    title: str
    content: str
    tags: Optional[str] = None
    symbol: Optional[str] = None
    anonymous: Optional[bool] = False

class PostCreate(PostBase):
    pass

class PostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[str] = None
    symbol: Optional[str] = None
    anonymous: Optional[bool] = None
    status: Optional[ContentStatus] = None
    moderation_reason: Optional[str] = None

class PostSchema(PostBase):
    id: int
    user_id: int
    status: ContentStatus
    moderation_reason: Optional[str]
    reviewed_by_admin_id: Optional[int]
    reviewed_at: Optional[datetime]
    flagged: bool
    created_at: datetime

    class Config:
        orm_mode = True

class ReviewBase(BaseModel):
    rating: int
    short_title: str
    text: str
    experience_level: Optional[str] = None
    anonymous: Optional[bool] = False

class ReviewCreate(ReviewBase):
    pass

class ReviewUpdate(BaseModel):
    rating: Optional[int] = None
    short_title: Optional[str] = None
    text: Optional[str] = None
    experience_level: Optional[str] = None
    anonymous: Optional[bool] = None
    status: Optional[ContentStatus] = None
    moderation_reason: Optional[str] = None

class ReviewSchema(ReviewBase):
    id: int
    user_id: int
    status: ContentStatus
    moderation_reason: Optional[str]
    reviewed_by_admin_id: Optional[int]
    reviewed_at: Optional[datetime]
    created_at: datetime

    class Config:
        orm_mode = True
