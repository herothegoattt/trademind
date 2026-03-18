from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from sqlalchemy import select

from app.models.community import CommunityPost, CommunityReview
from app.schemas.community import PostSchema, ReviewSchema, PostUpdate, ReviewUpdate
from app.api.deps import get_db_dependency, get_current_user

router = APIRouter()

from app.api.deps import get_current_admin

# admin dependency replaced by helper
async def require_admin(admin=Depends(get_current_admin)):
    return admin

@router.get("/moderation/posts", response_model=List[PostSchema])
async def list_pending_posts(db: AsyncSession = Depends(get_db_dependency), admin=Depends(require_admin)):
    q = select(CommunityPost).where(CommunityPost.status == "pending")
    result = await db.execute(q)
    return result.scalars().all()

@router.put("/moderation/posts/{post_id}", response_model=PostSchema)
async def review_post(post_id: int, data: PostUpdate, db: AsyncSession = Depends(get_db_dependency), admin=Depends(require_admin)):
    post = await db.get(CommunityPost, post_id)
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    for k,v in data.dict(exclude_unset=True).items():
        setattr(post, k, v)
    post.reviewed_by_admin_id = admin.id
    post.reviewed_at = func.now()
    await db.commit()
    await db.refresh(post)
    return post

@router.get("/moderation/reviews", response_model=List[ReviewSchema])
async def list_pending_reviews(db: AsyncSession = Depends(get_db_dependency), admin=Depends(require_admin)):
    q = select(CommunityReview).where(CommunityReview.status == "pending")
    result = await db.execute(q)
    return result.scalars().all()

@router.put("/moderation/reviews/{review_id}", response_model=ReviewSchema)
async def review_review(review_id: int, data: ReviewUpdate, db: AsyncSession = Depends(get_db_dependency), admin=Depends(require_admin)):
    rev = await db.get(CommunityReview, review_id)
    if not rev:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    for k,v in data.dict(exclude_unset=True).items():
        setattr(rev, k, v)
    rev.reviewed_by_admin_id = admin.id
    rev.reviewed_at = func.now()
    await db.commit()
    await db.refresh(rev)
    return rev
