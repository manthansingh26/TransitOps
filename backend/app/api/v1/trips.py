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


@router.get("", response_model=list[TripRead])
def list_trips(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.scalars(select(Trip).order_by(Trip.created_at.desc())).all()


@router.get("/{trip_id}", response_model=TripRead)
def get_trip(trip_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    trip = db.get(Trip, trip_id)
    if trip is None:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


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
