"""Reports & analytics: dashboard KPIs and per-vehicle metrics."""
from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.enums import DriverStatus, TripStatus, VehicleStatus
from app.models.models import Driver, Expense, FuelLog, MaintenanceLog, Trip, User, Vehicle

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/dashboard")
def dashboard(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    vehicles = db.scalars(select(Vehicle)).all()
    total = len(vehicles)
    non_retired = [v for v in vehicles if v.status != VehicleStatus.RETIRED]
    on_trip = [v for v in vehicles if v.status == VehicleStatus.ON_TRIP]
    available = [v for v in vehicles if v.status == VehicleStatus.AVAILABLE]
    in_shop = [v for v in vehicles if v.status == VehicleStatus.IN_SHOP]

    active_trips = db.scalar(select(func.count()).where(Trip.status == TripStatus.DISPATCHED))
    pending_trips = db.scalar(select(func.count()).where(Trip.status == TripStatus.DRAFT))
    drivers_on_duty = db.scalar(select(func.count()).where(Driver.status == DriverStatus.ON_TRIP))

    utilization = (len(on_trip) / len(non_retired) * 100) if non_retired else 0.0

    return {
        "total_vehicles": total,
        "active_vehicles": len(non_retired),
        "available_vehicles": len(available),
        "in_maintenance": len(in_shop),
        "on_trip_vehicles": len(on_trip),
        "active_trips": active_trips or 0,
        "pending_trips": pending_trips or 0,
        "drivers_on_duty": drivers_on_duty or 0,
        "fleet_utilization": round(utilization, 1),
    }


@router.get("/vehicle-costs")
def vehicle_costs(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    """Per-vehicle operational cost, fuel efficiency, and ROI."""
    rows = []
    for v in db.scalars(select(Vehicle)).all():
        fuel_cost = db.scalar(
            select(func.coalesce(func.sum(FuelLog.cost), 0.0)).where(FuelLog.vehicle_id == v.id)
        )
        fuel_liters = db.scalar(
            select(func.coalesce(func.sum(FuelLog.liters), 0.0)).where(FuelLog.vehicle_id == v.id)
        )
        maint_cost = db.scalar(
            select(func.coalesce(func.sum(MaintenanceLog.cost), 0.0)).where(
                MaintenanceLog.vehicle_id == v.id
            )
        )
        expense_cost = db.scalar(
            select(func.coalesce(func.sum(Expense.amount), 0.0)).where(Expense.vehicle_id == v.id)
        )
        distance = db.scalar(
            select(func.coalesce(func.sum(Trip.actual_distance_km), 0.0)).where(
                Trip.vehicle_id == v.id
            )
        )
        trip_revenue = db.scalar(
            select(func.coalesce(func.sum(Trip.revenue), 0.0)).where(Trip.vehicle_id == v.id)
        )
        operational_cost = float(fuel_cost) + float(maint_cost) + float(expense_cost)
        efficiency = (float(distance) / float(fuel_liters)) if fuel_liters else None
        roi = (
            (float(trip_revenue) - (float(fuel_cost) + float(maint_cost))) / v.acquisition_cost
            if v.acquisition_cost
            else None
        )
        rows.append(
            {
                "vehicle_id": v.id,
                "registration_number": v.registration_number,
                "fuel_cost": round(float(fuel_cost), 2),
                "maintenance_cost": round(float(maint_cost), 2),
                "expense_cost": round(float(expense_cost), 2),
                "operational_cost": round(operational_cost, 2),
                "fuel_efficiency_km_per_l": round(efficiency, 2) if efficiency else None,
                "roi": round(roi, 3) if roi is not None else None,
            }
        )
    return rows
