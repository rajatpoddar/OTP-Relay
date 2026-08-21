"""Seed the database with initial data."""
import asyncio
import uuid
from datetime import datetime, timezone, timedelta

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import select

from app.core.config import settings
from app.core.security import hash_password
from app.models.user import User, UserRole
from app.models.organization import Organization, State, District, Block, OrgStatus
from app.models.staff_operator import Staff, Operator
from app.models.device_service import Device, DeviceStatus, DepartmentService, SenderId
from app.models.routing import StaffSenderAuthorization, AuthStatus, RoutingRule
from app.models.otp import OtpMessage, OtpStatus, OtpDeliveryEvent, OperatorNote
from app.models.subscription import SubscriptionPlan, Subscription, SubscriptionStatus, Payment, AppVersion, ActivationCode
from app.models.audit import AuditLog


async def seed():
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = async_sessionmaker(engine, expire_on_commit=False)

    async with async_session() as db:
        # Check if already seeded
        result = await db.execute(select(User).limit(1))
        if result.scalar_one_or_none():
            print("Database already seeded.")
            return

        # Create State
        state = State(name="Jharkhand", code="JH")
        db.add(state)
        await db.flush()

        # Create District
        district = District(name="Deoghar", code="DG", state_id=state.id)
        db.add(district)
        await db.flush()

        # Create Block
        block = Block(name="Palojori", code="PL", district_id=district.id)
        db.add(block)
        await db.flush()

        # Create Subscription Plan
        plan = SubscriptionPlan(
            name="Professional",
            description="Full access for mid-size offices",
            monthly_price=4999,
            staff_limit=50,
            operator_limit=10,
            device_limit=50,
            otp_limit=50000,
        )
        db.add(plan)
        await db.flush()

        # Create Organization
        org = Organization(
            name="Palojori Block Office",
            code="ORG-8821",
            org_type="office",
            state_id=state.id,
            district_id=district.id,
            block_id=block.id,
            status=OrgStatus.ACTIVE,
            trial_ends_at=datetime.now(timezone.utc) + timedelta(days=30),
        )
        db.add(org)
        await db.flush()

        # Create Subscription
        sub = Subscription(
            organization_id=org.id,
            plan_id=plan.id,
            status="ACTIVE",
            starts_at=datetime.now(timezone.utc),
            expires_at=datetime.now(timezone.utc) + timedelta(days=30),
        )
        db.add(sub)
        await db.flush()

        # Create Super Admin
        super_admin = User(
            email="admin@otp-relay.gov.in",
            full_name="Super Admin",
            hashed_password=hash_password("admin123"),
            role=UserRole.SUPER_ADMIN,
            is_active=True,
        )
        db.add(super_admin)

        # Create Office Admin
        office_admin_user = User(
            email="office.admin@palojori.gov.in",
            full_name="Office Admin",
            hashed_password=hash_password("admin123"),
            role=UserRole.OFFICE_ADMIN,
            organization_id=org.id,
            is_active=True,
        )
        db.add(office_admin_user)

        # Create Operators
        op1_user = User(
            email="amit.kumar@palojori.gov.in",
            full_name="Amit Kumar",
            hashed_password=hash_password("operator123"),
            role=UserRole.OPERATOR,
            organization_id=org.id,
            is_active=True,
        )
        db.add(op1_user)
        await db.flush()

        op1 = Operator(user_id=op1_user.id, organization_id=org.id, full_name="Amit Kumar")
        db.add(op1)

        op2_user = User(
            email="sunita.devi@palojori.gov.in",
            full_name="Sunita Devi",
            hashed_password=hash_password("operator123"),
            role=UserRole.OPERATOR,
            organization_id=org.id,
            is_active=True,
        )
        db.add(op2_user)
        await db.flush()

        op2 = Operator(user_id=op2_user.id, organization_id=org.id, full_name="Sunita Devi")
        db.add(op2)

        # Create Staff
        staff_users = [
            ("Rajesh Kumar", "9876543210"),
            ("Suresh Singh", "9876543211"),
            ("Priya Das", "9876543212"),
            ("Anil Murmu", "9876543213"),
        ]

        staff_objects = []
        for name, mobile in staff_users:
            su = User(
                email=f"{name.lower().replace(' ', '.')}@palojori.gov.in",
                full_name=name,
                phone=mobile,
                hashed_password=hash_password("staff123"),
                role=UserRole.STAFF,
                organization_id=org.id,
                is_active=True,
            )
            db.add(su)
            await db.flush()

            staff = Staff(
                user_id=su.id,
                organization_id=org.id,
                full_name=name,
                mobile_number=mobile,
            )
            db.add(staff)
            staff_objects.append(staff)

        await db.flush()

        # Create Department Services
        services = [
            ("VBGRAMG", "VBGRAMG", "Village Business Gramin"),
            ("MKUBER", "MKUBER", "Mukhyamantri Kuber"),
            ("NREGA", "NREGA", "National Rural Employment Guarantee Act"),
        ]

        service_objects = []
        for code, name, display in services:
            svc = DepartmentService(
                organization_id=org.id,
                name=name,
                code=code,
                display_name=display,
            )
            db.add(svc)
            service_objects.append(svc)

        await db.flush()

        # Create Sender IDs
        sender_configs = [
            ("BT-VBGRAM-G", "Village Business", service_objects[0], 6, r"(\d{6})"),
            ("AX-MKUBER-S", "Mukhyamantri Kuber", service_objects[1], 6, r"(\d{6})"),
            ("JD-NREGA-D", "NREGA Payment", service_objects[2], 4, r"(\d{4})"),
        ]

        sender_objects = []
        for sender_id, display, dept, otp_len, regex in sender_configs:
            sid = SenderId(
                organization_id=org.id,
                department_id=dept.id,
                sender_id=sender_id,
                display_name=display,
                otp_length=otp_len,
                extraction_regex=regex,
                purpose_regex=r"for\s+(.+?)(?:\s+for|\s+is|\.|\s+Do)",
                reference_regex=r"Reference\s+(?:No\.?\s*)?[:\s]*(\S+)",
            )
            db.add(sid)
            sender_objects.append(sid)

        await db.flush()

        # Create Routing Rules
        rule = RoutingRule(
            organization_id=org.id,
            name="VBGRAMG → Amit Kumar",
            sender_id=sender_objects[0].id,
            operator_id=op1.id,
            priority="high",
            is_active=True,
        )
        db.add(rule)

        rule2 = RoutingRule(
            organization_id=org.id,
            name="MKUBER → Sunita Devi",
            sender_id=sender_objects[1].id,
            operator_id=op2.id,
            priority="high",
            is_active=True,
        )
        db.add(rule2)

        # Default catch-all rule
        rule3 = RoutingRule(
            organization_id=org.id,
            name="Default → Amit Kumar",
            operator_id=op1.id,
            priority="normal",
            is_active=True,
        )
        db.add(rule3)

        # Authorize staff for senders
        for staff in staff_objects[:2]:  # First 2 staff
            for sender in sender_objects[:2]:  # First 2 senders
                auth = StaffSenderAuthorization(
                    staff_id=staff.id,
                    sender_id=sender.id,
                    status="AUTHORIZED",
                    authorized_at=datetime.now(timezone.utc),
                )
                db.add(auth)

        await db.commit()
        print("✅ Database seeded successfully!")
        print(f"   Super Admin: admin@otp-relay.gov.in / admin123")
        print(f"   Office Admin: office.admin@palojori.gov.in / admin123")
        print(f"   Operator: amit.kumar@palojori.gov.in / operator123")
        print(f"   Staff: rajesh.kumar@palojori.gov.in / staff123")


if __name__ == "__main__":
    asyncio.run(seed())
