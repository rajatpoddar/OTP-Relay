import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timezone

from app.core.database import get_db
from app.core.dependencies import require_super_admin, get_tenant_context, TenantContextResult
from app.models.subscription import SubscriptionPlan, Subscription, Payment, AppVersion, SubscriptionStatus
from app.models.organization import Organization
from app.models.staff_operator import Staff, Operator
from app.models.device_service import Device
from app.schemas.device import (
    SubscriptionPlanCreate, SubscriptionPlanResponse, SubscriptionResponse,
)

router = APIRouter(prefix="/api", tags=["Subscriptions & Plans"])


# --- Super Admin: Plans ---

@router.post("/super-admin/plans", response_model=SubscriptionPlanResponse)
async def create_plan(
    request: SubscriptionPlanCreate,
    current_user=Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    plan = SubscriptionPlan(
        name=request.name,
        description=request.description,
        monthly_price=request.monthly_price,
        staff_limit=request.staff_limit,
        operator_limit=request.operator_limit,
        device_limit=request.device_limit,
        otp_limit=request.otp_limit,
        features=request.features,
    )
    db.add(plan)
    await db.flush()
    return SubscriptionPlanResponse.model_validate(plan)


@router.get("/super-admin/plans", response_model=List[SubscriptionPlanResponse])
async def list_plans(
    current_user=Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(SubscriptionPlan).order_by(SubscriptionPlan.monthly_price))
    return [SubscriptionPlanResponse.model_validate(p) for p in result.scalars().all()]


@router.get("/super-admin/plans/{plan_id}", response_model=SubscriptionPlanResponse)
async def get_plan(
    plan_id: uuid.UUID,
    current_user=Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(SubscriptionPlan).where(SubscriptionPlan.id == plan_id))
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return SubscriptionPlanResponse.model_validate(plan)


@router.put("/super-admin/plans/{plan_id}", response_model=SubscriptionPlanResponse)
async def update_plan(
    plan_id: uuid.UUID,
    request: SubscriptionPlanCreate,
    current_user=Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(SubscriptionPlan).where(SubscriptionPlan.id == plan_id))
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    for field, value in request.model_dump().items():
        setattr(plan, field, value)
    db.add(plan)
    await db.flush()
    return SubscriptionPlanResponse.model_validate(plan)


@router.delete("/super-admin/plans/{plan_id}")
async def delete_plan(
    plan_id: uuid.UUID,
    current_user=Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(SubscriptionPlan).where(SubscriptionPlan.id == plan_id))
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    # Check if any subscriptions use this plan
    sub_count = await db.execute(
        select(func.count(Subscription.id)).where(Subscription.plan_id == plan_id)
    )
    if sub_count.scalar() > 0:
        raise HTTPException(status_code=400, detail="Cannot delete plan with active subscriptions")

    await db.delete(plan)
    await db.flush()
    return {"message": "Plan deleted"}


# --- Super Admin: Subscriptions ---

@router.get("/super-admin/subscriptions", response_model=List[dict])
async def list_subscriptions(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user=Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Subscription, Organization, SubscriptionPlan)
        .join(Organization, Subscription.organization_id == Organization.id)
        .join(SubscriptionPlan, Subscription.plan_id == SubscriptionPlan.id)
        .offset(skip)
        .limit(limit)
    )
    rows = result.all()

    return [
        {
            "id": str(sub.id),
            "organization_id": str(sub.organization_id),
            "organization_name": org.name,
            "plan_name": plan.name,
            "status": sub.status.value if sub.status else "UNKNOWN",
            "starts_at": sub.starts_at.isoformat() if sub.starts_at else None,
            "expires_at": sub.expires_at.isoformat() if sub.expires_at else None,
            "monthly_price": plan.monthly_price,
        }
        for sub, org, plan in rows
    ]


@router.post("/super-admin/subscriptions", response_model=SubscriptionResponse)
async def create_subscription(
    organization_id: uuid.UUID,
    plan_id: uuid.UUID,
    current_user=Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    # Check if org already has subscription
    existing = await db.execute(
        select(Subscription).where(Subscription.organization_id == organization_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Organization already has a subscription")

    sub = Subscription(
        organization_id=organization_id,
        plan_id=plan_id,
        status=SubscriptionStatus.TRIAL,
        starts_at=datetime.now(timezone.utc),
        trial_ends_at=datetime.now(timezone.utc),
    )
    db.add(sub)
    await db.flush()
    return SubscriptionResponse.model_validate(sub)


@router.patch("/super-admin/subscriptions/{sub_id}/activate")
async def activate_subscription(
    sub_id: uuid.UUID,
    current_user=Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Subscription).where(Subscription.id == sub_id))
    sub = result.scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    sub.status = SubscriptionStatus.ACTIVE
    db.add(sub)
    await db.flush()
    return {"message": "Subscription activated"}


@router.patch("/super-admin/subscriptions/{sub_id}/suspend")
async def suspend_subscription(
    sub_id: uuid.UUID,
    current_user=Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Subscription).where(Subscription.id == sub_id))
    sub = result.scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    sub.status = SubscriptionStatus.SUSPENDED
    db.add(sub)
    await db.flush()
    return {"message": "Subscription suspended"}


# --- Super Admin: App Versions ---

@router.get("/super-admin/app-versions", response_model=List[dict])
async def list_app_versions(
    current_user=Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(AppVersion).order_by(AppVersion.created_at.desc()))
    versions = result.scalars().all()
    return [
        {
            "id": str(v.id),
            "version": v.version,
            "minimum_supported_version": v.minimum_supported_version,
            "latest_version": v.latest_version,
            "force_update": v.force_update,
            "release_notes": v.release_notes,
            "download_url": v.download_url,
            "is_active": v.is_active,
            "created_at": v.created_at.isoformat() if v.created_at else None,
        }
        for v in versions
    ]


@router.post("/super-admin/app-versions", response_model=dict)
async def create_app_version(
    version: str,
    latest_version: str,
    minimum_supported_version: Optional[str] = None,
    force_update: bool = False,
    release_notes: Optional[str] = None,
    download_url: Optional[str] = None,
    current_user=Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    app_version = AppVersion(
        version=version,
        latest_version=latest_version,
        minimum_supported_version=minimum_supported_version,
        force_update=force_update,
        release_notes=release_notes,
        download_url=download_url,
    )
    db.add(app_version)
    await db.flush()
    return {
        "id": str(app_version.id),
        "version": app_version.version,
        "message": "App version created",
    }


# --- Office Admin: Current Subscription ---

@router.get("/admin/subscription")
async def get_my_subscription(
    tenant: TenantContextResult = Depends(get_tenant_context),
):
    """Get current organization's subscription details."""
    result = await tenant.db.execute(
        select(Subscription, SubscriptionPlan)
        .join(SubscriptionPlan, Subscription.plan_id == SubscriptionPlan.id)
        .where(Subscription.organization_id == tenant.organization_id)
    )
    row = result.one_or_none()
    if not row:
        return {"has_subscription": False}

    sub, plan = row

    # Get usage counts
    staff_count = (await tenant.db.execute(
        select(func.count(Staff.id)).where(Staff.organization_id == tenant.organization_id)
    )).scalar()

    operator_count = (await tenant.db.execute(
        select(func.count(Operator.id)).where(Operator.organization_id == tenant.organization_id)
    )).scalar()

    device_count = (await tenant.db.execute(
        select(func.count(Device.id)).where(Device.organization_id == tenant.organization_id)
    )).scalar()

    return {
        "has_subscription": True,
        "plan_name": plan.name,
        "monthly_price": plan.monthly_price,
        "status": sub.status.value if sub.status else "UNKNOWN",
        "starts_at": sub.starts_at.isoformat() if sub.starts_at else None,
        "expires_at": sub.expires_at.isoformat() if sub.expires_at else None,
        "limits": {
            "staff_limit": plan.staff_limit,
            "operator_limit": plan.operator_limit,
            "device_limit": plan.device_limit,
            "otp_limit": plan.otp_limit,
        },
        "usage": {
            "staff_count": staff_count,
            "operator_count": operator_count,
            "device_count": device_count,
        },
    }


# --- Public: App Version Check (No Auth Required) ---

@router.get("/public/app-version/latest")
async def get_latest_version(
    current_version: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Check for latest app version (public endpoint, no auth required)."""
    result = await db.execute(
        select(AppVersion)
        .where(AppVersion.is_active == True)
        .order_by(AppVersion.created_at.desc())
        .limit(1)
    )
    version = result.scalar_one_or_none()
    
    if not version:
        return {
            "version": None,
            "force_update": False,
            "release_notes": None,
            "download_url": None,
            "minimum_supported_version": None,
            "is_update_available": False,
        }
    
    # Check if update is available
    is_update_available = False
    if current_version and version.version:
        try:
            current_parts = current_version.split(".")
            latest_parts = version.version.split(".")
            
            # Pad with zeros
            max_len = max(len(current_parts), len(latest_parts))
            current_padded = [int(x) for x in current_parts] + [0] * (max_len - len(current_parts))
            latest_padded = [int(x) for x in latest_parts] + [0] * (max_len - len(latest_parts))
            
            is_update_available = latest_padded > current_padded
        except (ValueError, AttributeError):
            is_update_available = True
    else:
        is_update_available = True
    
    return {
        "version": version.version,
        "force_update": version.force_update,
        "release_notes": version.release_notes,
        "download_url": version.download_url,
        "minimum_supported_version": version.minimum_supported_version,
        "is_update_available": is_update_available,
    }
