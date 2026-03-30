from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class PropertyCreate(BaseModel):
    name: str
    address: str | None = None
    suburb: str | None = None
    beds: int | None = None
    baths: float | None = None
    property_type: str | None = None
    owner_name: str | None = None
    owner_email: str | None = None
    owner_phone: str | None = None
    notes: str | None = None
    breezeway_id: str | None = None
    cleaning_instructions: str | None = None
    access_method: str | None = None
    access_code: str | None = None
    parking_instructions: str | None = None
    wifi_name: str | None = None
    wifi_password: str | None = None
    consumables: list[dict] | None = None
    bedrooms: int | None = None
    bathrooms: int | None = None
    living_areas: int | None = None


class PropertyUpdate(BaseModel):
    name: str | None = None
    address: str | None = None
    suburb: str | None = None
    beds: int | None = None
    baths: float | None = None
    property_type: str | None = None
    owner_name: str | None = None
    owner_email: str | None = None
    owner_phone: str | None = None
    notes: str | None = None
    status: str | None = None
    cleaning_instructions: str | None = None
    access_method: str | None = None
    access_code: str | None = None
    parking_instructions: str | None = None
    wifi_name: str | None = None
    wifi_password: str | None = None
    consumables: list[dict] | None = None
    bedrooms: int | None = None
    bathrooms: int | None = None
    living_areas: int | None = None


class PropertyResponse(BaseModel):
    id: UUID
    name: str
    address: str | None
    suburb: str | None
    beds: int | None
    baths: float | None
    property_type: str | None
    owner_name: str | None
    owner_email: str | None
    owner_phone: str | None
    notes: str | None
    status: str
    breezeway_id: str | None
    cleaning_instructions: str | None = None
    access_method: str | None = None
    access_code: str | None = None
    parking_instructions: str | None = None
    wifi_name: str | None = None
    wifi_password: str | None = None
    consumables: list[dict] | None = None
    bedrooms: int | None = None
    bathrooms: int | None = None
    living_areas: int | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
