from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AccountBase(BaseModel):
    name: str
    base_currency: str
    starting_balance: float
    current_balance: Optional[float] = None

class AccountCreate(AccountBase):
    pass

class AccountUpdate(BaseModel):
    name: Optional[str] = None
    base_currency: Optional[str] = None
    starting_balance: Optional[float] = None
    current_balance: Optional[float] = None

class AccountSchema(AccountBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        orm_mode = True
