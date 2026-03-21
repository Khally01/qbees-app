from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select

from app.database import AsyncSession, get_db
from app.middleware.auth import require_admin
from app.models.user import User

router = APIRouter(prefix="/admin", tags=["admin"])


class UserCreate(BaseModel):
    name: str
    phone: str | None = None
    email: str | None = None
    role: str = "cleaner"
    language: str = "en"


class UserResponse(BaseModel):
    id: UUID
    name: str
    phone: str | None
    email: str | None
    role: str
    language: str
    is_active: bool

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    email: str | None = None
    role: str | None = None
    language: str | None = None
    is_active: bool | None = None


@router.get("/users", response_model=list[UserResponse])
async def list_users(
    role: str | None = None,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    query = select(User).where(User.tenant_id == admin.tenant_id)
    if role:
        query = query.where(User.role == role)
    query = query.order_by(User.name)

    result = await db.execute(query)
    return result.scalars().all()


@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    body: UserCreate,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    user = User(
        tenant_id=admin.tenant_id,
        name=body.name,
        phone=body.phone,
        email=body.email,
        role=body.role,
        language=body.language,
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
