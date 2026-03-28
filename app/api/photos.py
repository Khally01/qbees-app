import os
import uuid as uuid_mod
from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import select

from app.database import AsyncSession, get_db
from app.middleware.auth import get_current_user
from app.models.photo import Photo
from app.models.task import Task
from app.models.user import User
from app.schemas.photo import PhotoResponse, PresignedUrlRequest, PresignedUrlResponse
from app.utils.r2 import create_presigned_upload_url, generate_upload_key, get_photo_url
from app.config import get_settings

settings = get_settings()
router = APIRouter(prefix="/photos", tags=["photos"])

# Local photo storage directory
UPLOAD_DIR = Path("/tmp/qbees-photos")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def photo_url(r2_key: str) -> str:
    """Get photo URL — use R2 if configured, otherwise local server."""
    if settings.r2_account_id:
        return get_photo_url(r2_key)
    # Local: serve from our own endpoint
    return f"/api/v1/photos/file/{r2_key}"


@router.post("/upload")
async def upload_photo(
    task_id: str = Form(...),
    category: str = Form(None),
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload a photo directly (no presigned URL needed)."""
    task_uuid = UUID(task_id)

    # Verify task exists
    result = await db.execute(
        select(Task).where(Task.id == task_uuid, Task.tenant_id == user.tenant_id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    # Generate key and save file
    ext = (file.filename or "photo.jpg").rsplit(".", 1)[-1] if file.filename and "." in file.filename else "jpg"
    unique = uuid_mod.uuid4().hex[:12]
    r2_key = f"{user.tenant_id}/{task_uuid}/{unique}.{ext}"

    if settings.r2_account_id:
        # Upload to R2
        from app.utils.r2 import get_r2_client
        client = get_r2_client()
        contents = await file.read()
        client.put_object(
            Bucket=settings.r2_bucket_name,
            Key=r2_key,
            Body=contents,
            ContentType=file.content_type or "image/jpeg",
        )
    else:
        # Save locally
        local_path = UPLOAD_DIR / r2_key
        local_path.parent.mkdir(parents=True, exist_ok=True)
        contents = await file.read()
        local_path.write_bytes(contents)

    # Create DB record
    photo = Photo(
        tenant_id=user.tenant_id,
        task_id=task_uuid,
        user_id=user.id,
        r2_key=r2_key,
        category=category,
    )
    db.add(photo)
    await db.flush()
    await db.refresh(photo)

    return {
        "id": str(photo.id),
        "url": photo_url(r2_key),
        "uploaded_at": photo.uploaded_at.isoformat(),
    }


@router.get("/file/{tenant_id}/{task_id}/{filename}")
async def serve_local_photo(tenant_id: str, task_id: str, filename: str):
    """Serve locally stored photos (dev/no-R2 mode)."""
    r2_key = f"{tenant_id}/{task_id}/{filename}"
    local_path = UPLOAD_DIR / r2_key
    if not local_path.exists():
        raise HTTPException(status_code=404, detail="Photo not found")
    return FileResponse(local_path, media_type="image/jpeg")


@router.post("/upload-url", response_model=PresignedUrlResponse)
async def get_upload_url(
    body: PresignedUrlRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a presigned URL to upload a photo directly to R2."""
    result = await db.execute(
        select(Task).where(Task.id == body.task_id, Task.tenant_id == user.tenant_id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    r2_key = generate_upload_key(user.tenant_id, body.task_id, body.filename)
    upload_url = create_presigned_upload_url(r2_key)

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

    return PresignedUrlResponse(upload_url=upload_url, photo_id=photo.id, r2_key=r2_key)


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
            url=photo_url(p.r2_key),
            thumbnail_url=photo_url(p.thumbnail_key) if p.thumbnail_key else None,
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
