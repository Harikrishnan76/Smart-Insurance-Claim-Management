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
