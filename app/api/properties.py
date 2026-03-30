from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, or_, func
from sqlalchemy.orm import selectinload

from app.database import AsyncSession, get_db
from app.middleware.auth import get_current_user, require_admin
from app.models.property import Property
from app.models.task import Task
from app.models.user import User
from app.schemas.property import PropertyCreate, PropertyUpdate, PropertyResponse

router = APIRouter(prefix="/properties", tags=["properties"])


@router.get("/", response_model=list[PropertyResponse])
async def list_properties(
    status_filter: str | None = Query(None, alias="status"),
    search: str | None = None,
    sort_by: str | None = None,
    sort_dir: str | None = "asc",
    skip: int = 0,
    limit: int = 200,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all properties for the tenant with search and sorting."""
    query = select(Property).where(Property.tenant_id == user.tenant_id)

    if status_filter:
        query = query.where(Property.status == status_filter)

    if search:
        query = query.where(
            or_(
                Property.name.ilike(f"%{search}%"),
                Property.address.ilike(f"%{search}%"),
                Property.suburb.ilike(f"%{search}%"),
                Property.owner_name.ilike(f"%{search}%"),
            )
        )

    # Sorting
    sort_col = {
        "name": Property.name,
        "suburb": Property.suburb,
        "status": Property.status,
        "created": Property.created_at,
    }.get(sort_by or "name", Property.name)

    if sort_dir == "desc":
        query = query.order_by(sort_col.desc())
    else:
        query = query.order_by(sort_col)

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{property_id}", response_model=PropertyResponse)
async def get_property(
    property_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Property).where(Property.id == property_id, Property.tenant_id == user.tenant_id)
    )
    prop = result.scalar_one_or_none()
    if not prop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    return prop


@router.get("/{property_id}/detail")
async def get_property_detail(
    property_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get property with recent tasks and stats."""
    result = await db.execute(
        select(Property).where(Property.id == property_id, Property.tenant_id == user.tenant_id)
    )
    prop = result.scalar_one_or_none()
    if not prop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")

    # Recent tasks for this property (last 20)
    tasks_result = await db.execute(
        select(Task)
        .where(Task.property_id == property_id)
        .options(selectinload(Task.assignments))
        .order_by(Task.scheduled_date.desc())
        .limit(20)
    )
    recent_tasks = tasks_result.scalars().all()

    # Stats
    total_result = await db.execute(
        select(func.count()).where(Task.property_id == property_id)
    )
    total_tasks = total_result.scalar() or 0

    completed_result = await db.execute(
        select(func.count()).where(Task.property_id == property_id, Task.status == "completed")
    )
    completed_tasks = completed_result.scalar() or 0

    return {
        "property": PropertyResponse.model_validate(prop),
        "recent_tasks": [
            {
                "id": str(t.id),
                "name": t.name,
                "status": t.status,
                "scheduled_date": str(t.scheduled_date),
                "scheduled_time": str(t.scheduled_time) if t.scheduled_time else None,
                "completed_at": t.completed_at.isoformat() if t.completed_at else None,
                "assignees": [a.user_id for a in (t.assignments or [])],
            }
            for t in recent_tasks
        ],
        "stats": {
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
        },
    }


@router.post("/", response_model=PropertyResponse, status_code=status.HTTP_201_CREATED)
async def create_property(
    body: PropertyCreate,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    prop = Property(tenant_id=user.tenant_id, **body.model_dump())
    db.add(prop)
    await db.flush()
    await db.refresh(prop)
    return prop


@router.patch("/{property_id}", response_model=PropertyResponse)
async def update_property(
    property_id: UUID,
    body: PropertyUpdate,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Property).where(Property.id == property_id, Property.tenant_id == user.tenant_id)
    )
    prop = result.scalar_one_or_none()
    if not prop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(prop, field, value)

    await db.flush()
    await db.refresh(prop)
    return prop


@router.delete("/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_property(
    property_id: UUID,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Property).where(Property.id == property_id, Property.tenant_id == user.tenant_id)
    )
    prop = result.scalar_one_or_none()
    if not prop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")

    await db.delete(prop)
