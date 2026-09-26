from datetime import datetime, timezone
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
)
from sqlalchemy.orm import foreign, relationship, synonym

from backend.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=True)
    hashed_password = Column(String(255), nullable=True)
    role = Column(String(50), default="viewer", nullable=False)  # admin, clinician, auditor, viewer
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    # Relationships
    clinician = relationship("Clinician", back_populates="user", uselist=False)
    audit_logs = relationship("AuditLog", back_populates="user")


class Patient(Base):
    """
    Authoritative CAREVAULT Patient Model.
    Directly supports all fields from patients.csv and powers the Critical Patient Card.
    """
    __tablename__ = "patients"

    patient_id = Column(String(50), primary_key=True, index=True)  # P0001, P0002...
    full_name = Column(String(255), nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String(20), nullable=False)
    ward = Column(String(100), nullable=False)
    bed_number = Column(String(50), nullable=False)
    blood_group = Column(String(10), nullable=False)
    allergies = Column(Text, nullable=False)
    critical_diagnosis = Column(Text, nullable=False)
    current_medications = Column(Text, nullable=False)
    recent_investigations = Column(Text, nullable=False)
    recent_results = Column(Text, nullable=False)
    last_synchronized = Column(DateTime(timezone=True), nullable=False)
    record_version = Column(String(20), default="V1", nullable=False)

    # Synonyms matching exact CSV column headers
    PATIENT_ID = synonym("patient_id")
    FULL_NAME = synonym("full_name")
    AGE = synonym("age")
    GENDER = synonym("gender")
    WARD = synonym("ward")
    BED_NUMBER = synonym("bed_number")
    BLOOD_GROUP = synonym("blood_group")
    ALLERGIES = synonym("allergies")
    CRITICAL_DIAGNOSIS = synonym("critical_diagnosis")
    CURRENT_MEDICATIONS = synonym("current_medications")
    RECENT_INVESTIGATIONS = synonym("recent_investigations")
    RECENT_RESULTS = synonym("recent_results")
    LAST_SYNCHRONIZED = synonym("last_synchronized")
    RECORD_VERSION = synonym("record_version")

    # Relationships
    clinical_events = relationship("ClinicalEvent", back_populates="patient", cascade="all, delete-orphan")


class Clinician(Base):
    """
    Authoritative CAREVAULT Clinician Model.
    Directly supports all fields from clinicians.csv.
    """
    __tablename__ = "clinicians"

    clinician_id = Column(String(50), primary_key=True, index=True)  # DR001, NR001...
    name = Column(String(255), nullable=False)
    role = Column(String(100), nullable=False)  # Doctor, Nurse...
    nfc_id = Column(String(100), unique=True, index=True, nullable=True)  # NFC_DR001
    fingerprint_id = Column(String(100), unique=True, index=True, nullable=True)  # FP_DR001
    active = Column(Boolean, default=True, nullable=False)  # TRUE/FALSE
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=True)

    # Synonyms matching exact CSV column headers
    CLINICIAN_ID = synonym("clinician_id")
    NAME = synonym("name")
    ROLE = synonym("role")
    NFC_ID = synonym("nfc_id")
    FINGERPRINT_ID = synonym("fingerprint_id")
    ACTIVE = synonym("active")

    # Relationships
    user = relationship("User", back_populates="clinician")
    clinical_events = relationship(
        "ClinicalEvent",
        back_populates="clinician",
        primaryjoin="Clinician.clinician_id == foreign(ClinicalEvent.clinician_id)",
    )


class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    device_uid = Column(String(100), unique=True, index=True, nullable=False)
    device_type = Column(String(100), nullable=False)  # ECG Monitor, Infusion Pump, etc.
    model = Column(String(100), nullable=False)
    facility = Column(String(100), nullable=True)
    status = Column(String(50), default="active", nullable=False)
    last_ping = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)


class ClinicalEvent(Base):
    """
    Authoritative CAREVAULT Clinical Event Model.
    Directly supports all fields from clinical_events.csv.
    Note: clinician_id stores identifiers directly without hard foreign key enforcement,
    preserving events for unlisted clinicians (e.g., MG001, AD001) without fabricating data.
    """
    __tablename__ = "clinical_events"

    event_id = Column(String(50), primary_key=True, index=True)  # E0001, E0002...
    patient_id = Column(String(50), ForeignKey("patients.patient_id"), nullable=False, index=True)
    clinician_id = Column(String(50), index=True, nullable=True)  # DR001, NR001, MG001, AD001...
    event_type = Column(String(100), nullable=False, index=True)
    event_details = Column(Text, nullable=False)
    event_timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    source = Column(String(100), default="CAREVAULT", nullable=False)
    status = Column(String(50), default="RECORDED", nullable=False)
    event_hash = Column(String(64), nullable=False, index=True)  # SHA-256 hex string
    integrity_status = Column(String(50), default="VALID", nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    # Synonyms matching exact CSV column headers
    EVENT_ID = synonym("event_id")
    PATIENT_ID = synonym("patient_id")
    CLINICIAN_ID = synonym("clinician_id")
    EVENT_TYPE = synonym("event_type")
    EVENT_DETAILS = synonym("event_details")
    EVENT_TIMESTAMP = synonym("event_timestamp")
    SOURCE = synonym("source")
    STATUS = synonym("status")
    EVENT_HASH = synonym("event_hash")
    INTEGRITY_STATUS = synonym("integrity_status")
    CREATED_AT = synonym("created_at")

    # Relationships
    patient = relationship("Patient", back_populates="clinical_events")
    clinician = relationship(
        "Clinician",
        back_populates="clinical_events",
        primaryjoin="foreign(ClinicalEvent.clinician_id) == Clinician.clinician_id",
    )
    integrity_records = relationship("IntegrityRecord", back_populates="clinical_event", cascade="all, delete-orphan")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(100), nullable=False)
    entity_id = Column(String(100), nullable=True)
    ip_address = Column(String(50), nullable=True)
    details = Column(JSON, nullable=True)
    timestamp = Column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)

    # Relationships
    user = relationship("User", back_populates="audit_logs")


class IntegrityRecord(Base):
    __tablename__ = "integrity_records"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(String(50), ForeignKey("clinical_events.event_id"), nullable=False, index=True)
    calculated_hash = Column(String(64), nullable=False)
    expected_hash = Column(String(64), nullable=False)
    status = Column(String(50), nullable=False)  # VALID, COMPROMISED
    verified_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    details = Column(Text, nullable=True)

    # Relationships
    clinical_event = relationship("ClinicalEvent", back_populates="integrity_records")


class ReconciliationRecord(Base):
    __tablename__ = "reconciliation_records"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(String(100), unique=True, index=True, nullable=False)
    source = Column(String(100), nullable=False)
    target = Column(String(100), default="Central_Vault", nullable=False)
    status = Column(String(50), default="IN_PROGRESS", nullable=False)
    records_processed = Column(Integer, default=0, nullable=False)
    discrepancy_count = Column(Integer, default=0, nullable=False)
    details = Column(JSON, nullable=True)
    synced_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
