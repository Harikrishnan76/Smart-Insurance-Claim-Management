import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  mobile: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  role: 'customer' | 'admin';
}

export interface Claim {
  claimId: string;
  customerId: string;
  customerName: string;
  email: string;
  mobile: string;
  policyNumber: string;
  policyType: string;
  policyStartDate: string;
  policyEndDate: string;
  claimType: string;
  incidentDate: string;
  incidentTime: string;
  incidentLocation: string;
  incidentDescription: string;
  claimAmount: number;
  damageSeverity: string;
  injuryInvolved: boolean;
  policeReportAvailable: boolean;
  submittedDate: string;
  // Guidewire response fields
  claimStatus: string;
  priority: string;
  riskScore: number;
  riskLevel: string;
  duplicateClaim: string;
  documentStatus: string;
  documents: string[];
}

interface AppContextType {
  user: User | null;
  setUser: (u: User | null) => void;
  claims: Claim[];
  addClaim: (c: Claim) => void;
  updateClaim: (id: string, updates: Partial<Claim>) => void;
}

const AppContext = createContext<AppContextType>({} as AppContextType);
export const useApp = () => useContext(AppContext);

// Demo claims for admin view
const DEMO_CLAIMS: Claim[] = [
  {
    claimId: 'CLM000123', customerId: 'CUST001', customerName: 'Arun Kumar', email: 'arun@example.com', mobile: '9876543210',
    policyNumber: 'POL10023', policyType: 'Vehicle Insurance', policyStartDate: '2025-01-01', policyEndDate: '2026-01-01',
    claimType: 'Accident', incidentDate: '2026-08-01', incidentTime: '14:30', incidentLocation: 'Chennai Highway, NH-44',
    incidentDescription: 'Vehicle collided with another car at highway intersection.', claimAmount: 85000,
    damageSeverity: 'Major', injuryInvolved: true, policeReportAvailable: true,
    submittedDate: '2026-08-02', claimStatus: 'Under Review', priority: 'High',
    riskScore: 72, riskLevel: 'High', duplicateClaim: 'No', documentStatus: 'Verified',
    documents: ['Policy Document', 'Driving License', 'Vehicle Registration', 'Accident Photos', 'Police Report', 'Medical Report'],
  },
  {
    claimId: 'CLM000124', customerId: 'CUST002', customerName: 'Ravi Shankar', email: 'ravi@example.com', mobile: '9876543211',
    policyNumber: 'POL10024', policyType: 'Vehicle Insurance', policyStartDate: '2025-03-01', policyEndDate: '2026-03-01',
    claimType: 'Theft', incidentDate: '2026-07-28', incidentTime: '02:00', incidentLocation: 'Coimbatore City Centre',
    incidentDescription: 'Vehicle stolen from parking lot overnight.', claimAmount: 25000,
    damageSeverity: 'Minor', injuryInvolved: false, policeReportAvailable: true,
    submittedDate: '2026-07-29', claimStatus: 'Approved', priority: 'Low',
    riskScore: 28, riskLevel: 'Low', duplicateClaim: 'No', documentStatus: 'Verified',
    documents: ['Policy Document', 'Driving License', 'Vehicle Registration', 'Police Report'],
  },
  {
    claimId: 'CLM000125', customerId: 'CUST003', customerName: 'Priya Devi', email: 'priya@example.com', mobile: '9876543212',
    policyNumber: 'POL10025', policyType: 'Vehicle Insurance', policyStartDate: '2025-06-01', policyEndDate: '2026-06-01',
    claimType: 'Natural Disaster', incidentDate: '2026-08-05', incidentTime: '11:00', incidentLocation: 'Madurai',
    incidentDescription: 'Vehicle damaged due to heavy flooding during monsoon season.', claimAmount: 150000,
    damageSeverity: 'Major', injuryInvolved: false, policeReportAvailable: false,
    submittedDate: '2026-08-06', claimStatus: 'Under Review', priority: 'High',
    riskScore: 65, riskLevel: 'High', duplicateClaim: 'Yes', documentStatus: 'Pending',
    documents: ['Policy Document', 'Driving License', 'Vehicle Registration', 'Accident Photos'],
  },
  {
    claimId: 'CLM000126', customerId: 'CUST004', customerName: 'Suresh Babu', email: 'suresh@example.com', mobile: '9876543213',
    policyNumber: 'POL10026', policyType: 'Vehicle Insurance', policyStartDate: '2024-11-01', policyEndDate: '2025-11-01',
    claimType: 'Fire', incidentDate: '2026-07-20', incidentTime: '16:45', incidentLocation: 'Trichy',
    incidentDescription: 'Engine caught fire due to electrical fault.', claimAmount: 120000,
    damageSeverity: 'Major', injuryInvolved: true, policeReportAvailable: true,
    submittedDate: '2026-07-21', claimStatus: 'Rejected', priority: 'Medium',
    riskScore: 58, riskLevel: 'Medium', duplicateClaim: 'No', documentStatus: 'Verified',
    documents: ['Policy Document', 'Driving License', 'Accident Photos', 'Police Report'],
  },
  {
    claimId: 'CLM000127', customerId: 'CUST005', customerName: 'Kavitha Rajan', email: 'kavitha@example.com', mobile: '9876543214',
    policyNumber: 'POL10027', policyType: 'Vehicle Insurance', policyStartDate: '2025-02-01', policyEndDate: '2026-02-01',
    claimType: 'Accident', incidentDate: '2026-08-08', incidentTime: '09:15', incidentLocation: 'Bangalore Road, Hosur',
    incidentDescription: 'Minor collision at traffic signal. No major damage.', claimAmount: 18000,
    damageSeverity: 'Minor', injuryInvolved: false, policeReportAvailable: false,
    submittedDate: '2026-08-09', claimStatus: 'Under Review', priority: 'Low',
    riskScore: 22, riskLevel: 'Low', duplicateClaim: 'No', documentStatus: 'Verified',
    documents: ['Policy Document', 'Driving License', 'Vehicle Registration', 'Accident Photos'],
  },
];

const DEMO_USERS: Record<string, User> = {
  'customer@demo.com': {
    id: 'CUST001', name: 'Hari Krishnan', email: 'customer@demo.com', mobile: '9876543210',
    address: '42, Anna Nagar West', city: 'Chennai', state: 'Tamil Nadu', pincode: '600040', role: 'customer',
  },
  'admin@demo.com': {
    id: 'ADMIN001', name: 'Admin User', email: 'admin@demo.com', mobile: '9000000001',
    address: 'Head Office', city: 'Chennai', state: 'Tamil Nadu', pincode: '600001', role: 'admin',
  },
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [claims, setClaims] = useState<Claim[]>(DEMO_CLAIMS);

  const addClaim = (c: Claim) => setClaims(prev => [c, ...prev]);
  const updateClaim = (id: string, updates: Partial<Claim>) =>
    setClaims(prev => prev.map(c => c.claimId === id ? { ...c, ...updates } : c));

  return (
    <AppContext.Provider value={{ user, setUser, claims, addClaim, updateClaim }}>
      {children}
    </AppContext.Provider>
  );
}

export { DEMO_USERS };
