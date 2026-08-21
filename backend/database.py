from sqlalchemy import create_engine, Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import DeclarativeBase, sessionmaker, relationship
from datetime import datetime
from config import settings

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False}  # SQLite specific
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


# ─── ORM Models ──────────────────────────────────────────────────────────────

class UserDB(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    mobile = Column(String, default="")
    address = Column(String, default="")
    city = Column(String, default="")
    state = Column(String, default="")
    pincode = Column(String, default="")
    role = Column(String, default="customer")  # 'customer' | 'admin'
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    claims = relationship("ClaimDB", back_populates="user", foreign_keys="ClaimDB.customer_id")


class ClaimDB(Base):
    __tablename__ = "claims"

    id = Column(Integer, primary_key=True, autoincrement=True)
    claim_id = Column(String, unique=True, index=True, nullable=False)
    customer_id = Column(String, ForeignKey("users.id"), nullable=False)
    customer_name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    mobile = Column(String, default="")

    # Policy
    policy_number = Column(String, nullable=False)
    policy_type = Column(String, nullable=False)
    policy_start_date = Column(String, nullable=False)
    policy_end_date = Column(String, nullable=False)

    # Claim Details
    claim_type = Column(String, nullable=False)
    incident_date = Column(String, nullable=False)
    incident_time = Column(String, nullable=False)
    incident_location = Column(String, nullable=False)
    incident_description = Column(Text, nullable=False)
    claim_amount = Column(Float, nullable=False)
    damage_severity = Column(String, nullable=False)
    injury_involved = Column(Boolean, default=False)
    police_report_available = Column(Boolean, default=False)
    submitted_date = Column(String, nullable=False)

    # Guidewire / AI Processing Results
    claim_status = Column(String, default="Under Review")
    priority = Column(String, default="Medium")
    risk_score = Column(Integer, default=0)
    risk_level = Column(String, default="Medium")
    duplicate_claim = Column(String, default="No")
    document_status = Column(String, default="Pending")
    documents = Column(Text, default="[]")  # JSON string

    # Audit
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("UserDB", back_populates="claims", foreign_keys=[customer_id])
    timeline = relationship("ClaimTimelineDB", back_populates="claim", cascade="all, delete-orphan")


class ClaimTimelineDB(Base):
    __tablename__ = "claim_timeline"

    id = Column(Integer, primary_key=True, autoincrement=True)
    claim_id = Column(String, ForeignKey("claims.claim_id"), nullable=False)
    status = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String, default="system")  # system | admin user id

    claim = relationship("ClaimDB", back_populates="timeline")


# ─── DB Init ─────────────────────────────────────────────────────────────────

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables."""
    Base.metadata.create_all(bind=engine)
