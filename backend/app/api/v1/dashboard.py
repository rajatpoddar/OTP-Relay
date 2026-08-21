from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.core.dependencies import require_super_admin, get_tenant_context, TenantContextResult
from app.models.organization import Organization
from app.models.user import User, UserRole
from app.models.staff_operator import Staff, Operator
from app.models.device_service import Device, DeviceStatus
from app.models.otp import OtpMessage, OtpStatus

router = APIRouter(prefix="/api", tags=["Dashboard"])


@router.get("/super-admin/dashboard")
async def super_admin_dashboard(
    current_user=Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    """Super Admin dashboard metrics."""
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    month_start = today_start.replace(day=1)

    total_orgs = (await db.execute(select(func.count(Organization.id)))).scalar()
    active_orgs = (await db.execute(
        select(func.count(Organization.id)).where(Organization.status == "ACTIVE")
    )).scalar()
    trial_orgs = (await db.execute(
        select(func.count(Organization.id)).where(Organization.status == "TRIAL")
    )).scalar()
    suspended_orgs = (await db.execute(
        select(func.count(Organization.id)).where(Organization.status.in_(["SUSPENDED", "EXPIRED"]))
    )).scalar()
    total_staff = (await db.execute(select(func.count(Staff.id)))).scalar()
    total_operators = (await db.execute(select(func.count(Operator.id)))).scalar()
    total_devices = (await db.execute(select(func.count(Device.id)))).scalar()
    otps_today = (await db.execute(
        select(func.count(OtpMessage.id)).where(OtpMessage.received_at >= today_start)
    )).scalar()
    otps_month = (await db.execute(
        select(func.count(OtpMessage.id)).where(OtpMessage.received_at >= month_start)
    )).scalar()

    return {
        "total_organizations": total_orgs,
        "active_organizations": active_orgs,
        "trial_organizations": trial_orgs,
        "expired_suspended_organizations": suspended_orgs,
        "total_staff": total_staff,
        "total_operators": total_operators,
        "total_devices": total_devices,
        "otps_today": otps_today,
        "otps_this_month": otps_month,
    }


@router.get("/admin/dashboard")
async def office_admin_dashboard(
    tenant: TenantContextResult = Depends(get_tenant_context),
):
    """Office Admin dashboard metrics."""
    db = tenant.db
    org_id = tenant.organization_id
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

    total_staff = (await db.execute(
        select(func.count(Staff.id)).where(Staff.organization_id == org_id)
    )).scalar()
    total_operators = (await db.execute(
        select(func.count(Operator.id)).where(Operator.organization_id == org_id)
    )).scalar()
    active_devices = (await db.execute(
        select(func.count(Device.id)).where(
            Device.organization_id == org_id,
            Device.status == DeviceStatus.ACTIVE,
        )
    )).scalar()
    otps_today = (await db.execute(
        select(func.count(OtpMessage.id)).where(
            OtpMessage.organization_id == org_id,
            OtpMessage.received_at >= today_start,
        )
    )).scalar()

    pending_otps = (await db.execute(
        select(func.count(OtpMessage.id)).where(
            OtpMessage.organization_id == org_id,
            OtpMessage.status.in_([OtpStatus.RECEIVED, OtpStatus.PROCESSING, OtpStatus.ROUTED, OtpStatus.DELIVERED]),
        )
    )).scalar()

    used_otps = (await db.execute(
        select(func.count(OtpMessage.id)).where(
            OtpMessage.organization_id == org_id,
            OtpMessage.status == OtpStatus.USED,
            OtpMessage.received_at >= today_start,
        )
    )).scalar()

    failed_otps = (await db.execute(
        select(func.count(OtpMessage.id)).where(
            OtpMessage.organization_id == org_id,
            OtpMessage.status == OtpStatus.FAILED,
            OtpMessage.received_at >= today_start,
        )
    )).scalar()

    return {
        "total_staff": total_staff,
        "total_operators": total_operators,
        "active_devices": active_devices,
        "otps_today": otps_today,
        "pending_otps": pending_otps,
        "used_otps": used_otps,
        "failed_otps": failed_otps,
    }
