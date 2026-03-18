"""Daily bias endpoint."""

from datetime import date
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.database import get_db
from app.api.deps import get_current_user, get_current_user_optional
from app.models import User
from app import crud

router = APIRouter(prefix="/api/v1", tags=["daily-bias"])


class DailyBiasResponse(BaseModel):
    id: int
    date: str
    brief: str
    warning_zones: List[str] | None
    sentiment: str

    class Config:
        from_attributes = True


@router.get("/daily-bias", response_model=DailyBiasResponse)
def get_daily_bias(
    d: date | None = None,
    db=Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DailyBiasResponse:
    """Get daily bias for a date (default today). Generates mock if missing."""
    date_str = (d or date.today()).isoformat()
    bias = crud.get_daily_bias_by_date(db, date_str)
    if not bias:
        from app.services.daily_bias import generate_daily_bias
        bias = generate_daily_bias(db, date_str)
    return DailyBiasResponse.model_validate(bias)


@router.get("/daily-bias/list", response_model=List[DailyBiasResponse])
def list_daily_bias(
    limit: int = 7,
    db=Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[DailyBiasResponse]:
    """List latest daily bias entries."""
    items = crud.get_daily_bias_latest(db, limit=limit)
    return [DailyBiasResponse.model_validate(b) for b in items]
