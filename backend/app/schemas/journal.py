from pydantic import BaseModel
from datetime import datetime
from typing import List, Any

class BlockSchema(BaseModel):
    id: int
    page_id: int
    order: int
    content: Any
    created_at: datetime

    class Config:
        orm_mode = True

class PageSchema(BaseModel):
    id: int
    user_id: int
    title: str
    created_at: datetime
    blocks: List[BlockSchema] = []

    class Config:
        orm_mode = True

class PageCreate(BaseModel):
    title: str

class BlockCreate(BaseModel):
    page_id: int
    order: int
    content: Any