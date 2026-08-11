import { Claim } from '../context/AppContext';

// Simulates Guidewire ClaimCenter API responses
// In production, replace these with actual API calls

const API_BASE = 'http://localhost:8080/api'; // Guidewire backend URL

export function computeRiskScore(claim: Partial<Claim>): { riskScore: number; riskLevel: string; priority: string; duplicateClaim: string } {
  let score = 0;

  // Severity scoring
  if (claim.damageSeverity === 'Major') score += 30;
  else if (claim.damageSeverity === 'Moderate') score += 15;
  else score += 5;

  // Injury
  if (claim.injuryInvolved) score += 20;

  // Claim amount
  const amt = claim.claimAmount || 0;
  if (amt > 100000) score += 20;
  else if (amt > 50000) score += 12;
  else if (amt > 20000) score += 6;

  // Claim type
  if (claim.claimType === 'Theft') score += 10;
  else if (claim.claimType === 'Fire') score += 8;

  // Police report
  if (!claim.policeReportAvailable && (claim.claimType === 'Accident' || claim.claimType === 'Theft')) score += 5;

  const riskScore = Math.min(score, 100);
  const riskLevel = riskScore >= 60 ? 'High' : riskScore >= 35 ? 'Medium' : 'Low';
  const priority = riskScore >= 60 ? 'High' : riskScore >= 35 ? 'Medium' : 'Low';
  const duplicateClaim = Math.random() > 0.85 ? 'Yes' : 'No';

  return { riskScore, riskLevel, priority, duplicateClaim };
}

export const apiService = {
  // Submit a new claim — returns Guidewire-processed result
  async submitClaim(claimData: Partial<Claim>): Promise<Claim> {
    // Simulate API delay
    await new Promise(r => setTimeout(r, 2000));

    const { riskScore, riskLevel, priority, duplicateClaim } = computeRiskScore(claimData);
    const claimId = 'CLM' + String(Math.floor(100000 + Math.random() * 900000));

    // In production: return await fetch(`${API_BASE}/claims`, { method:'POST', body: JSON.stringify(claimData), headers:{'Content-Type':'application/json'} }).then(r=>r.json());

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
  },

  async updateClaimStatus(claimId: string, status: string): Promise<{ success: boolean }> {
    await new Promise(r => setTimeout(r, 800));
    return { success: true };
  },

  async getClaims(): Promise<Claim[]> {
    await new Promise(r => setTimeout(r, 500));
    return [];
  },

  async login(email: string, password: string): Promise<{ success: boolean; message?: string }> {
    await new Promise(r => setTimeout(r, 800));
    if (password.length < 4) return { success: false, message: 'Invalid credentials' };
    return { success: true };
  },

  async register(data: Partial<import('../context/AppContext').User> & { password: string }): Promise<{ success: boolean; message?: string }> {
    await new Promise(r => setTimeout(r, 1000));
    return { success: true };
  },
};
