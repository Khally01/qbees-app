from datetime import date, datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload

from app.database import AsyncSession, get_db
from app.middleware.auth import get_current_user, require_admin
from app.models.property import Property
from app.models.task import Task, TaskAssignment
from app.models.user import User
from app.schemas.task import (
    AssignmentStatusUpdate,
    TaskCreate,
    TaskResponse,
    TaskStatusUpdate,
    TaskUpdate,
)

router = APIRouter(prefix="/tasks", tags=["tasks"])


def task_to_response(task: Task) -> TaskResponse:
    return TaskResponse(
        id=task.id,
        property_id=task.property_id,
        property_name=task.property.name if task.property else None,
        property_address=task.property.address if task.property else None,
        name=task.name,
        status=task.status,
        scheduled_date=task.scheduled_date,
        scheduled_time=task.scheduled_time,
        started_at=task.started_at,
        completed_at=task.completed_at,
        notes=task.notes,
        report_url=task.report_url,
        assignments=[
            {
                "id": a.id,
                "user_id": a.user_id,
                "user_name": a.user.name if a.user else None,
                "status": a.status,
                "responded_at": a.responded_at,
            }
            for a in (task.assignments or [])
        ],
        photo_count=len(task.photos) if task.photos else 0,
        created_at=task.created_at,
        updated_at=task.updated_at,
    )


@router.get("/", response_model=list[TaskResponse])
async def list_tasks(
    scheduled_date: date | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    status_filter: str | None = Query(None, alias="status"),
    property_id: UUID | None = None,
    assigned_to: UUID | None = None,
    search: str | None = None,
    sort_by: str | None = None,
    sort_dir: str | None = "asc",
    skip: int = 0,
    limit: int = 200,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List tasks with optional filters, date range, search, and sorting."""
    query = (
        select(Task)
        .where(Task.tenant_id == user.tenant_id)
        .options(selectinload(Task.property), selectinload(Task.assignments).selectinload(TaskAssignment.user), selectinload(Task.photos))
    )

    # Date filters
    if scheduled_date:
        query = query.where(Task.scheduled_date == scheduled_date)
    if date_from:
        query = query.where(Task.scheduled_date >= date_from)
    if date_to:
        query = query.where(Task.scheduled_date <= date_to)
    if status_filter:
        query = query.where(Task.status == status_filter)
    if property_id:
        query = query.where(Task.property_id == property_id)
    if assigned_to:
        query = query.join(TaskAssignment).where(TaskAssignment.user_id == assigned_to)

    # Text search across property name, task name, notes
    if search:
        query = query.join(Property, Task.property_id == Property.id, isouter=True).where(
            or_(
                Property.name.ilike(f"%{search}%"),
                Task.name.ilike(f"%{search}%"),
                Task.notes.ilike(f"%{search}%"),
            )
        )

    # Cleaners only see their own tasks
    if user.role == "cleaner":
        query = query.join(TaskAssignment, isouter=False).where(TaskAssignment.user_id == user.id)

    # Sorting
    sort_column = {
        "date": Task.scheduled_date,
        "time": Task.scheduled_time,
        "status": Task.status,
        "name": Task.name,
        "created": Task.created_at,
    }.get(sort_by or "date", Task.scheduled_date)

    if sort_dir == "desc":
        query = query.order_by(sort_column.desc(), Task.scheduled_time)
    else:
        query = query.order_by(sort_column, Task.scheduled_time)

    query = query.offset(skip).limit(limit)

    result = await db.execute(query)
    tasks = result.unique().scalars().all()
    return [task_to_response(t) for t in tasks]


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Task)
        .where(Task.id == task_id, Task.tenant_id == user.tenant_id)
        .options(selectinload(Task.property), selectinload(Task.assignments).selectinload(TaskAssignment.user), selectinload(Task.photos))
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task_to_response(task)


@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    body: TaskCreate,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    task = Task(
        tenant_id=user.tenant_id,
        property_id=body.property_id,
        name=body.name,
        scheduled_date=body.scheduled_date,
        scheduled_time=body.scheduled_time,
        checklist_id=body.checklist_id,
        notes=body.notes,
    )
    db.add(task)
    await db.flush()

    # Create assignments
    if body.assignee_ids:
        for uid in body.assignee_ids:
            assignment = TaskAssignment(task_id=task.id, user_id=uid)
            db.add(assignment)
        task.status = "assigned"
        await db.flush()

    await db.refresh(task)
    # Reload with relationships
    result = await db.execute(
        select(Task)
        .where(Task.id == task.id)
        .options(selectinload(Task.property), selectinload(Task.assignments).selectinload(TaskAssignment.user), selectinload(Task.photos))
    )
    task = result.scalar_one()
    return task_to_response(task)


@router.patch("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: UUID,
    body: TaskUpdate,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.tenant_id == user.tenant_id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(task, field, value)

    await db.flush()

    # Reload with relationships
    result = await db.execute(
        select(Task)
        .where(Task.id == task.id)
        .options(selectinload(Task.property), selectinload(Task.assignments).selectinload(TaskAssignment.user), selectinload(Task.photos))
    )
    task = result.scalar_one()
    return task_to_response(task)


@router.post("/{task_id}/status", response_model=TaskResponse)
async def update_task_status(
    task_id: UUID,
    body: TaskStatusUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update task status (cleaners can mark in_progress/completed)."""
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.tenant_id == user.tenant_id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    now = datetime.now(timezone.utc)

    if body.status == "in_progress":
        task.status = "in_progress"
        task.started_at = now
    elif body.status == "completed":
        task.status = "completed"
        task.completed_at = now
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid status: {body.status}")

    await db.flush()

    result = await db.execute(
        select(Task)
        .where(Task.id == task.id)
        .options(selectinload(Task.property), selectinload(Task.assignments).selectinload(TaskAssignment.user), selectinload(Task.photos))
    )
    task = result.scalar_one()
    return task_to_response(task)


@router.post("/{task_id}/assignments/{assignment_id}/respond")
async def respond_to_assignment(
    task_id: UUID,
    assignment_id: UUID,
    body: AssignmentStatusUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Accept or decline a task assignment."""
    result = await db.execute(
        select(TaskAssignment).where(
            TaskAssignment.id == assignment_id,
            TaskAssignment.task_id == task_id,
            TaskAssignment.user_id == user.id,
        )
    )
    assignment = result.scalar_one_or_none()
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")

    if body.status not in ("accepted", "declined"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Status must be 'accepted' or 'declined'")

    assignment.status = body.status
    assignment.responded_at = datetime.now(timezone.utc)

    # If accepted, update task status
    if body.status == "accepted":
        task_result = await db.execute(select(Task).where(Task.id == task_id))
        task = task_result.scalar_one()
        if task.status == "assigned":
            task.status = "accepted"

    await db.flush()
    return {"status": assignment.status, "responded_at": assignment.responded_at}
