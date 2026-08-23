import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class Staff(Base):
    __tablename__ = "staff"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False, index=True)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True)
    staff_id_number = Column(String(50), nullable=True)
    full_name = Column(String(255), nullable=False)
    mobile_number = Column(String(20), nullable=False, index=True)
    designation = Column(String(100), nullable=True)
    department_id = Column(UUID(as_uuid=True), ForeignKey("department_services.id"), nullable=True, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    profile_completed = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    user = relationship("User", back_populates="staff_profile")
    organization = relationship("Organization", back_populates="staff")
    department = relationship("DepartmentService")
    devices = relationship("Device", back_populates="staff")
    authorizations = relationship("StaffSenderAuthorization", back_populates="staff")
    otp_messages = relationship("OtpMessage", back_populates="staff")
    operator_preferences = relationship("StaffOperatorOtpPreference", back_populates="staff")


class Operator(Base):
    __tablename__ = "operators"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False, index=True)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    user = relationship("User", back_populates="operator_profile")
    organization = relationship("Organization", back_populates="operators")
    routing_rules = relationship("RoutingRule", back_populates="operator")
    otp_deliveries = relationship("OtpDeliveryEvent", back_populates="operator")
    operator_notes = relationship("OperatorNote", back_populates="operator")
    staff_preferences = relationship("StaffOperatorOtpPreference", back_populates="operator")


class StaffOperatorOtpPreference(Base):
    """Controls whether a staff member's OTPs can be routed to a specific operator.

    When enabled=True, OTPs from this staff member CAN be delivered to this operator.
    When enabled=False, OTPs from this staff member MUST NOT be delivered to this operator.
    The routing engine checks this before delivery.
    """
    __tablename__ = "staff_operator_otp_preferences"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True)
    staff_id = Column(UUID(as_uuid=True), ForeignKey("staff.id"), nullable=False, index=True)
    operator_id = Column(UUID(as_uuid=True), ForeignKey("operators.id"), nullable=False, index=True)
    enabled = Column(Boolean, default=True, nullable=False)  # True = OTP sharing allowed
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    updated_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    # Relationships
    staff = relationship("Staff", back_populates="operator_preferences")
    operator = relationship("Operator", back_populates="staff_preferences")
    organization = relationship("Organization")

    __table_args__ = (
        UniqueConstraint("organization_id", "staff_id", "operator_id", name="uq_staff_operator_org"),
    )
