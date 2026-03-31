from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select, func

from app.database import AsyncSession, get_db
from app.middleware.auth import get_current_user
from app.models.property import Property
from app.models.task import Task, TaskAssignment
from app.models.user import User

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats")
async def get_dashboard_stats(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Dashboard overview stats."""
    tenant_id = user.tenant_id
    today = date.today()
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0).date()

    # Active properties
    props_result = await db.execute(
        select(func.count()).where(Property.tenant_id == tenant_id, Property.status == "active")
    )
    active_properties = props_result.scalar() or 0

    # Active bees
    bees_result = await db.execute(
        select(func.count()).where(User.tenant_id == tenant_id, User.role == "cleaner", User.is_active == True)
    )
    active_bees = bees_result.scalar() or 0

    # Jobs today
    today_result = await db.execute(
        select(func.count()).where(Task.tenant_id == tenant_id, Task.scheduled_date == today)
    )
    jobs_today = today_result.scalar() or 0

    # Jobs today completed
    today_done = await db.execute(
        select(func.count()).where(
            Task.tenant_id == tenant_id, Task.scheduled_date == today, Task.status == "completed"
        )
    )
    jobs_today_completed = today_done.scalar() or 0

    # Jobs today in progress
    today_active = await db.execute(
        select(func.count()).where(
            Task.tenant_id == tenant_id, Task.scheduled_date == today, Task.status == "in_progress"
        )
    )
    jobs_today_active = today_active.scalar() or 0

    # Jobs today unassigned
    unassigned_q = (
        select(func.count())
        .select_from(Task)
        .outerjoin(TaskAssignment, Task.id == TaskAssignment.task_id)
        .where(
            Task.tenant_id == tenant_id,
            Task.scheduled_date == today,
            TaskAssignment.id == None,
            Task.status != "cancelled",
        )
    )
    unassigned_result = await db.execute(unassigned_q)
    jobs_today_unassigned = unassigned_result.scalar() or 0

    # Jobs this month
    month_result = await db.execute(
        select(func.count()).where(
            Task.tenant_id == tenant_id, Task.scheduled_date >= month_start
        )
    )
    jobs_this_month = month_result.scalar() or 0

    # Completed this month
    month_done = await db.execute(
        select(func.count()).where(
            Task.tenant_id == tenant_id, Task.scheduled_date >= month_start, Task.status == "completed"
        )
    )
    jobs_month_completed = month_done.scalar() or 0

    completion_rate = round(jobs_month_completed / jobs_this_month * 100, 1) if jobs_this_month > 0 else 0

    return {
        "active_properties": active_properties,
        "active_bees": active_bees,
        "today": {
            "total": jobs_today,
            "completed": jobs_today_completed,
            "in_progress": jobs_today_active,
            "unassigned": jobs_today_unassigned,
            "pending": jobs_today - jobs_today_completed - jobs_today_active,
        },
        "this_month": {
            "total": jobs_this_month,
            "completed": jobs_month_completed,
            "completion_rate": completion_rate,
        },
    }
