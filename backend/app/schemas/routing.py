from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime


class RoutingRuleCreate(BaseModel):
    name: str
    sender_id: Optional[UUID] = None
    service_id: Optional[UUID] = None
    staff_id: Optional[UUID] = None
    operator_id: UUID
    priority: str = "normal"
    is_active: bool = True
    effective_from: Optional[datetime] = None
    effective_to: Optional[datetime] = None


class RoutingRuleUpdate(BaseModel):
    name: Optional[str] = None
    sender_id: Optional[UUID] = None
    service_id: Optional[UUID] = None
    staff_id: Optional[UUID] = None
    operator_id: Optional[UUID] = None
    priority: Optional[str] = None
    is_active: Optional[bool] = None
    effective_from: Optional[datetime] = None
    effective_to: Optional[datetime] = None


class RoutingRuleResponse(BaseModel):
    id: UUID
    organization_id: UUID
    name: str
    sender_id: Optional[UUID] = None
    service_id: Optional[UUID] = None
    staff_id: Optional[UUID] = None
    operator_id: UUID
    priority: str
    is_active: bool
    effective_from: Optional[datetime] = None
    effective_to: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class SenderIdCreate(BaseModel):
    department_id: Optional[UUID] = None
    sender_id: str
    display_name: Optional[str] = None
    otp_length: int = 6
    extraction_regex: Optional[str] = None
    message_template: Optional[str] = None
    purpose_regex: Optional[str] = None
    reference_regex: Optional[str] = None
    is_active: bool = True


class SenderIdUpdate(BaseModel):
    department_id: Optional[UUID] = None
    display_name: Optional[str] = None
    otp_length: Optional[int] = None
    extraction_regex: Optional[str] = None
    message_template: Optional[str] = None
    purpose_regex: Optional[str] = None
    reference_regex: Optional[str] = None
    is_active: Optional[bool] = None


class SenderIdResponse(BaseModel):
    id: UUID
    organization_id: UUID
    department_id: Optional[UUID] = None
    sender_id: str
    display_name: Optional[str] = None
    otp_length: int
    extraction_regex: Optional[str] = None
    message_template: Optional[str] = None
    purpose_regex: Optional[str] = None
    reference_regex: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class DepartmentServiceCreate(BaseModel):
    name: str
    code: str
    display_name: Optional[str] = None


class DepartmentServiceUpdate(BaseModel):
    name: Optional[str] = None
    display_name: Optional[str] = None
    is_active: Optional[bool] = None


class DepartmentServiceResponse(BaseModel):
    id: UUID
    organization_id: UUID
    name: str
    code: str
    display_name: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class StaffAuthCreate(BaseModel):
    sender_id: UUID
    status: str = "AUTHORIZED"


class StaffAuthResponse(BaseModel):
    id: UUID
    staff_id: UUID
    sender_id: UUID
    status: str
    authorized_at: Optional[datetime] = None
    revoked_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True
