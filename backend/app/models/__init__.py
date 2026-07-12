"""Import all models so SQLAlchemy can discover them."""
from app.models.enums import (
    AppRole,
    DriverStatus,
    ExpenseCategory,
    MaintenanceStatus,
    TripStatus,
    VehicleStatus,
    VehicleType,
)
from app.models.models import (
    Driver,
    Expense,
    FuelLog,
    MaintenanceLog,
    Trip,
    TripEvent,
    User,
    Vehicle,
)

__all__ = [
    "AppRole",
    "VehicleStatus",
    "VehicleType",
    "DriverStatus",
    "TripStatus",
    "MaintenanceStatus",
    "ExpenseCategory",
    "User",
    "Vehicle",
    "Driver",
    "Trip",
    "TripEvent",
    "MaintenanceLog",
    "FuelLog",
    "Expense",
]
