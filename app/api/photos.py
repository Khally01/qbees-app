from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select

from app.database import AsyncSession, get_db
from app.middleware.auth import get_current_user
from app.models.photo import Photo
from app.models.task import Task
from app.models.user import User
from app.schemas.photo import PhotoResponse, PresignedUrlRequest, PresignedUrlResponse
from app.utils.r2 import create_presigned_upload_url, generate_upload_key, get_photo_url

router = APIRouter(prefix="/photos", tags=["photos"])


@router.post("/upload-url", response_model=PresignedUrlResponse)
async def get_upload_url(
    body: PresignedUrlRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a presigned URL to upload a photo directly to R2."""
    # Verify task exists and belongs to tenant
    result = await db.execute(
        select(Task).where(Task.id == body.task_id, Task.tenant_id == user.tenant_id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    # Generate R2 key and presigned URL
    r2_key = generate_upload_key(user.tenant_id, body.task_id, body.filename)
    upload_url = create_presigned_upload_url(r2_key)

    # Create photo record (will be confirmed after upload)
    photo = Photo(
        tenant_id=user.tenant_id,
        task_id=body.task_id,
        user_id=user.id,
        r2_key=r2_key,
        category=body.category,
        checklist_item=body.checklist_item,
    )
    db.add(photo)
    await db.flush()

    return PresignedUrlResponse(
        upload_url=upload_url,
        photo_id=photo.id,
        r2_key=r2_key,
    )


@router.get("/task/{task_id}", response_model=list[PhotoResponse])
async def list_task_photos(
    task_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all photos for a task."""
    result = await db.execute(
        select(Photo)
        .join(Task)
        .where(Photo.task_id == task_id, Task.tenant_id == user.tenant_id)
        .order_by(Photo.uploaded_at)
    )
    photos = result.scalars().all()

    return [
        PhotoResponse(
            id=p.id,
            task_id=p.task_id,
            user_id=p.user_id,
            category=p.category,
            checklist_item=p.checklist_item,
            caption=p.caption,
            url=get_photo_url(p.r2_key),
            thumbnail_url=get_photo_url(p.thumbnail_key) if p.thumbnail_key else None,
            uploaded_at=p.uploaded_at,
        )
        for p in photos
    ]


@router.delete("/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_photo(
    photo_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Photo).where(Photo.id == photo_id, Photo.user_id == user.id)
    )
    photo = result.scalar_one_or_none()
    if not photo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Photo not found")

    await db.delete(photo)
