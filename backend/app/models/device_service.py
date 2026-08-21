import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Integer, Text, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class DeviceStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACTIVE = "ACTIVE"
    REVOKED = "REVOKED"
    SUSPENDED = "SUSPENDED"


class Device(Base):
    __tablename__ = "devices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    device_id = Column(String(255), unique=True, nullable=False, index=True)
    staff_id = Column(UUID(as_uuid=True), ForeignKey("staff.id"), nullable=False, index=True)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True)
    model = Column(String(100), nullable=True)
    android_version = Column(String(20), nullable=True)
    app_version = Column(String(20), nullable=True)
    status = Column(SAEnum(DeviceStatus), default=DeviceStatus.PENDING, nullable=False, index=True)
    registered_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    last_seen_at = Column(DateTime(timezone=True), nullable=True)
    last_sync_at = Column(DateTime(timezone=True), nullable=True)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    revoked_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    staff = relationship("Staff", back_populates="devices")
    organization = relationship("Organization", back_populates="devices")


class DepartmentService(Base):
    __tablename__ = "department_services"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=False)
    display_name = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    organization = relationship("Organization", back_populates="departments")
    sender_ids = relationship("SenderId", back_populates="department")


class SenderId(Base):
    __tablename__ = "sender_ids"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True)
    department_id = Column(UUID(as_uuid=True), ForeignKey("department_services.id"), nullable=True, index=True)
    sender_id = Column(String(50), nullable=False)
    display_name = Column(String(255), nullable=True)
    otp_length = Column(Integer, default=6)
    extraction_regex = Column(Text, nullable=True)
    message_template = Column(Text, nullable=True)
    purpose_regex = Column(Text, nullable=True)
    reference_regex = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    organization = relationship("Organization", back_populates="sender_ids")
    department = relationship("DepartmentService", back_populates="sender_ids")
    authorizations = relationship("StaffSenderAuthorization", back_populates="sender")
    routing_rules = relationship("RoutingRule", back_populates="sender")
    otp_messages = relationship("OtpMessage", back_populates="sender")
