import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone

from app.core.database import get_db
from app.core.dependencies import get_tenant_context, TenantContextResult
from app.models.device_service import Device, DeviceStatus
from app.models.staff_operator import Staff
from app.schemas.device import (
    DeviceRegisterRequest, DeviceHeartbeatRequest, DeviceSyncRequest, DeviceResponse,
)

router = APIRouter(prefix="/api/device", tags=["Device"])


@router.post("/register", response_model=DeviceResponse)
async def register_device(
    request: DeviceRegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    # Validate activation code
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

    # Check if device already registered
    existing = await db.execute(select(Device).where(Device.device_id == request.device_id))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Device already registered")

    # Get staff from activation code
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


@router.post("/heartbeat")
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


@router.post("/sync")
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

    # Process OTP events from device
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


@router.get("/status/{device_id}", response_model=DeviceResponse)
async def device_status(
    device_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Device).where(Device.device_id == device_id))
    device = result.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return DeviceResponse.model_validate(device)


@router.post("/admin/devices/{device_id}/revoke")
async def revoke_device(
    device_id: uuid.UUID,
    tenant: TenantContextResult = Depends(get_tenant_context),
):
    result = await tenant.db.execute(
        select(Device).where(
            Device.id == device_id,
            Device.organization_id == tenant.organization_id,
        )
    )
    device = result.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    device.status = DeviceStatus.REVOKED
    device.revoked_at = datetime.now(timezone.utc)
    device.revoked_by = tenant.user_id
    tenant.db.add(device)
    await tenant.db.flush()
    return {"message": "Device revoked"}
