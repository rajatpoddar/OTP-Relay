import re
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, Tuple, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, and_

from app.models.otp import OtpMessage, OtpStatus, OtpDeliveryEvent
from app.models.device_service import SenderId
from app.models.routing import RoutingRule, StaffSenderAuthorization, AuthStatus
from app.models.staff_operator import Operator, Staff, StaffOperatorOtpPreference
from app.models.audit import AuditLog


# Priority order for routing
PRIORITY_ORDER = {"critical": 0, "high": 1, "normal": 2, "low": 3}


class OTPService:
    """Enhanced OTP processing pipeline and routing engine.

    Routing precedence:
    1. Device authorization
    2. Staff sender authorization
    3. Routing rule match
    4. Staff → Operator sharing preference  <-- NEW
    5. Operator active/enabled status
    6. Subscription/organization eligibility
    7. Deliver to operator
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    async def process_otp(
        self,
        organization_id: uuid.UUID,
        message: str,
        sender_text: str,
        device_id: Optional[uuid.UUID] = None,
        staff_id: Optional[uuid.UUID] = None,
    ) -> OtpMessage:
        """
        Full OTP processing pipeline:
        1. Sender Validation
        2. Authorization Validation
        3. OTP Extraction (configurable per sender)
        4. Duplicate Detection
        5. Routing (with staff→operator preference check)
        6. Database + Audit
        """

        # Step 1: Sender Validation
        sender = await self._find_sender(organization_id, sender_text)

        # Step 2: Authorization Validation
        if staff_id and sender:
            authorized = await self._check_authorization(staff_id, sender.id)
            if not authorized:
                return await self._create_failed_otp(
                    organization_id, staff_id, sender_text,
                    message, "Sender not authorized by staff", device_id
                )

        # Step 3: OTP Extraction (enhanced with configurable regex)
        otp_value, purpose, reference = self._extract_otp_enhanced(message, sender)

        # Step 3b: OTP length validation
        if otp_value and sender and sender.otp_length:
            if len(otp_value) != sender.otp_length:
                otp_value = self._extract_otp_by_length(message, sender.otp_length)

        # Step 4: Duplicate Detection
        if otp_value and staff_id:
            duplicate = await self._check_duplicate(organization_id, staff_id, otp_value, sender_text)
            if duplicate:
                return duplicate

        # Step 5: Create OTP record with expiry
        expiry_minutes = 10  # Default
        if sender and sender.message_template:
            pass

        otp = OtpMessage(
            organization_id=organization_id,
            staff_id=staff_id or uuid.uuid4(),
            device_id=device_id,
            sender_id=sender.id if sender else None,
            sender_text=sender_text,
            service_name=sender.department.code if sender and sender.department else None,
            otp_value=otp_value,
            otp_length=len(otp_value) if otp_value else None,
            purpose=purpose,
            reference_number=reference,
            raw_message=message,
            status=OtpStatus.RECEIVED,
            expiry_at=datetime.now(timezone.utc) + timedelta(minutes=expiry_minutes),
        )
        self.db.add(otp)
        await self.db.flush()

        # Step 6: Routing (with staff→operator preference enforcement)
        if otp_value:
            delivery_result = await self._route_otp_with_preferences(
                organization_id, sender, staff_id, otp.id
            )
            if delivery_result == "delivered":
                otp.status = OtpStatus.DELIVERED
                otp.routed_at = datetime.now(timezone.utc)
                otp.delivered_at = datetime.now(timezone.utc)
                self.db.add(otp)
                await self.db.flush()
            elif delivery_result == "blocked":
                # OTP record stays with status=RECEIVED; blocked event logged below
                pass
            else:
                otp.status = OtpStatus.UNASSIGNED
                self.db.add(otp)
                await self.db.flush()

                await self._create_audit_log(
                    organization_id=organization_id,
                    action="otp_unassigned",
                    entity_type="otp_message",
                    entity_id=otp.id,
                    details="No routing rule matched - OTP placed in unassigned queue",
                )

        return otp

    async def _find_sender(self, organization_id: uuid.UUID, sender_text: str) -> Optional[SenderId]:
        result = await self.db.execute(
            select(SenderId).where(
                SenderId.organization_id == organization_id,
                SenderId.sender_id == sender_text,
                SenderId.is_active == True,
            )
        )
        return result.scalar_one_or_none()

    async def _check_authorization(self, staff_id: uuid.UUID, sender_id: uuid.UUID) -> bool:
        result = await self.db.execute(
            select(StaffSenderAuthorization).where(
                StaffSenderAuthorization.staff_id == staff_id,
                StaffSenderAuthorization.sender_id == sender_id,
                StaffSenderAuthorization.status == AuthStatus.AUTHORIZED,
            )
        )
        return result.scalar_one_or_none() is not None

    def _extract_otp_enhanced(self, message: str, sender: Optional[SenderId]) -> Tuple[Optional[str], Optional[str], Optional[str]]:
        otp_value = None
        purpose = None
        reference = None

        if sender and sender.extraction_regex:
            try:
                match = re.search(sender.extraction_regex, message, re.IGNORECASE)
                if match:
                    otp_value = match.group(1) if match.groups() else match.group(0)
            except re.error:
                pass

        if not otp_value:
            patterns = [
                r'(?:OTP|otp|Otp)[:\s]*(\d{4,8})',
                r'(?:code|Code)[:\s]*(\d{4,8})',
                r'(?:verification|Verification)[:\s]*(\d{4,8})',
                r'(?:is|Is)[:\s]*(\d{4,8})\.',
                r'\b(\d{4,8})\b',
            ]
            for pattern in patterns:
                match = re.search(pattern, message)
                if match:
                    otp_value = match.group(1)
                    break

        if sender and sender.purpose_regex:
            try:
                match = re.search(sender.purpose_regex, message, re.IGNORECASE)
                if match:
                    purpose = match.group(1) if match.groups() else match.group(0)
            except re.error:
                pass
        else:
            purpose_match = re.search(
                r'(?:for|For)\s+(?:[A-Z][A-Z0-9_]+\s+)?(.+?)(?:\s+for|\s+is|\.|\s+Do\s+not)',
                message, re.IGNORECASE
            )
            if purpose_match:
                purpose = purpose_match.group(1).strip()

        if sender and sender.reference_regex:
            try:
                match = re.search(sender.reference_regex, message, re.IGNORECASE)
                if match:
                    reference = match.group(1) if match.groups() else match.group(0)
            except re.error:
                pass
        else:
            ref_match = re.search(
                r'(?:Reference|reference|Ref|ref)\s+(?:No\.?|number)?\s*[:\s]*(\S+)',
                message, re.IGNORECASE
            )
            if ref_match:
                reference = ref_match.group(1)

        return otp_value, purpose, reference

    def _extract_otp_by_length(self, message: str, length: int) -> Optional[str]:
        pattern = rf'\b(\d{{{length}}})\b'
        match = re.search(pattern, message)
        return match.group(1) if match else None

    async def _check_duplicate(
        self, organization_id: uuid.UUID, staff_id: uuid.UUID,
        otp_value: str, sender_text: str
    ) -> Optional[OtpMessage]:
        five_min_ago = datetime.now(timezone.utc) - timedelta(minutes=5)
        result = await self.db.execute(
            select(OtpMessage).where(
                OtpMessage.organization_id == organization_id,
                OtpMessage.staff_id == staff_id,
                OtpMessage.otp_value == otp_value,
                OtpMessage.sender_text == sender_text,
                OtpMessage.received_at >= five_min_ago,
            )
        )
        return result.scalar_one_or_none()

    async def _route_otp_with_preferences(
        self,
        organization_id: uuid.UUID,
        sender: Optional[SenderId],
        staff_id: Optional[uuid.UUID],
        otp_id: uuid.UUID,
    ) -> str:
        """Route OTP with staff→operator preference enforcement.

        Returns: "delivered", "blocked", or "unassigned"
        """
        now = datetime.now(timezone.utc)

        # Get all candidate operators from routing rules
        candidates = await self._get_routing_candidates(organization_id, sender, staff_id, now)

        if not candidates:
            return "unassigned"

        # Check staff→operator preferences
        for priority_val, rule, operator in candidates:
            allowed = await self._check_staff_operator_preference(staff_id, operator.id, organization_id)

            if allowed:
                # Deliver to this operator
                event = OtpDeliveryEvent(
                    otp_id=otp_id,
                    operator_id=operator.id,
                    event_type="delivered",
                )
                self.db.add(event)
                await self.db.flush()

                await self._create_audit_log(
                    organization_id=organization_id,
                    action="otp_delivered",
                    entity_type="otp_message",
                    entity_id=otp_id,
                    details=f"OTP delivered to operator {operator.full_name}",
                )
                return "delivered"
            else:
                # This operator is blocked by staff preference
                await self._create_audit_log(
                    organization_id=organization_id,
                    action="DELIVERY_BLOCKED_BY_STAFF_PREFERENCE",
                    entity_type="otp_message",
                    entity_id=otp_id,
                    details=f"OTP blocked: staff preference disables routing to operator {operator.full_name}",
                )
                # Continue to next candidate (fallback)

        # All candidates blocked
        return "blocked"

    async def _get_routing_candidates(
        self,
        organization_id: uuid.UUID,
        sender: Optional[SenderId],
        staff_id: Optional[uuid.UUID],
        now: datetime,
    ) -> list:
        """Get sorted routing candidates by priority."""
        candidates = []

        # Try: Staff + Sender specific rule
        if staff_id and sender:
            rules = await self._get_active_rules(
                organization_id, sender_id=sender.id, staff_id=staff_id, now=now
            )
            for rule in rules:
                op = await self._get_operator(rule.operator_id)
                if op:
                    candidates.append((PRIORITY_ORDER.get(rule.priority, 2), rule, op))

        # Try: Sender specific rule (no staff filter)
        if sender:
            rules = await self._get_active_rules(
                organization_id, sender_id=sender.id, staff_id=None, now=now
            )
            for rule in rules:
                op = await self._get_operator(rule.operator_id)
                if op:
                    candidates.append((PRIORITY_ORDER.get(rule.priority, 2), rule, op))

        # Try: Service specific rule
        if sender and sender.department_id:
            rules = await self._get_active_rules(
                organization_id, service_id=sender.department_id, now=now
            )
            for rule in rules:
                op = await self._get_operator(rule.operator_id)
                if op:
                    candidates.append((PRIORITY_ORDER.get(rule.priority, 2), rule, op))

        # Try: Default catch-all rule
        rules = await self._get_active_rules(organization_id, now=now)
        for rule in rules:
            op = await self._get_operator(rule.operator_id)
            if op:
                candidates.append((PRIORITY_ORDER.get(rule.priority, 2), rule, op))

        if candidates:
            candidates.sort(key=lambda x: x[0])

        return candidates

    async def _check_staff_operator_preference(
        self,
        staff_id: Optional[uuid.UUID],
        operator_id: uuid.UUID,
        organization_id: uuid.UUID,
    ) -> bool:
        """Check if staff→operator OTP sharing is enabled.

        Returns True if sharing is allowed (default behavior).
        Returns False only if an explicit preference record with enabled=False exists.
        """
        if not staff_id:
            return True  # No staff context = allow

        result = await self.db.execute(
            select(StaffOperatorOtpPreference).where(
                StaffOperatorOtpPreference.staff_id == staff_id,
                StaffOperatorOtpPreference.operator_id == operator_id,
                StaffOperatorOtpPreference.organization_id == organization_id,
            )
        )
        pref = result.scalar_one_or_none()

        if pref is None:
            return True  # No preference set = default allow

        return pref.enabled

    async def _get_active_rules(
        self, organization_id: uuid.UUID,
        sender_id: Optional[uuid.UUID] = None,
        service_id: Optional[uuid.UUID] = None,
        staff_id: Optional[uuid.UUID] = None,
        now: datetime = None,
    ) -> list:
        if now is None:
            now = datetime.now(timezone.utc)

        conditions = [
            RoutingRule.organization_id == organization_id,
            RoutingRule.is_active == True,
            (RoutingRule.effective_from.is_(None) | (RoutingRule.effective_from <= now)),
            (RoutingRule.effective_to.is_(None) | (RoutingRule.effective_to >= now)),
        ]

        if sender_id is not None:
            conditions.append(RoutingRule.sender_id == sender_id)
        else:
            conditions.append(RoutingRule.sender_id.is_(None))

        if service_id is not None:
            conditions.append(RoutingRule.service_id == service_id)
        else:
            conditions.append(RoutingRule.service_id.is_(None))

        if staff_id is not None:
            conditions.append(RoutingRule.staff_id == staff_id)
        else:
            conditions.append(RoutingRule.staff_id.is_(None))

        result = await self.db.execute(
            select(RoutingRule).where(and_(*conditions))
        )
        return list(result.scalars().all())

    async def _get_operator(self, operator_id: uuid.UUID) -> Optional[Operator]:
        result = await self.db.execute(select(Operator).where(Operator.id == operator_id))
        return result.scalar_one_or_none()

    async def _create_failed_otp(
        self, org_id, staff_id, sender_text, message, reason, device_id
    ) -> OtpMessage:
        otp = OtpMessage(
            organization_id=org_id,
            staff_id=staff_id,
            device_id=device_id,
            sender_text=sender_text,
            raw_message=message,
            status=OtpStatus.FAILED,
            failure_reason=reason,
            failed_at=datetime.now(timezone.utc),
        )
        self.db.add(otp)
        await self.db.flush()

        await self._create_audit_log(
            organization_id=org_id,
            action="otp_failed",
            entity_type="otp_message",
            entity_id=otp.id,
            details=f"OTP failed: {reason}",
        )

        return otp

    async def _create_audit_log(
        self, organization_id: uuid.UUID, action: str,
        entity_type: str, entity_id: uuid.UUID, details: str,
        user_id: Optional[uuid.UUID] = None,
    ):
        log = AuditLog(
            organization_id=organization_id,
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            details=details,
        )
        self.db.add(log)
        await self.db.flush()

    async def mark_viewed(self, otp_id: uuid.UUID, organization_id: uuid.UUID) -> Optional[OtpMessage]:
        result = await self.db.execute(
            select(OtpMessage).where(
                OtpMessage.id == otp_id,
                OtpMessage.organization_id == organization_id,
            )
        )
        otp = result.scalar_one_or_none()
        if otp and otp.status in (OtpStatus.DELIVERED, OtpStatus.ROUTED, OtpStatus.RECEIVED):
            otp.status = OtpStatus.VIEWED
            otp.viewed_at = datetime.now(timezone.utc)
            self.db.add(otp)
            await self.db.flush()
        return otp

    async def mark_used(
        self, otp_id: uuid.UUID, organization_id: uuid.UUID,
        operator_id: uuid.UUID, note: str
    ) -> Optional[OtpMessage]:
        result = await self.db.execute(
            select(OtpMessage).where(
                OtpMessage.id == otp_id,
                OtpMessage.organization_id == organization_id,
            )
        )
        otp = result.scalar_one_or_none()
        if not otp:
            return None

        if otp.status == OtpStatus.USED:
            return otp

        otp.status = OtpStatus.USED
        otp.used_at = datetime.now(timezone.utc)
        self.db.add(otp)
        await self.db.flush()

        event = OtpDeliveryEvent(
            otp_id=otp.id,
            operator_id=operator_id,
            event_type="used",
        )
        self.db.add(event)
        await self.db.flush()

        await self._create_audit_log(
            organization_id=organization_id,
            action="otp_used",
            entity_type="otp_message",
            entity_id=otp.id,
            details=f"OTP marked as used with note: {note[:100]}",
            user_id=None,
        )

        return otp

    async def expire_old_otps(self, organization_id: Optional[uuid.UUID] = None):
        now = datetime.now(timezone.utc)
        conditions = [
            OtpMessage.status.in_([OtpStatus.RECEIVED, OtpStatus.PROCESSING, OtpStatus.ROUTED, OtpStatus.DELIVERED]),
            OtpMessage.expiry_at < now,
        ]
        if organization_id:
            conditions.append(OtpMessage.organization_id == organization_id)

        result = await self.db.execute(
            select(OtpMessage).where(and_(*conditions))
        )
        otps = result.scalars().all()

        for otp in otps:
            otp.status = OtpStatus.EXPIRED
            otp.failed_at = now
            otp.failure_reason = "OTP expired"
            self.db.add(otp)

        if otps:
            await self.db.flush()

        return len(otps)

    def get_masked_otp(self, otp_value: Optional[str], status: str) -> Optional[str]:
        if not otp_value:
            return None
        if status in (OtpStatus.USED.value, OtpStatus.EXPIRED.value, OtpStatus.FAILED.value):
            if len(otp_value) < 4:
                return "••••••"
            return f"{otp_value[:2]}••{otp_value[-2:]}"
        return otp_value
