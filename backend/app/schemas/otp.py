from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime


class OtpSubmitRequest(BaseModel):
    sender_id_text: str
    message: str
    staff_id: Optional[UUID] = None


class OtpResponse(BaseModel):
    id: UUID
    organization_id: UUID
    staff_id: UUID
    sender_text: str
    service_name: Optional[str] = None
    otp_display: Optional[str] = None
    otp_length: Optional[int] = None
    purpose: Optional[str] = None
    reference_number: Optional[str] = None
    status: str
    expiry_at: Optional[datetime] = None
    received_at: datetime
    routed_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    viewed_at: Optional[datetime] = None
    used_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class OtpMarkUsedRequest(BaseModel):
    note: str


class OtpNoteRequest(BaseModel):
    note: str


class OtpNoteResponse(BaseModel):
    id: UUID
    otp_id: UUID
    operator_id: UUID
    note: str
    created_at: datetime

    class Config:
        from_attributes = True


class OtpDeliveryEventResponse(BaseModel):
    id: UUID
    otp_id: UUID
    operator_id: UUID
    event_type: str
    created_at: datetime

    class Config:
        from_attributes = True
