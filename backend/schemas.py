from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime


# ─── Auth Schemas ─────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    mobile: Optional[str] = ""
    address: Optional[str] = ""
    city: Optional[str] = ""
    state: Optional[str] = ""
    pincode: Optional[str] = ""
    role: Optional[str] = "customer"

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


# ─── User Schemas ─────────────────────────────────────────────────────────────

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    mobile: str
    address: str
    city: str
    state: str
    pincode: str
    role: str

    model_config = {"from_attributes": True}


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    mobile: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None


# ─── Claim Schemas ────────────────────────────────────────────────────────────

class ClaimSubmitRequest(BaseModel):
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    email: Optional[str] = None
    mobile: Optional[str] = ""

    policy_number: str
    policy_type: str
    policy_start_date: str
    policy_end_date: str

    claim_type: str
    incident_date: str
    incident_time: str
    incident_location: str
    incident_description: str
    claim_amount: float
    damage_severity: str
    injury_involved: bool
    police_report_available: bool
    documents: Optional[List[str]] = []


class ClaimStatusUpdateRequest(BaseModel):
    status: str  # Approved | Rejected | Under Review | Request


class ClaimResponse(BaseModel):
    claim_id: str
    customer_id: str
    customer_name: str
    email: str
    mobile: str
    policy_number: str
    policy_type: str
    policy_start_date: str
    policy_end_date: str
    claim_type: str
    incident_date: str
    incident_time: str
    incident_location: str
    incident_description: str
    claim_amount: float
    damage_severity: str
    injury_involved: bool
    police_report_available: bool
    submitted_date: str
    claim_status: str
    priority: str
    risk_score: int
    risk_level: str
    duplicate_claim: str
    document_status: str
    documents: List[str]
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ─── Timeline Schema ──────────────────────────────────────────────────────────

class TimelineEventResponse(BaseModel):
    id: int
    claim_id: str
    status: str
    message: str
    timestamp: datetime
    created_by: str

    model_config = {"from_attributes": True}


# ─── Dashboard Stats ──────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_claims: int
    under_review: int
    approved: int
    rejected: int
    high_risk: int
    total_amount: float


# ─── Generic Response ─────────────────────────────────────────────────────────

class MessageResponse(BaseModel):
    success: bool
    message: str


TokenResponse.model_rebuild()
