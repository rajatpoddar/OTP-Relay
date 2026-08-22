import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timezone

from app.core.database import get_db
from app.core.dependencies import get_tenant_context, TenantContextResult, require_office_admin
from app.models.device_service import Device, DeviceStatus
from app.models.staff_operator import Staff
from app.models.user import User
from app.schemas.device import (
    DeviceRegisterRequest, DeviceHeartbeatRequest, DeviceSyncRequest,
    DeviceResponse, AdminDeviceResponse, DeviceRevokeRequest,
)

router = APIRouter(prefix="/api", tags=["Device"])


# --- Admin Device Management ---

@router.get("/admin/devices", response_model=List[AdminDeviceResponse])
async def list_devices(
    status: str = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    tenant: TenantContextResult = Depends(get_tenant_context),
):
    """List all devices for the organization (Office Admin)."""
    conditions = [Device.organization_id == tenant.organization_id]
    if status:
        conditions.append(Device.status == status)

    query = (
        select(Device)
        .where(*conditions)
        .order_by(Device.registered_at.desc())
        .offset(skip)
        .limit(limit)
    )
    result = await tenant.db.execute(query)
    devices = result.scalars().all()

    # Batch-load staff info
    staff_ids = [d.staff_id for d in devices]
    staff_map = {}
    if staff_ids:
        staff_result = await tenant.db.execute(
            select(Staff).where(Staff.id.in_(staff_ids))
        )
        for s in staff_result.scalars().all():
            staff_map[s.id] = s

    response = []
    for device in devices:
        staff = staff_map.get(device.staff_id)
        response.append(AdminDeviceResponse(
            id=device.id,
            device_id=device.device_id,
            staff_id=device.staff_id,
            staff_name=staff.full_name if staff else None,
            staff_mobile=staff.mobile_number if staff else None,
            organization_id=device.organization_id,
            model=device.model,
            android_version=device.android_version,
            app_version=device.app_version,
            status=device.status.value if isinstance(device.status, DeviceStatus) else device.status,
            registered_at=device.registered_at,
            last_seen_at=device.last_seen_at,
            last_sync_at=device.last_sync_at,
            revoked_at=device.revoked_at,
        ))
    return response


@router.get("/admin/devices/{device_id}", response_model=AdminDeviceResponse)
async def get_device(
    device_id: uuid.UUID,
    tenant: TenantContextResult = Depends(get_tenant_context),
):
    """Get device detail for Office Admin."""
    result = await tenant.db.execute(
        select(Device).where(
            Device.id == device_id,
            Device.organization_id == tenant.organization_id,
        )
    )
    device = result.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    staff = None
    if device.staff_id:
        staff_result = await tenant.db.execute(
            select(Staff).where(Staff.id == device.staff_id)
        )
        staff = staff_result.scalar_one_or_none()

    return AdminDeviceResponse(
        id=device.id,
        device_id=device.device_id,
        staff_id=device.staff_id,
        staff_name=staff.full_name if staff else None,
        staff_mobile=staff.mobile_number if staff else None,
        organization_id=device.organization_id,
        model=device.model,
        android_version=device.android_version,
        app_version=device.app_version,
        status=device.status.value if isinstance(device.status, DeviceStatus) else device.status,
        registered_at=device.registered_at,
        last_seen_at=device.last_seen_at,
        last_sync_at=device.last_sync_at,
        revoked_at=device.revoked_at,
    )


@router.post("/admin/devices/{device_id}/revoke", response_model=AdminDeviceResponse)
async def revoke_device(
    device_id: uuid.UUID,
    request: DeviceRevokeRequest = None,
    tenant: TenantContextResult = Depends(get_tenant_context),
):
    """Revoke a device (Office Admin)."""
    result = await tenant.db.execute(
        select(Device).where(
            Device.id == device_id,
            Device.organization_id == tenant.organization_id,
        )
    )
    device = result.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    if device.status == DeviceStatus.REVOKED:
        raise HTTPException(status_code=400, detail="Device is already revoked")

    device.status = DeviceStatus.REVOKED
    device.revoked_at = datetime.now(timezone.utc)
    device.revoked_by = tenant.user_id
    tenant.db.add(device)
    await tenant.db.flush()

    # Audit log
    from app.models.audit import AuditLog
    audit = AuditLog(
        organization_id=tenant.organization_id,
        user_id=tenant.user_id,
        action="device_revoked",
        entity_type="device",
        entity_id=device.id,
        details=f"Device {device.device_id} revoked" + (f": {request.reason}" if request and request.reason else ""),
    )
    tenant.db.add(audit)
    await tenant.db.flush()

    # Fetch staff info for response
    staff = None
    if device.staff_id:
        staff_result = await tenant.db.execute(
            select(Staff).where(Staff.id == device.staff_id)
        )
        staff = staff_result.scalar_one_or_none()

    return AdminDeviceResponse(
        id=device.id,
        device_id=device.device_id,
        staff_id=device.staff_id,
        staff_name=staff.full_name if staff else None,
        staff_mobile=staff.mobile_number if staff else None,
        organization_id=device.organization_id,
        model=device.model,
        android_version=device.android_version,
        app_version=device.app_version,
        status=device.status.value,
        registered_at=device.registered_at,
        last_seen_at=device.last_seen_at,
        last_sync_at=device.last_sync_at,
        revoked_at=device.revoked_at,
    )


@router.post("/admin/devices/{device_id}/reactivate", response_model=AdminDeviceResponse)
async def reactivate_device(
    device_id: uuid.UUID,
    tenant: TenantContextResult = Depends(get_tenant_context),
):
    """Reactivate a revoked device (Office Admin)."""
    result = await tenant.db.execute(
        select(Device).where(
            Device.id == device_id,
            Device.organization_id == tenant.organization_id,
        )
    )
    device = result.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    device.status = DeviceStatus.ACTIVE
    device.revoked_at = None
    device.revoked_by = None
    tenant.db.add(device)
    await tenant.db.flush()

    staff = None
    if device.staff_id:
        staff_result = await tenant.db.execute(
            select(Staff).where(Staff.id == device.staff_id)
        )
        staff = staff_result.scalar_one_or_none()

    return AdminDeviceResponse(
        id=device.id,
        device_id=device.device_id,
        staff_id=device.staff_id,
        staff_name=staff.full_name if staff else None,
        staff_mobile=staff.mobile_number if staff else None,
        organization_id=device.organization_id,
        model=device.model,
        android_version=device.android_version,
        app_version=device.app_version,
        status=device.status.value,
        registered_at=device.registered_at,
        last_seen_at=device.last_seen_at,
        last_sync_at=device.last_sync_at,
        revoked_at=device.revoked_at,
    )


# --- Device Self-Service APIs ---

@router.post("/device/register", response_model=DeviceResponse)
async def register_device(
    request: DeviceRegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    from app.models.subscription import ActivationCode
    result = await db.execute(
        select(ActivationCode).where(
            ActivationCode.code == request.activation_code,
            ActivationCode.is_used == False,
        )
    )
    activation = result.scalar_one_or_none()
    if not activation or activation.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Invalid or expired activation code")

    existing = await db.execute(select(Device).where(Device.device_id == request.device_id))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Device already registered")

    staff = None
    if activation.staff_id:
        staff_result = await db.execute(select(Staff).where(Staff.id == activation.staff_id))
        staff = staff_result.scalar_one_or_none()

    device = Device(
        device_id=request.device_id,
        staff_id=activation.staff_id or uuid.uuid4(),
        organization_id=activation.organization_id,
        model=request.model,
        android_version=request.android_version,
        app_version=request.app_version,
        status=DeviceStatus.ACTIVE,
    )
    db.add(device)

    activation.is_used = True
    activation.device_id = device.id
    activation.used_at = datetime.now(timezone.utc)
    db.add(activation)
    await db.flush()

    return DeviceResponse.model_validate(device)


@router.post("/device/heartbeat")
async def device_heartbeat(
    request: DeviceHeartbeatRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Device).where(Device.device_id == request.device_id))
    device = result.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    if device.status == DeviceStatus.REVOKED:
        raise HTTPException(status_code=403, detail="Device has been revoked")

    device.last_seen_at = datetime.now(timezone.utc)
    db.add(device)
    await db.flush()
    return {"status": "ok", "last_seen": device.last_seen_at.isoformat()}


@router.post("/device/sync")
async def device_sync(
    request: DeviceSyncRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Device).where(Device.device_id == request.device_id))
    device = result.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    if device.status == DeviceStatus.REVOKED:
        raise HTTPException(status_code=403, detail="Device has been revoked")

    device.last_sync_at = datetime.now(timezone.utc)
    db.add(device)
    await db.flush()

    from app.services.otp_service import OTPService
    service = OTPService(db)

    processed = 0
    for event in request.otp_events:
        try:
            await service.process_otp(
                organization_id=device.organization_id,
                message=event.get("message", ""),
                sender_text=event.get("sender_id", ""),
                device_id=device.id,
                staff_id=device.staff_id,
            )
            processed += 1
        except Exception:
            continue

    return {"status": "ok", "processed": processed, "total": len(request.otp_events)}


@router.get("/device/status/{device_id}", response_model=DeviceResponse)
async def device_status(
    device_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Device).where(Device.device_id == device_id))
    device = result.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return DeviceResponse.model_validate(device)
