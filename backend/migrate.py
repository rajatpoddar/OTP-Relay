"""Run initial migration."""
from sqlalchemy import create_engine
from app.core.config import settings
from app.core.database import Base

# Import all models so Base.metadata knows about them
from app.models.user import User, UserRole
from app.models.organization import Organization, State, District, Block, OrgStatus
from app.models.staff_operator import Staff, Operator, StaffOperatorOtpPreference
from app.models.device_service import Device, DeviceStatus, DepartmentService, SenderId
from app.models.routing import StaffSenderAuthorization, AuthStatus, RoutingRule
from app.models.otp import OtpMessage, OtpStatus, OtpDeliveryEvent, OperatorNote
from app.models.subscription import SubscriptionPlan, Subscription, SubscriptionStatus, Payment, AppVersion, ActivationCode
from app.models.audit import AuditLog


def run_migrations():
    engine = create_engine(settings.DATABASE_URL_SYNC)
    Base.metadata.create_all(engine)
    print("✅ Database tables created successfully!")


if __name__ == "__main__":
    run_migrations()
