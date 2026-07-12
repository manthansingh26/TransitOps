"""User model for authentication and RBAC.

Per the spec, every authenticated user is assigned exactly one role, so the
role is a single enum column rather than a many-to-many relationship.
"""
from typing import Optional

from sqlalchemy import Boolean, Enum, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import RoleName


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[RoleName] = mapped_column(
        Enum(RoleName, native_enum=False), nullable=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Optional: a user account may be linked to a driver profile so drivers
    # can log in and monitor their own deliveries.
    driver_profile: Mapped[Optional["Driver"]] = relationship(
        back_populates="user", uselist=False
    )
