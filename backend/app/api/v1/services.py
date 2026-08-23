import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.dependencies import get_tenant_context, TenantContextResult
from app.models.device_service import DepartmentService, SenderId
from app.models.routing import RoutingRule, StaffSenderAuthorization, AuthorizationStatus
from app.schemas.routing import (
    DepartmentServiceCreate, DepartmentServiceUpdate, DepartmentServiceResponse,
    SenderIdCreate, SenderIdUpdate, SenderIdResponse,
    RoutingRuleCreate, RoutingRuleUpdate, RoutingRuleResponse,
    StaffAuthCreate, StaffAuthResponse,
)

router = APIRouter(prefix="/api", tags=["Services & Routing"])


# --- Department Services ---
@router.post("/admin/services", response_model=DepartmentServiceResponse)
async def create_service(
    request: DepartmentServiceCreate,
    tenant: TenantContextResult = Depends(get_tenant_context),
):
    service = DepartmentService(
        organization_id=tenant.organization_id,
        name=request.name,
        code=request.code,
        display_name=request.display_name,
    )
    tenant.db.add(service)
    await tenant.db.flush()
    return DepartmentServiceResponse.model_validate(service)


@router.get("/admin/services", response_model=List[DepartmentServiceResponse])
async def list_services(
    tenant: TenantContextResult = Depends(get_tenant_context),
):
    result = await tenant.db.execute(
        select(DepartmentService).where(DepartmentService.organization_id == tenant.organization_id)
    )
    return [DepartmentServiceResponse.model_validate(s) for s in result.scalars().all()]


@router.put("/admin/services/{service_id}", response_model=DepartmentServiceResponse)
async def update_service(
    service_id: uuid.UUID,
    request: DepartmentServiceUpdate,
    tenant: TenantContextResult = Depends(get_tenant_context),
):
    result = await tenant.db.execute(
        select(DepartmentService).where(
            DepartmentService.id == service_id,
            DepartmentService.organization_id == tenant.organization_id,
        )
    )
    service = result.scalar_one_or_none()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    for field, value in request.model_dump(exclude_unset=True).items():
        setattr(service, field, value)
    tenant.db.add(service)
    await tenant.db.flush()
    return DepartmentServiceResponse.model_validate(service)


# --- Sender IDs ---
@router.post("/admin/sender-ids", response_model=SenderIdResponse)
async def create_sender_id(
    request: SenderIdCreate,
    tenant: TenantContextResult = Depends(get_tenant_context),
):
    sender = SenderId(
        organization_id=tenant.organization_id,
        department_id=request.department_id,
        sender_id=request.sender_id,
        display_name=request.display_name,
        otp_length=request.otp_length,
        extraction_regex=request.extraction_regex,
        message_template=request.message_template,
        purpose_regex=request.purpose_regex,
        reference_regex=request.reference_regex,
        is_active=request.is_active,
    )
    tenant.db.add(sender)
    await tenant.db.flush()
    return SenderIdResponse.model_validate(sender)


@router.get("/admin/sender-ids", response_model=List[SenderIdResponse])
async def list_sender_ids(
    tenant: TenantContextResult = Depends(get_tenant_context),
):
    result = await tenant.db.execute(
        select(SenderId).where(SenderId.organization_id == tenant.organization_id)
    )
    return [SenderIdResponse.model_validate(s) for s in result.scalars().all()]


@router.put("/admin/sender-ids/{sender_id}", response_model=SenderIdResponse)
async def update_sender_id(
    sender_id: uuid.UUID,
    request: SenderIdUpdate,
    tenant: TenantContextResult = Depends(get_tenant_context),
):
    result = await tenant.db.execute(
        select(SenderId).where(
            SenderId.id == sender_id,
            SenderId.organization_id == tenant.organization_id,
        )
    )
    sender = result.scalar_one_or_none()
    if not sender:
        raise HTTPException(status_code=404, detail="Sender ID not found")

    for field, value in request.model_dump(exclude_unset=True).items():
        setattr(sender, field, value)
    tenant.db.add(sender)
    await tenant.db.flush()
    return SenderIdResponse.model_validate(sender)


# --- Routing Rules ---
@router.post("/admin/routing-rules", response_model=RoutingRuleResponse)
async def create_routing_rule(
    request: RoutingRuleCreate,
    tenant: TenantContextResult = Depends(get_tenant_context),
):
    # If a staff_id is specified, the rule requires staff authorization before routing
    auth_status = AuthorizationStatus.PENDING if request.staff_id else AuthorizationStatus.AUTHORIZED

    rule = RoutingRule(
        organization_id=tenant.organization_id,
        name=request.name,
        sender_id=request.sender_id,
        service_id=request.service_id,
        staff_id=request.staff_id,
        operator_id=request.operator_id,
        priority=request.priority,
        is_active=request.is_active,
        authorization_status=auth_status,
        effective_from=request.effective_from,
        effective_to=request.effective_to,
    )
    tenant.db.add(rule)
    await tenant.db.flush()
    return RoutingRuleResponse.model_validate(rule)


@router.get("/admin/routing-rules", response_model=List[RoutingRuleResponse])
async def list_routing_rules(
    tenant: TenantContextResult = Depends(get_tenant_context),
):
    result = await tenant.db.execute(
        select(RoutingRule).where(RoutingRule.organization_id == tenant.organization_id)
    )
    return [RoutingRuleResponse.model_validate(r) for r in result.scalars().all()]


@router.put("/admin/routing-rules/{rule_id}", response_model=RoutingRuleResponse)
async def update_routing_rule(
    rule_id: uuid.UUID,
    request: RoutingRuleUpdate,
    tenant: TenantContextResult = Depends(get_tenant_context),
):
    result = await tenant.db.execute(
        select(RoutingRule).where(
            RoutingRule.id == rule_id,
            RoutingRule.organization_id == tenant.organization_id,
        )
    )
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=404, detail="Routing rule not found")

    for field, value in request.model_dump(exclude_unset=True).items():
        setattr(rule, field, value)
    tenant.db.add(rule)
    await tenant.db.flush()
    return RoutingRuleResponse.model_validate(rule)


# --- Staff Sender Authorizations ---
from pydantic import BaseModel as PydanticBaseModel


class StaffAuthorizeRequest(PydanticBaseModel):
    sender_id: uuid.UUID
    status: str = "AUTHORIZED"


class StaffAuthorizeByTextRequest(PydanticBaseModel):
    sender_text: str
    status: str = "AUTHORIZED"


@router.post("/staff/authorize", response_model=StaffAuthResponse)
async def authorize_sender(
    request: StaffAuthorizeRequest,
    tenant: TenantContextResult = Depends(get_tenant_context),
):
    from app.models.staff_operator import Staff
    from datetime import datetime, timezone

    staff = await tenant.db.execute(
        select(Staff).where(
            Staff.user_id == tenant.user_id,
            Staff.organization_id == tenant.organization_id,
        )
    )
    staff_obj = staff.scalar_one_or_none()
    if not staff_obj:
        raise HTTPException(status_code=404, detail="Staff profile not found")

    # Check if auth already exists
    existing = await tenant.db.execute(
        select(StaffSenderAuthorization).where(
            StaffSenderAuthorization.staff_id == staff_obj.id,
            StaffSenderAuthorization.sender_id == request.sender_id,
        )
    )
    existing_auth = existing.scalar_one_or_none()

    if existing_auth:
        existing_auth.status = request.status
        if request.status == "AUTHORIZED":
            existing_auth.authorized_at = datetime.now(timezone.utc)
            existing_auth.revoked_at = None
        else:
            existing_auth.revoked_at = datetime.now(timezone.utc)
        tenant.db.add(existing_auth)
        await tenant.db.flush()
        return StaffAuthResponse.model_validate(existing_auth)

    auth = StaffSenderAuthorization(
        staff_id=staff_obj.id,
        sender_id=request.sender_id,
        status=request.status,
        authorized_at=datetime.now(timezone.utc) if request.status == "AUTHORIZED" else None,
    )
    tenant.db.add(auth)
    await tenant.db.flush()
    return StaffAuthResponse.model_validate(auth)


@router.post("/staff/authorize-by-text", response_model=StaffAuthResponse)
async def authorize_sender_by_text(
    request: StaffAuthorizeByTextRequest,
    tenant: TenantContextResult = Depends(get_tenant_context),
):
    """Authorize a sender by its text identifier (e.g. 'BT-VBGRAM-G')."""
    from app.models.staff_operator import Staff
    from datetime import datetime, timezone

    staff = await tenant.db.execute(
        select(Staff).where(
            Staff.user_id == tenant.user_id,
            Staff.organization_id == tenant.organization_id,
        )
    )
    staff_obj = staff.scalar_one_or_none()
    if not staff_obj:
        raise HTTPException(status_code=404, detail="Staff profile not found")

    # Find sender by text
    sender_result = await tenant.db.execute(
        select(SenderId).where(
            SenderId.sender_id == request.sender_text,
            SenderId.organization_id == tenant.organization_id,
        )
    )
    sender = sender_result.scalar_one_or_none()
    if not sender:
        raise HTTPException(status_code=404, detail=f"Sender ID '{request.sender_text}' not found")

    # Check if auth already exists
    existing = await tenant.db.execute(
        select(StaffSenderAuthorization).where(
            StaffSenderAuthorization.staff_id == staff_obj.id,
            StaffSenderAuthorization.sender_id == sender.id,
        )
    )
    existing_auth = existing.scalar_one_or_none()

    if existing_auth:
        existing_auth.status = request.status
        if request.status == "AUTHORIZED":
            existing_auth.authorized_at = datetime.now(timezone.utc)
            existing_auth.revoked_at = None
        else:
            existing_auth.revoked_at = datetime.now(timezone.utc)
        tenant.db.add(existing_auth)
        await tenant.db.flush()
        return StaffAuthResponse.model_validate(existing_auth)

    auth = StaffSenderAuthorization(
        staff_id=staff_obj.id,
        sender_id=sender.id,
        status=request.status,
        authorized_at=datetime.now(timezone.utc) if request.status == "AUTHORIZED" else None,
    )
    tenant.db.add(auth)
    await tenant.db.flush()
    return StaffAuthResponse.model_validate(auth)


@router.get("/staff/authorizations", response_model=List[StaffAuthResponse])
async def list_my_authorizations(
    tenant: TenantContextResult = Depends(get_tenant_context),
):
    from app.models.staff_operator import Staff

    staff = await tenant.db.execute(
        select(Staff).where(
            Staff.user_id == tenant.user_id,
            Staff.organization_id == tenant.organization_id,
        )
    )
    staff_obj = staff.scalar_one_or_none()
    if not staff_obj:
        raise HTTPException(status_code=404, detail="Staff profile not found")

    result = await tenant.db.execute(
        select(StaffSenderAuthorization).where(StaffSenderAuthorization.staff_id == staff_obj.id)
    )
    return [StaffAuthResponse.model_validate(a) for a in result.scalars().all()]


@router.get("/staff/available-senders")
async def list_available_senders(
    tenant: TenantContextResult = Depends(get_tenant_context),
):
    """Return all active sender IDs in this organization.
    Used by Android onboarding screen for staff to choose from."""
    result = await tenant.db.execute(
        select(SenderId).where(
            SenderId.organization_id == tenant.organization_id,
            SenderId.is_active == True,
        )
    )
    senders = result.scalars().all()

    return [
        {
            "sender_id": s.sender_id,
            "display_name": s.display_name,
            "otp_length": s.otp_length,
        }
        for s in senders
    ]


@router.get("/staff/my-senders")
async def list_my_authorized_senders(
    tenant: TenantContextResult = Depends(get_tenant_context),
):
    """Return the staff's authorized sender IDs with full sender details.
    Used by Android app to sync only authorized senders to local DB."""
    from app.models.staff_operator import Staff
    from app.models.routing import AuthStatus

    staff = await tenant.db.execute(
        select(Staff).where(
            Staff.user_id == tenant.user_id,
            Staff.organization_id == tenant.organization_id,
        )
    )
    staff_obj = staff.scalar_one_or_none()
    if not staff_obj:
        raise HTTPException(status_code=404, detail="Staff profile not found")

    # Get authorized sender IDs for this staff
    auth_result = await tenant.db.execute(
        select(StaffSenderAuthorization, SenderId).join(
            SenderId, StaffSenderAuthorization.sender_id == SenderId.id
        ).where(
            StaffSenderAuthorization.staff_id == staff_obj.id,
            StaffSenderAuthorization.status == AuthStatus.AUTHORIZED,
        )
    )
    rows = auth_result.all()

    return [
        {
            "sender_id": sender.sender_id,
            "display_name": sender.display_name,
            "otp_length": sender.otp_length,
            "extraction_regex": sender.extraction_regex,
            "message_template": sender.message_template,
            "purpose_regex": sender.purpose_regex,
            "reference_regex": sender.reference_regex,
            "is_authorized": True,
        }
        for auth, sender in rows
    ]


# --- Routing Rule Authorization (Staff) ---

class RoutingRuleAuthorizeRequest(PydanticBaseModel):
    rule_id: uuid.UUID
    action: str  # "authorize" or "reject"
    rejection_reason: Optional[str] = None


@router.get("/staff/pending-rules")
async def list_pending_routing_rules(
    tenant: TenantContextResult = Depends(get_tenant_context),
):
    """List routing rules pending staff authorization."""
    from app.models.staff_operator import Staff

    staff = await tenant.db.execute(
        select(Staff).where(
            Staff.user_id == tenant.user_id,
            Staff.organization_id == tenant.organization_id,
        )
    )
    staff_obj = staff.scalar_one_or_none()
    if not staff_obj:
        raise HTTPException(status_code=404, detail="Staff profile not found")

    result = await tenant.db.execute(
        select(RoutingRule).where(
            RoutingRule.organization_id == tenant.organization_id,
            RoutingRule.staff_id == staff_obj.id,
            RoutingRule.authorization_status == AuthorizationStatus.PENDING,
            RoutingRule.is_active == True,
        )
    )
    return [RoutingRuleResponse.model_validate(r) for r in result.scalars().all()]


@router.post("/staff/authorize-rule")
async def authorize_routing_rule(
    request: RoutingRuleAuthorizeRequest,
    tenant: TenantContextResult = Depends(get_tenant_context),
):
    """Staff member authorizes or rejects a routing rule targeted at them."""
    from app.models.staff_operator import Staff
    from datetime import datetime, timezone

    staff = await tenant.db.execute(
        select(Staff).where(
            Staff.user_id == tenant.user_id,
            Staff.organization_id == tenant.organization_id,
        )
    )
    staff_obj = staff.scalar_one_or_none()
    if not staff_obj:
        raise HTTPException(status_code=404, detail="Staff profile not found")

    # Fetch the rule
    rule_result = await tenant.db.execute(
        select(RoutingRule).where(
            RoutingRule.id == request.rule_id,
            RoutingRule.organization_id == tenant.organization_id,
            RoutingRule.staff_id == staff_obj.id,
        )
    )
    rule = rule_result.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=404, detail="Routing rule not found or not assigned to you")

    if request.action == "authorize":
        rule.authorization_status = AuthorizationStatus.AUTHORIZED
        rule.authorized_at = datetime.now(timezone.utc)
        rule.authorized_by = staff_obj.id
        rule.rejection_reason = None
    elif request.action == "reject":
        rule.authorization_status = AuthorizationStatus.REJECTED
        rule.rejection_reason = request.rejection_reason or "Staff rejected this routing rule"
    else:
        raise HTTPException(status_code=400, detail="Action must be 'authorize' or 'reject'")

    tenant.db.add(rule)
    await tenant.db.flush()

    return {"status": rule.authorization_status.value, "rule_id": str(rule.id)}
