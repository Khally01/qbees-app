from datetime import date, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import select, func, or_

from app.database import AsyncSession, get_db
from app.middleware.auth import require_admin
from app.models.task import Task, TaskAssignment
from app.models.user import User

router = APIRouter(prefix="/admin", tags=["admin"])


class UserCreate(BaseModel):
    name: str
    phone: str | None = None
    email: str | None = None
    role: str = "cleaner"
    language: str = "en"
    nickname: str | None = None
    address: str | None = None
    suburb: str | None = None
    transport: str | None = None
    skills: list[str] | None = None
    regions: list[str] | None = None
    notes: str | None = None
    start_date: date | None = None


class UserResponse(BaseModel):
    id: UUID
    name: str
    phone: str | None
    email: str | None
    role: str
    language: str
    is_active: bool
    nickname: str | None = None
    address: str | None = None
    suburb: str | None = None
    transport: str | None = None
    skills: list[str] | None = None
    regions: list[str] | None = None
    notes: str | None = None
    start_date: date | None = None
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    email: str | None = None
    role: str | None = None
    language: str | None = None
    is_active: bool | None = None
    nickname: str | None = None
    address: str | None = None
    suburb: str | None = None
    transport: str | None = None
    skills: list[str] | None = None
    regions: list[str] | None = None
    notes: str | None = None
    start_date: date | None = None


@router.get("/users", response_model=list[UserResponse])
async def list_users(
    role: str | None = None,
    search: str | None = None,
    active_only: bool = False,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    query = select(User).where(User.tenant_id == admin.tenant_id)
    if role:
        query = query.where(User.role == role)
    if active_only:
        query = query.where(User.is_active == True)
    if search:
        query = query.where(
            or_(
                User.name.ilike(f"%{search}%"),
                User.phone.ilike(f"%{search}%"),
                User.nickname.ilike(f"%{search}%"),
                User.suburb.ilike(f"%{search}%"),
            )
        )
    query = query.order_by(User.name)

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: UUID,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User).where(User.id == user_id, User.tenant_id == admin.tenant_id)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.get("/users/{user_id}/stats")
async def get_user_stats(
    user_id: UUID,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Get cleaner performance stats."""
    # Verify user exists
    result = await db.execute(
        select(User).where(User.id == user_id, User.tenant_id == admin.tenant_id)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Total jobs assigned (all time)
    total_result = await db.execute(
        select(func.count()).select_from(TaskAssignment).where(TaskAssignment.user_id == user_id)
    )
    total_jobs = total_result.scalar() or 0

    # Completed jobs
    completed_result = await db.execute(
        select(func.count())
        .select_from(TaskAssignment)
        .join(Task, TaskAssignment.task_id == Task.id)
        .where(TaskAssignment.user_id == user_id, Task.status == "completed")
    )
    completed_jobs = completed_result.scalar() or 0

    # This month
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    month_result = await db.execute(
        select(func.count())
        .select_from(TaskAssignment)
        .join(Task, TaskAssignment.task_id == Task.id)
        .where(
            TaskAssignment.user_id == user_id,
            Task.scheduled_date >= month_start.date(),
        )
    )
    this_month = month_result.scalar() or 0

    # Recent tasks (last 15)
    recent_result = await db.execute(
        select(Task)
        .join(TaskAssignment, TaskAssignment.task_id == Task.id)
        .where(TaskAssignment.user_id == user_id)
        .order_by(Task.scheduled_date.desc())
        .limit(15)
    )
    recent_tasks = recent_result.scalars().all()

    return {
        "user": UserResponse.model_validate(user),
        "stats": {
            "total_jobs": total_jobs,
            "completed_jobs": completed_jobs,
            "completion_rate": round(completed_jobs / total_jobs * 100, 1) if total_jobs > 0 else 0,
            "this_month": this_month,
        },
        "recent_tasks": [
            {
                "id": str(t.id),
                "name": t.name,
                "status": t.status,
                "scheduled_date": str(t.scheduled_date),
                "completed_at": t.completed_at.isoformat() if t.completed_at else None,
            }
            for t in recent_tasks
        ],
    }


@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    body: UserCreate,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    user = User(
        tenant_id=admin.tenant_id,
        **body.model_dump(),
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user


@router.patch("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: UUID,
    body: UserUpdate,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User).where(User.id == user_id, User.tenant_id == admin.tenant_id)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(user, field, value)

    await db.flush()
    await db.refresh(user)
    return user
