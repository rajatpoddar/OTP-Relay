from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context

from app.core.config import settings
from app.core.database import Base
# Import all models so Base.metadata discovers them
from app.models.user import User, UserRole
from app.models.organization import Organization, State, District, Block, OrgStatus
from app.models.staff_operator import Staff, Operator
from app.models.device_service import Device, DeviceStatus, DepartmentService, SenderId
from app.models.routing import StaffSenderAuthorization, AuthStatus, RoutingRule
from app.models.otp import OtpMessage, OtpStatus, OtpDeliveryEvent, OperatorNote
from app.models.subscription import SubscriptionPlan, Subscription, SubscriptionStatus, Payment, AppVersion, ActivationCode
from app.models.audit import AuditLog

config = context.config
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL_SYNC)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
