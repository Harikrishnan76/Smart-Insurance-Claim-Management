import React, { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, PlusCircle, List, LogOut, User, Shield, Settings } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface SidebarLinkProps { icon: ReactNode; label: string; path: string; id: string; onClick?: () => void; }

function SidebarLink({ icon, label, path, id, onClick }: SidebarLinkProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const active = location.pathname === path;
  return (
    <button
      id={id}
      className={`sidebar-link ${active ? 'active' : ''}`}
      onClick={onClick || (() => navigate(path))}
    >
      {icon}
      {label}
    </button>
  );
}

export function CustomerSidebar() {
  const { setUser } = useApp();
  const navigate = useNavigate();
  return (
    <aside className="sidebar">
      <div className="sidebar-section">Main</div>
      <SidebarLink id="sb-dashboard" icon={<LayoutDashboard size={16} />} label="Dashboard" path="/customer" />
      <SidebarLink id="sb-submit" icon={<PlusCircle size={16} />} label="Submit Claim" path="/customer/claim-form" />
      <SidebarLink id="sb-claims" icon={<List size={16} />} label="My Claims" path="/customer/my-claims" />
      <div className="sidebar-section">Account</div>
      <SidebarLink id="sb-profile" icon={<User size={16} />} label="My Profile" path="/customer/profile" />
      <SidebarLink id="sb-policies" icon={<Shield size={16} />} label="My Policies" path="/customer/policies" />
      <div style={{ marginTop: 'auto', paddingTop: 16 }}>
        <button className="sidebar-link" id="sb-logout" onClick={() => { setUser(null); navigate('/login'); }}>
          <LogOut size={16} /> Logout
        </button>
      </div>
    </aside>
  );
}

export function AdminSidebar() {
  const { setUser } = useApp();
  const navigate = useNavigate();
  return (
    <aside className="sidebar">
      <div className="sidebar-section">Admin</div>
      <SidebarLink id="sb-admin-dash" icon={<LayoutDashboard size={16} />} label="Dashboard" path="/admin" />
      <SidebarLink id="sb-admin-claims" icon={<List size={16} />} label="All Claims" path="/admin/claims" />
      <div style={{ marginTop: 'auto', paddingTop: 16 }}>
        <button className="sidebar-link" id="sb-admin-logout" onClick={() => { setUser(null); navigate('/login'); }}>
          <LogOut size={16} /> Logout
        </button>
      </div>
    </aside>
  );
}
