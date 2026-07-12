"""Vehicle model - the core fleet asset, matching the official spec fields."""
from typing import List, Optional

from sqlalchemy import Boolean, Enum, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import VehicleStatus, VehicleType


class Vehicle(Base):
    __tablename__ = "vehicles"

    id: Mapped[int] = mapped_column(primary_key=True)

    # Business Rule 1: registration number must be unique.
    registration_number: Mapped[str] = mapped_column(
        String(30), unique=True, index=True, nullable=False
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)  # name / model
    type: Mapped[VehicleType] = mapped_column(
        Enum(VehicleType, native_enum=False), nullable=False
    )
    max_load_capacity_kg: Mapped[float] = mapped_column(Float, nullable=False)
    odometer: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    acquisition_cost: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    region: Mapped[Optional[str]] = mapped_column(String(80), index=True)

    status: Mapped[VehicleStatus] = mapped_column(
        Enum(VehicleStatus, native_enum=False),
        default=VehicleStatus.AVAILABLE,
        nullable=False,
        index=True,
    )

    # Manually-entered revenue used for the Vehicle ROI report (spec assumption).
    revenue: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    # Soft-delete flag: never hard-delete a vehicle with trip history.
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    trips: Mapped[List["Trip"]] = relationship(back_populates="vehicle")
    maintenance_logs: Mapped[List["MaintenanceLog"]] = relationship(
        back_populates="vehicle"
    )
    fuel_logs: Mapped[List["FuelLog"]] = relationship(back_populates="vehicle")
    expenses: Mapped[List["Expense"]] = relationship(back_populates="vehicle")
