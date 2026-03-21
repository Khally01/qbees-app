from datetime import datetime, date, time
from uuid import UUID

from pydantic import BaseModel


class TaskCreate(BaseModel):
    property_id: UUID
    name: str
    scheduled_date: date
    scheduled_time: time | None = None
    checklist_id: UUID | None = None
    notes: str | None = None
    assignee_ids: list[UUID] | None = None  # cleaners to assign


class TaskUpdate(BaseModel):
    name: str | None = None
    status: str | None = None
    scheduled_date: date | None = None
    scheduled_time: time | None = None
    notes: str | None = None


class AssignmentResponse(BaseModel):
    id: UUID
    user_id: UUID
    user_name: str | None = None
    status: str
    responded_at: datetime | None

    model_config = {"from_attributes": True}


class TaskResponse(BaseModel):
    id: UUID
    property_id: UUID
    property_name: str | None = None
    name: str
    status: str
    scheduled_date: date
    scheduled_time: time | None
    started_at: datetime | None
    completed_at: datetime | None
    notes: str | None
    report_url: str | None
    assignments: list[AssignmentResponse] = []
    photo_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TaskStatusUpdate(BaseModel):
    status: str  # in_progress, completed


class AssignmentStatusUpdate(BaseModel):
    status: str  # accepted, declined
