"""Authentication schemas: signup, login, and token payloads."""
from pydantic import BaseModel, EmailStr

from app.models.enums import RoleName
from app.schemas.user import UserRead


class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: RoleName


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AuthResponse(Token):
    user: UserRead


class TokenPayload(BaseModel):
    """Decoded JWT claims."""
    sub: str
    role: RoleName
