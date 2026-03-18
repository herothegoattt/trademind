from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from sqlalchemy import select

from app.schemas.community import PostCreate, PostUpdate, PostSchema, ReviewCreate, ReviewSchema
from app.models.community import CommunityPost, CommunityReview
from app.api.deps import get_db_dependency, get_current_user

router = APIRouter()

# posts
@router.post("/posts", response_model=PostSchema)
async def create_post(data: PostCreate, db: AsyncSession = Depends(get_db_dependency), current_user=Depends(get_current_user)):
    post = CommunityPost(user_id=current_user.id, **data.dict())
    db.add(post)
    await db.commit()
    await db.refresh(post)
    return post

@router.get("/posts", response_model=List[PostSchema])
async def list_posts(db: AsyncSession = Depends(get_db_dependency)):
    q = select(CommunityPost).where(CommunityPost.status == "approved")
    result = await db.execute(q)
    return result.scalars().all()

@router.get("/posts/{post_id}", response_model=PostSchema)
async def get_post(post_id: int, db: AsyncSession = Depends(get_db_dependency), current_user=Depends(get_current_user)):
    post = await db.get(CommunityPost, post_id)
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    if post.status != "approved" and post.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)
    return post

@router.put("/posts/{post_id}", response_model=PostSchema)
async def update_post(post_id: int, data: PostUpdate, db: AsyncSession = Depends(get_db_dependency), current_user=Depends(get_current_user)):
    post = await db.get(CommunityPost, post_id)
    if not post or post.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    for k,v in data.dict(exclude_unset=True).items():
        setattr(post, k, v)
    await db.commit()
    await db.refresh(post)
    return post

@router.delete("/posts/{post_id}")
async def delete_post(post_id: int, db: AsyncSession = Depends(get_db_dependency), current_user=Depends(get_current_user)):
    post = await db.get(CommunityPost, post_id)
    if not post or post.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    await db.delete(post)
    await db.commit()
    return {"ok": True}

# reviews
@router.post("/reviews", response_model=ReviewSchema)
async def create_review(data: ReviewCreate, db: AsyncSession = Depends(get_db_dependency), current_user=Depends(get_current_user)):
    review = CommunityReview(user_id=current_user.id, **data.dict())
    db.add(review)
    await db.commit()
    await db.refresh(review)
    return review

@router.get("/reviews", response_model=List[ReviewSchema])
async def list_reviews(db: AsyncSession = Depends(get_db_dependency)):
    q = select(CommunityReview).where(CommunityReview.status == "approved")
    result = await db.execute(q)
    return result.scalars().all()
