import React from 'react';
import { CheckCircle, Clock, AlertCircle, XCircle } from 'lucide-react';

interface Props { status: string; size?: 'sm' | 'md'; }

export default function ClaimStatus({ status, size = 'md' }: Props) {
  const cfg: Record<string, { cls: string; icon: React.ReactNode }> = {
    'Approved':      { cls: 'badge-success', icon: <CheckCircle size={12} /> },
    'Rejected':      { cls: 'badge-danger',  icon: <XCircle size={12} /> },
    'Under Review':  { cls: 'badge-warning', icon: <Clock size={12} /> },
    'Submitted':     { cls: 'badge-primary', icon: <AlertCircle size={12} /> },
    'Pending':       { cls: 'badge-muted',   icon: <Clock size={12} /> },
    'Completed':     { cls: 'badge-success', icon: <CheckCircle size={12} /> },
  };
  const { cls = 'badge-muted', icon } = cfg[status] || {};
  return (
    <span className={`badge ${cls}`} style={size === 'sm' ? { fontSize: 10, padding: '2px 8px' } : {}}>
      {icon} {status}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, string> = { High: 'badge-danger', Medium: 'badge-warning', Low: 'badge-success' };
  return <span className={`badge ${map[priority] || 'badge-muted'}`}>{priority}</span>;
}

export function RiskBadge({ level }: { level: string }) {
  const map: Record<string, string> = { High: 'badge-danger', Medium: 'badge-warning', Low: 'badge-success' };
  return <span className={`badge ${map[level] || 'badge-muted'}`}>{level}</span>;
}
