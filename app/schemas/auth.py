"""Auth schemas: tokens, user, login, register."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: str  # user id
    exp: datetime
    type: str = "access"


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")
    name: Optional[str] = Field(None, description="User full name")


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    verified: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class GoogleToken(BaseModel):
    id_token: str

