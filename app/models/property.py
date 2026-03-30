import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Integer, Numeric, DateTime, ForeignKey, Text, JSON, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Property(Base):
    __tablename__ = "properties"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("tenants.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    address: Mapped[str | None] = mapped_column(String(500), nullable=True)
    suburb: Mapped[str | None] = mapped_column(String(100), nullable=True)
    beds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    baths: Mapped[float | None] = mapped_column(Numeric(3, 1), nullable=True)
    property_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    owner_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    owner_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    owner_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    default_checklist_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("checklists.id"), nullable=True
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="active")
    metadata_: Mapped[dict] = mapped_column("metadata", JSON, default=dict)
    breezeway_id: Mapped[str | None] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Phase 2: Cleaning-specific fields
    cleaning_instructions: Mapped[str | None] = mapped_column(Text, nullable=True)
    access_method: Mapped[str | None] = mapped_column(String(50), nullable=True)  # lockbox, smart lock, key safe
    access_code: Mapped[str | None] = mapped_column(String(100), nullable=True)
    parking_instructions: Mapped[str | None] = mapped_column(Text, nullable=True)
    wifi_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    wifi_password: Mapped[str | None] = mapped_column(String(100), nullable=True)
    consumables: Mapped[dict | None] = mapped_column(JSON, nullable=True)  # [{name, qty}]
    bedrooms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    bathrooms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    living_areas: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Relationships
    tenant = relationship("Tenant", back_populates="properties")
    default_checklist = relationship("Checklist", foreign_keys=[default_checklist_id])
    tasks = relationship("Task", back_populates="property", lazy="selectin")
