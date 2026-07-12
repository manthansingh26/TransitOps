"""Trip endpoints with lifecycle actions enforcing business rules."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.core.database import get_db
from app.models.enums import AppRole
from app.models.models import Trip, User
from app.schemas.schemas import TripComplete, TripCreate, TripRead
from app.services import business

router = APIRouter(prefix="/trips", tags=["trips"])


@router.get("")
def list_trips(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    trips = db.scalars(select(Trip).order_by(Trip.created_at.desc())).all()
    out = []
    for t in trips:
        d = TripRead.model_validate(t).model_dump(mode="json")
        d["vehicle"] = (
            {
                "registration_number": t.vehicle.registration_number,
                "model": t.vehicle.model,
                "max_load_capacity_kg": t.vehicle.max_load_capacity_kg,
            }
            if t.vehicle
            else None
        )
        d["driver"] = (
            {"name": t.driver.name, "license_expiry_date": t.driver.license_expiry_date.isoformat()}
            if t.driver
            else None
        )
        out.append(d)
    return out


@router.get("/meta/eligible")
def eligible_for_trip(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    """Vehicles and drivers eligible for a new trip (business rules 2-4).

    Declared before the /{trip_id} route so "meta" is not parsed as an id.
    """
    from datetime import date

    from app.models.enums import DriverStatus, VehicleStatus
    from app.models.models import Driver, Vehicle

    vehicles = (
        db.query(Vehicle)
        .filter(Vehicle.status == VehicleStatus.AVAILABLE)
        .order_by(Vehicle.registration_number)
        .all()
    )
    drivers = (
        db.query(Driver)
        .filter(
            Driver.status == DriverStatus.AVAILABLE,
            Driver.license_expiry_date >= date.today(),
        )
        .order_by(Driver.name)
        .all()
    )
    return {
        "vehicles": [
            {
                "id": v.id,
                "registration_number": v.registration_number,
                "model": v.model,
                "max_load_capacity_kg": v.max_load_capacity_kg,
                "type": v.type.value,
            }
            for v in vehicles
        ],
        "drivers": [
            {
                "id": d.id,
                "name": d.name,
                "license_expiry_date": d.license_expiry_date.isoformat(),
                "license_number": d.license_number,
                "status": d.status.value,
            }
            for d in drivers
        ],
    }


@router.get("/{trip_id}")
def get_trip(trip_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    trip = db.get(Trip, trip_id)
    if trip is None:
        raise HTTPException(status_code=404, detail="Trip not found")
    events = [
        {
            "id": e.id,
            "trip_id": e.trip_id,
            "event": e.event,
            "note": e.note,
            "actor_id": e.actor_id,
            "created_at": e.created_at.isoformat(),
        }
        for e in sorted(trip.events, key=lambda x: x.created_at)
    ]
    trip_data = TripRead.model_validate(trip).model_dump(mode="json")
    trip_data["vehicle"] = {
        "registration_number": trip.vehicle.registration_number,
        "model": trip.vehicle.model,
        "max_load_capacity_kg": trip.vehicle.max_load_capacity_kg,
    }
    trip_data["driver"] = {
        "name": trip.driver.name,
        "license_expiry_date": trip.driver.license_expiry_date.isoformat(),
    }
    return {"trip": trip_data, "events": events}


@router.post("", response_model=TripRead, status_code=201)
def create_trip(
    payload: TripCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(AppRole.FLEET_MANAGER, AppRole.DRIVER)),
):
    return business.create_trip(db, payload, user.id)


@router.post("/{trip_id}/dispatch", response_model=TripRead)
def dispatch_trip(
    trip_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(AppRole.FLEET_MANAGER)),
):
    return business.dispatch_trip(db, trip_id, user.id)


@router.post("/{trip_id}/complete", response_model=TripRead)
def complete_trip(
    trip_id: int,
    payload: TripComplete,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(AppRole.FLEET_MANAGER)),
):
    return business.complete_trip(db, trip_id, payload, user.id)


@router.post("/{trip_id}/cancel", response_model=TripRead)
def cancel_trip(
    trip_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(AppRole.FLEET_MANAGER)),
):
    return business.cancel_trip(db, trip_id, user.id)
