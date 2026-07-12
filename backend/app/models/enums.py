"""Centralized status enums, aligned to the official TransitOps problem statement.

Values are the exact human-readable labels from the spec so they read cleanly
in the DB, API responses, and the UI.
"""
import enum


class RoleName(str, enum.Enum):
    """RBAC roles. Every user is assigned exactly one."""
    FLEET_MANAGER = "fleet_manager"
    DRIVER = "driver"
    SAFETY_OFFICER = "safety_officer"
    FINANCIAL_ANALYST = "financial_analyst"


class VehicleType(str, enum.Enum):
    TRUCK = "Truck"
    VAN = "Van"
    BIKE = "Bike"
    CAR = "Car"
    BUS = "Bus"


class VehicleStatus(str, enum.Enum):
    AVAILABLE = "Available"
    ON_TRIP = "On Trip"
    IN_SHOP = "In Shop"
    RETIRED = "Retired"


class DriverStatus(str, enum.Enum):
    AVAILABLE = "Available"
    ON_TRIP = "On Trip"
    OFF_DUTY = "Off Duty"
    SUSPENDED = "Suspended"


class TripStatus(str, enum.Enum):
    DRAFT = "Draft"
    DISPATCHED = "Dispatched"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"


class MaintenanceStatus(str, enum.Enum):
    ACTIVE = "Active"
    CLOSED = "Closed"


class ExpenseCategory(str, enum.Enum):
    TOLL = "Toll"
    FINE = "Fine"
    INSURANCE = "Insurance"
    PARKING = "Parking"
    OTHER = "Other"
