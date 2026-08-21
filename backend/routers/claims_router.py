import json
import random
import string
from datetime import datetime, date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database import get_db, ClaimDB, ClaimTimelineDB, UserDB
from schemas import (
    ClaimSubmitRequest, ClaimResponse, ClaimStatusUpdateRequest,
    TimelineEventResponse, DashboardStats, MessageResponse
)
from auth import get_current_user, get_current_admin
from rules_engine import compute_risk_score, check_duplicate, determine_document_status

router = APIRouter(prefix="/api/claims", tags=["Claims"])


def _generate_claim_id() -> str:
    """Generate a unique CLM ID."""
    digits = ''.join(random.choices(string.digits, k=6))
    return f"CLM{digits}"


def _serialize_claim(claim: ClaimDB) -> ClaimResponse:
    """Convert DB model to response schema, parsing JSON fields."""
    docs = json.loads(claim.documents) if claim.documents else []
    data = {
        "claim_id": claim.claim_id,
        "customer_id": claim.customer_id,
        "customer_name": claim.customer_name,
        "email": claim.email,
        "mobile": claim.mobile,
        "policy_number": claim.policy_number,
        "policy_type": claim.policy_type,
        "policy_start_date": claim.policy_start_date,
        "policy_end_date": claim.policy_end_date,
        "claim_type": claim.claim_type,
        "incident_date": claim.incident_date,
        "incident_time": claim.incident_time,
        "incident_location": claim.incident_location,
        "incident_description": claim.incident_description,
        "claim_amount": claim.claim_amount,
        "damage_severity": claim.damage_severity,
        "injury_involved": claim.injury_involved,
        "police_report_available": claim.police_report_available,
        "submitted_date": claim.submitted_date,
        "claim_status": claim.claim_status,
        "priority": claim.priority,
        "risk_score": claim.risk_score,
        "risk_level": claim.risk_level,
        "duplicate_claim": claim.duplicate_claim,
        "document_status": claim.document_status,
        "documents": docs,
        "created_at": claim.created_at,
        "updated_at": claim.updated_at,
    }
    return ClaimResponse(**data)


def _add_timeline_event(db: Session, claim_id: str, status: str, message: str, created_by: str = "system"):
    event = ClaimTimelineDB(
        claim_id=claim_id,
        status=status,
        message=message,
        created_by=created_by,
    )
    db.add(event)


# ─── Customer Endpoints ───────────────────────────────────────────────────────

@router.post("", response_model=ClaimResponse, status_code=201)
def submit_claim(
    data: ClaimSubmitRequest,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user),
):
    """Submit a new insurance claim (customer)."""
    # Run Guidewire Gosu Rules Engine
    risk_result = compute_risk_score(
        damage_severity=data.damage_severity,
        injury_involved=data.injury_involved,
        claim_amount=data.claim_amount,
        claim_type=data.claim_type,
        police_report_available=data.police_report_available,
    )

    # Duplicate check
    existing_ids = [c.claim_id for c in db.query(ClaimDB.claim_id).filter(
        ClaimDB.customer_id == current_user.id
    ).all()]
    duplicate = check_duplicate(
        customer_id=current_user.id,
        policy_number=data.policy_number,
        incident_date=data.incident_date,
        claim_type=data.claim_type,
        existing_claim_ids=existing_ids,
    )

    doc_status = determine_document_status(data.documents or [])

    claim_id = _generate_claim_id()
    # Ensure uniqueness
    while db.query(ClaimDB).filter(ClaimDB.claim_id == claim_id).first():
        claim_id = _generate_claim_id()

    claim = ClaimDB(
        claim_id=claim_id,
        customer_id=current_user.id,
        customer_name=current_user.name,
        email=current_user.email,
        mobile=current_user.mobile or data.mobile or "",
        policy_number=data.policy_number,
        policy_type=data.policy_type,
        policy_start_date=data.policy_start_date,
        policy_end_date=data.policy_end_date,
        claim_type=data.claim_type,
        incident_date=data.incident_date,
        incident_time=data.incident_time,
        incident_location=data.incident_location,
        incident_description=data.incident_description,
        claim_amount=data.claim_amount,
        damage_severity=data.damage_severity,
        injury_involved=data.injury_involved,
        police_report_available=data.police_report_available,
        submitted_date=date.today().isoformat(),
        claim_status="Under Review",
        priority=risk_result["priority"],
        risk_score=risk_result["risk_score"],
        risk_level=risk_result["risk_level"],
        duplicate_claim=duplicate,
        document_status=doc_status,
        documents=json.dumps(data.documents or []),
    )

    db.add(claim)
    db.flush()

    # Auto-create timeline entry
    _add_timeline_event(
        db, claim_id, "Under Review",
        f"Claim {claim_id} submitted successfully. Gosu Risk Score: {risk_result['risk_score']}/100 ({risk_result['risk_level']} Risk)."
    )

    db.commit()
    db.refresh(claim)
    return _serialize_claim(claim)


@router.get("/my", response_model=List[ClaimResponse])
def get_my_claims(
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user),
):
    """Get all claims for the current customer."""
    claims = db.query(ClaimDB).filter(
        ClaimDB.customer_id == current_user.id
    ).order_by(ClaimDB.created_at.desc()).all()
    return [_serialize_claim(c) for c in claims]


# NOTE: /stats/dashboard MUST be declared before /{claim_id} to avoid
# FastAPI routing the literal "stats" as a claim_id path parameter.
@router.get("/stats/dashboard", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_admin: UserDB = Depends(get_current_admin),
):
    """Get admin dashboard statistics."""
    all_claims = db.query(ClaimDB).all()
    total_amount = sum(c.claim_amount for c in all_claims)
    return DashboardStats(
        total_claims=len(all_claims),
        under_review=sum(1 for c in all_claims if c.claim_status == "Under Review"),
        approved=sum(1 for c in all_claims if c.claim_status == "Approved"),
        rejected=sum(1 for c in all_claims if c.claim_status == "Rejected"),
        high_risk=sum(1 for c in all_claims if c.risk_level == "High"),
        total_amount=total_amount,
    )


@router.get("/{claim_id}", response_model=ClaimResponse)
def get_claim(
    claim_id: str,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user),
):
    """Get a specific claim by ID. Customers can only see their own claims."""
    claim = db.query(ClaimDB).filter(ClaimDB.claim_id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    if current_user.role != "admin" and claim.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return _serialize_claim(claim)


@router.get("/{claim_id}/timeline", response_model=List[TimelineEventResponse])
def get_claim_timeline(
    claim_id: str,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user),
):
    """Get timeline events for a specific claim."""
    claim = db.query(ClaimDB).filter(ClaimDB.claim_id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    if current_user.role != "admin" and claim.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    events = db.query(ClaimTimelineDB).filter(
        ClaimTimelineDB.claim_id == claim_id
    ).order_by(ClaimTimelineDB.timestamp.asc()).all()
    return events


# ─── Admin Endpoints ──────────────────────────────────────────────────────────

@router.get("", response_model=List[ClaimResponse])
def get_all_claims(
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    claim_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db),
    current_admin: UserDB = Depends(get_current_admin),
):
    """Get all claims with optional filters (admin only)."""
    query = db.query(ClaimDB)

    if status:
        query = query.filter(ClaimDB.claim_status == status)
    if priority:
        query = query.filter(ClaimDB.priority == priority)
    if claim_type:
        query = query.filter(ClaimDB.claim_type == claim_type)
    if search:
        like = f"%{search}%"
        query = query.filter(
            ClaimDB.claim_id.ilike(like) |
            ClaimDB.customer_name.ilike(like) |
            ClaimDB.policy_number.ilike(like) |
            ClaimDB.email.ilike(like)
        )

    claims = query.order_by(ClaimDB.created_at.desc()).offset(skip).limit(limit).all()
    return [_serialize_claim(c) for c in claims]


@router.put("/{claim_id}/status", response_model=ClaimResponse)
def update_claim_status(
    claim_id: str,
    data: ClaimStatusUpdateRequest,
    db: Session = Depends(get_db),
    current_admin: UserDB = Depends(get_current_admin),
):
    """Update claim status (admin only). Logs to timeline."""
    claim = db.query(ClaimDB).filter(ClaimDB.claim_id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    old_status = claim.claim_status
    new_status_map = {
        "Approve": "Approved",
        "Reject": "Rejected",
        "Request": "Document Requested",
        "Approved": "Approved",
        "Rejected": "Rejected",
        "Under Review": "Under Review",
        "Document Requested": "Document Requested",
    }
    new_status = new_status_map.get(data.status, data.status)
    claim.claim_status = new_status
    claim.updated_at = datetime.utcnow()

    # Auto-generate status message
    messages = {
        "Approved": f"Claim {claim_id} has been APPROVED by admin. Settlement will be processed within 3-5 business days.",
        "Rejected": f"Claim {claim_id} has been REJECTED by admin. Please contact support for more information.",
        "Document Requested": f"Admin has requested additional documents for claim {claim_id}. Please upload the required documents.",
        "Under Review": f"Claim {claim_id} has been moved back to Under Review status.",
    }
    message = messages.get(new_status, f"Claim status updated from {old_status} to {new_status}.")

    _add_timeline_event(db, claim_id, new_status, message, created_by=current_admin.id)
    db.commit()
    db.refresh(claim)
    return _serialize_claim(claim)




@router.delete("/{claim_id}", response_model=MessageResponse)
def delete_claim(
    claim_id: str,
    db: Session = Depends(get_db),
    current_admin: UserDB = Depends(get_current_admin),
):
    """Delete a claim (admin only)."""
    claim = db.query(ClaimDB).filter(ClaimDB.claim_id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    db.delete(claim)
    db.commit()
    return MessageResponse(success=True, message=f"Claim {claim_id} deleted successfully.")
