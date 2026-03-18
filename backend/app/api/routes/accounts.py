from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.schemas.account import AccountCreate, AccountUpdate, AccountSchema
from app.models.account import Account
from app.api.deps import get_db_dependency, get_current_user

router = APIRouter()

@router.post("/", response_model=AccountSchema)
async def create_account(data: AccountCreate, db: AsyncSession = Depends(get_db_dependency), current_user=Depends(get_current_user)):
    account = Account(user_id=current_user.id, **data.dict())
    db.add(account)
    await db.commit()
    await db.refresh(account)
    return account

@router.get("/", response_model=List[AccountSchema])
async def list_accounts(db: AsyncSession = Depends(get_db_dependency), current_user=Depends(get_current_user)):
    result = await db.execute(Account.select().where(Account.user_id == current_user.id))
    return result.scalars().all()

@router.get("/{account_id}", response_model=AccountSchema)
async def get_account(account_id: int, db: AsyncSession = Depends(get_db_dependency), current_user=Depends(get_current_user)):
    account = await db.get(Account, account_id)
    if not account or account.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    return account

@router.put("/{account_id}", response_model=AccountSchema)
async def update_account(account_id: int, data: AccountUpdate, db: AsyncSession = Depends(get_db_dependency), current_user=Depends(get_current_user)):
    account = await db.get(Account, account_id)
    if not account or account.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    for k,v in data.dict(exclude_unset=True).items():
        setattr(account, k, v)
    await db.commit()
    await db.refresh(account)
    return account

@router.delete("/{account_id}")
async def delete_account(account_id: int, db: AsyncSession = Depends(get_db_dependency), current_user=Depends(get_current_user)):
    account = await db.get(Account, account_id)
    if not account or account.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    await db.delete(account)
    await db.commit()
    return {"ok": True}
