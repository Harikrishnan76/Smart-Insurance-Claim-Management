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
};
