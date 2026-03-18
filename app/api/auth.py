"""Auth routes: register, login, me, logout, Google sign-in."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas.auth import Token, UserCreate, UserLogin, UserResponse, GoogleToken
from app.core.security import hash_password, verify_password, create_access_token
from app.api.deps import get_current_user
from app.services.google_auth import verify_google_id_token

router = APIRouter(prefix="/api/v1", tags=["auth"])


@router.post("/auth/register", response_model=UserResponse)
def register(
    data: UserCreate,
    db: Session = Depends(get_db),
) -> User:
    """Register a new user (email + password)."""
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        name=data.name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        avatar_url=user.avatar_url,
        verified=user.is_active,
        created_at=user.created_at,
    )


@router.post("/auth/login", response_model=Token)
def login(
    data: UserLogin,
    db: Session = Depends(get_db),
) -> Token:
    """Login with email and password. Returns JWT."""
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not user.hashed_password or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User inactive")
    return Token(access_token=create_access_token(str(user.id)))


@router.get("/auth/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)) -> User:
    """Return current authenticated user."""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        avatar_url=current_user.avatar_url,
        verified=current_user.is_active,
        created_at=current_user.created_at,
    )


@router.get("/user/profile")
def user_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Return current user profile with stats."""
    from app import crud
    
    # Get user's decision stats
    decisions = crud.get_decisions_by_user(db, current_user.id)
    
    # Calculate stats
    total_decisions = len(decisions) if decisions else 0
    
    # Calculate accuracy (assuming 'outcome' field exists)
    if decisions:
        won = sum(1 for d in decisions if hasattr(d, 'outcome') and d.outcome == 'won')
        accuracy_rate = won / total_decisions if total_decisions > 0 else 0
    else:
        accuracy_rate = 0.0
    
    # Get favorite markets from decisions (example)
    favorite_markets = []
    if decisions:
        market_counts = {}
        for d in decisions:
            market = getattr(d, 'market', 'N/A')
            if market:
                market_counts[market] = market_counts.get(market, 0) + 1
        favorite_markets = sorted(market_counts.items(), key=lambda x: x[1], reverse=True)[:3]
        favorite_markets = [market for market, count in favorite_markets]
    
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name or "Trader",
        "avatar_url": getattr(current_user, 'avatar_url', None),
        "verified": current_user.is_active,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
        "stats": {
            "decisions_count": total_decisions,
            "accuracy_rate": round(accuracy_rate, 2),
            "favorite_markets": favorite_markets,
        }
    }


@router.post("/auth/logout")
def logout():
    """Logout: client should discard the token. No server-side blacklist in MVP."""
    return {"message": "Logged out"}


@router.post("/auth/google", response_model=Token)
async def google_login(
    data: GoogleToken,
    db: Session = Depends(get_db),
) -> Token:
    """Sign in with Google id_token. Creates user if first time."""
    payload = await verify_google_id_token(data.id_token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google id_token",
        )
    google_id = payload.get("sub")
    email = payload.get("email")
    name = payload.get("name")
    if not google_id or not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing sub or email in token",
        )
    user = db.query(User).filter(User.google_id == google_id).first()
    if not user:
        user = db.query(User).filter(User.email == email).first()
        if user:
            user.google_id = google_id
            if name and not user.name:
                user.name = name
            db.commit()
            db.refresh(user)
        else:
            user = User(email=email, google_id=google_id, name=name)
            db.add(user)
            db.commit()
            db.refresh(user)
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User inactive")
    return Token(access_token=create_access_token(str(user.id)))
