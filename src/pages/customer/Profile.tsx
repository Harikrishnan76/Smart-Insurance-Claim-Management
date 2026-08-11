import React from 'react';
import { useApp } from '../../context/AppContext';
import { CustomerSidebar } from '../../components/Sidebar';
import { User, Mail, Phone, MapPin, Shield, Calendar } from 'lucide-react';

export default function Profile() {
  const { user } = useApp();
  return (
    <div className="dashboard-layout">
      <CustomerSidebar />
      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Your account information and policy details.</p>
        </div>

        <div className="grid-2" style={{ maxWidth:900 }}>
          <div className="card">
            <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:24 }}>
              <div style={{ width:64, height:64, borderRadius:'50%', background:'linear-gradient(135deg,#6366f1,#22d3ee)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, fontWeight:800, color:'#fff' }}>
                {user?.name.charAt(0)}
              </div>
              <div>
                <h2 style={{ fontSize:20, fontWeight:700, marginBottom:4 }}>{user?.name}</h2>
                <span className="badge badge-primary">{user?.role?.toUpperCase()}</span>
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {[
                { icon:<Mail size={16}/>, label:'Email', val: user?.email },
                { icon:<Phone size={16}/>, label:'Mobile', val: user?.mobile },
                { icon:<MapPin size={16}/>, label:'Address', val: [user?.address, user?.city, user?.state, user?.pincode].filter(Boolean).join(', ') },
                { icon:<Shield size={16}/>, label:'Customer ID', val: user?.id },
              ].map(row => (
                <div key={row.label} style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                  <div style={{ color:'var(--primary-light)', marginTop:2 }}>{row.icon}</div>
                  <div>
                    <div className="info-key">{row.label}</div>
                    <div className="info-val" style={{ fontWeight:500 }}>{row.val || '—'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize:17, fontWeight:700, marginBottom:20 }}>My Policies</h3>
            {[{ num:'POL10025', type:'Vehicle Insurance', valid:'2027-01-01', cover:'₹5,00,000' }].map(p => (
              <div key={p.num} style={{ padding:20, borderRadius:12, background:'linear-gradient(135deg,rgba(99,102,241,0.1),rgba(34,211,238,0.06))', border:'1px solid rgba(99,102,241,0.25)' }}>
                <div className="flex-between mb-3">
                  <code style={{ color:'var(--primary-light)', fontWeight:700 }}>{p.num}</code>
                  <span className="badge badge-success">Active</span>
                </div>
                <div className="info-grid">
                  <div><div className="info-key">Type</div><div className="info-val">{p.type}</div></div>
                  <div><div className="info-key">Coverage</div><div className="info-val">{p.cover}</div></div>
                  <div><div className="info-key">Valid Until</div><div className="info-val">{p.valid}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
