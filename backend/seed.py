"""
Seed script: populates the database with demo users and claims from AppContext.tsx
Run once: python seed.py
"""
import json
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal, init_db, UserDB, ClaimDB, ClaimTimelineDB
from auth import hash_password
from datetime import datetime


DEMO_USERS = [
    {
        "id": "CUST001",
        "name": "Hari Krishnan",
        "email": "customer@demo.com",
        "password": "demo1234",
        "mobile": "9876543210",
        "address": "42, Anna Nagar West",
        "city": "Chennai",
        "state": "Tamil Nadu",
        "pincode": "600040",
        "role": "customer",
    },
    {
        "id": "ADMIN001",
        "name": "Admin User",
        "email": "admin@demo.com",
        "password": "admin1234",
        "mobile": "9000000001",
        "address": "Head Office",
        "city": "Chennai",
        "state": "Tamil Nadu",
        "pincode": "600001",
        "role": "admin",
    },
]

DEMO_CLAIMS = [
    {
        "claim_id": "CLM000123", "customer_id": "CUST001", "customer_name": "Arun Kumar",
        "email": "arun@example.com", "mobile": "9876543210",
        "policy_number": "POL10023", "policy_type": "Vehicle Insurance",
        "policy_start_date": "2025-01-01", "policy_end_date": "2026-01-01",
        "claim_type": "Accident", "incident_date": "2026-08-01", "incident_time": "14:30",
        "incident_location": "Chennai Highway, NH-44",
        "incident_description": "Vehicle collided with another car at highway intersection.",
        "claim_amount": 85000, "damage_severity": "Major", "injury_involved": True,
        "police_report_available": True, "submitted_date": "2026-08-02",
        "claim_status": "Under Review", "priority": "High",
        "risk_score": 72, "risk_level": "High", "duplicate_claim": "No",
        "document_status": "Verified",
        "documents": json.dumps(["Policy Document", "Driving License", "Vehicle Registration",
                                  "Accident Photos", "Police Report", "Medical Report"]),
    },
    {
        "claim_id": "CLM000124", "customer_id": "CUST001", "customer_name": "Ravi Shankar",
        "email": "ravi@example.com", "mobile": "9876543211",
        "policy_number": "POL10024", "policy_type": "Vehicle Insurance",
        "policy_start_date": "2025-03-01", "policy_end_date": "2026-03-01",
        "claim_type": "Theft", "incident_date": "2026-07-28", "incident_time": "02:00",
        "incident_location": "Coimbatore City Centre",
        "incident_description": "Vehicle stolen from parking lot overnight.",
        "claim_amount": 25000, "damage_severity": "Minor", "injury_involved": False,
        "police_report_available": True, "submitted_date": "2026-07-29",
        "claim_status": "Approved", "priority": "Low",
        "risk_score": 28, "risk_level": "Low", "duplicate_claim": "No",
        "document_status": "Verified",
        "documents": json.dumps(["Policy Document", "Driving License", "Vehicle Registration", "Police Report"]),
    },
    {
        "claim_id": "CLM000125", "customer_id": "CUST001", "customer_name": "Priya Devi",
        "email": "priya@example.com", "mobile": "9876543212",
        "policy_number": "POL10025", "policy_type": "Vehicle Insurance",
        "policy_start_date": "2025-06-01", "policy_end_date": "2026-06-01",
        "claim_type": "Natural Disaster", "incident_date": "2026-08-05", "incident_time": "11:00",
        "incident_location": "Madurai",
        "incident_description": "Vehicle damaged due to heavy flooding during monsoon season.",
        "claim_amount": 150000, "damage_severity": "Major", "injury_involved": False,
        "police_report_available": False, "submitted_date": "2026-08-06",
        "claim_status": "Under Review", "priority": "High",
        "risk_score": 65, "risk_level": "High", "duplicate_claim": "Yes",
        "document_status": "Pending",
        "documents": json.dumps(["Policy Document", "Driving License", "Vehicle Registration", "Accident Photos"]),
    },
    {
        "claim_id": "CLM000126", "customer_id": "CUST001", "customer_name": "Suresh Babu",
        "email": "suresh@example.com", "mobile": "9876543213",
        "policy_number": "POL10026", "policy_type": "Vehicle Insurance",
        "policy_start_date": "2024-11-01", "policy_end_date": "2025-11-01",
        "claim_type": "Fire", "incident_date": "2026-07-20", "incident_time": "16:45",
        "incident_location": "Trichy",
        "incident_description": "Engine caught fire due to electrical fault.",
        "claim_amount": 120000, "damage_severity": "Major", "injury_involved": True,
        "police_report_available": True, "submitted_date": "2026-07-21",
        "claim_status": "Rejected", "priority": "Medium",
        "risk_score": 58, "risk_level": "Medium", "duplicate_claim": "No",
        "document_status": "Verified",
        "documents": json.dumps(["Policy Document", "Driving License", "Accident Photos", "Police Report"]),
    },
    {
        "claim_id": "CLM000127", "customer_id": "CUST001", "customer_name": "Kavitha Rajan",
        "email": "kavitha@example.com", "mobile": "9876543214",
        "policy_number": "POL10027", "policy_type": "Vehicle Insurance",
        "policy_start_date": "2025-02-01", "policy_end_date": "2026-02-01",
        "claim_type": "Accident", "incident_date": "2026-08-08", "incident_time": "09:15",
        "incident_location": "Bangalore Road, Hosur",
        "incident_description": "Minor collision at traffic signal. No major damage.",
        "claim_amount": 18000, "damage_severity": "Minor", "injury_involved": False,
        "police_report_available": False, "submitted_date": "2026-08-09",
        "claim_status": "Under Review", "priority": "Low",
        "risk_score": 22, "risk_level": "Low", "duplicate_claim": "No",
        "document_status": "Verified",
        "documents": json.dumps(["Policy Document", "Driving License", "Vehicle Registration", "Accident Photos"]),
    },
]

TIMELINE_EVENTS = [
    ("CLM000123", "Submitted", "Claim CLM000123 submitted. Risk Score: 72/100 (High Risk).", "system"),
    ("CLM000123", "Under Review", "Assigned to senior adjuster. High priority case.", "ADMIN001"),
    ("CLM000124", "Submitted", "Claim CLM000124 submitted. Risk Score: 28/100 (Low Risk).", "system"),
    ("CLM000124", "Under Review", "Initial review started. Documents verified.", "ADMIN001"),
    ("CLM000124", "Approved", "Claim CLM000124 has been APPROVED. Settlement will be processed within 3-5 business days.", "ADMIN001"),
    ("CLM000125", "Submitted", "Claim CLM000125 submitted. Risk Score: 65/100 (High Risk). Potential duplicate detected.", "system"),
    ("CLM000125", "Under Review", "Duplicate flag raised. Manual review required.", "ADMIN001"),
    ("CLM000126", "Submitted", "Claim CLM000126 submitted. Risk Score: 58/100 (Medium Risk).", "system"),
    ("CLM000126", "Under Review", "Policy validity check failed. Policy expired before incident.", "ADMIN001"),
    ("CLM000126", "Rejected", "Claim CLM000126 has been REJECTED. Policy was expired at time of incident.", "ADMIN001"),
    ("CLM000127", "Submitted", "Claim CLM000127 submitted. Risk Score: 22/100 (Low Risk).", "system"),
    ("CLM000127", "Under Review", "Standard review process initiated.", "ADMIN001"),
]


def seed():
    init_db()
    db = SessionLocal()
    try:
        # Seed users
        for u in DEMO_USERS:
            existing = db.query(UserDB).filter(UserDB.id == u["id"]).first()
            if not existing:
                db.add(UserDB(
                    id=u["id"],
                    name=u["name"],
                    email=u["email"],
                    hashed_password=hash_password(u["password"]),
                    mobile=u["mobile"],
                    address=u["address"],
                    city=u["city"],
                    state=u["state"],
                    pincode=u["pincode"],
                    role=u["role"],
                ))
                print(f"  ✓ Created user: {u['email']} ({u['role']})")
            else:
                print(f"  ~ Skipped existing user: {u['email']}")

        db.commit()

        # Seed claims
        for c in DEMO_CLAIMS:
            existing = db.query(ClaimDB).filter(ClaimDB.claim_id == c["claim_id"]).first()
            if not existing:
                db.add(ClaimDB(**c))
                print(f"  ✓ Created claim: {c['claim_id']}")
            else:
                print(f"  ~ Skipped existing claim: {c['claim_id']}")

        db.commit()

        # Seed timeline
        for claim_id, status, message, created_by in TIMELINE_EVENTS:
            db.add(ClaimTimelineDB(
                claim_id=claim_id,
                status=status,
                message=message,
                created_by=created_by,
            ))
        db.commit()
        print(f"  ✓ Seeded {len(TIMELINE_EVENTS)} timeline events")

        print("\n✅ Database seeded successfully!")
        print("   Demo credentials:")
        print("   Customer: customer@demo.com / demo1234")
        print("   Admin:    admin@demo.com / admin1234")

    finally:
        db.close()


if __name__ == "__main__":
    seed()
