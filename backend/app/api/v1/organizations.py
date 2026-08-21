import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.dependencies import require_super_admin, get_tenant_context, TenantContextResult
from app.models.organization import Organization, State, District, Block
from app.schemas.organization import (
    OrganizationCreate, OrganizationUpdate, OrganizationResponse,
    StateCreate, StateResponse,
    DistrictCreate, DistrictResponse,
    BlockCreate, BlockResponse,
)

router = APIRouter(prefix="/api", tags=["Organizations"])


# --- Super Admin: Organization Management ---
@router.post("/super-admin/organizations", response_model=OrganizationResponse)
async def create_organization(
    request: OrganizationCreate,
    current_user=Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    org = Organization(
        name=request.name,
        code=request.code,
        org_type=request.org_type,
        state_id=request.state_id,
        district_id=request.district_id,
        block_id=request.block_id,
    )
    db.add(org)
    await db.flush()
    return OrganizationResponse.model_validate(org)


@router.get("/super-admin/organizations", response_model=List[OrganizationResponse])
async def list_organizations(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user=Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Organization).offset(skip).limit(limit))
    orgs = result.scalars().all()
    return [OrganizationResponse.model_validate(o) for o in orgs]


@router.get("/super-admin/organizations/{org_id}", response_model=OrganizationResponse)
async def get_organization(
    org_id: uuid.UUID,
    current_user=Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Organization).where(Organization.id == org_id))
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return OrganizationResponse.model_validate(org)


@router.put("/super-admin/organizations/{org_id}", response_model=OrganizationResponse)
async def update_organization(
    org_id: uuid.UUID,
    request: OrganizationUpdate,
    current_user=Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Organization).where(Organization.id == org_id))
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    update_data = request.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(org, field, value)
    db.add(org)
    await db.flush()
    return OrganizationResponse.model_validate(org)


@router.patch("/super-admin/organizations/{org_id}/suspend")
async def suspend_organization(
    org_id: uuid.UUID,
    current_user=Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Organization).where(Organization.id == org_id))
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    org.status = "SUSPENDED"
    db.add(org)
    await db.flush()
    return {"message": "Organization suspended"}


@router.patch("/super-admin/organizations/{org_id}/activate")
async def activate_organization(
    org_id: uuid.UUID,
    current_user=Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Organization).where(Organization.id == org_id))
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    org.status = "ACTIVE"
    db.add(org)
    await db.flush()
    return {"message": "Organization activated"}


# --- Hierarchy: States ---
@router.get("/super-admin/states", response_model=List[StateResponse])
async def list_states(
    current_user=Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(State))
    return [StateResponse.model_validate(s) for s in result.scalars().all()]


@router.post("/super-admin/states", response_model=StateResponse)
async def create_state(
    request: StateCreate,
    current_user=Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    state = State(name=request.name, code=request.code)
    db.add(state)
    await db.flush()
    return StateResponse.model_validate(state)


# --- Hierarchy: Districts ---
@router.get("/super-admin/districts", response_model=List[DistrictResponse])
async def list_districts(
    state_id: Optional[uuid.UUID] = None,
    current_user=Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    query = select(District)
    if state_id:
        query = query.where(District.state_id == state_id)
    result = await db.execute(query)
    return [DistrictResponse.model_validate(d) for d in result.scalars().all()]


@router.post("/super-admin/districts", response_model=DistrictResponse)
async def create_district(
    request: DistrictCreate,
    current_user=Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    district = District(name=request.name, code=request.code, state_id=request.state_id)
    db.add(district)
    await db.flush()
    return DistrictResponse.model_validate(district)


# --- Hierarchy: Blocks ---
@router.get("/super-admin/blocks", response_model=List[BlockResponse])
async def list_blocks(
    district_id: Optional[uuid.UUID] = None,
    current_user=Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    query = select(Block)
    if district_id:
        query = query.where(Block.district_id == district_id)
    result = await db.execute(query)
    return [BlockResponse.model_validate(b) for b in result.scalars().all()]


@router.post("/super-admin/blocks", response_model=BlockResponse)
async def create_block(
    request: BlockCreate,
    current_user=Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    block = Block(name=request.name, code=request.code, district_id=request.district_id)
    db.add(block)
    await db.flush()
    return BlockResponse.model_validate(block)
