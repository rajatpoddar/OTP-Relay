"""Staff-Operator OTP Sharing Preferences API.

This module manages per-operator OTP sharing preferences.
When a staff member disables sharing to an operator, OTPs from that staff
must NOT be routed to the disabled operator, regardless of routing rules.
"""
import uuid
from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.dependencies import get_tenant_context, TenantContextResult
from app.models.staff_operator import Staff, Operator, StaffOperatorOtpPreference
from app.models.audit import AuditLog
from app.schemas.staff_operator import (
    StaffOperatorPreferenceResponse,
    StaffOperatorPreferenceCreate,
    StaffOperatorPreferenceUpdate,
    StaffOperatorBulkUpdate,
)

router = APIRouter(prefix="/api", tags=["Staff-Operator Preferences"])


async def _get_staff_obj(tenant: TenantContextResult, staff_id: uuid.UUID) -> Staff:
    """Get staff object within tenant."""
    result = await tenant.db.execute(
        select(Staff).where(
            Staff.id == staff_id,
            Staff.organization_id == tenant.organization_id,
        )
    )
    staff = result.scalar_one_or_none()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    return staff


async def _get_preference_response(pref: StaffOperatorOtpPreference, db) -> StaffOperatorPreferenceResponse:
    """Build response with operator name."""
    op_result = await db.execute(select(Operator).where(Operator.id == pref.operator_id))
    operator = op_result.scalar_one_or_none()
    return StaffOperatorPreferenceResponse(
        id=pref.id,
        organization_id=pref.organization_id,
        staff_id=pref.staff_id,
        operator_id=pref.operator_id,
        operator_name=operator.full_name if operator else None,
        enabled=pref.enabled,
        created_at=pref.created_at,
        updated_at=pref.updated_at,
        updated_by=pref.updated_by,
    )


# --- Office Admin Endpoints ---

@router.get("/admin/staff/{staff_id}/operator-preferences", response_model=List[StaffOperatorPreferenceResponse])
async def list_staff_operator_preferences(
    staff_id: uuid.UUID,
    tenant: TenantContextResult = Depends(get_tenant_context),
):
    """List OTP sharing preferences for a staff member (Office Admin)."""
    await _get_staff_obj(tenant, staff_id)

    result = await tenant.db.execute(
        select(StaffOperatorOtpPreference).where(
            StaffOperatorOtpPreference.staff_id == staff_id,
            StaffOperatorOtpPreference.organization_id == tenant.organization_id,
        )
    )
    prefs = result.scalars().all()

    response = []
    for pref in prefs:
        response.append(await _get_preference_response(pref, tenant.db))
    return response


@router.post("/admin/staff/{staff_id}/operator-preferences", response_model=StaffOperatorPreferenceResponse)
async def set_staff_operator_preference(
    staff_id: uuid.UUID,
    request: StaffOperatorPreferenceCreate,
    tenant: TenantContextResult = Depends(get_tenant_context),
):
    """Create or update a staff-operator OTP sharing preference (Office Admin)."""
    await _get_staff_obj(tenant, staff_id)

    # Verify operator exists in this organization
    op_result = await tenant.db.execute(
        select(Operator).where(
            Operator.id == request.operator_id,
            Operator.organization_id == tenant.organization_id,
        )
    )
    operator = op_result.scalar_one_or_none()
    if not operator:
        raise HTTPException(status_code=404, detail="Operator not found")

    # Check if preference already exists
    existing = await tenant.db.execute(
        select(StaffOperatorOtpPreference).where(
            StaffOperatorOtpPreference.staff_id == staff_id,
            StaffOperatorOtpPreference.operator_id == request.operator_id,
            StaffOperatorOtpPreference.organization_id == tenant.organization_id,
        )
    )
    pref = existing.scalar_one_or_none()

    if pref:
        pref.enabled = request.enabled
        pref.updated_at = datetime.now(timezone.utc)
        pref.updated_by = tenant.user_id
        tenant.db.add(pref)
    else:
        pref = StaffOperatorOtpPreference(
            organization_id=tenant.organization_id,
            staff_id=staff_id,
            operator_id=request.operator_id,
            enabled=request.enabled,
            updated_by=tenant.user_id,
        )
        tenant.db.add(pref)

    await tenant.db.flush()

    # Audit log
    action = "staff_operator_preference_enabled" if request.enabled else "staff_operator_preference_disabled"
    audit = AuditLog(
        organization_id=tenant.organization_id,
        user_id=tenant.user_id,
        action=action,
        entity_type="staff_operator_preference",
        entity_id=pref.id,
        details=f"Staff {staff_id} → Operator {operator.full_name}: {'ON' if request.enabled else 'OFF'}",
    )
    tenant.db.add(audit)
    await tenant.db.flush()

    return await _get_preference_response(pref, tenant.db)


@router.put("/admin/staff/{staff_id}/operator-preferences", response_model=List[StaffOperatorPreferenceResponse])
async def bulk_update_staff_operator_preferences(
    staff_id: uuid.UUID,
    request: StaffOperatorBulkUpdate,
    tenant: TenantContextResult = Depends(get_tenant_context),
):
    """Bulk update all operator preferences for a staff member (Office Admin)."""
    await _get_staff_obj(tenant, staff_id)

    # Get all operators in this organization
    op_result = await tenant.db.execute(
        select(Operator).where(Operator.organization_id == tenant.organization_id)
    )
    operators = {op.id: op for op in op_result.scalars().all()}

    # Map incoming preferences
    pref_map = {str(p.operator_id): p.enabled for p in request.preferences}

    # Update or create preferences for each operator
    for op_id, op in operators.items():
        enabled = pref_map.get(str(op_id), True)  # Default to enabled if not specified

        existing = await tenant.db.execute(
            select(StaffOperatorOtpPreference).where(
                StaffOperatorOtpPreference.staff_id == staff_id,
                StaffOperatorOtpPreference.operator_id == op_id,
                StaffOperatorOtpPreference.organization_id == tenant.organization_id,
            )
        )
        pref = existing.scalar_one_or_none()

        if pref:
            if pref.enabled != enabled:
                pref.enabled = enabled
                pref.updated_at = datetime.now(timezone.utc)
                pref.updated_by = tenant.user_id
                tenant.db.add(pref)
        else:
            pref = StaffOperatorOtpPreference(
                organization_id=tenant.organization_id,
                staff_id=staff_id,
                operator_id=op_id,
                enabled=enabled,
                updated_by=tenant.user_id,
            )
            tenant.db.add(pref)

    await tenant.db.flush()

    # Return updated preferences
    result = await tenant.db.execute(
        select(StaffOperatorOtpPreference).where(
            StaffOperatorOtpPreference.staff_id == staff_id,
            StaffOperatorOtpPreference.organization_id == tenant.organization_id,
        )
    )
    prefs = result.scalars().all()
    return [await _get_preference_response(p, tenant.db) for p in prefs]


# --- Staff Self-Service Endpoints (for Android/Web) ---

@router.get("/staff/operator-preferences", response_model=List[StaffOperatorPreferenceResponse])
async def list_my_operator_preferences(
    tenant: TenantContextResult = Depends(get_tenant_context),
):
    """List OTP sharing preferences for the current staff member."""
    result = await tenant.db.execute(
        select(Staff).where(
            Staff.user_id == tenant.user_id,
            Staff.organization_id == tenant.organization_id,
        )
    )
    staff = result.scalar_one_or_none()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff profile not found")

    pref_result = await tenant.db.execute(
        select(StaffOperatorOtpPreference).where(
            StaffOperatorOtpPreference.staff_id == staff.id,
            StaffOperatorOtpPreference.organization_id == tenant.organization_id,
        )
    )
    prefs = pref_result.scalars().all()
    return [await _get_preference_response(p, tenant.db) for p in prefs]


@router.put("/staff/operator-preferences/{preference_id}", response_model=StaffOperatorPreferenceResponse)
async def update_my_operator_preference(
    preference_id: uuid.UUID,
    request: StaffOperatorPreferenceUpdate,
    tenant: TenantContextResult = Depends(get_tenant_context),
):
    """Update an operator preference for the current staff member."""
    result = await tenant.db.execute(
        select(Staff).where(
            Staff.user_id == tenant.user_id,
            Staff.organization_id == tenant.organization_id,
        )
    )
    staff = result.scalar_one_or_none()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff profile not found")

    pref_result = await tenant.db.execute(
        select(StaffOperatorOtpPreference).where(
            StaffOperatorOtpPreference.id == preference_id,
            StaffOperatorOtpPreference.staff_id == staff.id,
            StaffOperatorOtpPreference.organization_id == tenant.organization_id,
        )
    )
    pref = pref_result.scalar_one_or_none()
    if not pref:
        raise HTTPException(status_code=404, detail="Preference not found")

    pref.enabled = request.enabled
    pref.updated_at = datetime.now(timezone.utc)
    pref.updated_by = tenant.user_id
    tenant.db.add(pref)
    await tenant.db.flush()

    return await _get_preference_response(pref, tenant.db)
