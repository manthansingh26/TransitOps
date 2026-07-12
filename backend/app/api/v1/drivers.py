"""Driver CRUD endpoints. Fleet Managers and Safety Officers can write."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.core.database import get_db
from app.models.enums import AppRole
from app.models.models import Driver, User
from app.schemas.schemas import DriverCreate, DriverRead, DriverUpdate

router = APIRouter(prefix="/drivers", tags=["drivers"])

_WRITE_ROLES = (AppRole.FLEET_MANAGER, AppRole.SAFETY_OFFICER)


@router.get("", response_model=list[DriverRead])
def list_drivers(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.scalars(select(Driver).order_by(Driver.created_at.desc())).all()


@router.post("", response_model=DriverRead, status_code=201)
def create_driver(
    payload: DriverCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(*_WRITE_ROLES)),
):
    driver = Driver(**payload.model_dump())
    db.add(driver)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="License number must be unique")
    db.refresh(driver)
    return driver


@router.patch("/{driver_id}", response_model=DriverRead)
def update_driver(
    driver_id: int,
    payload: DriverUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(*_WRITE_ROLES)),
):
    driver = db.get(Driver, driver_id)
    if driver is None:
        raise HTTPException(status_code=404, detail="Driver not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(driver, k, v)
    db.commit()
    db.refresh(driver)
    return driver


@router.delete("/{driver_id}", status_code=204)
def delete_driver(
    driver_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(*_WRITE_ROLES)),
):
    driver = db.get(Driver, driver_id)
    if driver is None:
        raise HTTPException(status_code=404, detail="Driver not found")
    if driver.trips:
        raise HTTPException(status_code=409, detail="Cannot delete a driver with trip history")
    db.delete(driver)
    db.commit()
