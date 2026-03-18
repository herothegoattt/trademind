from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import datetime
from sqlalchemy import select, func

from app.schemas.trade import TradeCreate, TradeUpdate, TradeSchema
from app.models.trade import Trade
from app.api.deps import get_db_dependency, get_current_user

router = APIRouter()

# CRUD
@router.post("/", response_model=TradeSchema)
async def create_trade(data: TradeCreate, db: AsyncSession = Depends(get_db_dependency), current_user=Depends(get_current_user)):
    trade = Trade(user_id=current_user.id, **data.dict())
    db.add(trade)
    await db.commit()
    await db.refresh(trade)
    return trade

@router.get("/", response_model=List[TradeSchema])
async def list_trades(
    account_id: Optional[int] = None,
    symbol: Optional[str] = None,
    asset_class: Optional[str] = None,
    outcome: Optional[str] = None,
    start: Optional[datetime] = Query(None),
    end: Optional[datetime] = Query(None),
    db: AsyncSession = Depends(get_db_dependency),
    current_user=Depends(get_current_user)
):
    q = select(Trade).where(Trade.user_id == current_user.id)
    if account_id:
        q = q.where(Trade.account_id == account_id)
    if symbol:
        q = q.where(Trade.symbol == symbol)
    if asset_class:
        q = q.where(Trade.asset_class == asset_class)
    if outcome:
        q = q.where(Trade.outcome == outcome)
    if start:
        q = q.where(Trade.entry_time >= start)
    if end:
        q = q.where(Trade.entry_time <= end)
    result = await db.execute(q.order_by(Trade.entry_time.desc()))
    return result.scalars().all()

@router.get("/{trade_id}", response_model=TradeSchema)
async def get_trade(trade_id: int, db: AsyncSession = Depends(get_db_dependency), current_user=Depends(get_current_user)):
    trade = await db.get(Trade, trade_id)
    if not trade or trade.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    return trade

@router.put("/{trade_id}", response_model=TradeSchema)
async def update_trade(trade_id: int, data: TradeUpdate, db: AsyncSession = Depends(get_db_dependency), current_user=Depends(get_current_user)):
    trade = await db.get(Trade, trade_id)
    if not trade or trade.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    for k,v in data.dict(exclude_unset=True).items():
        setattr(trade, k, v)
    await db.commit()
    await db.refresh(trade)
    return trade

@router.delete("/{trade_id}")
async def delete_trade(trade_id: int, db: AsyncSession = Depends(get_db_dependency), current_user=Depends(get_current_user)):
    trade = await db.get(Trade, trade_id)
    if not trade or trade.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    await db.delete(trade)
    await db.commit()
    return {"ok": True}

# Analytics
@router.get("/analytics/summary")
async def analytics_summary(
    account_id: Optional[int] = None,
    period: str = Query("month", regex="^(month|quarter|year)$"),
    start: Optional[datetime] = Query(None),
    end: Optional[datetime] = Query(None),
    db: AsyncSession = Depends(get_db_dependency),
    current_user=Depends(get_current_user)
):
    # simple return % = total pnl / starting balance
    q = select(Trade).where(Trade.user_id == current_user.id)
    if account_id:
        q = q.where(Trade.account_id == account_id)
    if start:
        q = q.where(Trade.entry_time >= start)
    if end:
        q = q.where(Trade.entry_time <= end)
    trades = (await db.execute(q)).scalars().all()
    total_pnl = 0
    start_bal = None
    for t in trades:
        if t.exit_price is not None:
            if t.direction == "long":
                pnl = (t.exit_price - t.entry_price) * t.position_size - (t.fees or 0)
            else:
                pnl = (t.entry_price - t.exit_price) * t.position_size - (t.fees or 0)
            total_pnl += pnl
            if start_bal is None or t.balance_before_trade < start_bal:
                start_bal = t.balance_before_trade
    if not start_bal:
        start_bal = 0
    return {"total_pnl": total_pnl, "simple_return_percent": (total_pnl / start_bal * 100) if start_bal else 0}
