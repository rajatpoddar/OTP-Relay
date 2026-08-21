import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class AuthStatus(str, enum.Enum):
    AUTHORIZED = "AUTHORIZED"
    NOT_AUTHORIZED = "NOT_AUTHORIZED"
    REVOKED = "REVOKED"


class StaffSenderAuthorization(Base):
    __tablename__ = "staff_sender_authorizations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    staff_id = Column(UUID(as_uuid=True), ForeignKey("staff.id"), nullable=False, index=True)
    sender_id = Column(UUID(as_uuid=True), ForeignKey("sender_ids.id"), nullable=False, index=True)
    status = Column(SAEnum(AuthStatus), default=AuthStatus.NOT_AUTHORIZED, nullable=False)
    authorized_at = Column(DateTime(timezone=True), nullable=True)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    staff = relationship("Staff", back_populates="authorizations")
    sender = relationship("SenderId", back_populates="authorizations")


class RoutingRule(Base):
    __tablename__ = "routing_rules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    sender_id = Column(UUID(as_uuid=True), ForeignKey("sender_ids.id"), nullable=True, index=True)
    service_id = Column(UUID(as_uuid=True), ForeignKey("department_services.id"), nullable=True, index=True)
    staff_id = Column(UUID(as_uuid=True), ForeignKey("staff.id"), nullable=True, index=True)
    operator_id = Column(UUID(as_uuid=True), ForeignKey("operators.id"), nullable=False, index=True)
    priority = Column(String(20), default="normal")  # low, normal, high, critical
    is_active = Column(Boolean, default=True, nullable=False)
    effective_from = Column(DateTime(timezone=True), nullable=True)
    effective_to = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    organization = relationship("Organization", back_populates="routing_rules")
    sender = relationship("SenderId", back_populates="routing_rules")
    staff = relationship("Staff")
    operator = relationship("Operator", back_populates="routing_rules")
