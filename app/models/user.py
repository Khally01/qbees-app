import uuid
from datetime import datetime, date, timezone

from sqlalchemy import String, Boolean, DateTime, Date, ForeignKey, Text, JSON, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("tenants.id"), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="cleaner")
    language: Mapped[str] = mapped_column(String(5), default="en")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Phase 3: Extended cleaner profile
    nickname: Mapped[str | None] = mapped_column(String(100), nullable=True)
    address: Mapped[str | None] = mapped_column(String(500), nullable=True)
    suburb: Mapped[str | None] = mapped_column(String(100), nullable=True)
    transport: Mapped[str | None] = mapped_column(String(50), nullable=True)  # car, walking, public
    skills: Mapped[dict | None] = mapped_column(JSON, nullable=True)  # ["deep_clean", "laundry"]
    regions: Mapped[dict | None] = mapped_column(JSON, nullable=True)  # ["St Kilda", "South Melbourne"]
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    # Relationships
    tenant = relationship("Tenant", back_populates="users")
    assignments = relationship("TaskAssignment", back_populates="user", lazy="selectin")
