# app/schemas/user.py
"""User and UserAction schemas."""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Dict, Any


class UserCreate(BaseModel):
    """User registration data."""
    email: str = Field(..., description="User email")
    password: str = Field(..., min_length=6, description="User password")
    name: Optional[str] = Field(None, description="User full name")


class UserLogin(BaseModel):
    """User login data."""
    email: str = Field(..., description="User email")
    password: str = Field(..., description="User password")


class UserResponse(BaseModel):
    """User response (no password)."""
    id: int
    email: str
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    verified: bool = Field(alias="is_active")
    created_at: datetime

    class Config:
        from_attributes = True


class UserActionCreate(BaseModel):
    """Create user action log."""
    action_type: str = Field(..., description="Type of action (e.g., 'create_decision')")
    resource_type: Optional[str] = Field(None, description="Type of resource affected")
    resource_id: Optional[int] = Field(None, description="ID of resource affected")
    description: Optional[str] = Field(None, description="Action description")
    action_metadata: Optional[Dict[str, Any]] = Field(None, description="Additional action data")
    ip_address: Optional[str] = Field(None, description="IP address of request")
    user_agent: Optional[str] = Field(None, description="User agent string")
    status: str = Field(default="success", description="Status of action")
    error_message: Optional[str] = Field(None, description="Error message if failed")


class UserAction(BaseModel):
    """User action log response."""
    id: int
    user_id: int
    action_type: str
    resource_type: Optional[str]
    resource_id: Optional[int]
    description: Optional[str]
    metadata: Optional[Dict[str, Any]]
    ip_address: Optional[str]
    user_agent: Optional[str]
    status: str
    error_message: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class UserActionStats(BaseModel):
    """User action statistics."""
    total_actions: int
    actions_today: int
    actions_this_week: int
    recent_actions: list["UserAction"]
    action_breakdown: Dict[str, int]  # action_type -> count
