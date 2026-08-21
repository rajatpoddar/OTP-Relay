import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Integer, Text, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class PlanStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    ARCHIVED = "ARCHIVED"


class SubscriptionStatus(str, enum.Enum):
    TRIAL = "TRIAL"
    ACTIVE = "ACTIVE"
    PAST_DUE = "PAST_DUE"
    EXPIRED = "EXPIRED"
    SUSPENDED = "SUSPENDED"
    CANCELLED = "CANCELLED"


class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    monthly_price = Column(Integer, nullable=False, default=0)
    staff_limit = Column(Integer, nullable=False, default=10)
    operator_limit = Column(Integer, nullable=False, default=2)
    device_limit = Column(Integer, nullable=False, default=10)
    otp_limit = Column(Integer, nullable=False, default=1000)
    features = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    status = Column(SAEnum(PlanStatus), default=PlanStatus.ACTIVE, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    subscriptions = relationship("Subscription", back_populates="plan")


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), unique=True, nullable=False, index=True)
    plan_id = Column(UUID(as_uuid=True), ForeignKey("subscription_plans.id"), nullable=False, index=True)
    status = Column(SAEnum(SubscriptionStatus), default=SubscriptionStatus.TRIAL, nullable=False, index=True)
    starts_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    trial_ends_at = Column(DateTime(timezone=True), nullable=True)
    cancelled_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships - use foreign_keys to disambiguate
    organization = relationship("Organization", back_populates="subscription", foreign_keys=[organization_id])
    plan = relationship("SubscriptionPlan", back_populates="subscriptions")
    payments = relationship("Payment", back_populates="subscription")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    subscription_id = Column(UUID(as_uuid=True), ForeignKey("subscriptions.id"), nullable=False, index=True)
    amount = Column(Integer, nullable=False)
    currency = Column(String(3), default="INR")
    payment_method = Column(String(50), nullable=True)
    payment_reference = Column(String(255), nullable=True)
    status = Column(String(20), default="pending")
    paid_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    subscription = relationship("Subscription", back_populates="payments")


class AppVersion(Base):
    __tablename__ = "app_versions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    version = Column(String(20), nullable=False, unique=True)
    minimum_supported_version = Column(String(20), nullable=True)
    latest_version = Column(String(20), nullable=False)
    force_update = Column(Boolean, default=False)
    release_notes = Column(Text, nullable=True)
    download_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)


class ActivationCode(Base):
    __tablename__ = "activation_codes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(50), unique=True, nullable=False, index=True)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True)
    staff_id = Column(UUID(as_uuid=True), ForeignKey("staff.id"), nullable=True)
    device_id = Column(UUID(as_uuid=True), ForeignKey("devices.id"), nullable=True)
    is_used = Column(Boolean, default=False, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    used_at = Column(DateTime(timezone=True), nullable=True)
