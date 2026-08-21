"""
Guidewire-style Gosu Rules Engine Simulation
Computes risk score, priority, and duplicate detection for insurance claims.
"""
from typing import Optional
import hashlib


def compute_risk_score(
    damage_severity: str,
    injury_involved: bool,
    claim_amount: float,
    claim_type: str,
    police_report_available: bool,
) -> dict:
    """
    Mimics Guidewire ClaimCenter's Gosu Rules Engine.
    Returns risk_score (0-100), risk_level, priority.
    """
    score = 0

    # Severity scoring
    if damage_severity == "Major":
        score += 30
    elif damage_severity == "Moderate":
        score += 15
    else:
        score += 5

    # Injury involvement
    if injury_involved:
        score += 20

    # Claim amount thresholds
    if claim_amount > 100000:
        score += 20
    elif claim_amount > 50000:
        score += 12
    elif claim_amount > 20000:
        score += 6

    # Claim type risk multiplier
    if claim_type == "Theft":
        score += 10
    elif claim_type == "Fire":
        score += 8
    elif claim_type == "Natural Disaster":
        score += 6

    # Missing police report for required claim types
    if not police_report_available and claim_type in ("Accident", "Theft"):
        score += 5

    risk_score = min(score, 100)
    risk_level = "High" if risk_score >= 60 else "Medium" if risk_score >= 35 else "Low"
    priority = "High" if risk_score >= 60 else "Medium" if risk_score >= 35 else "Low"

    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "priority": priority,
    }


def check_duplicate(
    customer_id: str,
    policy_number: str,
    incident_date: str,
    claim_type: str,
    existing_claim_ids: list,
) -> str:
    """
    Deterministic duplicate detection based on claim fingerprint.
    In production, this would cross-check against claim database.
    """
    # Create a fingerprint from key fields
    fingerprint = f"{customer_id}:{policy_number}:{incident_date}:{claim_type}"
    hash_val = int(hashlib.md5(fingerprint.encode()).hexdigest(), 16)
    # Mark as duplicate if hash ends in specific pattern (simulates ~10% rate)
    # In production, actually query DB for same policy + incident date
    is_dup = (hash_val % 10) == 0
    return "Yes" if is_dup else "No"


def determine_document_status(documents: list) -> str:
    """Determine document completeness status."""
    if not documents:
        return "Pending"
    required = {"Policy Document", "Driving License", "Vehicle Registration"}
    provided = set(documents)
    if required.issubset(provided):
        return "Verified"
    return "Incomplete"
