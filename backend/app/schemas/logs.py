"""Schemas for MaintenanceLog, FuelLog and Expense."""
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import ExpenseCategory, MaintenanceStatus


# --- Maintenance ---
class MaintenanceCreate(BaseModel):
    vehicle_id: int
    description: str = Field(..., max_length=255)
    cost: float = Field(default=0.0, ge=0)


class MaintenanceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    vehicle_id: int
    description: str
    cost: float
    status: MaintenanceStatus
    opened_at: datetime
    closed_at: Optional[datetime] = None
    created_at: datetime


# --- Fuel ---
class FuelLogCreate(BaseModel):
    vehicle_id: int
    liters: float = Field(..., gt=0)
    cost: float = Field(..., ge=0)
    date: date
    odometer_at_fill: Optional[float] = Field(default=None, ge=0)


class FuelLogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    vehicle_id: int
    liters: float
    cost: float
    date: date
    odometer_at_fill: Optional[float] = None
    created_at: datetime


# --- Expense ---
class ExpenseCreate(BaseModel):
    vehicle_id: Optional[int] = None
    category: ExpenseCategory
    amount: float = Field(..., gt=0)
    date: date
    description: Optional[str] = None


class ExpenseRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    vehicle_id: Optional[int] = None
    category: ExpenseCategory
    amount: float
    date: date
    description: Optional[str] = None
    created_at: datetime
