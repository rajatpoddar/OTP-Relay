import uuid
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func, and_, case
from io import StringIO
import csv

from app.core.dependencies import get_tenant_context, TenantContextResult, require_super_admin
from app.models.audit import AuditLog
from app.models.otp import OtpMessage, OtpStatus
from app.models.staff_operator import Staff, Operator
from app.models.device_service import SenderId, DepartmentService

router = APIRouter(prefix="/api", tags=["Audit & Reports"])


# --- Audit Trail ---

@router.get("/admin/audit", response_model=List[dict])
async def list_audit_logs(
    action: Optional[str] = None,
    entity_type: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    tenant: TenantContextResult = Depends(get_tenant_context),
):
    """List audit logs for the organization."""
    conditions = [AuditLog.organization_id == tenant.organization_id]
    if action:
        conditions.append(AuditLog.action == action)
    if entity_type:
        conditions.append(AuditLog.entity_type == entity_type)

    result = await tenant.db.execute(
        select(AuditLog)
        .where(and_(*conditions))
        .order_by(desc(AuditLog.created_at))
        .offset(skip)
        .limit(limit)
    )
    logs = result.scalars().all()

    return [
        {
            "id": str(log.id),
            "action": log.action,
            "entity_type": log.entity_type,
            "entity_id": str(log.entity_id) if log.entity_id else None,
            "details": log.details,
            "created_at": log.created_at.isoformat() if log.created_at else None,
        }
        for log in logs
    ]


@router.get("/super-admin/audit", response_model=List[dict])
async def list_all_audit_logs(
    organization_id: Optional[uuid.UUID] = None,
    action: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user=Depends(require_super_admin),
    db: AsyncSession = Depends(get_tenant_context),
):
    """List all audit logs (Super Admin)."""
    from app.core.database import get_db

    conditions = []
    if organization_id:
        conditions.append(AuditLog.organization_id == organization_id)
    if action:
        conditions.append(AuditLog.action == action)

    async with db as session:
        query = select(AuditLog)
        if conditions:
            query = query.where(and_(*conditions))
        query = query.order_by(desc(AuditLog.created_at)).offset(skip).limit(limit)

        result = await session.execute(query)
        logs = result.scalars().all()

        return [
            {
                "id": str(log.id),
                "organization_id": str(log.organization_id) if log.organization_id else None,
                "action": log.action,
                "entity_type": log.entity_type,
                "entity_id": str(log.entity_id) if log.entity_id else None,
                "details": log.details,
                "created_at": log.created_at.isoformat() if log.created_at else None,
            }
            for log in logs
        ]


# --- Reports ---

@router.get("/admin/reports/daily")
async def daily_report(
    date: Optional[str] = None,
    tenant: TenantContextResult = Depends(get_tenant_context),
):
    """Daily OTP report for the organization."""
    if date:
        target_date = datetime.fromisoformat(date)
    else:
        target_date = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

    next_date = target_date + timedelta(days=1)

    result = await tenant.db.execute(
        select(
            func.count(OtpMessage.id).label("total"),
            func.count(case((OtpMessage.status == OtpStatus.USED, 1))).label("used"),
            func.count(case((OtpMessage.status == OtpStatus.FAILED, 1))).label("failed"),
            func.count(case((OtpMessage.status == OtpStatus.UNASSIGNED, 1))).label("unassigned"),
            func.count(case((OtpMessage.status == OtpStatus.EXPIRED, 1))).label("expired"),
        ).where(
            OtpMessage.organization_id == tenant.organization_id,
            OtpMessage.received_at >= target_date,
            OtpMessage.received_at < next_date,
        )
    )
    row = result.one()

    return {
        "date": target_date.date().isoformat(),
        "total": row.total,
        "used": row.used,
        "failed": row.failed,
        "unassigned": row.unassigned,
        "expired": row.expired,
        "success_rate": round((row.used / row.total * 100), 1) if row.total > 0 else 0,
    }


@router.get("/admin/reports/staff-wise")
async def staff_wise_report(
    tenant: TenantContextResult = Depends(get_tenant_context),
):
    """Staff-wise OTP report."""
    result = await tenant.db.execute(
        select(
            Staff.full_name,
            Staff.mobile_number,
            func.count(OtpMessage.id).label("total_otps"),
            func.count(case((OtpMessage.status == OtpStatus.USED, 1))).label("used"),
            func.count(case((OtpMessage.status == OtpStatus.FAILED, 1))).label("failed"),
        )
        .join(OtpMessage, OtpMessage.staff_id == Staff.id)
        .where(Staff.organization_id == tenant.organization_id)
        .group_by(Staff.id, Staff.full_name, Staff.mobile_number)
        .order_by(desc(func.count(OtpMessage.id)))
    )
    rows = result.all()

    return [
        {
            "staff_name": row.full_name,
            "mobile": row.mobile_number,
            "total_otps": row.total_otps,
            "used": row.used,
            "failed": row.failed,
            "success_rate": round((row.used / row.total_otps * 100), 1) if row.total_otps > 0 else 0,
        }
        for row in rows
    ]


@router.get("/admin/reports/service-wise")
async def service_wise_report(
    tenant: TenantContextResult = Depends(get_tenant_context),
):
    """Service/Department-wise OTP report."""
    result = await tenant.db.execute(
        select(
            OtpMessage.service_name,
            func.count(OtpMessage.id).label("total_otps"),
            func.count(case((OtpMessage.status == OtpStatus.USED, 1))).label("used"),
            func.count(case((OtpMessage.status == OtpStatus.FAILED, 1))).label("failed"),
        )
        .where(
            OtpMessage.organization_id == tenant.organization_id,
            OtpMessage.service_name.isnot(None),
        )
        .group_by(OtpMessage.service_name)
        .order_by(desc(func.count(OtpMessage.id)))
    )
    rows = result.all()

    return [
        {
            "service": row.service_name,
            "total_otps": row.total_otps,
            "used": row.used,
            "failed": row.failed,
            "success_rate": round((row.used / row.total_otps * 100), 1) if row.total_otps > 0 else 0,
        }
        for row in rows
    ]


@router.get("/admin/reports/export-csv")
async def export_otps_csv(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    tenant: TenantContextResult = Depends(get_tenant_context),
):
    """Export OTPs as CSV."""
    conditions = [OtpMessage.organization_id == tenant.organization_id]

    if start_date:
        conditions.append(OtpMessage.received_at >= datetime.fromisoformat(start_date))
    if end_date:
        conditions.append(OtpMessage.received_at <= datetime.fromisoformat(end_date))

    result = await tenant.db.execute(
        select(OtpMessage)
        .where(and_(*conditions))
        .order_by(desc(OtpMessage.received_at))
        .limit(10000)
    )
    otps = result.scalars().all()

    output = StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID", "Received At", "Service", "Sender", "Purpose", "Reference",
        "OTP Length", "Status", "Routed At", "Delivered At", "Viewed At", "Used At"
    ])

    for otp in otps:
        writer.writerow([
            str(otp.id),
            otp.received_at.isoformat() if otp.received_at else "",
            otp.service_name or "",
            otp.sender_text,
            otp.purpose or "",
            otp.reference_number or "",
            otp.otp_length or "",
            otp.status.value if otp.status else "",
            otp.routed_at.isoformat() if otp.routed_at else "",
            otp.delivered_at.isoformat() if otp.delivered_at else "",
            otp.viewed_at.isoformat() if otp.viewed_at else "",
            otp.used_at.isoformat() if otp.used_at else "",
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=otp_report.csv"},
    )
