"""Import all models here so Alembic/SQLAlchemy can discover them."""
from app.models.driver import Driver
from app.models.logs import Expense, FuelLog, MaintenanceLog
from app.models.trip import Trip
from app.models.user import User
from app.models.vehicle import Vehicle

__all__ = [
    "User",
    "Vehicle",
    "Driver",
    "Trip",
    "MaintenanceLog",
    "FuelLog",
    "Expense",
]
