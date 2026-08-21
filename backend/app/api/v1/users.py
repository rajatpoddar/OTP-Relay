import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import hash_password
from app.core.dependencies import require_super_admin
from app.core.dependencies import get_tenant_context, TenantContextResult, require_office_admin
from app.models.user import User, UserRole
from app.models.staff_operator import Staff, Operator
from app.schemas.user import (
    UserCreate, UserUpdate, UserResponse,
    StaffCreate, StaffUpdate, StaffResponse,
    OperatorCreate, OperatorUpdate, OperatorResponse,
)

router = APIRouter(prefix="/api", tags=["Users"])


# --- Super Admin: Platform Users ---
@router.get("/super-admin/users", response_model=List[UserResponse])
async def list_all_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user=Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).offset(skip).limit(limit))
    return [UserResponse.model_validate(u) for u in result.scalars().all()]


# --- Office Admin: Staff Management ---
@router.post("/admin/staff", response_model=StaffResponse)
async def create_staff(
    request: StaffCreate,
    current_user=Depends(require_office_admin),
    tenant: TenantContextResult = Depends(get_tenant_context),
):
    # Create user with STAFF role
    user = User(
        email=f"staff_{request.mobile_number}@otp-relay.local",
        full_name=request.full_name,
        phone=request.mobile_number,
        hashed_password=hash_password("changeme"),
        role=UserRole.STAFF,
        organization_id=tenant.organization_id,
    )
    tenant.db.add(user)
    await tenant.db.flush()

    staff = Staff(
        user_id=user.id,
        organization_id=tenant.organization_id,
        staff_id_number=request.staff_id_number,
        full_name=request.full_name,
        mobile_number=request.mobile_number,
        department_id=request.department_id,
    )
    tenant.db.add(staff)
    await tenant.db.flush()
    return StaffResponse.model_validate(staff)


@router.get("/admin/staff", response_model=List[StaffResponse])
async def list_staff(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user=Depends(require_office_admin),
    tenant: TenantContextResult = Depends(get_tenant_context),
):
    query = select(Staff).where(Staff.organization_id == tenant.organization_id).offset(skip).limit(limit)
    result = await tenant.db.execute(query)
    return [StaffResponse.model_validate(s) for s in result.scalars().all()]


@router.get("/admin/staff/{staff_id}", response_model=StaffResponse)
async def get_staff(
    staff_id: uuid.UUID,
    tenant: TenantContextResult = Depends(get_tenant_context),
):
    from app.core.dependencies import require_organization_id
    result = await tenant.db.execute(
        select(Staff).where(Staff.id == staff_id, Staff.organization_id == tenant.organization_id)
    )
    staff = result.scalar_one_or_none()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    return StaffResponse.model_validate(staff)


@router.put("/admin/staff/{staff_id}", response_model=StaffResponse)
async def update_staff(
    staff_id: uuid.UUID,
    request: StaffUpdate,
    tenant: TenantContextResult = Depends(get_tenant_context),
):
    result = await tenant.db.execute(
        select(Staff).where(Staff.id == staff_id, Staff.organization_id == tenant.organization_id)
    )
    staff = result.scalar_one_or_none()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")

    for field, value in request.model_dump(exclude_unset=True).items():
        setattr(staff, field, value)
    tenant.db.add(staff)
    await tenant.db.flush()
    return StaffResponse.model_validate(staff)


# --- Office Admin: Operator Management ---
@router.post("/admin/operators", response_model=OperatorResponse)
async def create_operator(
    request: OperatorCreate,
    tenant: TenantContextResult = Depends(get_tenant_context),
):
    user = User(
        email=f"operator_{uuid.uuid4().hex[:8]}@otp-relay.local",
        full_name=request.full_name,
        hashed_password=hash_password("changeme"),
        role=UserRole.OPERATOR,
        organization_id=tenant.organization_id,
    )
    tenant.db.add(user)
    await tenant.db.flush()

    operator = Operator(
        user_id=user.id,
        organization_id=tenant.organization_id,
        full_name=request.full_name,
    )
    tenant.db.add(operator)
    await tenant.db.flush()
    return OperatorResponse.model_validate(operator)


@router.get("/admin/operators", response_model=List[OperatorResponse])
async def list_operators(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    tenant: TenantContextResult = Depends(get_tenant_context),
):
    query = select(Operator).where(Operator.organization_id == tenant.organization_id).offset(skip).limit(limit)
    result = await tenant.db.execute(query)
    return [OperatorResponse.model_validate(o) for o in result.scalars().all()]


@router.get("/admin/operators/{operator_id}", response_model=OperatorResponse)
async def get_operator(
    operator_id: uuid.UUID,
    tenant: TenantContextResult = Depends(get_tenant_context),
):
    result = await tenant.db.execute(
        select(Operator).where(Operator.id == operator_id, Operator.organization_id == tenant.organization_id)
    )
    operator = result.scalar_one_or_none()
    if not operator:
        raise HTTPException(status_code=404, detail="Operator not found")
    return OperatorResponse.model_validate(operator)


@router.put("/admin/operators/{operator_id}", response_model=OperatorResponse)
async def update_operator(
    operator_id: uuid.UUID,
    request: OperatorUpdate,
    tenant: TenantContextResult = Depends(get_tenant_context),
):
    result = await tenant.db.execute(
        select(Operator).where(Operator.id == operator_id, Operator.organization_id == tenant.organization_id)
    )
    operator = result.scalar_one_or_none()
    if not operator:
        raise HTTPException(status_code=404, detail="Operator not found")

    for field, value in request.model_dump(exclude_unset=True).items():
        setattr(operator, field, value)
    tenant.db.add(operator)
    await tenant.db.flush()
    return OperatorResponse.model_validate(operator)
