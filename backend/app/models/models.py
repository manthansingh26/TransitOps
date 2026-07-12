"""SQLAlchemy models mirroring the TransitOps schema on local PostgreSQL."""
from datetime import date, datetime
from typing import List, Optional

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import (
    AppRole,
    DriverStatus,
    ExpenseCategory,
    MaintenanceStatus,
    TripStatus,
    VehicleStatus,
    VehicleType,
)


def _enum(e):
    """Native-safe enum column that stores the enum *value* (lowercase)."""
    return Enum(e, native_enum=False, values_callable=lambda x: [i.value for i in x])


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False, default="")
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[AppRole] = mapped_column(_enum(AppRole), nullable=False, default=AppRole.DRIVER)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class Vehicle(Base):
    __tablename__ = "vehicles"

    id: Mapped[int] = mapped_column(primary_key=True)
    registration_number: Mapped[str] = mapped_column(String(30), unique=True, index=True, nullable=False)
    model: Mapped[str] = mapped_column(String(120), nullable=False)
    type: Mapped[VehicleType] = mapped_column(_enum(VehicleType), nullable=False)
    max_load_capacity_kg: Mapped[float] = mapped_column(Float, nullable=False)
    odometer: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    acquisition_cost: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    status: Mapped[VehicleStatus] = mapped_column(
        _enum(VehicleStatus), nullable=False, default=VehicleStatus.AVAILABLE, index=True
    )
    region: Mapped[str] = mapped_column(String(80), nullable=False, default="")
    revenue: Mapped[float] = mapped_column(Float, nullable=False, default=0)

    trips: Mapped[List["Trip"]] = relationship(back_populates="vehicle")
    maintenance_logs: Mapped[List["MaintenanceLog"]] = relationship(back_populates="vehicle")
    fuel_logs: Mapped[List["FuelLog"]] = relationship(back_populates="vehicle")


class Driver(Base):
    __tablename__ = "drivers"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    license_number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    license_category: Mapped[str] = mapped_column(String(20), nullable=False, default="")
    license_expiry_date: Mapped[date] = mapped_column(Date, nullable=False)
    contact_number: Mapped[str] = mapped_column(String(20), nullable=False, default="")
    safety_score: Mapped[int] = mapped_column(Integer, nullable=False, default=80)
    status: Mapped[DriverStatus] = mapped_column(
        _enum(DriverStatus), nullable=False, default=DriverStatus.AVAILABLE, index=True
    )
    user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))

    trips: Mapped[List["Trip"]] = relationship(back_populates="driver")

    @property
    def license_is_valid(self) -> bool:
        return self.license_expiry_date >= date.today()


class Trip(Base):
    __tablename__ = "trips"

    id: Mapped[int] = mapped_column(primary_key=True)
    source: Mapped[str] = mapped_column(String(255), nullable=False)
    destination: Mapped[str] = mapped_column(String(255), nullable=False)
    vehicle_id: Mapped[int] = mapped_column(ForeignKey("vehicles.id", ondelete="RESTRICT"), nullable=False, index=True)
    driver_id: Mapped[int] = mapped_column(ForeignKey("drivers.id", ondelete="RESTRICT"), nullable=False, index=True)
    cargo_weight_kg: Mapped[float] = mapped_column(Float, nullable=False)
    planned_distance_km: Mapped[float] = mapped_column(Float, nullable=False)
    actual_distance_km: Mapped[Optional[float]] = mapped_column(Float)
    fuel_consumed_liters: Mapped[Optional[float]] = mapped_column(Float)
    revenue: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    status: Mapped[TripStatus] = mapped_column(
        _enum(TripStatus), nullable=False, default=TripStatus.DRAFT, index=True
    )
    created_by: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    dispatched_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    cancelled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    vehicle: Mapped["Vehicle"] = relationship(back_populates="trips")
    driver: Mapped["Driver"] = relationship(back_populates="trips")
    events: Mapped[List["TripEvent"]] = relationship(back_populates="trip", cascade="all, delete-orphan")


class TripEvent(Base):
    __tablename__ = "trip_events"

    id: Mapped[int] = mapped_column(primary_key=True)
    trip_id: Mapped[int] = mapped_column(ForeignKey("trips.id", ondelete="CASCADE"), nullable=False, index=True)
    event: Mapped[str] = mapped_column(String(50), nullable=False)
    note: Mapped[str] = mapped_column(Text, nullable=False, default="")
    actor_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))

    trip: Mapped["Trip"] = relationship(back_populates="events")


class MaintenanceLog(Base):
    __tablename__ = "maintenance_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    vehicle_id: Mapped[int] = mapped_column(ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False, index=True)
    description: Mapped[str] = mapped_column(String(255), nullable=False)
    cost: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    status: Mapped[MaintenanceStatus] = mapped_column(
        _enum(MaintenanceStatus), nullable=False, default=MaintenanceStatus.ACTIVE, index=True
    )
    opened_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    closed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    vehicle: Mapped["Vehicle"] = relationship(back_populates="maintenance_logs")


class FuelLog(Base):
    __tablename__ = "fuel_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    vehicle_id: Mapped[int] = mapped_column(ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False, index=True)
    liters: Mapped[float] = mapped_column(Float, nullable=False)
    cost: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    date: Mapped[date] = mapped_column(Date, nullable=False, default=date.today)
    odometer_at_fill: Mapped[Optional[float]] = mapped_column(Float)

    vehicle: Mapped["Vehicle"] = relationship(back_populates="fuel_logs")


class Expense(Base):
    __tablename__ = "expenses"

    id: Mapped[int] = mapped_column(primary_key=True)
    vehicle_id: Mapped[Optional[int]] = mapped_column(ForeignKey("vehicles.id", ondelete="SET NULL"), index=True)
    category: Mapped[ExpenseCategory] = mapped_column(
        _enum(ExpenseCategory), nullable=False, default=ExpenseCategory.OTHER
    )
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False, default=date.today)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
