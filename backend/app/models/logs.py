"""MaintenanceLog, FuelLog and Expense models, matching the official spec."""
from datetime import date, datetime
from typing import Optional

from sqlalchemy import Date, DateTime, Enum, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import ExpenseCategory, MaintenanceStatus


class MaintenanceLog(Base):
    __tablename__ = "maintenance_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    vehicle_id: Mapped[int] = mapped_column(
        ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # e.g. "Oil Change", "Brake Repair".
    description: Mapped[str] = mapped_column(String(255), nullable=False)
    cost: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    # Business Rules 9-10: Active => vehicle In Shop, Closed => restore Available.
    status: Mapped[MaintenanceStatus] = mapped_column(
        Enum(MaintenanceStatus, native_enum=False),
        default=MaintenanceStatus.ACTIVE,
        nullable=False,
        index=True,
    )

    opened_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    closed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    vehicle: Mapped["Vehicle"] = relationship(back_populates="maintenance_logs")


class FuelLog(Base):
    __tablename__ = "fuel_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    vehicle_id: Mapped[int] = mapped_column(
        ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False, index=True
    )

    liters: Mapped[float] = mapped_column(Float, nullable=False)
    cost: Mapped[float] = mapped_column(Float, nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    odometer_at_fill: Mapped[Optional[float]] = mapped_column(Float)

    vehicle: Mapped["Vehicle"] = relationship(back_populates="fuel_logs")


class Expense(Base):
    __tablename__ = "expenses"

    id: Mapped[int] = mapped_column(primary_key=True)

    # Nullable: an expense may be general (not tied to a specific vehicle).
    vehicle_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("vehicles.id", ondelete="SET NULL"), index=True
    )

    category: Mapped[ExpenseCategory] = mapped_column(
        Enum(ExpenseCategory, native_enum=False), nullable=False
    )
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)

    vehicle: Mapped[Optional["Vehicle"]] = relationship(back_populates="expenses")
