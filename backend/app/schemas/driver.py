"""Driver Pydantic schemas."""
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import DriverStatus


class DriverBase(BaseModel):
    name: str = Field(..., max_length=150)
    license_number: str = Field(..., max_length=50)
    license_category: Optional[str] = None
    license_expiry_date: date
    contact_number: Optional[str] = None
    safety_score: float = Field(default=100.0, ge=0, le=100)


class DriverCreate(DriverBase):
    status: DriverStatus = DriverStatus.AVAILABLE
    user_id: Optional[int] = None


class DriverUpdate(BaseModel):
    name: Optional[str] = None
    license_number: Optional[str] = None
    license_category: Optional[str] = None
    license_expiry_date: Optional[date] = None
    contact_number: Optional[str] = None
    safety_score: Optional[float] = Field(default=None, ge=0, le=100)
    status: Optional[DriverStatus] = None


class DriverRead(DriverBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: DriverStatus
    user_id: Optional[int] = None
    license_is_valid: bool
    created_at: datetime
