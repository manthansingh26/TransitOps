"""Status enums, matching the original Supabase schema values (lowercase)."""
import enum


class AppRole(str, enum.Enum):
    FLEET_MANAGER = "fleet_manager"
    DRIVER = "driver"
    SAFETY_OFFICER = "safety_officer"
    FINANCIAL_ANALYST = "financial_analyst"


class VehicleStatus(str, enum.Enum):
    AVAILABLE = "available"
    ON_TRIP = "on_trip"
    IN_SHOP = "in_shop"
    RETIRED = "retired"


class VehicleType(str, enum.Enum):
    TRUCK = "truck"
    VAN = "van"
    BIKE = "bike"
    CAR = "car"


class DriverStatus(str, enum.Enum):
    AVAILABLE = "available"
    ON_TRIP = "on_trip"
    OFF_DUTY = "off_duty"
    SUSPENDED = "suspended"


class TripStatus(str, enum.Enum):
    DRAFT = "draft"
    DISPATCHED = "dispatched"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class MaintenanceStatus(str, enum.Enum):
    ACTIVE = "active"
    CLOSED = "closed"


class ExpenseCategory(str, enum.Enum):
    TOLL = "toll"
    FINE = "fine"
    INSURANCE = "insurance"
    OTHER = "other"
