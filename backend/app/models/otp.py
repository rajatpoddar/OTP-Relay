import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, Integer, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class OtpStatus(str, enum.Enum):
    RECEIVED = "RECEIVED"
    PROCESSING = "PROCESSING"
    ROUTED = "ROUTED"
    DELIVERED = "DELIVERED"
    VIEWED = "VIEWED"
    USED = "USED"
    EXPIRED = "EXPIRED"
    FAILED = "FAILED"
    UNASSIGNED = "UNASSIGNED"


class OtpMessage(Base):
    __tablename__ = "otp_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True)
    staff_id = Column(UUID(as_uuid=True), ForeignKey("staff.id"), nullable=True, index=True)
    device_id = Column(UUID(as_uuid=True), ForeignKey("devices.id"), nullable=True, index=True)
    sender_id = Column(UUID(as_uuid=True), ForeignKey("sender_ids.id"), nullable=True, index=True)
    sender_text = Column(String(50), nullable=False)
    service_name = Column(String(100), nullable=True)
    otp_value = Column(String(20), nullable=True)  # Will be masked after use/expiry
    otp_length = Column(Integer, nullable=True)
    purpose = Column(Text, nullable=True)
    reference_number = Column(String(100), nullable=True)
    raw_message = Column(Text, nullable=True)
    status = Column(SAEnum(OtpStatus), default=OtpStatus.RECEIVED, nullable=False, index=True)
    expiry_at = Column(DateTime(timezone=True), nullable=True)
    received_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    routed_at = Column(DateTime(timezone=True), nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    viewed_at = Column(DateTime(timezone=True), nullable=True)
    used_at = Column(DateTime(timezone=True), nullable=True)
    failed_at = Column(DateTime(timezone=True), nullable=True)
    failure_reason = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    organization = relationship("Organization", back_populates="otp_messages")
    staff = relationship("Staff", back_populates="otp_messages")
    sender = relationship("SenderId", back_populates="otp_messages")
    delivery_events = relationship("OtpDeliveryEvent", back_populates="otp_message")
    operator_notes = relationship("OperatorNote", back_populates="otp_message")


class OtpDeliveryEvent(Base):
    __tablename__ = "otp_delivery_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    otp_id = Column(UUID(as_uuid=True), ForeignKey("otp_messages.id"), nullable=False, index=True)
    operator_id = Column(UUID(as_uuid=True), ForeignKey("operators.id"), nullable=False, index=True)
    event_type = Column(String(50), nullable=False)  # routed, delivered, viewed, used
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    otp_message = relationship("OtpMessage", back_populates="delivery_events")
    operator = relationship("Operator", back_populates="otp_deliveries")


class OperatorNote(Base):
    __tablename__ = "operator_notes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    otp_id = Column(UUID(as_uuid=True), ForeignKey("otp_messages.id"), nullable=False, index=True)
    operator_id = Column(UUID(as_uuid=True), ForeignKey("operators.id"), nullable=False, index=True)
    note = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    otp_message = relationship("OtpMessage", back_populates="operator_notes")
    operator = relationship("Operator", back_populates="operator_notes")
