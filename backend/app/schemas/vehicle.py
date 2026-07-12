"""Vehicle Pydantic schemas."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import VehicleStatus, VehicleType


class VehicleBase(BaseModel):
    registration_number: str = Field(..., max_length=30)
    name: str = Field(..., max_length=120)
    type: VehicleType
    max_load_capacity_kg: float = Field(..., gt=0)
    odometer: float = Field(default=0.0, ge=0)
    acquisition_cost: float = Field(default=0.0, ge=0)
    region: Optional[str] = None
    revenue: float = Field(default=0.0, ge=0)


class VehicleCreate(VehicleBase):
    status: VehicleStatus = VehicleStatus.AVAILABLE


class VehicleUpdate(BaseModel):
    """All fields optional for partial updates."""
    name: Optional[str] = None
    type: Optional[VehicleType] = None
    max_load_capacity_kg: Optional[float] = Field(default=None, gt=0)
    odometer: Optional[float] = Field(default=None, ge=0)
    acquisition_cost: Optional[float] = Field(default=None, ge=0)
    region: Optional[str] = None
    revenue: Optional[float] = Field(default=None, ge=0)
    status: Optional[VehicleStatus] = None


class VehicleRead(VehicleBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: VehicleStatus
    created_at: datetime
