from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID
from datetime import datetime


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: "UserInfo"


class RefreshRequest(BaseModel):
    refresh_token: str


class UserInfo(BaseModel):
    id: UUID
    email: str
    full_name: str
    role: str
    organization_id: Optional[UUID] = None
    is_active: bool

    class Config:
        from_attributes = True


class PasswordChange(BaseModel):
    current_password: str
    new_password: str
