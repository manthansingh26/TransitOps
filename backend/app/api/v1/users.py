"""User management. Only Fleet Managers can list/change roles."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.core.database import get_db
from app.models.enums import AppRole
from app.models.models import User
from app.schemas.schemas import UserRead

router = APIRouter(prefix="/users", tags=["users"])


class RoleUpdate(BaseModel):
    role: AppRole


@router.get("", response_model=list[UserRead])
def list_users(
    db: Session = Depends(get_db), _: User = Depends(require_roles(AppRole.FLEET_MANAGER))
):
    return db.scalars(select(User).order_by(User.created_at.desc())).all()


@router.patch("/{user_id}/role", response_model=UserRead)
def update_role(
    user_id: int,
    payload: RoleUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(AppRole.FLEET_MANAGER)),
):
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = payload.role
    db.commit()
    db.refresh(user)
    return user
