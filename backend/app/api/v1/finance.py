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


@router.get("/fuel", response_model=list[FuelRead])
def list_fuel(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.scalars(select(FuelLog).order_by(FuelLog.date.desc())).all()


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


@router.get("/expenses", response_model=list[ExpenseRead])
def list_expenses(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.scalars(select(Expense).order_by(Expense.date.desc())).all()


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
