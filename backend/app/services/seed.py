"""Seed the database with minimal production data.

Creates ONLY:
- Super Admin user (can be changed after first login)
- Default subscription plan
- Default activation code for initial device registration

Everything else (organization, staff, operators, sender IDs, routing rules)
should be created by the Super Admin through the admin panel.
"""
import asyncio
from datetime import datetime, timezone, timedelta

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import select

from app.core.config import settings
from app.core.security import hash_password
from app.models.user import User, UserRole
from app.models.subscription import SubscriptionPlan, ActivationCode


# Default credentials - CHANGE THESE IN PRODUCTION
SUPER_ADMIN_EMAIL = "admin@otp-relay.com"
SUPER_ADMIN_PASSWORD = "admin123"
SUPER_ADMIN_NAME = "Super Admin"


async def seed():
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = async_sessionmaker(engine, expire_on_commit=False)

    async with async_session() as db:
        # Check if already seeded
        result = await db.execute(select(User).limit(1))
        if result.scalar_one_or_none():
            print("ℹ️  Database already has data. Skipping seed.")
            return

        print("🌱 Seeding database...")

        # 1. Create Super Admin
        super_admin = User(
            email=SUPER_ADMIN_EMAIL,
            full_name=SUPER_ADMIN_NAME,
            hashed_password=hash_password(SUPER_ADMIN_PASSWORD),
            role=UserRole.SUPER_ADMIN,
            is_active=True,
        )
        db.add(super_admin)
        await db.flush()
        print(f"   ✅ Super Admin: {SUPER_ADMIN_EMAIL}")

        # 2. Create Default Subscription Plan
        plan = SubscriptionPlan(
            name="Professional",
            description="Full access for offices and field teams",
            monthly_price=4999,
            staff_limit=50,
            operator_limit=10,
            device_limit=50,
            otp_limit=50000,
        )
        db.add(plan)
        await db.flush()
        print(f"   ✅ Subscription Plan: Professional")

        # 3. Create Default Activation Code
        # This is used for initial device registration before staff accounts exist
        default_code = ActivationCode(
            code="DEFAULT",
            is_used=False,
            expires_at=datetime.now(timezone.utc) + timedelta(days=365),
        )
        db.add(default_code)
        await db.flush()
        print(f"   ✅ Default Activation Code: DEFAULT")

        await db.commit()

        print("")
        print("══════════════════════════════════════════")
        print("  🎉 Database seeded successfully!")
        print("══════════════════════════════════════════")
        print("")
        print("  Default Super Admin Login:")
        print(f"  Email:    {SUPER_ADMIN_EMAIL}")
        print(f"  Password: {SUPER_ADMIN_PASSWORD}")
        print("")
        print("  ⚠️  CHANGE PASSWORD AFTER FIRST LOGIN!")
        print("")
        print("  Next Steps:")
        print("  1. Login as Super Admin")
        print("  2. Create your Organization")
        print("  3. Create Office Admin")
        print("  4. Configure Sender IDs & Routing Rules")
        print("  5. Staff will register via mobile app")
        print("")


if __name__ == "__main__":
    asyncio.run(seed())
