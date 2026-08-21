import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class OrgStatus(str, enum.Enum):
    TRIAL = "TRIAL"
    ACTIVE = "ACTIVE"
    PAST_DUE = "PAST_DUE"
    EXPIRED = "EXPIRED"
    SUSPENDED = "SUSPENDED"
    CANCELLED = "CANCELLED"


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    org_type = Column(String(50), default="office")
    state_id = Column(UUID(as_uuid=True), ForeignKey("states.id"), nullable=True, index=True)
    district_id = Column(UUID(as_uuid=True), ForeignKey("districts.id"), nullable=True, index=True)
    block_id = Column(UUID(as_uuid=True), ForeignKey("blocks.id"), nullable=True, index=True)
    status = Column(SAEnum(OrgStatus), default=OrgStatus.TRIAL, nullable=False, index=True)
    trial_ends_at = Column(DateTime(timezone=True), nullable=True)
    settings = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    users = relationship("User", back_populates="organization")
    state = relationship("State", back_populates="organizations")
    district = relationship("District", back_populates="organizations")
    block = relationship("Block", back_populates="organizations")
    subscription = relationship("Subscription", back_populates="organization", uselist=False)
    staff = relationship("Staff", back_populates="organization")
    operators = relationship("Operator", back_populates="organization")
    departments = relationship("DepartmentService", back_populates="organization")
    sender_ids = relationship("SenderId", back_populates="organization")
    routing_rules = relationship("RoutingRule", back_populates="organization")
    devices = relationship("Device", back_populates="organization")
    otp_messages = relationship("OtpMessage", back_populates="organization")


class State(Base):
    __tablename__ = "states"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    code = Column(String(10), unique=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    organizations = relationship("Organization", back_populates="state")
    districts = relationship("District", back_populates="state")


class District(Base):
    __tablename__ = "districts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    code = Column(String(10), nullable=False)
    state_id = Column(UUID(as_uuid=True), ForeignKey("states.id"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    state = relationship("State", back_populates="districts")
    organizations = relationship("Organization", back_populates="district")
    blocks = relationship("Block", back_populates="district")


class Block(Base):
    __tablename__ = "blocks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    code = Column(String(10), nullable=False)
    district_id = Column(UUID(as_uuid=True), ForeignKey("districts.id"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    district = relationship("District", back_populates="blocks")
    organizations = relationship("Organization", back_populates="block")
