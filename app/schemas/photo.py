from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class PresignedUrlRequest(BaseModel):
    task_id: UUID
    filename: str
    category: str | None = None  # before, after, issue, checklist
    checklist_item: str | None = None


class PresignedUrlResponse(BaseModel):
    upload_url: str
    photo_id: UUID
    r2_key: str


class PhotoResponse(BaseModel):
    id: UUID
    task_id: UUID
    user_id: UUID
    category: str | None
    checklist_item: str | None
    caption: str | None
    url: str  # public or presigned read URL
    thumbnail_url: str | None
    uploaded_at: datetime

    model_config = {"from_attributes": True}
