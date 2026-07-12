"""User-related Pydantic schemas."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr

from app.models.enums import RoleName


class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: RoleName


class UserCreate(UserBase):
    password: str


class UserRead(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_active: bool
    created_at: datetime
