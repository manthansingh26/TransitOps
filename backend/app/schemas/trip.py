"""Trip Pydantic schemas, including lifecycle action payloads."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import TripStatus


class TripCreate(BaseModel):
    source: str = Field(..., max_length=255)
    destination: str = Field(..., max_length=255)
    vehicle_id: int
    driver_id: int
    cargo_weight_kg: float = Field(..., gt=0)
    planned_distance_km: float = Field(..., gt=0)
    revenue: float = Field(default=0.0, ge=0)
    notes: Optional[str] = None


class TripCompleteRequest(BaseModel):
    """Required inputs when completing a trip (Business Rule 7)."""
    final_odometer: float = Field(..., ge=0)
    fuel_consumed_liters: float = Field(..., gt=0)
    actual_distance_km: Optional[float] = Field(default=None, gt=0)


class TripRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    source: str
    destination: str
    vehicle_id: int
    driver_id: int
    cargo_weight_kg: float
    planned_distance_km: float
    actual_distance_km: Optional[float] = None
    fuel_consumed_liters: Optional[float] = None
    final_odometer: Optional[float] = None
    revenue: float
    status: TripStatus
    created_by: Optional[int] = None
    dispatched_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime
