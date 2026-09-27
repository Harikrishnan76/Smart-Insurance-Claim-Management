"""
OCR Router — Optical Character Recognition for Document Verification
Uses pytesseract (for images) and pdfplumber (for PDFs) to extract text
from uploaded insurance documents and parse key claim fields.
"""

import io
import re
import logging
from typing import Optional

from fastapi import APIRouter, File, UploadFile, Depends, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from auth import get_current_user
from database import UserDB

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ocr", tags=["OCR"])


# ─── Response Schemas ────────────────────────────────────────────────────────

class OCRField(BaseModel):
    value: str
    confidence: str  # "high" | "medium" | "low"


class OCRResult(BaseModel):
    success: bool
    doc_type: str
    raw_text: str
    extracted_fields: dict
    verification_status: str   # "verified" | "partial" | "unreadable"
    verification_notes: list[str]
    error: Optional[str] = None


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _extract_text_from_image(content: bytes) -> str:
    """Extract text from image bytes using pytesseract."""
    try:
        import pytesseract
        from PIL import Image
        img = Image.open(io.BytesIO(content))
        # Enhance image for better OCR
        img = img.convert("RGB")
        text = pytesseract.image_to_string(img, config="--psm 6 --oem 3")
        return text.strip()
    except ImportError:
        raise HTTPException(
            status_code=503,
            detail="OCR engine not installed. Run: pip install pytesseract Pillow"
        )
    except Exception as e:
        logger.error(f"Image OCR failed: {e}")
        return ""


def _extract_text_from_pdf(content: bytes) -> str:
    """Extract text from PDF bytes using pdfplumber."""
    try:
        import pdfplumber
        text_parts = []
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            for page in pdf.pages:
                t = page.extract_text()
                if t:
                    text_parts.append(t)
        return "\n".join(text_parts).strip()
    except ImportError:
        raise HTTPException(
            status_code=503,
            detail="PDF parser not installed. Run: pip install pdfplumber"
        )
    except Exception as e:
        logger.error(f"PDF OCR failed: {e}")
        return ""


def _safe_find(pattern: str, text: str, flags=re.IGNORECASE) -> Optional[str]:
    """Return first regex match group or None."""
    m = re.search(pattern, text, flags)
    return m.group(1).strip() if m else None


# ─── Document-specific parsers ───────────────────────────────────────────────

def _parse_policy_document(text: str) -> dict:
    fields = {}
    notes = []

    pol = _safe_find(r"policy\s*(?:no\.?|number)[:\s]+([A-Z0-9\-]+)", text)
    if pol:
        fields["policy_number"] = {"value": pol, "confidence": "high"}
    else:
        notes.append("Policy number not clearly detected")

    holder = _safe_find(r"(?:insured|policy\s*holder|name)[:\s]+([A-Za-z\s]+)", text)
    if holder and len(holder) > 2:
        fields["policy_holder"] = {"value": holder[:60], "confidence": "medium"}

    # Date patterns: DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY, Month DD YYYY
    start = _safe_find(
        r"(?:valid\s*from|start\s*date|commencement)[:\s]+(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\w+\s+\d{1,2},?\s+\d{4})",
        text
    )
    if start:
        fields["policy_start_date"] = {"value": start, "confidence": "medium"}

    end = _safe_find(
        r"(?:valid\s*(?:till|to|upto)|expir(?:y|es?)|end\s*date)[:\s]+(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\w+\s+\d{1,2},?\s+\d{4})",
        text
    )
    if end:
        fields["policy_end_date"] = {"value": end, "confidence": "medium"}

    ptype = _safe_find(r"(?:type\s*of\s*policy|policy\s*type|coverage)[:\s]+([A-Za-z\s]+)", text)
    if ptype and len(ptype) > 2:
        fields["policy_type"] = {"value": ptype[:50], "confidence": "medium"}

    return fields, notes


def _parse_driving_license(text: str) -> dict:
    fields = {}
    notes = []

    dl = _safe_find(r"(?:DL|D\.L|licence\s*no\.?|license\s*no\.?)[:\s]+([A-Z0-9\s\-]+)", text)
    if dl:
        fields["license_number"] = {"value": dl.replace(" ", "")[:20], "confidence": "high"}
    else:
        notes.append("License number not detected")

    name = _safe_find(r"(?:name|holder|licensee)[:\s]+([A-Za-z\s]+)", text)
    if name and len(name) > 2:
        fields["holder_name"] = {"value": name[:60], "confidence": "medium"}

    dob = _safe_find(r"(?:DOB|date\s*of\s*birth|born)[:\s]+(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})", text)
    if dob:
        fields["date_of_birth"] = {"value": dob, "confidence": "high"}

    valid = _safe_find(
        r"(?:valid\s*(?:till|to|upto)|expiry)[:\s]+(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})",
        text
    )
    if valid:
        fields["valid_till"] = {"value": valid, "confidence": "high"}
    else:
        notes.append("Expiry date not clearly detected")

    vehicle_class = _safe_find(r"(?:class\s*of\s*vehicle|COV|vehicle\s*class)[:\s]+([A-Za-z0-9,\s]+)", text)
    if vehicle_class:
        fields["vehicle_class"] = {"value": vehicle_class[:50], "confidence": "medium"}

    return fields, notes


def _parse_vehicle_registration(text: str) -> dict:
    fields = {}
    notes = []

    reg = _safe_find(r"(?:registration\s*(?:no\.?|number)|reg\s*no\.?|vehicle\s*no\.?)[:\s]+([A-Z]{2}\s*\d{2}\s*[A-Z]{1,2}\s*\d{4})", text)
    if not reg:
        # Generic plate pattern
        reg = _safe_find(r"\b([A-Z]{2}[\s\-]?\d{2}[\s\-]?[A-Z]{1,3}[\s\-]?\d{4})\b", text)
    if reg:
        fields["registration_number"] = {"value": reg.replace(" ", ""), "confidence": "high"}
    else:
        notes.append("Registration number not clearly detected")

    owner = _safe_find(r"(?:owner|registered\s*to|name)[:\s]+([A-Za-z\s]+)", text)
    if owner and len(owner) > 2:
        fields["owner_name"] = {"value": owner[:60], "confidence": "medium"}

    make = _safe_find(r"(?:make|manufacturer|brand)[:\s]+([A-Za-z\s]+)", text)
    if make and len(make) > 1:
        fields["vehicle_make"] = {"value": make[:30], "confidence": "medium"}

    model = _safe_find(r"(?:model)[:\s]+([A-Za-z0-9\s]+)", text)
    if model and len(model) > 1:
        fields["vehicle_model"] = {"value": model[:30], "confidence": "medium"}

    rto = _safe_find(r"(?:RTO|registering\s*authority|issued\s*by)[:\s]+([A-Za-z\s,]+)", text)
    if rto:
        fields["rto_office"] = {"value": rto[:60], "confidence": "low"}

    return fields, notes


def _parse_police_report(text: str) -> dict:
    fields = {}
    notes = []

    fir = _safe_find(r"(?:FIR|first\s*information\s*report|case\s*no\.?)[:\s#]+([A-Z0-9/\-]+)", text)
    if fir:
        fields["fir_number"] = {"value": fir, "confidence": "high"}
    else:
        notes.append("FIR number not detected")

    station = _safe_find(r"(?:police\s*station|station)[:\s]+([A-Za-z\s]+)", text)
    if station and len(station) > 2:
        fields["police_station"] = {"value": station[:60], "confidence": "medium"}

    date = _safe_find(
        r"(?:date\s*of\s*(?:report|incident|occurrence)|reported\s*on)[:\s]+(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})",
        text
    )
    if date:
        fields["incident_date"] = {"value": date, "confidence": "high"}
    else:
        notes.append("Incident date in report not detected")

    location = _safe_find(r"(?:place\s*of\s*(?:occurrence|incident)|location|address)[:\s]+([A-Za-z0-9\s,.\-]+)", text)
    if location and len(location) > 3:
        fields["incident_location"] = {"value": location[:100], "confidence": "medium"}

    return fields, notes


def _parse_medical_report(text: str) -> dict:
    fields = {}
    notes = []

    patient = _safe_find(r"(?:patient\s*name|name\s*of\s*patient|patient)[:\s]+([A-Za-z\s]+)", text)
    if patient and len(patient) > 2:
        fields["patient_name"] = {"value": patient[:60], "confidence": "medium"}

    diagnosis = _safe_find(r"(?:diagnosis|condition|findings?)[:\s]+([A-Za-z0-9\s,.\-]+)", text)
    if diagnosis and len(diagnosis) > 3:
        fields["diagnosis"] = {"value": diagnosis[:100], "confidence": "medium"}

    date = _safe_find(r"(?:date\s*of\s*(?:examination|consultation|admission)|report\s*date)[:\s]+(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})", text)
    if date:
        fields["report_date"] = {"value": date, "confidence": "high"}

    doctor = _safe_find(r"(?:dr\.?|doctor|physician)[:\s]+([A-Za-z\s]+)", text)
    if doctor and len(doctor) > 2:
        fields["doctor_name"] = {"value": "Dr. " + doctor[:40], "confidence": "medium"}
    else:
        notes.append("Doctor name not clearly detected")

    hospital = _safe_find(r"(?:hospital|clinic|medical\s*centre)[:\s]*([A-Za-z0-9\s,]+)", text)
    if hospital and len(hospital) > 2:
        fields["hospital"] = {"value": hospital[:60], "confidence": "medium"}

    return fields, notes


def _parse_accident_photos(text: str) -> dict:
    """For photos, OCR text is usually sparse — look for any embedded metadata."""
    fields = {}
    notes = ["Image document — OCR extracts any embedded text or metadata"]

    date = _safe_find(r"(\d{4}[-:]\d{2}[-:]\d{2})", text)
    if date:
        fields["photo_date"] = {"value": date, "confidence": "low"}

    location = _safe_find(r"(?:location|gps|lat)[:\s]+([0-9.\s,N/S/E/W°]+)", text)
    if location:
        fields["gps_coordinates"] = {"value": location[:50], "confidence": "low"}

    if not fields:
        notes.append("No machine-readable text found in photo — manual review required")

    return fields, notes


DOC_PARSERS = {
    "policy":       (_parse_policy_document,    "Policy Document"),
    "license":      (_parse_driving_license,     "Driving License"),
    "registration": (_parse_vehicle_registration,"Vehicle Registration"),
    "police":       (_parse_police_report,       "Police Report"),
    "medical":      (_parse_medical_report,      "Medical Report"),
    "photos":       (_parse_accident_photos,     "Accident Photos"),
}


# ─── Verification Engine ──────────────────────────────────────────────────────

def _parse_date_flexible(date_str: str) -> Optional[object]:
    """Try multiple date formats and return a date object or None."""
    from datetime import date as date_cls
    formats = [
        "%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d", "%Y/%m/%d",
        "%d/%m/%y", "%d-%m-%y",
        "%B %d, %Y", "%b %d, %Y", "%d %B %Y", "%d %b %Y",
    ]
    for fmt in formats:
        try:
            return __import__('datetime').datetime.strptime(date_str.strip(), fmt).date()
        except (ValueError, AttributeError):
            continue
    return None


def _name_similarity(name_a: str, name_b: str) -> float:
    """Simple name similarity: check if any word from name_a appears in name_b."""
    if not name_a or not name_b:
        return 0.0
    words_a = {w.lower().strip() for w in name_a.split() if len(w) > 2}
    words_b = {w.lower().strip() for w in name_b.split() if len(w) > 2}
    if not words_a or not words_b:
        return 0.0
    overlap = words_a & words_b
    return len(overlap) / max(len(words_a), len(words_b))


class VerificationCheck(BaseModel):
    check_id: str
    label: str
    status: str        # "pass" | "fail" | "warn" | "skip"
    detail: str
    field_value: Optional[str] = None


class DocumentVerificationResult(BaseModel):
    doc_type: str
    doc_label: str
    trust_score: int          # 0–100
    trust_level: str          # "high" | "medium" | "low" | "invalid"
    overall_status: str       # "authentic" | "suspicious" | "invalid" | "incomplete"
    checks: list[VerificationCheck]
    fraud_flags: list[str]
    summary: str


def _verify_policy(fields: dict, ctx: dict) -> tuple[list, list]:
    """
    Verify a policy document against claim context.
    ctx keys: incident_date, policy_number (from form), policy_start_date, policy_end_date
    """
    checks = []
    flags = []
    today = __import__('datetime').date.today()

    # 1. Policy number present and matches claim
    pol_val = fields.get("policy_number", {}).get("value", "")
    ctx_pol = ctx.get("policy_number", "")
    if pol_val:
        if ctx_pol and pol_val.upper().replace("-", "") == ctx_pol.upper().replace("-", ""):
            checks.append(VerificationCheck(
                check_id="pol_num_match", label="Policy Number Match",
                status="pass", detail=f"OCR extracted '{pol_val}' matches claim policy number.",
                field_value=pol_val
            ))
        elif ctx_pol:
            checks.append(VerificationCheck(
                check_id="pol_num_match", label="Policy Number Match",
                status="fail", detail=f"OCR found '{pol_val}' but claim form has '{ctx_pol}'. Mismatch detected.",
                field_value=pol_val
            ))
            flags.append(f"Policy number mismatch: document shows '{pol_val}', form has '{ctx_pol}'")
        else:
            checks.append(VerificationCheck(
                check_id="pol_num_match", label="Policy Number Match",
                status="warn", detail=f"Policy number '{pol_val}' extracted. No claim number to cross-check.",
                field_value=pol_val
            ))
    else:
        checks.append(VerificationCheck(
            check_id="pol_num_match", label="Policy Number Match",
            status="fail", detail="Policy number not found in document.",
        ))
        flags.append("Policy number not readable in document")

    # 2. Policy expiry — is policy active as of today?
    end_val = fields.get("policy_end_date", {}).get("value", "")
    if end_val:
        end_date = _parse_date_flexible(end_val)
        if end_date:
            if end_date >= today:
                checks.append(VerificationCheck(
                    check_id="pol_not_expired", label="Policy Active",
                    status="pass", detail=f"Policy valid until {end_val} — currently active.",
                    field_value=end_val
                ))
            else:
                checks.append(VerificationCheck(
                    check_id="pol_not_expired", label="Policy Active",
                    status="fail", detail=f"Policy expired on {end_val}. Expired policy cannot be used for claims.",
                    field_value=end_val
                ))
                flags.append(f"Policy expired on {end_val} — claim may be invalid")
        else:
            checks.append(VerificationCheck(
                check_id="pol_not_expired", label="Policy Active",
                status="warn", detail=f"Could not parse expiry date '{end_val}'. Manual review needed.",
                field_value=end_val
            ))
    else:
        checks.append(VerificationCheck(
            check_id="pol_not_expired", label="Policy Active",
            status="fail", detail="Policy expiry date not found in document.",
        ))

    # 3. Incident date falls within policy period
    inc_date_str = ctx.get("incident_date", "")
    start_val = fields.get("policy_start_date", {}).get("value", "")
    if inc_date_str and start_val and end_val:
        inc_date = _parse_date_flexible(inc_date_str) or _parse_date_flexible(inc_date_str.replace("-", "/"))
        start_date = _parse_date_flexible(start_val)
        end_date2 = _parse_date_flexible(end_val)
        if inc_date and start_date and end_date2:
            if start_date <= inc_date <= end_date2:
                checks.append(VerificationCheck(
                    check_id="incident_in_policy", label="Incident Within Policy Period",
                    status="pass", detail=f"Incident on {inc_date_str} falls within policy period {start_val} – {end_val}.",
                    field_value=inc_date_str
                ))
            else:
                checks.append(VerificationCheck(
                    check_id="incident_in_policy", label="Incident Within Policy Period",
                    status="fail", detail=f"Incident date {inc_date_str} is OUTSIDE policy period {start_val} – {end_val}.",
                    field_value=inc_date_str
                ))
                flags.append(f"Incident date {inc_date_str} falls outside policy coverage period")
        else:
            checks.append(VerificationCheck(
                check_id="incident_in_policy", label="Incident Within Policy Period",
                status="warn", detail="Cannot verify date range — date parsing failed. Manual review required.",
            ))
    else:
        checks.append(VerificationCheck(
            check_id="incident_in_policy", label="Incident Within Policy Period",
            status="skip", detail="Incident date or policy dates not available for cross-check.",
        ))

    # 4. Policy type matches claim type
    pol_type_val = fields.get("policy_type", {}).get("value", "")
    ctx_claim_type = ctx.get("claim_type", "")
    if pol_type_val and ctx_claim_type:
        vehicle_keywords = ["vehicle", "motor", "auto", "car", "bike"]
        health_keywords = ["health", "medical", "personal accident"]
        is_vehicle_policy = any(k in pol_type_val.lower() for k in vehicle_keywords)
        is_vehicle_claim = ctx_claim_type.lower() in ["accident", "theft"]
        is_health_policy = any(k in pol_type_val.lower() for k in health_keywords)
        is_health_claim = ctx_claim_type.lower() in ["other"]
        if is_vehicle_policy and is_vehicle_claim:
            checks.append(VerificationCheck(
                check_id="policy_type_match", label="Policy Type Matches Claim",
                status="pass", detail=f"'{pol_type_val}' covers '{ctx_claim_type}' claims.",
                field_value=pol_type_val
            ))
        elif is_health_policy and is_health_claim:
            checks.append(VerificationCheck(
                check_id="policy_type_match", label="Policy Type Matches Claim",
                status="pass", detail=f"'{pol_type_val}' covers '{ctx_claim_type}' claims.",
                field_value=pol_type_val
            ))
        else:
            checks.append(VerificationCheck(
                check_id="policy_type_match", label="Policy Type Matches Claim",
                status="warn", detail=f"Policy type '{pol_type_val}' may not cover '{ctx_claim_type}' claims. Review required.",
                field_value=pol_type_val
            ))
    else:
        checks.append(VerificationCheck(
            check_id="policy_type_match", label="Policy Type Matches Claim",
            status="skip", detail="Policy type or claim type not available.",
        ))

    return checks, flags


def _verify_license(fields: dict, ctx: dict) -> tuple[list, list]:
    checks = []
    flags = []

    # 1. License number format (Indian DL format: STATE_CODE + YEAR + 7DIGITS)
    lic_val = fields.get("license_number", {}).get("value", "")
    if lic_val:
        clean_lic = re.sub(r"[\s\-]", "", lic_val.upper())
        # Indian DL: 2-letter state code + 2 digits (district) + year + 7 digits OR legacy formats
        if re.match(r"^[A-Z]{2}\d{2,4}\d{7}$", clean_lic) or re.match(r"^[A-Z]{2}\d{11,13}$", clean_lic):
            checks.append(VerificationCheck(
                check_id="lic_format", label="License Number Format",
                status="pass", detail=f"License number '{lic_val}' matches valid Indian DL format.",
                field_value=lic_val
            ))
        else:
            checks.append(VerificationCheck(
                check_id="lic_format", label="License Number Format",
                status="warn", detail=f"License number '{lic_val}' — format could not be fully validated.",
                field_value=lic_val
            ))
    else:
        checks.append(VerificationCheck(
            check_id="lic_format", label="License Number Format",
            status="fail", detail="License number not found in document.",
        ))
        flags.append("License number missing from document")

    # 2. Not expired as of incident date
    valid_till_val = fields.get("valid_till", {}).get("value", "")
    inc_date_str = ctx.get("incident_date", "")
    if valid_till_val:
        exp_date = _parse_date_flexible(valid_till_val)
        if exp_date:
            check_date = _parse_date_flexible(inc_date_str) if inc_date_str else __import__('datetime').date.today()
            if check_date and exp_date >= check_date:
                checks.append(VerificationCheck(
                    check_id="lic_not_expired", label="License Not Expired",
                    status="pass", detail=f"License valid until {valid_till_val} — valid at time of incident.",
                    field_value=valid_till_val
                ))
            else:
                checks.append(VerificationCheck(
                    check_id="lic_not_expired", label="License Not Expired",
                    status="fail", detail=f"License expired on {valid_till_val}. Driving with expired license.",
                    field_value=valid_till_val
                ))
                flags.append(f"Driving license expired on {valid_till_val}")
        else:
            checks.append(VerificationCheck(
                check_id="lic_not_expired", label="License Not Expired",
                status="warn", detail=f"Cannot parse expiry date '{valid_till_val}'.",
                field_value=valid_till_val
            ))
    else:
        checks.append(VerificationCheck(
            check_id="lic_not_expired", label="License Not Expired",
            status="fail", detail="License expiry date not found. Cannot verify validity.",
        ))
        flags.append("License expiry date missing")

    # 3. Holder name matches claimant
    holder_val = fields.get("holder_name", {}).get("value", "")
    claimant_name = ctx.get("customer_name", "")
    if holder_val and claimant_name:
        similarity = _name_similarity(holder_val, claimant_name)
        if similarity >= 0.5:
            checks.append(VerificationCheck(
                check_id="lic_name_match", label="Name Matches Claimant",
                status="pass", detail=f"License holder '{holder_val}' matches claimant '{claimant_name}'.",
                field_value=holder_val
            ))
        else:
            checks.append(VerificationCheck(
                check_id="lic_name_match", label="Name Matches Claimant",
                status="fail", detail=f"License holder '{holder_val}' does NOT match claimant '{claimant_name}'.",
                field_value=holder_val
            ))
            flags.append(f"License holder name '{holder_val}' doesn't match claimant '{claimant_name}'")
    else:
        checks.append(VerificationCheck(
            check_id="lic_name_match", label="Name Matches Claimant",
            status="skip", detail="Name cross-check skipped — holder name or claimant name unavailable.",
        ))

    # 4. Vehicle class covers the claimed vehicle (at least check it's present)
    veh_class = fields.get("vehicle_class", {}).get("value", "")
    if veh_class:
        checks.append(VerificationCheck(
            check_id="vehicle_class", label="Vehicle Class Present",
            status="pass", detail=f"Vehicle class '{veh_class}' found in license.",
            field_value=veh_class
        ))
    else:
        checks.append(VerificationCheck(
            check_id="vehicle_class", label="Vehicle Class Present",
            status="warn", detail="Vehicle class/category not found in license.",
        ))

    return checks, flags


def _verify_registration(fields: dict, ctx: dict) -> tuple[list, list]:
    checks = []
    flags = []

    # 1. Registration number format (Indian: STATE_CODE + DISTRICT + SERIES + NUMBER)
    reg_val = fields.get("registration_number", {}).get("value", "")
    if reg_val:
        clean_reg = re.sub(r"[\s\-]", "", reg_val.upper())
        if re.match(r"^[A-Z]{2}\d{2}[A-Z]{1,3}\d{4}$", clean_reg):
            checks.append(VerificationCheck(
                check_id="reg_format", label="Registration Number Format",
                status="pass", detail=f"Registration '{reg_val}' is a valid Indian vehicle registration format.",
                field_value=reg_val
            ))
        else:
            checks.append(VerificationCheck(
                check_id="reg_format", label="Registration Number Format",
                status="warn", detail=f"Registration '{reg_val}' doesn't match standard Indian format (e.g., TN10AB1234).",
                field_value=reg_val
            ))
            if len(clean_reg) < 6:
                flags.append(f"Registration number '{reg_val}' appears too short or malformed")
    else:
        checks.append(VerificationCheck(
            check_id="reg_format", label="Registration Number Format",
            status="fail", detail="Vehicle registration number not found in document.",
        ))
        flags.append("Vehicle registration number missing from RC document")

    # 2. Owner name matches claimant
    owner_val = fields.get("owner_name", {}).get("value", "")
    claimant_name = ctx.get("customer_name", "")
    if owner_val and claimant_name:
        similarity = _name_similarity(owner_val, claimant_name)
        if similarity >= 0.4:
            checks.append(VerificationCheck(
                check_id="reg_owner_match", label="Owner Matches Claimant",
                status="pass", detail=f"Registered owner '{owner_val}' matches claimant '{claimant_name}'.",
                field_value=owner_val
            ))
        else:
            checks.append(VerificationCheck(
                check_id="reg_owner_match", label="Owner Matches Claimant",
                status="warn", detail=f"RC owner '{owner_val}' differs from claimant '{claimant_name}'. Could be a borrowed/leased vehicle.",
                field_value=owner_val
            ))
    else:
        checks.append(VerificationCheck(
            check_id="reg_owner_match", label="Owner Matches Claimant",
            status="skip", detail="Owner name or claimant name unavailable for cross-check.",
        ))

    # 3. Make and model are present
    make_val = fields.get("vehicle_make", {}).get("value", "")
    model_val = fields.get("vehicle_model", {}).get("value", "")
    if make_val and model_val:
        checks.append(VerificationCheck(
            check_id="reg_make_model", label="Vehicle Make & Model",
            status="pass", detail=f"Vehicle identified as {make_val} {model_val}.",
            field_value=f"{make_val} {model_val}"
        ))
    elif make_val or model_val:
        checks.append(VerificationCheck(
            check_id="reg_make_model", label="Vehicle Make & Model",
            status="warn", detail=f"Only partial vehicle details found: make='{make_val}', model='{model_val}'.",
            field_value=f"{make_val} {model_val}".strip()
        ))
    else:
        checks.append(VerificationCheck(
            check_id="reg_make_model", label="Vehicle Make & Model",
            status="fail", detail="Vehicle make and model not found in registration document.",
        ))

    return checks, flags


def _verify_police(fields: dict, ctx: dict) -> tuple[list, list]:
    checks = []
    flags = []

    # 1. FIR number present and valid format
    fir_val = fields.get("fir_number", {}).get("value", "")
    if fir_val:
        if re.search(r"\d{3,}", fir_val):
            checks.append(VerificationCheck(
                check_id="fir_present", label="FIR Number Valid",
                status="pass", detail=f"FIR number '{fir_val}' found with valid numeric component.",
                field_value=fir_val
            ))
        else:
            checks.append(VerificationCheck(
                check_id="fir_present", label="FIR Number Valid",
                status="warn", detail=f"FIR number '{fir_val}' found but format appears unusual.",
                field_value=fir_val
            ))
    else:
        checks.append(VerificationCheck(
            check_id="fir_present", label="FIR Number Valid",
            status="fail", detail="FIR/case number not detected in police report.",
        ))
        flags.append("FIR number missing from police report")

    # 2. Incident date in report matches claimed date
    report_inc_date_val = fields.get("incident_date", {}).get("value", "")
    ctx_inc_date = ctx.get("incident_date", "")
    if report_inc_date_val and ctx_inc_date:
        rd = _parse_date_flexible(report_inc_date_val)
        cd = _parse_date_flexible(ctx_inc_date)
        if rd and cd:
            diff_days = abs((rd - cd).days)
            if diff_days == 0:
                checks.append(VerificationCheck(
                    check_id="fir_date_match", label="Incident Date Matches",
                    status="pass", detail=f"Police report date '{report_inc_date_val}' matches claimed incident date '{ctx_inc_date}'.",
                    field_value=report_inc_date_val
                ))
            elif diff_days <= 2:
                checks.append(VerificationCheck(
                    check_id="fir_date_match", label="Incident Date Matches",
                    status="warn", detail=f"Police report date '{report_inc_date_val}' differs by {diff_days} day(s) from claimed date '{ctx_inc_date}'. Marginal discrepancy.",
                    field_value=report_inc_date_val
                ))
            else:
                checks.append(VerificationCheck(
                    check_id="fir_date_match", label="Incident Date Matches",
                    status="fail", detail=f"Police report date '{report_inc_date_val}' differs by {diff_days} days from claimed date '{ctx_inc_date}'. Significant discrepancy.",
                    field_value=report_inc_date_val
                ))
                flags.append(f"FIR incident date '{report_inc_date_val}' differs from claimed date '{ctx_inc_date}' by {diff_days} days")
        else:
            checks.append(VerificationCheck(
                check_id="fir_date_match", label="Incident Date Matches",
                status="warn", detail="Date comparison failed — could not parse one or both dates.",
            ))
    else:
        checks.append(VerificationCheck(
            check_id="fir_date_match", label="Incident Date Matches",
            status="skip", detail="Incident date in report or claim not available.",
        ))

    # 3. Police station present
    station_val = fields.get("police_station", {}).get("value", "")
    if station_val:
        checks.append(VerificationCheck(
            check_id="station_present", label="Police Station Identified",
            status="pass", detail=f"Police station: {station_val}",
            field_value=station_val
        ))
    else:
        checks.append(VerificationCheck(
            check_id="station_present", label="Police Station Identified",
            status="warn", detail="Police station name not detected in report.",
        ))

    # 4. Report date is not in the future
    today = __import__('datetime').date.today()
    loc_val = fields.get("incident_location", {}).get("value", "")
    if loc_val:
        ctx_loc = ctx.get("incident_location", "")
        if ctx_loc:
            loc_words_a = set(loc_val.lower().split())
            loc_words_b = set(ctx_loc.lower().split())
            common = loc_words_a & loc_words_b - {"the", "a", "an", "in", "at", "on", "of"}
            if common:
                checks.append(VerificationCheck(
                    check_id="loc_match", label="Incident Location Matches",
                    status="pass", detail=f"Location in police report ('{loc_val}') has common terms with claimed location ('{ctx_loc}').",
                    field_value=loc_val
                ))
            else:
                checks.append(VerificationCheck(
                    check_id="loc_match", label="Incident Location Matches",
                    status="warn", detail=f"Location in police report '{loc_val}' doesn't clearly match claimed '{ctx_loc}'.",
                    field_value=loc_val
                ))
        else:
            checks.append(VerificationCheck(
                check_id="loc_match", label="Incident Location Matches",
                status="skip", detail="No claimed location to cross-check against.",
            ))
    else:
        checks.append(VerificationCheck(
            check_id="loc_match", label="Incident Location Matches",
            status="skip", detail="Location not extracted from police report.",
        ))

    return checks, flags


def _verify_medical(fields: dict, ctx: dict) -> tuple[list, list]:
    checks = []
    flags = []

    # 1. Patient name matches claimant
    patient_val = fields.get("patient_name", {}).get("value", "")
    claimant_name = ctx.get("customer_name", "")
    if patient_val and claimant_name:
        similarity = _name_similarity(patient_val, claimant_name)
        if similarity >= 0.4:
            checks.append(VerificationCheck(
                check_id="patient_name_match", label="Patient Matches Claimant",
                status="pass", detail=f"Patient name '{patient_val}' matches claimant '{claimant_name}'.",
                field_value=patient_val
            ))
        else:
            checks.append(VerificationCheck(
                check_id="patient_name_match", label="Patient Matches Claimant",
                status="fail", detail=f"Patient name '{patient_val}' doesn't match claimant '{claimant_name}'.",
                field_value=patient_val
            ))
            flags.append(f"Medical report patient '{patient_val}' doesn't match claimant '{claimant_name}'")
    else:
        checks.append(VerificationCheck(
            check_id="patient_name_match", label="Patient Matches Claimant",
            status="skip", detail="Patient or claimant name not available for cross-check.",
        ))

    # 2. Report date is after incident date
    report_date_val = fields.get("report_date", {}).get("value", "")
    inc_date_str = ctx.get("incident_date", "")
    if report_date_val and inc_date_str:
        rd = _parse_date_flexible(report_date_val)
        id_ = _parse_date_flexible(inc_date_str)
        if rd and id_:
            if rd >= id_:
                diff = (rd - id_).days
                if diff <= 30:
                    checks.append(VerificationCheck(
                        check_id="report_after_incident", label="Report After Incident",
                        status="pass", detail=f"Medical report date '{report_date_val}' is {diff} day(s) after incident '{inc_date_str}' — consistent.",
                        field_value=report_date_val
                    ))
                else:
                    checks.append(VerificationCheck(
                        check_id="report_after_incident", label="Report After Incident",
                        status="warn", detail=f"Medical report is {diff} days after the incident. Late filing may indicate delayed treatment.",
                        field_value=report_date_val
                    ))
            else:
                checks.append(VerificationCheck(
                    check_id="report_after_incident", label="Report After Incident",
                    status="fail", detail=f"Medical report date '{report_date_val}' is BEFORE incident date '{inc_date_str}'. Impossible timeline.",
                    field_value=report_date_val
                ))
                flags.append(f"Medical report date {report_date_val} precedes incident date {inc_date_str} — impossible")
        else:
            checks.append(VerificationCheck(
                check_id="report_after_incident", label="Report After Incident",
                status="warn", detail="Cannot parse dates for timeline verification.",
            ))
    else:
        checks.append(VerificationCheck(
            check_id="report_after_incident", label="Report After Incident",
            status="skip", detail="Report date or incident date not available.",
        ))

    # 3. Diagnosis present
    diag_val = fields.get("diagnosis", {}).get("value", "")
    if diag_val:
        checks.append(VerificationCheck(
            check_id="diagnosis_present", label="Diagnosis Documented",
            status="pass", detail=f"Diagnosis: '{diag_val}'",
            field_value=diag_val
        ))
    else:
        checks.append(VerificationCheck(
            check_id="diagnosis_present", label="Diagnosis Documented",
            status="warn", detail="No diagnosis found in medical report.",
        ))

    # 4. Doctor name present
    doctor_val = fields.get("doctor_name", {}).get("value", "")
    if doctor_val:
        checks.append(VerificationCheck(
            check_id="doctor_present", label="Doctor Identified",
            status="pass", detail=f"Treating doctor: {doctor_val}",
            field_value=doctor_val
        ))
    else:
        checks.append(VerificationCheck(
            check_id="doctor_present", label="Doctor Identified",
            status="warn", detail="Doctor name not clearly identified in report.",
        ))

    return checks, flags


def _verify_photos(fields: dict, ctx: dict) -> tuple[list, list]:
    checks = []
    flags = []

    photo_date_val = fields.get("photo_date", {}).get("value", "")
    inc_date_str = ctx.get("incident_date", "")
    if photo_date_val and inc_date_str:
        pd = _parse_date_flexible(photo_date_val)
        id_ = _parse_date_flexible(inc_date_str)
        if pd and id_:
            diff = abs((pd - id_).days)
            if diff <= 3:
                checks.append(VerificationCheck(
                    check_id="photo_date_match", label="Photo Timestamp Near Incident",
                    status="pass", detail=f"Photo timestamp '{photo_date_val}' is within {diff} day(s) of incident date '{inc_date_str}'.",
                    field_value=photo_date_val
                ))
            else:
                checks.append(VerificationCheck(
                    check_id="photo_date_match", label="Photo Timestamp Near Incident",
                    status="warn", detail=f"Photo timestamp '{photo_date_val}' is {diff} days from incident date '{inc_date_str}'. Photos may have been taken later.",
                    field_value=photo_date_val
                ))
        else:
            checks.append(VerificationCheck(
                check_id="photo_date_match", label="Photo Timestamp Near Incident",
                status="warn", detail="Could not parse photo or incident date for comparison.",
            ))
    else:
        checks.append(VerificationCheck(
            check_id="photo_date_match", label="Photo Timestamp Near Incident",
            status="warn", detail="No EXIF timestamp found in photo. Manual review recommended.",
        ))
    checks.append(VerificationCheck(
        check_id="photo_readable", label="Photo is Readable",
        status="pass" if fields else "warn",
        detail="Photo uploaded and processed." if fields else "Photo may be unclear or unprocessable.",
    ))
    return checks, flags


VERIFIERS = {
    "policy":       (_verify_policy,       "Policy Document"),
    "license":      (_verify_license,      "Driving License"),
    "registration": (_verify_registration, "Vehicle Registration"),
    "police":       (_verify_police,       "Police Report"),
    "medical":      (_verify_medical,      "Medical Report"),
    "photos":       (_verify_photos,       "Accident Photos"),
}


def _compute_trust_score(checks: list[VerificationCheck]) -> int:
    """
    Compute a trust score 0–100 based on check results.
    pass=10pts, warn=5pts, fail=0pts, skip=ignored.
    """
    scored = [c for c in checks if c.status != "skip"]
    if not scored:
        return 50
    total = len(scored) * 10
    earned = sum(10 if c.status == "pass" else 5 if c.status == "warn" else 0 for c in scored)
    return round((earned / total) * 100)


def _determine_verification_status(fields: dict, notes: list, text: str) -> str:
    if len(text) < 30:
        return "unreadable"
    if len(fields) >= 2 and len(notes) == 0:
        return "verified"
    if len(fields) >= 1:
        return "partial"
    return "unreadable"


# ─── Endpoint ─────────────────────────────────────────────────────────────────

@router.post("/analyze", response_model=OCRResult)
async def analyze_document(
    file: UploadFile = File(...),
    doc_type: str = "policy",
    current_user: UserDB = Depends(get_current_user),
):
    """
    Perform OCR on an uploaded document and extract key insurance fields.

    - **file**: The document file (PDF, PNG, JPG, JPEG)
    - **doc_type**: One of: policy | license | registration | police | medical | photos
    """
    if doc_type not in DOC_PARSERS:
        raise HTTPException(status_code=400, detail=f"Unknown doc_type '{doc_type}'. Valid: {list(DOC_PARSERS)}")

    content_type = file.content_type or ""
    filename = file.filename or ""
    content = await file.read()

    if not content:
        return OCRResult(
            success=False,
            doc_type=doc_type,
            raw_text="",
            extracted_fields={},
            verification_status="unreadable",
            verification_notes=["Empty file uploaded"],
            error="Empty file"
        )

    # ── Extract raw text ──────────────────────────────────────────────────────
    try:
        if content_type == "application/pdf" or filename.lower().endswith(".pdf"):
            raw_text = _extract_text_from_pdf(content)
        elif content_type.startswith("image/") or filename.lower().endswith((".png", ".jpg", ".jpeg")):
            raw_text = _extract_text_from_image(content)
        else:
            raise HTTPException(status_code=415, detail="Unsupported file type. Use PDF, PNG, or JPG.")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"OCR extraction error: {e}")
        return OCRResult(
            success=False,
            doc_type=doc_type,
            raw_text="",
            extracted_fields={},
            verification_status="unreadable",
            verification_notes=["OCR engine failed to process the document"],
            error=str(e)
        )

    # ── Parse fields ──────────────────────────────────────────────────────────
    parser_fn, doc_label = DOC_PARSERS[doc_type]
    try:
        fields, notes = parser_fn(raw_text)
    except Exception as e:
        logger.error(f"Field parsing error: {e}")
        fields, notes = {}, ["Field extraction failed"]

    verification_status = _determine_verification_status(fields, notes, raw_text)

    # Truncate raw text for response (max 1500 chars)
    display_text = raw_text[:1500] + ("..." if len(raw_text) > 1500 else "")

    return OCRResult(
        success=True,
        doc_type=doc_type,
        raw_text=display_text,
        extracted_fields=fields,
        verification_status=verification_status,
        verification_notes=notes,
    )


# ─── Document Authenticity Verification Endpoint ──────────────────────────────

class VerifyRequest(BaseModel):
    doc_type: str
    extracted_fields: dict   # {field_key: {value: str, confidence: str}}
    claim_context: dict      # {policy_number, incident_date, incident_location, customer_name, claim_type, ...}


@router.post("/verify", response_model=DocumentVerificationResult)
async def verify_document(
    body: VerifyRequest,
    current_user: UserDB = Depends(get_current_user),
):
    """
    Run full document authenticity verification on OCR-extracted fields.

    Cross-validates extracted data against claim context:
    - Policy: number match, expiry, incident within coverage period, type match
    - License: format, expiry at incident, holder name vs claimant
    - Registration: format, owner vs claimant, make/model
    - Police Report: FIR number, date match vs claim, location match
    - Medical: patient name, report date after incident, diagnosis present
    - Photos: timestamp near incident date

    Returns a trust score (0–100), per-check breakdown, fraud flags, and summary.
    """
    doc_type = body.doc_type
    if doc_type not in VERIFIERS:
        raise HTTPException(status_code=400, detail=f"Unknown doc_type '{doc_type}'. Valid: {list(VERIFIERS)}")

    verifier_fn, doc_label = VERIFIERS[doc_type]
    try:
        checks, flags = verifier_fn(body.extracted_fields, body.claim_context)
    except Exception as e:
        logger.error(f"Verification engine error: {e}")
        raise HTTPException(status_code=500, detail=f"Verification engine error: {str(e)}")

    trust_score = _compute_trust_score(checks)

    # Determine trust level
    if trust_score >= 80:
        trust_level = "high"
    elif trust_score >= 55:
        trust_level = "medium"
    elif trust_score >= 30:
        trust_level = "low"
    else:
        trust_level = "invalid"

    # Determine overall status
    fail_count = sum(1 for c in checks if c.status == "fail")
    pass_count = sum(1 for c in checks if c.status == "pass")
    scored_count = sum(1 for c in checks if c.status != "skip")

    if len(flags) >= 2 or fail_count >= 2:
        overall_status = "suspicious" if trust_score >= 30 else "invalid"
    elif fail_count == 0 and trust_score >= 75:
        overall_status = "authentic"
    elif pass_count == 0:
        overall_status = "incomplete"
    else:
        overall_status = "suspicious" if flags else "authentic"

    # Build summary
    if overall_status == "authentic":
        summary = f"{doc_label} passed all verification checks. Document appears genuine with a trust score of {trust_score}/100."
    elif overall_status == "suspicious":
        flag_summary = "; ".join(flags[:2])
        summary = f"{doc_label} has {fail_count} failed check(s) and {len(flags)} concern(s). Trust score: {trust_score}/100. Issues: {flag_summary}."
    elif overall_status == "invalid":
        summary = f"{doc_label} failed critical verification checks (trust score {trust_score}/100). Document may be fraudulent or invalid."
    else:
        summary = f"{doc_label} is incomplete — {scored_count} checks ran but insufficient data to fully verify. Trust score: {trust_score}/100."

    return DocumentVerificationResult(
        doc_type=doc_type,
        doc_label=doc_label,
        trust_score=trust_score,
        trust_level=trust_level,
        overall_status=overall_status,
        checks=checks,
        fraud_flags=flags,
        summary=summary,
    )
