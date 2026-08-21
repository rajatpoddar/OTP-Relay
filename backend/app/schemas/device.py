from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime


class DeviceRegisterRequest(BaseModel):
    device_id: str
    activation_code: str
    model: Optional[str] = None
    android_version: Optional[str] = None
    app_version: Optional[str] = None


class DeviceHeartbeatRequest(BaseModel):
    device_id: str


class DeviceSyncRequest(BaseModel):
    device_id: str
    otp_events: list[dict]


class DeviceResponse(BaseModel):
    id: UUID
    device_id: str
    staff_id: UUID
    organization_id: UUID
    model: Optional[str] = None
    android_version: Optional[str] = None
    app_version: Optional[str] = None
    status: str
    registered_at: datetime
    last_seen_at: Optional[datetime] = None
    last_sync_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SubscriptionPlanCreate(BaseModel):
    name: str
    description: Optional[str] = None
    monthly_price: int
    staff_limit: int = 10
    operator_limit: int = 2
    device_limit: int = 10
    otp_limit: int = 1000
    features: Optional[str] = None


class SubscriptionPlanResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str] = None
    monthly_price: int
    staff_limit: int
    operator_limit: int
    device_limit: int
    otp_limit: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class SubscriptionResponse(BaseModel):
    id: UUID
    organization_id: UUID
    plan_id: UUID
    status: str
    starts_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    trial_ends_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True
