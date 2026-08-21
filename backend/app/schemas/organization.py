from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime


class StateCreate(BaseModel):
    name: str
    code: str


class StateResponse(BaseModel):
    id: UUID
    name: str
    code: str

    class Config:
        from_attributes = True


class DistrictCreate(BaseModel):
    name: str
    code: str
    state_id: UUID


class DistrictResponse(BaseModel):
    id: UUID
    name: str
    code: str
    state_id: UUID

    class Config:
        from_attributes = True


class BlockCreate(BaseModel):
    name: str
    code: str
    district_id: UUID


class BlockResponse(BaseModel):
    id: UUID
    name: str
    code: str
    district_id: UUID

    class Config:
        from_attributes = True


class OrganizationCreate(BaseModel):
    name: str
    code: str
    org_type: str = "office"
    state_id: Optional[UUID] = None
    district_id: Optional[UUID] = None
    block_id: Optional[UUID] = None


class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    state_id: Optional[UUID] = None
    district_id: Optional[UUID] = None
    block_id: Optional[UUID] = None


class OrganizationResponse(BaseModel):
    id: UUID
    name: str
    code: str
    org_type: str
    status: str
    state_id: Optional[UUID] = None
    district_id: Optional[UUID] = None
    block_id: Optional[UUID] = None
    created_at: datetime

    class Config:
        from_attributes = True
