from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime


class UserCreate(BaseModel):
    email: str
    full_name: str
    phone: Optional[str] = None
    password: str
    role: str
    organization_id: Optional[UUID] = None


class UserUpdate(BaseModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    organization_id: Optional[UUID] = None
    is_active: Optional[bool] = None


class UserResponse(BaseModel):
    id: UUID
    email: str
    full_name: str
    phone: Optional[str] = None
    role: str
    organization_id: Optional[UUID] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class StaffCreate(BaseModel):
    staff_id_number: Optional[str] = None
    full_name: str
    mobile_number: str
    designation: Optional[str] = None
    department_id: Optional[UUID] = None


class StaffUpdate(BaseModel):
    full_name: Optional[str] = None
    mobile_number: Optional[str] = None
    designation: Optional[str] = None
    department_id: Optional[UUID] = None
    is_active: Optional[bool] = None


class StaffResponse(BaseModel):
    id: UUID
    user_id: UUID
    organization_id: UUID
    staff_id_number: Optional[str] = None
    full_name: str
    mobile_number: str
    designation: Optional[str] = None
    department_id: Optional[UUID] = None
    is_active: bool
    profile_completed: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


class OperatorCreate(BaseModel):
    user_id: UUID
    full_name: str


class OperatorUpdate(BaseModel):
    full_name: Optional[str] = None
    is_active: Optional[bool] = None


class OperatorResponse(BaseModel):
    id: UUID
    user_id: UUID
    organization_id: UUID
    full_name: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
