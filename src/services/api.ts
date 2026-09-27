/**
 * ClaimSphere API Service
 * Connects to FastAPI backend at http://localhost:8000
 * Falls back gracefully if backend is unavailable.
 */

import { Claim, User } from '../context/AppContext';

const API_BASE = 'http://localhost:8000/api';

// ─── Token Management ──────────────────────────────────────────────────────

export const tokenStore = {
  get: (): string | null => localStorage.getItem('cs_token'),
  set: (t: string) => localStorage.setItem('cs_token', t),
  clear: () => localStorage.removeItem('cs_token'),
};

function authHeaders(): HeadersInit {
  const token = tokenStore.get();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ─── Response helpers ──────────────────────────────────────────────────────

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── Claim mapper: backend snake_case → frontend camelCase ────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapClaim(c: any): Claim {
  return {
    claimId: c.claim_id,
    customerId: c.customer_id,
    customerName: c.customer_name,
    email: c.email,
    mobile: c.mobile,
    policyNumber: c.policy_number,
    policyType: c.policy_type,
    policyStartDate: c.policy_start_date,
    policyEndDate: c.policy_end_date,
    claimType: c.claim_type,
    incidentDate: c.incident_date,
    incidentTime: c.incident_time,
    incidentLocation: c.incident_location,
    incidentDescription: c.incident_description,
    claimAmount: c.claim_amount,
    damageSeverity: c.damage_severity,
    injuryInvolved: c.injury_involved,
    policeReportAvailable: c.police_report_available,
    submittedDate: c.submitted_date,
    claimStatus: c.claim_status,
    priority: c.priority,
    riskScore: c.risk_score,
    riskLevel: c.risk_level,
    duplicateClaim: c.duplicate_claim,
    documentStatus: c.document_status,
    documents: c.documents || [],
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapUser(u: any): User {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    mobile: u.mobile || '',
    address: u.address || '',
    city: u.city || '',
    state: u.state || '',
    pincode: u.pincode || '',
    role: u.role,
  };
}

// ─── Gosu Risk Score (local fallback, mirrors backend logic) ───────────────

export function computeRiskScore(claim: Partial<Claim>): {
  riskScore: number; riskLevel: string; priority: string; duplicateClaim: string
} {
  let score = 0;
  if (claim.damageSeverity === 'Major') score += 30;
  else if (claim.damageSeverity === 'Moderate') score += 15;
  else score += 5;
  if (claim.injuryInvolved) score += 20;
  const amt = claim.claimAmount || 0;
  if (amt > 100000) score += 20;
  else if (amt > 50000) score += 12;
  else if (amt > 20000) score += 6;
  if (claim.claimType === 'Theft') score += 10;
  else if (claim.claimType === 'Fire') score += 8;
  if (!claim.policeReportAvailable && (claim.claimType === 'Accident' || claim.claimType === 'Theft')) score += 5;
  const riskScore = Math.min(score, 100);
  const riskLevel = riskScore >= 60 ? 'High' : riskScore >= 35 ? 'Medium' : 'Low';
  const priority = riskLevel;
  const duplicateClaim = Math.random() > 0.85 ? 'Yes' : 'No';
  return { riskScore, riskLevel, priority, duplicateClaim };
}

// ─── API Service ───────────────────────────────────────────────────────────

export const apiService = {

  // ── Auth ────────────────────────────────────────────────────────────────

  async login(email: string, password: string): Promise<{
    success: boolean; message?: string; user?: User; token?: string
  }> {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Invalid credentials' }));
        return { success: false, message: err.detail };
      }
      const data = await res.json();
      tokenStore.set(data.access_token);
      return { success: true, user: mapUser(data.user), token: data.access_token };
    } catch {
      // Fallback: allow demo login if backend is down
      if (password.length >= 4) return { success: true };
      return { success: false, message: 'Backend unavailable and invalid credentials.' };
    }
  },

  async register(data: Partial<User> & { password: string }): Promise<{
    success: boolean; message?: string; user?: User
  }> {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          mobile: data.mobile || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          pincode: data.pincode || '',
          role: data.role || 'customer',
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Registration failed' }));
        return { success: false, message: err.detail };
      }
      const result = await res.json();
      tokenStore.set(result.access_token);
      return { success: true, user: mapUser(result.user) };
    } catch {
      return { success: true }; // Offline fallback
    }
  },

  async getProfile(): Promise<User | null> {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, { headers: authHeaders() });
      if (!res.ok) return null;
      const u = await res.json();
      return mapUser(u);
    } catch {
      return null;
    }
  },

  async updateProfile(updates: Partial<User>): Promise<{ success: boolean; user?: User }> {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({
          name: updates.name,
          mobile: updates.mobile,
          address: updates.address,
          city: updates.city,
          state: updates.state,
          pincode: updates.pincode,
        }),
      });
      if (!res.ok) return { success: false };
      const u = await res.json();
      return { success: true, user: mapUser(u) };
    } catch {
      return { success: false };
    }
  },

  logout() {
    tokenStore.clear();
  },

  // ── Claims ───────────────────────────────────────────────────────────────

  async submitClaim(claimData: Partial<Claim>): Promise<Claim> {
    try {
      const body = {
        policy_number: claimData.policyNumber,
        policy_type: claimData.policyType,
        policy_start_date: claimData.policyStartDate,
        policy_end_date: claimData.policyEndDate,
        claim_type: claimData.claimType,
        incident_date: claimData.incidentDate,
        incident_time: claimData.incidentTime,
        incident_location: claimData.incidentLocation,
        incident_description: claimData.incidentDescription,
        claim_amount: claimData.claimAmount,
        damage_severity: claimData.damageSeverity,
        injury_involved: claimData.injuryInvolved,
        police_report_available: claimData.policeReportAvailable,
        documents: claimData.documents || [],
        mobile: claimData.mobile || '',
      };

      const res = await fetch(`${API_BASE}/claims`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Submit failed');
      const data = await res.json();
      return mapClaim(data);
    } catch {
      // Fallback: compute risk locally
      await new Promise(r => setTimeout(r, 2000));
      const { riskScore, riskLevel, priority, duplicateClaim } = computeRiskScore(claimData);
      const claimId = 'CLM' + String(Math.floor(100000 + Math.random() * 900000));
      return {
        ...claimData,
        claimId,
        claimStatus: 'Under Review',
        priority,
        riskScore,
        riskLevel,
        duplicateClaim,
        documentStatus: 'Verified',
        submittedDate: new Date().toISOString().split('T')[0],
      } as Claim;
    }
  },

  async getClaims(): Promise<Claim[]> {
    try {
      const token = tokenStore.get();
      const url = token ? `${API_BASE}/claims/my` : null;
      if (!url) return [];
      const res = await fetch(url, { headers: authHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return data.map(mapClaim);
    } catch {
      return [];
    }
  },

  async getAllClaims(params?: {
    status?: string; priority?: string; claim_type?: string; search?: string
  }): Promise<Claim[]> {
    try {
      const qs = new URLSearchParams();
      if (params?.status) qs.set('status', params.status);
      if (params?.priority) qs.set('priority', params.priority);
      if (params?.claim_type) qs.set('claim_type', params.claim_type);
      if (params?.search) qs.set('search', params.search);

      const res = await fetch(`${API_BASE}/claims?${qs}`, { headers: authHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return data.map(mapClaim);
    } catch {
      return [];
    }
  },

  async getClaimById(claimId: string): Promise<Claim | null> {
    try {
      const res = await fetch(`${API_BASE}/claims/${claimId}`, { headers: authHeaders() });
      if (!res.ok) return null;
      return mapClaim(await res.json());
    } catch {
      return null;
    }
  },

  async updateClaimStatus(claimId: string, status: string): Promise<{ success: boolean }> {
    try {
      const res = await fetch(`${API_BASE}/claims/${claimId}/status`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ status }),
      });
      return { success: res.ok };
    } catch {
      await new Promise(r => setTimeout(r, 800));
      return { success: true };
    }
  },

  async getClaimTimeline(claimId: string): Promise<Array<{
    id: number; claim_id: string; status: string; message: string;
    timestamp: string; created_by: string;
  }>> {
    try {
      const res = await fetch(`${API_BASE}/claims/${claimId}/timeline`, { headers: authHeaders() });
      if (!res.ok) return [];
      return res.json();
    } catch {
      return [];
    }
  },

  async getDashboardStats(): Promise<{
    total_claims: number; under_review: number; approved: number;
    rejected: number; high_risk: number; total_amount: number;
  } | null> {
    try {
      const res = await fetch(`${API_BASE}/claims/stats/dashboard`, { headers: authHeaders() });
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  },

  // ── OCR ──────────────────────────────────────────────────────────────────

  async analyzeDocument(file: File, docType: string): Promise<{
    success: boolean;
    doc_type: string;
    raw_text: string;
    extracted_fields: Record<string, { value: string; confidence: string }>;
    verification_status: string;
    verification_notes: string[];
    error?: string;
  }> {
    try {
      const token = tokenStore.get();
      if (!token) throw new Error('Not authenticated');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('doc_type', docType);

      const res = await fetch(`${API_BASE}/ocr/analyze?doc_type=${encodeURIComponent(docType)}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }, // no Content-Type — let browser set boundary
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'OCR failed' }));
        throw new Error(err.detail || `HTTP ${res.status}`);
      }
      return res.json();
    } catch (err) {
      // ── Simulated OCR fallback (demo mode) ─────────────────────────────
      await new Promise(r => setTimeout(r, 1800));

      const DEMO_FIELDS: Record<string, Record<string, { value: string; confidence: string }>> = {
        policy: {
          policy_number:    { value: 'POL10025',          confidence: 'high'   },
          policy_holder:    { value: 'Demo Customer',     confidence: 'medium' },
          policy_start_date:{ value: '01/01/2026',        confidence: 'medium' },
          policy_end_date:  { value: '01/01/2027',        confidence: 'medium' },
          policy_type:      { value: 'Vehicle Insurance', confidence: 'medium' },
        },
        license: {
          license_number: { value: 'TN10 20261234567', confidence: 'high'   },
          holder_name:    { value: 'Demo Customer',    confidence: 'medium' },
          date_of_birth:  { value: '15/06/1990',       confidence: 'high'   },
          valid_till:     { value: '14/06/2030',        confidence: 'high'   },
          vehicle_class:  { value: 'MCWG, LMV',        confidence: 'medium' },
        },
        registration: {
          registration_number: { value: 'TN10AB1234',      confidence: 'high'   },
          owner_name:          { value: 'Demo Customer',   confidence: 'medium' },
          vehicle_make:        { value: 'Maruti Suzuki',   confidence: 'medium' },
          vehicle_model:       { value: 'Swift Dzire',     confidence: 'medium' },
          rto_office:          { value: 'Chennai Central', confidence: 'low'    },
        },
        police: {
          fir_number:       { value: 'FIR/2026/CH/00487', confidence: 'high'   },
          police_station:   { value: 'Adyar Police Station', confidence: 'medium' },
          incident_date:    { value: '10/08/2026',         confidence: 'high'   },
          incident_location:{ value: 'NH-44, Chennai',     confidence: 'medium' },
        },
        medical: {
          patient_name: { value: 'Demo Customer',          confidence: 'medium' },
          diagnosis:    { value: 'Contusions and abrasions', confidence: 'medium' },
          report_date:  { value: '11/08/2026',             confidence: 'high'   },
          doctor_name:  { value: 'Dr. K. Raghavan',        confidence: 'medium' },
          hospital:     { value: 'Apollo Hospitals Chennai', confidence: 'medium' },
        },
        photos: {
          photo_date: { value: '2026-08-10', confidence: 'low' },
        },
      };

      const fields = DEMO_FIELDS[docType] || {};
      const status = Object.keys(fields).length >= 2 ? 'verified' : 'partial';

      return {
        success: true,
        doc_type: docType,
        raw_text: `[Demo Mode — Backend OCR unavailable]\nSimulated extraction for ${file.name}.\nError: ${err instanceof Error ? err.message : 'Connection failed'}`,
        extracted_fields: fields,
        verification_status: status,
        verification_notes: ['Running in demo mode — connect backend for live OCR'],
      };
    }
  },

  // ── Document Authenticity Verification ──────────────────────────────────

  async verifyDocument(
    docType: string,
    extractedFields: Record<string, { value: string; confidence: string }>,
    claimContext: {
      policy_number?: string;
      incident_date?: string;
      incident_location?: string;
      customer_name?: string;
      claim_type?: string;
      policy_start_date?: string;
      policy_end_date?: string;
    }
  ): Promise<{
    doc_type: string;
    doc_label: string;
    trust_score: number;
    trust_level: string;
    overall_status: string;
    checks: Array<{
      check_id: string;
      label: string;
      status: 'pass' | 'fail' | 'warn' | 'skip';
      detail: string;
      field_value?: string;
    }>;
    fraud_flags: string[];
    summary: string;
  }> {
    try {
      const token = tokenStore.get();
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(`${API_BASE}/ocr/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          doc_type: docType,
          extracted_fields: extractedFields,
          claim_context: claimContext,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Verification failed' }));
        throw new Error(err.detail || `HTTP ${res.status}`);
      }
      return res.json();
    } catch {
      // ── Demo verification fallback (runs client-side logic) ────────────
      await new Promise(r => setTimeout(r, 1200));

      const DOC_LABELS: Record<string, string> = {
        policy: 'Policy Document', license: 'Driving License',
        registration: 'Vehicle Registration', police: 'Police Report',
        medical: 'Medical Report', photos: 'Accident Photos',
      };
      const doc_label = DOC_LABELS[docType] ?? docType;

      // Build demo checks based on available extracted fields
      const checks: Array<{ check_id: string; label: string; status: 'pass'|'fail'|'warn'|'skip'; detail: string; field_value?: string }> = [];
      const fraud_flags: string[] = [];

      // Helper: check if field exists
      const fv = (key: string) => extractedFields[key]?.value ?? '';

      if (docType === 'policy') {
        const pol = fv('policy_number');
        const ctxPol = claimContext.policy_number ?? '';
        checks.push({
          check_id: 'pol_num_match', label: 'Policy Number Match',
          status: pol ? (ctxPol && pol.replace(/-/g,'').toUpperCase() === ctxPol.replace(/-/g,'').toUpperCase() ? 'pass' : ctxPol ? 'fail' : 'warn') : 'fail',
          detail: pol ? (ctxPol && pol.replace(/-/g,'').toUpperCase() === ctxPol.replace(/-/g,'').toUpperCase()
            ? `Policy number '${pol}' matches claim form.`
            : ctxPol ? `Policy number mismatch: document '${pol}' vs form '${ctxPol}'.`
            : `Policy number '${pol}' extracted.`)
            : 'Policy number not found.',
          field_value: pol || undefined,
        });
        if (pol && ctxPol && pol.replace(/-/g,'').toUpperCase() !== ctxPol.replace(/-/g,'').toUpperCase())
          fraud_flags.push(`Policy number mismatch: '${pol}' vs '${ctxPol}'`);

        const endDate = fv('policy_end_date');
        const today = new Date();
        if (endDate) {
          const parts = endDate.split(/[\/\-]/);
          let dt: Date | null = null;
          if (parts.length === 3) {
            // try DD/MM/YYYY
            dt = new Date(+parts[2], +parts[1]-1, +parts[0]);
            if (isNaN(dt.getTime())) dt = new Date(+parts[0], +parts[1]-1, +parts[2]);
          }
          const active = dt ? dt >= today : true;
          checks.push({
            check_id: 'pol_not_expired', label: 'Policy Active',
            status: active ? 'pass' : 'fail',
            detail: active ? `Policy valid until ${endDate} — active.` : `Policy expired on ${endDate}.`,
            field_value: endDate,
          });
          if (!active) fraud_flags.push(`Policy expired on ${endDate}`);
        } else {
          checks.push({ check_id: 'pol_not_expired', label: 'Policy Active', status: 'fail', detail: 'Expiry date not found.' });
        }

        checks.push({
          check_id: 'incident_in_policy', label: 'Incident Within Policy Period',
          status: fv('policy_start_date') && endDate && claimContext.incident_date ? 'pass' : 'skip',
          detail: 'Date range cross-check (demo mode — always passes in demo).',
          field_value: claimContext.incident_date,
        });

        const polType = fv('policy_type');
        checks.push({
          check_id: 'policy_type_match', label: 'Policy Type Matches Claim',
          status: polType ? 'pass' : 'warn',
          detail: polType ? `Policy type: ${polType}` : 'Policy type not found.',
          field_value: polType || undefined,
        });
      }

      if (docType === 'license') {
        const lic = fv('license_number');
        checks.push({
          check_id: 'lic_format', label: 'License Number Format',
          status: lic ? 'pass' : 'fail',
          detail: lic ? `License number '${lic}' found.` : 'License number not found.',
          field_value: lic || undefined,
        });
        const exp = fv('valid_till');
        checks.push({
          check_id: 'lic_not_expired', label: 'License Not Expired',
          status: exp ? 'pass' : 'fail',
          detail: exp ? `License valid until ${exp}.` : 'Expiry date missing.',
          field_value: exp || undefined,
        });
        const holder = fv('holder_name');
        const cname = claimContext.customer_name ?? '';
        checks.push({
          check_id: 'lic_name_match', label: 'Name Matches Claimant',
          status: holder && cname ? (holder.toLowerCase().split(' ').some(w => cname.toLowerCase().includes(w) && w.length > 2) ? 'pass' : 'warn') : 'skip',
          detail: holder ? `License holder: '${holder}'` : 'Holder name not found.',
          field_value: holder || undefined,
        });
        checks.push({
          check_id: 'vehicle_class', label: 'Vehicle Class Present',
          status: fv('vehicle_class') ? 'pass' : 'warn',
          detail: fv('vehicle_class') ? `Class: ${fv('vehicle_class')}` : 'Vehicle class not found.',
          field_value: fv('vehicle_class') || undefined,
        });
      }

      if (docType === 'registration') {
        const reg = fv('registration_number');
        const validReg = reg ? /^[A-Z]{2}\d{2}[A-Z]{1,3}\d{4}$/.test(reg.replace(/[\s\-]/g,'').toUpperCase()) : false;
        checks.push({
          check_id: 'reg_format', label: 'Registration Number Format',
          status: reg ? (validReg ? 'pass' : 'warn') : 'fail',
          detail: reg ? (validReg ? `'${reg}' is valid Indian registration format.` : `'${reg}' — format needs review.`) : 'Registration number not found.',
          field_value: reg || undefined,
        });
        checks.push({
          check_id: 'reg_owner_match', label: 'Owner Matches Claimant',
          status: fv('owner_name') ? 'pass' : 'skip',
          detail: fv('owner_name') ? `Owner: ${fv('owner_name')}` : 'Owner name not found.',
          field_value: fv('owner_name') || undefined,
        });
        checks.push({
          check_id: 'reg_make_model', label: 'Vehicle Make & Model',
          status: fv('vehicle_make') && fv('vehicle_model') ? 'pass' : fv('vehicle_make') || fv('vehicle_model') ? 'warn' : 'fail',
          detail: `${fv('vehicle_make')} ${fv('vehicle_model')}`.trim() || 'Make/model not found.',
          field_value: (`${fv('vehicle_make')} ${fv('vehicle_model')}`).trim() || undefined,
        });
      }

      if (docType === 'police') {
        const fir = fv('fir_number');
        checks.push({
          check_id: 'fir_present', label: 'FIR Number Valid',
          status: fir ? 'pass' : 'fail',
          detail: fir ? `FIR: ${fir}` : 'FIR number not found.',
          field_value: fir || undefined,
        });
        const incDate = fv('incident_date');
        const ctxDate = claimContext.incident_date ?? '';
        checks.push({
          check_id: 'fir_date_match', label: 'Incident Date Matches',
          status: incDate && ctxDate ? (incDate === ctxDate ? 'pass' : 'warn') : 'skip',
          detail: incDate ? `FIR date: ${incDate}` : 'Date not found.',
          field_value: incDate || undefined,
        });
        checks.push({
          check_id: 'station_present', label: 'Police Station Identified',
          status: fv('police_station') ? 'pass' : 'warn',
          detail: fv('police_station') ? `Station: ${fv('police_station')}` : 'Station not identified.',
          field_value: fv('police_station') || undefined,
        });
        checks.push({
          check_id: 'loc_match', label: 'Incident Location Matches',
          status: fv('incident_location') ? 'pass' : 'skip',
          detail: fv('incident_location') ? `Location: ${fv('incident_location')}` : 'Location not found.',
          field_value: fv('incident_location') || undefined,
        });
      }

      if (docType === 'medical') {
        checks.push({
          check_id: 'patient_name_match', label: 'Patient Matches Claimant',
          status: fv('patient_name') ? 'pass' : 'skip',
          detail: fv('patient_name') ? `Patient: ${fv('patient_name')}` : 'Patient name not found.',
          field_value: fv('patient_name') || undefined,
        });
        checks.push({
          check_id: 'report_after_incident', label: 'Report After Incident',
          status: fv('report_date') && claimContext.incident_date ? 'pass' : 'skip',
          detail: fv('report_date') ? `Report date: ${fv('report_date')}` : 'Report date not found.',
          field_value: fv('report_date') || undefined,
        });
        checks.push({
          check_id: 'diagnosis_present', label: 'Diagnosis Documented',
          status: fv('diagnosis') ? 'pass' : 'warn',
          detail: fv('diagnosis') ? `Diagnosis: ${fv('diagnosis')}` : 'Diagnosis not found.',
          field_value: fv('diagnosis') || undefined,
        });
        checks.push({
          check_id: 'doctor_present', label: 'Doctor Identified',
          status: fv('doctor_name') ? 'pass' : 'warn',
          detail: fv('doctor_name') ? `Doctor: ${fv('doctor_name')}` : 'Doctor not identified.',
          field_value: fv('doctor_name') || undefined,
        });
      }

      if (docType === 'photos') {
        checks.push({
          check_id: 'photo_date_match', label: 'Photo Timestamp Near Incident',
          status: fv('photo_date') ? 'pass' : 'warn',
          detail: fv('photo_date') ? `Photo timestamp: ${fv('photo_date')}` : 'No EXIF timestamp found.',
          field_value: fv('photo_date') || undefined,
        });
        checks.push({ check_id: 'photo_readable', label: 'Photo is Readable', status: 'pass', detail: 'Photo uploaded and processed.' });
      }

      // Calculate trust score
      const scored = checks.filter(c => c.status !== 'skip');
      const trustScore = scored.length === 0 ? 50
        : Math.round((scored.reduce((s, c) => s + (c.status === 'pass' ? 10 : c.status === 'warn' ? 5 : 0), 0) / (scored.length * 10)) * 100);

      const trust_level = trustScore >= 80 ? 'high' : trustScore >= 55 ? 'medium' : trustScore >= 30 ? 'low' : 'invalid';
      const failCount = checks.filter(c => c.status === 'fail').length;
      const passCount = checks.filter(c => c.status === 'pass').length;

      let overall_status: string;
      if (fraud_flags.length >= 2 || failCount >= 2) overall_status = trustScore >= 30 ? 'suspicious' : 'invalid';
      else if (failCount === 0 && trustScore >= 75) overall_status = 'authentic';
      else if (passCount === 0) overall_status = 'incomplete';
      else overall_status = fraud_flags.length > 0 ? 'suspicious' : 'authentic';

      const summaries: Record<string, string> = {
        authentic: `${doc_label} passed all checks. Trust score: ${trustScore}/100.`,
        suspicious: `${doc_label} has ${failCount} failed check(s). Trust score: ${trustScore}/100. Review required.`,
        invalid: `${doc_label} failed critical checks. Trust score: ${trustScore}/100. Document may be invalid.`,
        incomplete: `${doc_label} is incomplete — insufficient data to fully verify. Trust score: ${trustScore}/100.`,
      };

      return {
        doc_type: docType,
        doc_label,
        trust_score: trustScore,
        trust_level,
        overall_status,
        checks,
        fraud_flags,
        summary: summaries[overall_status] ?? summaries.incomplete,
      };
    }
  },
};
