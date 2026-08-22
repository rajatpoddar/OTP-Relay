import uuid
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.core.database import get_db
from app.core.dependencies import get_tenant_context, TenantContextResult, require_operator
from app.models.otp import OtpMessage, OtpStatus, OtpDeliveryEvent, OperatorNote
from app.models.staff_operator import Operator, Staff
from app.schemas.otp import (
    OtpSubmitRequest, OtpResponse, OtpMarkUsedRequest, OtpNoteRequest, OtpNoteResponse,
)

router = APIRouter(prefix="/api", tags=["OTP"])


def mask_otp(otp_value: str) -> str:
    """Mask OTP for display: show first 2 and last 2 chars."""
    if not otp_value or len(otp_value) < 4:
        return "••••••"
    return f"{otp_value[:2]}•••{otp_value[-2:]}"


@router.post("/otp/submit", response_model=OtpResponse)
async def submit_otp(
    request: OtpSubmitRequest,
    tenant: TenantContextResult = Depends(get_tenant_context),
):
    """Submit OTP from Android device."""
    # Resolve staff_id from authenticated user
    staff_id = None
    if tenant.organization_id:
        result = await tenant.db.execute(
            select(Staff).where(
                Staff.user_id == tenant.user_id,
                Staff.organization_id == tenant.organization_id,
            )
        )
        staff = result.scalar_one_or_none()
        if staff:
            staff_id = staff.id

    from app.services.otp_service import OTPService
    service = OTPService(tenant.db)
    otp = await service.process_otp(
        organization_id=tenant.organization_id,
        message=request.message,
        sender_text=request.sender_id_text,
        staff_id=staff_id,
    )
    return OtpResponse(
        id=otp.id,
        organization_id=otp.organization_id,
        staff_id=otp.staff_id,
        sender_text=otp.sender_text,
        service_name=otp.service_name,
        otp_length=otp.otp_length,
        purpose=otp.purpose,
        reference_number=otp.reference_number,
        status=otp.status.value,
        expiry_at=otp.expiry_at,
        received_at=otp.received_at,
    )


@router.get("/operator/otp", response_model=List[OtpResponse])
async def list_operator_otps(
    status: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    tenant: TenantContextResult = Depends(get_tenant_context),
):
    """List OTPs for the current operator."""
    from app.core.security import get_current_user
    from app.models.user import User
    from app.models.staff_operator import Operator as OperatorModel

    # Get operator profile
    result = await tenant.db.execute(
        select(OperatorModel).where(
            OperatorModel.user_id == tenant.user_id,
            OperatorModel.organization_id == tenant.organization_id,
        )
    )
    operator = result.scalar_one_or_none()
    if not operator:
        raise HTTPException(status_code=404, detail="Operator profile not found")

    # Query OTPs delivered to this operator
    query = (
        select(OtpMessage)
        .where(OtpMessage.organization_id == tenant.organization_id)
        .order_by(desc(OtpMessage.received_at))
        .offset(skip)
        .limit(limit)
    )
    if status:
        query = query.where(OtpMessage.status == OtpStatus(status))

    result = await tenant.db.execute(query)
    otps = result.scalars().all()

    response = []
    for otp in otps:
        otp_display = None
        if otp.status in (OtpStatus.RECEIVED, OtpStatus.PROCESSING, OtpStatus.ROUTED, OtpStatus.DELIVERED, OtpStatus.VIEWED):
            otp_display = otp.otp_value
        else:
            otp_display = mask_otp(otp.otp_value) if otp.otp_value else None

        response.append(OtpResponse(
            id=otp.id,
            organization_id=otp.organization_id,
            staff_id=otp.staff_id,
            sender_text=otp.sender_text,
            service_name=otp.service_name,
            otp_display=otp_display,
            otp_length=otp.otp_length,
            purpose=otp.purpose,
            reference_number=otp.reference_number,
            status=otp.status.value,
            expiry_at=otp.expiry_at,
            received_at=otp.received_at,
            routed_at=otp.routed_at,
            delivered_at=otp.delivered_at,
            viewed_at=otp.viewed_at,
            used_at=otp.used_at,
        ))
    return response


@router.get("/operator/otp/{otp_id}", response_model=OtpResponse)
async def get_operator_otp(
    otp_id: uuid.UUID,
    tenant: TenantContextResult = Depends(get_tenant_context),
):
    result = await tenant.db.execute(
        select(OtpMessage).where(
            OtpMessage.id == otp_id,
            OtpMessage.organization_id == tenant.organization_id,
        )
    )
    otp = result.scalar_one_or_none()
    if not otp:
        raise HTTPException(status_code=404, detail="OTP not found")

    # Mark as viewed
    if otp.status in (OtpStatus.DELIVERED, OtpStatus.ROUTED):
        otp.status = OtpStatus.VIEWED
        otp.viewed_at = datetime.now(timezone.utc)
        tenant.db.add(otp)
        await tenant.db.flush()

    otp_display = otp.otp_value if otp.status not in (OtpStatus.USED, OtpStatus.EXPIRED, OtpStatus.FAILED) else mask_otp(otp.otp_value)

    return OtpResponse(
        id=otp.id,
        organization_id=otp.organization_id,
        staff_id=otp.staff_id,
        sender_text=otp.sender_text,
        service_name=otp.service_name,
        otp_display=otp_display,
        otp_length=otp.otp_length,
        purpose=otp.purpose,
        reference_number=otp.reference_number,
        status=otp.status.value,
        expiry_at=otp.expiry_at,
        received_at=otp.received_at,
        routed_at=otp.routed_at,
        delivered_at=otp.delivered_at,
        viewed_at=otp.viewed_at,
        used_at=otp.used_at,
    )


@router.post("/operator/otp/{otp_id}/use", response_model=OtpNoteResponse)
async def mark_otp_used(
    otp_id: uuid.UUID,
    request: OtpMarkUsedRequest,
    tenant: TenantContextResult = Depends(get_tenant_context),
):
    """Mark OTP as used with mandatory usage note."""
    result = await tenant.db.execute(
        select(OtpMessage).where(
            OtpMessage.id == otp_id,
            OtpMessage.organization_id == tenant.organization_id,
        )
    )
    otp = result.scalar_one_or_none()
    if not otp:
        raise HTTPException(status_code=404, detail="OTP not found")

    if otp.status == OtpStatus.USED:
        raise HTTPException(status_code=400, detail="OTP already marked as used")

    # Get operator profile
    from app.models.staff_operator import Operator as OperatorModel
    op_result = await tenant.db.execute(
        select(OperatorModel).where(
            OperatorModel.user_id == tenant.user_id,
            OperatorModel.organization_id == tenant.organization_id,
        )
    )
    operator = op_result.scalar_one_or_none()
    if not operator:
        raise HTTPException(status_code=404, detail="Operator profile not found")

    # Create usage note
    note = OperatorNote(
        otp_id=otp.id,
        operator_id=operator.id,
        note=request.note,
    )
    tenant.db.add(note)

    # Update OTP status
    otp.status = OtpStatus.USED
    otp.used_at = datetime.now(timezone.utc)
    tenant.db.add(otp)
    await tenant.db.flush()

    # Create delivery event
    event = OtpDeliveryEvent(
        otp_id=otp.id,
        operator_id=operator.id,
        event_type="used",
    )
    tenant.db.add(event)
    await tenant.db.flush()

    return OtpNoteResponse(
        id=note.id,
        otp_id=note.otp_id,
        operator_id=note.operator_id,
        note=note.note,
        created_at=note.created_at,
    )


@router.post("/operator/otp/{otp_id}/note", response_model=OtpNoteResponse)
async def add_otp_note(
    otp_id: uuid.UUID,
    request: OtpNoteRequest,
    tenant: TenantContextResult = Depends(get_tenant_context),
):
    """Add a note to an OTP without marking it as used."""
    result = await tenant.db.execute(
        select(OtpMessage).where(
            OtpMessage.id == otp_id,
            OtpMessage.organization_id == tenant.organization_id,
        )
    )
    otp = result.scalar_one_or_none()
    if not otp:
        raise HTTPException(status_code=404, detail="OTP not found")

    from app.models.staff_operator import Operator as OperatorModel
    op_result = await tenant.db.execute(
        select(OperatorModel).where(
            OperatorModel.user_id == tenant.user_id,
            OperatorModel.organization_id == tenant.organization_id,
        )
    )
    operator = op_result.scalar_one_or_none()
    if not operator:
        raise HTTPException(status_code=404, detail="Operator profile not found")

    note = OperatorNote(
        otp_id=otp.id,
        operator_id=operator.id,
        note=request.note,
    )
    tenant.db.add(note)
    await tenant.db.flush()

    return OtpNoteResponse(
        id=note.id,
        otp_id=note.otp_id,
        operator_id=note.operator_id,
        note=note.note,
        created_at=note.created_at,
    )


@router.get("/admin/otp", response_model=List[OtpResponse])
async def list_all_otps(
    status: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    tenant: TenantContextResult = Depends(get_tenant_context),
):
    """List all OTPs for the organization (Office Admin)."""
    query = (
        select(OtpMessage)
        .where(OtpMessage.organization_id == tenant.organization_id)
        .order_by(desc(OtpMessage.received_at))
        .offset(skip)
        .limit(limit)
    )
    if status:
        query = query.where(OtpMessage.status == OtpStatus(status))

    result = await tenant.db.execute(query)
    otps = result.scalars().all()

    return [
        OtpResponse(
            id=otp.id,
            organization_id=otp.organization_id,
            staff_id=otp.staff_id,
            sender_text=otp.sender_text,
            service_name=otp.service_name,
            otp_display=mask_otp(otp.otp_value) if otp.otp_value else None,
            otp_length=otp.otp_length,
            purpose=otp.purpose,
            reference_number=otp.reference_number,
            status=otp.status.value,
            expiry_at=otp.expiry_at,
            received_at=otp.received_at,
        )
        for otp in otps
    ]
