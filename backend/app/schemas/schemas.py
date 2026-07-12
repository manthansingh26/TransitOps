"""Pydantic request/response schemas."""
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.enums import (
    AppRole,
    DriverStatus,
    ExpenseCategory,
    MaintenanceStatus,
    TripStatus,
    VehicleStatus,
    VehicleType,
)


# ---------- Auth / Users ----------
class SignupRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: AppRole = AppRole.DRIVER


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    full_name: str
    email: EmailStr
    role: AppRole
    is_active: bool


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead


# ---------- Vehicles ----------
class VehicleBase(BaseModel):
    registration_number: str
    model: str
    type: VehicleType
    max_load_capacity_kg: float = Field(..., gt=0)
    odometer: float = Field(0, ge=0)
    acquisition_cost: float = Field(0, ge=0)
    region: str = ""
    revenue: float = Field(0, ge=0)


class VehicleCreate(VehicleBase):
    status: VehicleStatus = VehicleStatus.AVAILABLE


class VehicleUpdate(BaseModel):
    model: Optional[str] = None
    type: Optional[VehicleType] = None
    max_load_capacity_kg: Optional[float] = Field(None, gt=0)
    odometer: Optional[float] = Field(None, ge=0)
    acquisition_cost: Optional[float] = Field(None, ge=0)
    region: Optional[str] = None
    revenue: Optional[float] = Field(None, ge=0)
    status: Optional[VehicleStatus] = None


class VehicleRead(VehicleBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    status: VehicleStatus
    created_at: datetime


# ---------- Drivers ----------
class DriverBase(BaseModel):
    name: str
    license_number: str
    license_category: str = ""
    license_expiry_date: date
    contact_number: str = ""
    safety_score: int = Field(80, ge=0, le=100)


class DriverCreate(DriverBase):
    status: DriverStatus = DriverStatus.AVAILABLE


class DriverUpdate(BaseModel):
    name: Optional[str] = None
    license_number: Optional[str] = None
    license_category: Optional[str] = None
    license_expiry_date: Optional[date] = None
    contact_number: Optional[str] = None
    safety_score: Optional[int] = Field(None, ge=0, le=100)
    status: Optional[DriverStatus] = None


class DriverRead(DriverBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    status: DriverStatus
    license_is_valid: bool
    created_at: datetime


# ---------- Trips ----------
class TripCreate(BaseModel):
    source: str
    destination: str
    vehicle_id: int
    driver_id: int
    cargo_weight_kg: float = Field(..., gt=0)
    planned_distance_km: float = Field(..., gt=0)
    revenue: float = Field(0, ge=0)


class TripComplete(BaseModel):
    actual_distance_km: float = Field(..., gt=0)
    fuel_consumed_liters: float = Field(..., gt=0)
    final_odometer: float = Field(..., ge=0)


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
    revenue: float
    status: TripStatus
    created_by: Optional[int] = None
    dispatched_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    created_at: datetime


# ---------- Maintenance ----------
class MaintenanceCreate(BaseModel):
    vehicle_id: int
    description: str
    cost: float = Field(0, ge=0)


class MaintenanceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    vehicle_id: int
    description: str
    cost: float
    status: MaintenanceStatus
    opened_at: datetime
    closed_at: Optional[datetime] = None


# ---------- Fuel ----------
class FuelCreate(BaseModel):
    vehicle_id: int
    liters: float = Field(..., gt=0)
    cost: float = Field(0, ge=0)
    date: date
    odometer_at_fill: Optional[float] = Field(None, ge=0)


class FuelRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    vehicle_id: int
    liters: float
    cost: float
    date: date
    odometer_at_fill: Optional[float] = None
    created_at: datetime


# ---------- Expenses ----------
class ExpenseCreate(BaseModel):
    vehicle_id: Optional[int] = None
    category: ExpenseCategory
    amount: float = Field(..., gt=0)
    date: date
    description: str = ""


class ExpenseRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    vehicle_id: Optional[int] = None
    category: ExpenseCategory
    amount: float
    date: date
    description: str
    created_at: datetime
