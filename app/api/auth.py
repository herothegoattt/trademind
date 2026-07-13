"""Auth routes: register, login, me, logout, Google sign-in."""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas.auth import Token, UserCreate, UserLogin, UserResponse, GoogleToken
from app.core.security import hash_password, verify_password, create_access_token
from app.api.deps import get_current_user
from app.services.google_auth import verify_google_id_token

router = APIRouter(prefix="/api/v1", tags=["auth"])


ADMIN_EMAIL = "rem.vafin.08@gmail.com"

def _user_response(user: User) -> UserResponse:
    plan = getattr(user, "plan", "core") or "core"
    if user.email.strip().lower() == ADMIN_EMAIL:
        plan = "apex"
    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        avatar_url=user.avatar_url,
        verified=user.is_active,
        created_at=user.created_at,
        plan=plan,
        plan_expires_at=None if user.email.strip().lower() == ADMIN_EMAIL else getattr(user, "plan_expires_at", None),
        ai_queries_this_month=getattr(user, "ai_queries_this_month", 0) or 0,
        is_onboarded=getattr(user, "is_onboarded", False) or False,
        preferred_market=getattr(user, "preferred_market", None),
    )


@router.post("/auth/register", response_model=UserResponse)
def register(
    data: UserCreate,
    db: Session = Depends(get_db),
) -> User:
    """Register a new user (email + password)."""
    email = data.email.strip().lower()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    user = User(
        email=email,
        hashed_password=hash_password(data.password),
        name=data.name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _user_response(user)


@router.post("/auth/login", response_model=Token)
def login(
    data: UserLogin,
    db: Session = Depends(get_db),
) -> Token:
    """Login with email and password. Returns JWT."""
    email = data.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    if not user or not user.hashed_password or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User inactive")
    return Token(access_token=create_access_token(str(user.id)))


@router.get("/auth/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)) -> UserResponse:
    """Return current authenticated user."""
    return _user_response(current_user)


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


@router.put("/auth/profile", response_model=UserResponse)
async def update_profile(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update profile fields: name, avatar_url."""
    body = await request.json()
    if "name" in body and isinstance(body["name"], str) and body["name"].strip():
        current_user.name = body["name"].strip()
    if "avatar_url" in body:
        current_user.avatar_url = body["avatar_url"] or None
    db.commit()
    db.refresh(current_user)
    return _user_response(current_user)


@router.post("/auth/onboarding", response_model=UserResponse)
async def onboarding(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark user as onboarded, optionally save preferred_market."""
    body = await request.json()
    current_user.is_onboarded = True
    if "preferred_market" in body and isinstance(body["preferred_market"], str) and body["preferred_market"].strip():
        current_user.preferred_market = body["preferred_market"].strip()
    db.commit()
    db.refresh(current_user)
    return _user_response(current_user)


@router.post("/auth/google-access")
async def google_login_access_token(
    request: Request,
    db: Session = Depends(get_db),
):
    """Sign in with Google access_token (from OAuth2 flow). Returns JWT + user."""
    import httpx
    body = await request.json()
    access_token = body.get("access_token")
    if not access_token:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing access_token")

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )

    if resp.status_code != 200:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Google token")

    info = resp.json()
    google_id = info.get("sub")
    email = (info.get("email") or "").strip().lower() or None
    name = info.get("name")
    picture = info.get("picture")

    if not google_id or not email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Incomplete Google profile")

    if info.get("email_verified") is False:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Google email not verified")

    user = db.query(User).filter(User.google_id == google_id).first()
    if not user:
        user = db.query(User).filter(User.email == email).first()
        if user:
            user.google_id = google_id
            if not user.avatar_url and picture:
                user.avatar_url = picture
            db.commit()
            db.refresh(user)
        else:
            user = User(email=email, google_id=google_id, name=name, avatar_url=picture)
            db.add(user)
            db.commit()
            db.refresh(user)

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User inactive")

    from app.core.security import create_access_token as _create_token
    jwt_token = _create_token(str(user.id))
    return {
        "access_token": jwt_token,
        "token_type": "bearer",
        "user": _user_response(user).model_dump(),
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
