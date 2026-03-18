from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.auth import RegisterSchema, LoginSchema, TokenSchema
from app.models.user import User
from app.core.security import hash_password, create_access_token, create_refresh_token
from app.api.deps import get_db_dependency

router = APIRouter()

@router.post("/register", response_model=TokenSchema)
async def register(data: RegisterSchema, db: AsyncSession = Depends(get_db_dependency)):
    user = User(email=data.email, hashed_password=hash_password(data.password), name=data.name)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    access = create_access_token({"sub": user.id})
    refresh = create_refresh_token({"sub": user.id})
    return {"access_token": access, "refresh_token": refresh}

@router.post("/login", response_model=TokenSchema)
async def login(data: LoginSchema, db: AsyncSession = Depends(get_db_dependency)):
    q = await db.execute(User.select().where(User.email == data.email))
    user = q.scalar_one_or_none()
    if not user or not user.verify_password(data.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    access = create_access_token({"sub": user.id})
    refresh = create_refresh_token({"sub": user.id})
    return {"access_token": access, "refresh_token": refresh}

@router.post("/refresh")
async def refresh(token: str):
    payload = decode_token(token)
    user_id = payload.get("sub")
    access = create_access_token({"sub": user_id})
    return {"access_token": access}