import uuid
from typing import Optional
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func, and_, case, extract

from app.core.dependencies import get_tenant_context, TenantContextResult, require_super_admin
from app.models.otp import OtpMessage, OtpStatus
from app.models.staff_operator import Staff, Operator
from app.models.device_service import Device, DeviceStatus

router = APIRouter(prefix="/api", tags=["Reports & Analytics"])


@router.get("/admin/reports/summary")
async def report_summary(
    days: int = Query(30, ge=1, le=365),
    tenant: TenantContextResult = Depends(get_tenant_context),
):
    """Summary report for the last N days."""
    since = datetime.now(timezone.utc) - timedelta(days=days)

    result = await tenant.db.execute(
        select(
            func.count(OtpMessage.id).label("total"),
            func.count(case((OtpMessage.status == OtpStatus.USED, 1))).label("used"),
            func.count(case((OtpMessage.status == OtpStatus.FAILED, 1))).label("failed"),
            func.count(case((OtpMessage.status == OtpStatus.UNASSIGNED, 1))).label("unassigned"),
            func.count(case((OtpMessage.status == OtpStatus.EXPIRED, 1))).label("expired"),
        ).where(
            OtpMessage.organization_id == tenant.organization_id,
            OtpMessage.received_at >= since,
        )
    )
    row = result.one()

    return {
        "period_days": days,
        "total": row.total,
        "used": row.used,
        "failed": row.failed,
        "unassigned": row.unassigned,
        "expired": row.expired,
        "success_rate": round((row.used / row.total * 100), 1) if row.total > 0 else 0,
    }


@router.get("/admin/reports/trend")
async def report_trend(
    days: int = Query(7, ge=1, le=30),
    tenant: TenantContextResult = Depends(get_tenant_context),
):
    """Daily OTP trend for the last N days."""
    since = datetime.now(timezone.utc) - timedelta(days=days)

    result = await tenant.db.execute(
        select(
            func.date(OtpMessage.received_at).label("date"),
            func.count(OtpMessage.id).label("total"),
            func.count(case((OtpMessage.status == OtpStatus.USED, 1))).label("used"),
            func.count(case((OtpMessage.status == OtpStatus.FAILED, 1))).label("failed"),
        )
        .where(
            OtpMessage.organization_id == tenant.organization_id,
            OtpMessage.received_at >= since,
        )
        .group_by(func.date(OtpMessage.received_at))
        .order_by(func.date(OtpMessage.received_at))
    )
    rows = result.all()

    return [
        {
            "date": str(row.date),
            "total": row.total,
            "used": row.used,
            "failed": row.failed,
        }
        for row in rows
    ]


@router.get("/admin/reports/operator-performance")
async def operator_performance(
    tenant: TenantContextResult = Depends(get_tenant_context),
):
    """Operator-wise OTP performance."""
    from app.models.otp import OtpDeliveryEvent

    result = await tenant.db.execute(
        select(
            Operator.full_name,
            func.count(OtpDeliveryEvent.id).label("total_delivered"),
            func.count(case((OtpDeliveryEvent.event_type == "used", 1))).label("used"),
        )
        .join(OtpDeliveryEvent, OtpDeliveryEvent.operator_id == Operator.id)
        .where(Operator.organization_id == tenant.organization_id)
        .group_by(Operator.id, Operator.full_name)
        .order_by(desc(func.count(OtpDeliveryEvent.id)))
    )
    rows = result.all()

    return [
        {
            "operator_name": row.full_name,
            "total_delivered": row.total_delivered,
            "used": row.used,
            "utilization_rate": round((row.used / row.total_delivered * 100), 1) if row.total_delivered > 0 else 0,
        }
        for row in rows
    ]


@router.get("/admin/reports/device-activity")
async def device_activity(
    tenant: TenantContextResult = Depends(get_tenant_context),
):
    """Device activity report."""
    result = await tenant.db.execute(
        select(
            Device.device_id,
            Device.model,
            Device.status,
            Device.last_seen_at,
            Device.last_sync_at,
        )
        .where(Device.organization_id == tenant.organization_id)
        .order_by(desc(Device.last_seen_at))
    )
    devices = result.scalars().all()

    return [
        {
            "device_id": d.device_id,
            "model": d.model,
            "status": d.status.value if d.status else "UNKNOWN",
            "last_seen": d.last_seen_at.isoformat() if d.last_seen_at else None,
            "last_sync": d.last_sync_at.isoformat() if d.last_sync_at else None,
        }
        for d in devices
    ]
