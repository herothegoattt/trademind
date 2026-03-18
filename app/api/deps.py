"""FastAPI dependencies: db, current user."""

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.core.security import decode_access_token

security = HTTPBearer(auto_error=False)


def get_current_user_optional(
    db: Annotated[Session, Depends(get_db)],
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
) -> User | None:
    if not credentials:
        return None
    payload = decode_access_token(credentials.credentials)
    if not payload or payload.get("type") != "access":
        return None
    sub = payload.get("sub")
    if not sub:
        return None
    try:
        user_id = int(sub)
    except ValueError:
        return None
    user = db.query(User).filter(User.id == user_id, User.is_active.is_(True)).first()
    return user


def get_current_user(
    current_user: Annotated[User | None, Depends(get_current_user_optional)],
) -> User:
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return current_user


def get_current_user_forbidden(
    current_user: Annotated[User | None, Depends(get_current_user_optional)],
) -> User:
    """Dependency that raises 403 Forbidden when no user is present.

    Use this for endpoints where tests expect Forbidden instead of Unauthorized.
    """
    if current_user is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    return current_user
