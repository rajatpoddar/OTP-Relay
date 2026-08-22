from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime


class StaffOperatorPreferenceResponse(BaseModel):
    """Response for a staff-operator OTP sharing preference."""
    id: UUID
    organization_id: UUID
    staff_id: UUID
    operator_id: UUID
    operator_name: Optional[str] = None
    enabled: bool
    created_at: datetime
    updated_at: datetime
    updated_by: Optional[UUID] = None

    class Config:
        from_attributes = True


class StaffOperatorPreferenceCreate(BaseModel):
    """Request to create/update a staff-operator OTP sharing preference."""
    operator_id: UUID
    enabled: bool = True


class StaffOperatorPreferenceUpdate(BaseModel):
    """Request to update a staff-operator OTP sharing preference."""
    enabled: bool


class StaffOperatorBulkUpdate(BaseModel):
    """Bulk update preferences for a staff member."""
    preferences: list[StaffOperatorPreferenceCreate]
