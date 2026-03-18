# app/services/action_logger.py
"""User action logging service."""

from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from fastapi import Request
from app.crud import log_user_action


class ActionLogger:
    """Helper class to log user actions with request context."""
    
    @staticmethod
    def get_client_ip(request: Request) -> str:
        """Extract client IP from request."""
        if request.headers.get("x-forwarded-for"):
            return request.headers.get("x-forwarded-for").split(",")[0].strip()
        return request.client.host if request.client else "unknown"
    
    @staticmethod
    def log_action(
        db: Session,
        user_id: int,
        action_type: str,
        request: Request,
        resource_type: Optional[str] = None,
        resource_id: Optional[int] = None,
        description: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        status: str = "success",
        error_message: Optional[str] = None,
    ):
        """Log a user action with request context."""
        return log_user_action(
            db=db,
            user_id=user_id,
            action_type=action_type,
            resource_type=resource_type,
            resource_id=resource_id,
            description=description,
            metadata=metadata or {},
            ip_address=ActionLogger.get_client_ip(request),
            user_agent=request.headers.get("user-agent", "unknown"),
            status=status,
            error_message=error_message,
        )
    
    @staticmethod
    async def log_action_async(
        db: Session,
        user_id: int,
        action_type: str,
        request: Request,
        resource_type: Optional[str] = None,
        resource_id: Optional[int] = None,
        description: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        status: str = "success",
        error_message: Optional[str] = None,
    ):
        """Async version of log_action (for future use with async DB)."""
        return ActionLogger.log_action(
            db=db,
            user_id=user_id,
            action_type=action_type,
            request=request,
            resource_type=resource_type,
            resource_id=resource_id,
            description=description,
            metadata=metadata,
            status=status,
            error_message=error_message,
        )
