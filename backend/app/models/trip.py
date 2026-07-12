"""Trip model - a dispatch job. Lifecycle: Draft -> Dispatched -> Completed/Cancelled."""
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import TripStatus


class Trip(Base):
    __tablename__ = "trips"

    id: Mapped[int] = mapped_column(primary_key=True)

    source: Mapped[str] = mapped_column(String(255), nullable=False)
    destination: Mapped[str] = mapped_column(String(255), nullable=False)

    vehicle_id: Mapped[int] = mapped_column(
        ForeignKey("vehicles.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    driver_id: Mapped[int] = mapped_column(
        ForeignKey("drivers.id", ondelete="RESTRICT"), nullable=False, index=True
    )

    cargo_weight_kg: Mapped[float] = mapped_column(Float, nullable=False)
    planned_distance_km: Mapped[float] = mapped_column(Float, nullable=False)

    # Filled in on completion.
    actual_distance_km: Mapped[Optional[float]] = mapped_column(Float)
    fuel_consumed_liters: Mapped[Optional[float]] = mapped_column(Float)
    final_odometer: Mapped[Optional[float]] = mapped_column(Float)

    # Per-trip revenue, feeds the Vehicle ROI report (spec assumption).
    revenue: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    status: Mapped[TripStatus] = mapped_column(
        Enum(TripStatus, native_enum=False),
        default=TripStatus.DRAFT,
        nullable=False,
        index=True,
    )

    # Audit / lifecycle timestamps.
    created_by: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL")
    )
    dispatched_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    cancelled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    notes: Mapped[Optional[str]] = mapped_column(Text)

    # Relationships
    vehicle: Mapped["Vehicle"] = relationship(back_populates="trips")
    driver: Mapped["Driver"] = relationship(back_populates="trips")
