import React, { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FileText, PlusCircle, List, LogOut,
  User, Shield, ChevronRight, Activity, Settings,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface SidebarLinkProps {
  icon: ReactNode;
  label: string;
  path: string;
  id: string;
  onClick?: () => void;
  badge?: string;
}

function SidebarLink({ icon, label, path, id, onClick, badge }: SidebarLinkProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const active = location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <button
      id={id}
      className={`sidebar-link ${active ? 'active' : ''}`}
      onClick={onClick || (() => navigate(path))}
    >
      <span style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
        background: active ? 'rgba(124,58,237,0.2)' : 'transparent',
        color: active ? 'var(--primary-light)' : 'var(--text-muted)',
        transition: 'var(--transition)',
      }}>
        {icon}
      </span>
      <span style={{ flex: 1, textAlign: 'left' }}>{label}</span>
      {badge && (
        <span style={{
          fontSize: 10, fontWeight: 800, padding: '1px 7px', borderRadius: 99,
          background: 'rgba(124,58,237,0.2)', color: 'var(--primary-light)',
          border: '1px solid rgba(124,58,237,0.3)',
        }}>{badge}</span>
      )}
      {active && (
        <ChevronRight size={12} color="var(--primary-light)" style={{ opacity: 0.6 }} />
      )}
    </button>
  );
}

function SidebarSection({ label }: { label: string }) {
  return (
    <div className="sidebar-section" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'var(--border-light)' }} />
    </div>
  );
}

export function CustomerSidebar() {
  const { user, setUser, claims } = useApp();
  const navigate = useNavigate();

  const myClaims = claims.filter(c => c.customerId === user?.id || c.customerName === user?.name);
  const pendingCount = myClaims.filter(c => c.claimStatus === 'Under Review').length;

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <aside className="sidebar">
      {/* User profile mini card */}
      <div style={{
        padding: '10px 12px 16px',
        marginBottom: 8,
        borderBottom: '1px solid var(--border-light)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 800, color: '#fff',
            boxShadow: '0 4px 12px rgba(124,58,237,0.4)',
          }}>
            {initials}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', flexShrink: 0, boxShadow: '0 0 6px #10b981' }} />
              Customer
            </div>
          </div>
        </div>
      </div>

      <SidebarSection label="Main" />
      <SidebarLink id="sb-dashboard"  icon={<LayoutDashboard size={15} />} label="Dashboard"    path="/customer" />
      <SidebarLink id="sb-submit"     icon={<PlusCircle size={15} />}     label="Submit Claim" path="/customer/claim-form" />
      <SidebarLink id="sb-claims"     icon={<List size={15} />}           label="My Claims"    path="/customer/my-claims"
        badge={pendingCount > 0 ? String(pendingCount) : undefined}
      />

      <SidebarSection label="Account" />
      <SidebarLink id="sb-profile"  icon={<User size={15} />}   label="My Profile"  path="/customer/profile" />
      <SidebarLink id="sb-policies" icon={<Shield size={15} />} label="My Policies" path="/customer/policies" />

      {/* Bottom section */}
      <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--border-light)' }}>
        {/* Powered by banner */}
        <div style={{
          margin: '0 2px 10px',
          padding: '10px 12px',
          borderRadius: 10,
          background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(6,182,212,0.05))',
          border: '1px solid rgba(124,58,237,0.15)',
        }}>
          <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 3 }}>
            Powered by
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary-light)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Activity size={11} color="var(--accent)" />
            Guidewire AI Engine
          </div>
        </div>

        <button
          className="sidebar-link"
          id="sb-logout"
          onClick={() => { setUser(null); navigate('/login'); }}
          style={{ color: '#f87171', width: '100%' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        >
          <span style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 28, height: 28, borderRadius: 8, background: 'rgba(239,68,68,0.1)',
          }}>
            <LogOut size={14} color="#f87171" />
          </span>
          Sign Out
        </button>
      </div>
    </aside>
  );
}

export function AdminSidebar() {
  const { user, setUser, claims } = useApp();
  const navigate = useNavigate();
  const pendingCount = claims.filter(c => c.claimStatus === 'Under Review').length;

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'AD';

  return (
    <aside className="sidebar">
      {/* Admin profile mini card */}
      <div style={{
        padding: '10px 12px 16px',
        marginBottom: 8,
        borderBottom: '1px solid var(--border-light)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 800, color: '#fff',
            boxShadow: '0 4px 12px rgba(245,158,11,0.3)',
          }}>
            {initials}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name}
            </div>
            <div style={{ fontSize: 10, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
              <Shield size={9} color="#fbbf24" />
              Administrator
            </div>
          </div>
        </div>
      </div>

      <SidebarSection label="Admin" />
      <SidebarLink id="sb-admin-dash"   icon={<LayoutDashboard size={15} />} label="Dashboard"  path="/admin" />
      <SidebarLink id="sb-admin-claims" icon={<List size={15} />}           label="All Claims" path="/admin/claims"
        badge={pendingCount > 0 ? String(pendingCount) : undefined}
      />

      <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--border-light)' }}>
        <div style={{
          margin: '0 2px 10px', padding: '10px 12px', borderRadius: 10,
          background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(239,68,68,0.05))',
          border: '1px solid rgba(245,158,11,0.15)',
        }}>
          <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 3 }}>Admin Controls</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Settings size={11} />
            Full Access Mode
          </div>
        </div>

        <button
          className="sidebar-link"
          id="sb-admin-logout"
          onClick={() => { setUser(null); navigate('/login'); }}
          style={{ color: '#f87171', width: '100%' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        >
          <span style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 28, height: 28, borderRadius: 8, background: 'rgba(239,68,68,0.1)',
          }}>
            <LogOut size={14} color="#f87171" />
          </span>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
