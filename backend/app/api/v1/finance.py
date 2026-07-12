"""Fuel logs and expenses. Fleet Managers and Financial Analysts can write."""
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.core.database import get_db
from app.models.enums import AppRole
from app.models.models import Expense, FuelLog, User
from app.schemas.schemas import ExpenseCreate, ExpenseRead, FuelCreate, FuelRead

router = APIRouter(tags=["finance"])

_WRITE_ROLES = (AppRole.FLEET_MANAGER, AppRole.FINANCIAL_ANALYST)


@router.get("/fuel")
def list_fuel(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    logs = db.scalars(select(FuelLog).order_by(FuelLog.date.desc())).all()
    out = []
    for f in logs:
        d = FuelRead.model_validate(f).model_dump(mode="json")
        d["vehicle"] = (
            {"registration_number": f.vehicle.registration_number, "model": f.vehicle.model}
            if f.vehicle
            else None
        )
        out.append(d)
    return out


@router.post("/fuel", response_model=FuelRead, status_code=201)
def create_fuel(
    payload: FuelCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(*_WRITE_ROLES)),
):
    log = FuelLog(**payload.model_dump())
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@router.get("/expenses")
def list_expenses(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    rows = db.scalars(select(Expense).order_by(Expense.date.desc())).all()
    out = []
    for e in rows:
        d = ExpenseRead.model_validate(e).model_dump(mode="json")
        d["vehicle"] = (
            {"registration_number": e.vehicle.registration_number, "model": e.vehicle.model}
            if e.vehicle
            else None
        )
        out.append(d)
    return out


@router.post("/expenses", response_model=ExpenseRead, status_code=201)
def create_expense(
    payload: ExpenseCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(*_WRITE_ROLES)),
):
    expense = Expense(**payload.model_dump())
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense
