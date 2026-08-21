import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService, tokenStore } from '../services/api';

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
  setClaims: (claims: Claim[]) => void;
  addClaim: (c: Claim) => void;
  updateClaim: (id: string, updates: Partial<Claim>) => void;
  refreshClaims: () => Promise<void>;
  loading: boolean;
}

const AppContext = createContext<AppContextType>({} as AppContextType);
export const useApp = () => useContext(AppContext);

// Demo users for offline fallback
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

export { DEMO_USERS };

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);

  // On mount: restore session from stored JWT
  useEffect(() => {
    const restoreSession = async () => {
      const token = tokenStore.get();
      if (token) {
        const profile = await apiService.getProfile();
        if (profile) {
          setUserState(profile);
        } else {
          tokenStore.clear();
        }
      }
      setLoading(false);
    };
    restoreSession();
  }, []);

  // Fetch claims from backend when user changes
  useEffect(() => {
    if (user) {
      refreshClaims();
    } else {
      setClaims([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const setUser = (u: User | null) => {
    setUserState(u);
    if (!u) {
      apiService.logout();
      setClaims([]);
    }
  };

  const refreshClaims = async () => {
    if (!user) return;
    try {
      let fetched: Claim[] = [];
      if (user.role === 'admin') {
        fetched = await apiService.getAllClaims();
      } else {
        fetched = await apiService.getClaims();
      }
      if (fetched.length > 0) {
        setClaims(fetched);
      }
    } catch {
      // Keep existing claims on error
    }
  };

  const addClaim = (c: Claim) => setClaims(prev => [c, ...prev]);

  const updateClaim = (id: string, updates: Partial<Claim>) =>
    setClaims(prev => prev.map(c => c.claimId === id ? { ...c, ...updates } : c));

  return (
    <AppContext.Provider value={{
      user, setUser, claims, setClaims,
      addClaim, updateClaim, refreshClaims, loading,
    }}>
      {children}
    </AppContext.Provider>
  );
}
