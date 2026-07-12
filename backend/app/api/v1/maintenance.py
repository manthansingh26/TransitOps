"""Maintenance endpoints with auto vehicle-status sync."""
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.core.database import get_db
from app.models.enums import AppRole
from app.models.models import MaintenanceLog, User
from app.schemas.schemas import MaintenanceCreate, MaintenanceRead
from app.services import business

router = APIRouter(prefix="/maintenance", tags=["maintenance"])


@router.get("", response_model=list[MaintenanceRead])
def list_maintenance(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.scalars(select(MaintenanceLog).order_by(MaintenanceLog.opened_at.desc())).all()


@router.post("", response_model=MaintenanceRead, status_code=201)
def open_maintenance(
    payload: MaintenanceCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(AppRole.FLEET_MANAGER)),
):
    return business.open_maintenance(db, payload)


@router.post("/{log_id}/close", response_model=MaintenanceRead)
def close_maintenance(
    log_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(AppRole.FLEET_MANAGER)),
):
    return business.close_maintenance(db, log_id)
