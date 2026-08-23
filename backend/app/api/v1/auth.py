import uuid
import random
import string
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone

from app.core.database import get_db
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user,
)
from app.schemas.auth import (
    LoginRequest, LoginResponse, RefreshRequest, UserInfo, PasswordChange,
    AppRequestOTP, AppVerifyOTP, AppOnboard, AppLoginResponse,
)
from app.models.user import User, UserRole

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive",
        )

    access_token = create_access_token(data={"sub": str(user.id), "role": user.role.value})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserInfo(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=user.role.value,
            organization_id=user.organization_id,
            is_active=user.is_active,
        ),
    )


@router.post("/refresh", response_model=LoginResponse)
async def refresh_token(request: RefreshRequest, db: AsyncSession = Depends(get_db)):
    payload = decode_token(request.refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    access_token = create_access_token(data={"sub": str(user.id), "role": user.role.value})
    new_refresh_token = create_refresh_token(data={"sub": str(user.id)})

    return LoginResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        user=UserInfo(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=user.role.value,
            organization_id=user.organization_id,
            is_active=user.is_active,
        ),
    )


@router.get("/me", response_model=UserInfo)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserInfo(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role.value,
        organization_id=current_user.organization_id,
        is_active=current_user.is_active,
    )


@router.post("/change-password")
async def change_password(
    request: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not verify_password(request.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    current_user.hashed_password = hash_password(request.new_password)
    db.add(current_user)
    await db.flush()
    return {"message": "Password changed successfully"}


# ============================================================
# App OTP Login (Operator-Assisted)
# ============================================================

# In-memory OTP store (production: use Redis)
_app_otp_store: dict = {}  # mobile_number -> {otp, expires_at, organization_id}


def _generate_otp(length: int = 6) -> str:
    return ''.join(random.choices(string.digits, k=length))


@router.post("/app/request-otp")
async def app_request_otp(
    request: AppRequestOTP,
    db: AsyncSession = Depends(get_db),
):
    """Staff requests OTP for mobile login. Generates OTP and broadcasts to operators via WebSocket."""
    from datetime import timedelta
    from app.core.config import settings

    mobile = request.mobile_number.strip()
    if not mobile or len(mobile) < 10:
        raise HTTPException(status_code=400, detail="Invalid mobile number")

    # Find staff by mobile number
    from app.models.staff_operator import Staff
    staff_result = await db.execute(
        select(Staff, User).join(User, Staff.user_id == User.id).where(Staff.mobile_number == mobile)
    )
    row = staff_result.first()

    if not row:
        raise HTTPException(status_code=404, detail="No staff account found with this mobile number")

    staff_obj, user_obj = row
    org_id = str(staff_obj.organization_id)

    # Generate 6-digit OTP
    otp = _generate_otp(6)
    expiry_minutes = settings.OTP_DEFAULT_EXPIRY_MINUTES
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=expiry_minutes)

    # Store OTP
    _app_otp_store[mobile] = {
        "otp": otp,
        "expires_at": expires_at,
        "organization_id": org_id,
        "user_id": str(user_obj.id),
        "staff_id": str(staff_obj.id),
    }

    # Broadcast to operators/admins via WebSocket
    try:
        from app.realtime.events import manager, sse_manager
        import json

        event = {
            "type": "app_login_request",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "data": {
                "mobile_number": mobile,
                "otp": otp,
                "staff_name": staff_obj.full_name,
                "expires_at": expires_at.isoformat(),
            },
        }
        await manager.broadcast_to_organization(org_id, event, target_role="OPERATOR")
        await manager.broadcast_to_organization(org_id, event, target_role="OFFICE_ADMIN")
        await sse_manager.push_event(org_id, event, target_role="OPERATOR")
        await sse_manager.push_event(org_id, event, target_role="OFFICE_ADMIN")
    except Exception:
        pass  # WebSocket broadcast is best-effort

    return {
        "message": "OTP sent. Ask your operator for the code.",
        "expires_in_minutes": expiry_minutes,
    }


@router.post("/app/verify-otp", response_model=AppLoginResponse)
async def app_verify_otp(
    request: AppVerifyOTP,
    db: AsyncSession = Depends(get_db),
):
    """Staff verifies OTP to complete login. Creates user/staff dynamically if new."""
    mobile = request.mobile_number.strip()
    otp = request.otp.strip()

    stored = _app_otp_store.get(mobile)
    if not stored:
        raise HTTPException(status_code=400, detail="No OTP requested for this number. Request a new one.")

    if stored["otp"] != otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    if datetime.now(timezone.utc) > stored["expires_at"]:
        del _app_otp_store[mobile]
        raise HTTPException(status_code=400, detail="OTP expired. Request a new one.")

    # OTP valid — clean up
    del _app_otp_store[mobile]

    user_id = stored["user_id"]
    staff_id = stored["staff_id"]
    org_id = stored["organization_id"]

    # Fetch user
    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is inactive")

    # Check if profile is completed
    from app.models.staff_operator import Staff
    staff_result = await db.execute(select(Staff).where(Staff.id == uuid.UUID(staff_id)))
    staff_obj = staff_result.scalar_one_or_none()
    profile_completed = staff_obj.profile_completed if staff_obj else False

    # Generate tokens
    access_token = create_access_token(data={"sub": str(user.id), "role": user.role.value})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    return AppLoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserInfo(
            id=user.id,
            email=user.email or "",
            full_name=user.full_name,
            role=user.role.value,
            organization_id=user.organization_id,
            is_active=user.is_active,
        ),
        is_new_user=not profile_completed,
        profile_completed=profile_completed,
    )


@router.post("/app/onboard")
async def app_onboard(
    request: AppOnboard,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Staff completes onboarding after first OTP login."""
    from app.models.staff_operator import Staff
    import uuid as uuid_mod

    # Update user full_name
    if request.name:
        current_user.full_name = request.name
        db.add(current_user)

    # Update staff profile
    staff_result = await db.execute(
        select(Staff).where(Staff.user_id == current_user.id)
    )
    staff_obj = staff_result.scalar_one_or_none()

    if not staff_obj:
        raise HTTPException(status_code=404, detail="Staff profile not found")

    if request.name:
        staff_obj.full_name = request.name
    if request.designation:
        staff_obj.designation = request.designation
    if request.department_id:
        staff_obj.department_id = uuid_mod.UUID(str(request.department_id))
    staff_obj.profile_completed = True

    db.add(staff_obj)
    await db.flush()

    # If sender_ids provided, auto-authorize them
    if request.sender_ids:
        from app.models.routing import StaffSenderAuthorization, AuthStatus
        from app.models.device_service import SenderId

        for sender_text in request.sender_ids:
            sender_result = await db.execute(
                select(SenderId).where(
                    SenderId.sender_id == sender_text,
                    SenderId.organization_id == current_user.organization_id,
                )
            )
            sender = sender_result.scalar_one_or_none()
            if sender:
                # Check if already authorized
                existing = await db.execute(
                    select(StaffSenderAuthorization).where(
                        StaffSenderAuthorization.staff_id == staff_obj.id,
                        StaffSenderAuthorization.sender_id == sender.id,
                    )
                )
                if not existing.scalar_one_or_none():
                    auth = StaffSenderAuthorization(
                        staff_id=staff_obj.id,
                        sender_id=sender.id,
                        status=AuthStatus.AUTHORIZED,
                        authorized_at=datetime.now(timezone.utc),
                    )
                    db.add(auth)

        await db.flush()

    return {"message": "Onboarding completed successfully", "profile_completed": True}
