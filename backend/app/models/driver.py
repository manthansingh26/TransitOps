"""Driver model - optionally linked to a User account."""
from datetime import date
from typing import List, Optional

from sqlalchemy import Date, Enum, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import DriverStatus


class Driver(Base):
    __tablename__ = "drivers"

    id: Mapped[int] = mapped_column(primary_key=True)

    name: Mapped[str] = mapped_column(String(150), nullable=False)
    license_number: Mapped[str] = mapped_column(
        String(50), unique=True, index=True, nullable=False
    )
    license_category: Mapped[Optional[str]] = mapped_column(String(20))
    license_expiry_date: Mapped[date] = mapped_column(Date, nullable=False)
    contact_number: Mapped[Optional[str]] = mapped_column(String(20))
    safety_score: Mapped[float] = mapped_column(Float, default=100.0, nullable=False)

    status: Mapped[DriverStatus] = mapped_column(
        Enum(DriverStatus, native_enum=False),
        default=DriverStatus.AVAILABLE,
        nullable=False,
        index=True,
    )

    # Optional link so a driver can log in themselves.
    user_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), unique=True
    )

    # Relationships
    user: Mapped[Optional["User"]] = relationship(back_populates="driver_profile")
    trips: Mapped[List["Trip"]] = relationship(back_populates="driver")

    @property
    def license_is_valid(self) -> bool:
        """Business Rule 3 helper: expired licenses cannot be dispatched."""
        return self.license_expiry_date >= date.today()

    @property
    def is_dispatchable(self) -> bool:
        return (
            self.status == DriverStatus.AVAILABLE and self.license_is_valid
        )
