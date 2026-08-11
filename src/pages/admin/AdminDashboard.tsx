import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Clock, AlertTriangle, CheckCircle, XCircle, TrendingUp, Users, Shield, ChevronRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AdminSidebar } from '../../components/Sidebar';
import DashboardCard from '../../components/DashboardCard';
import ClaimStatus, { PriorityBadge, RiskBadge } from '../../components/ClaimStatus';

export default function AdminDashboard() {
  const { claims } = useApp();
  const navigate = useNavigate();

  const stats = {
    total: claims.length,
    newClaims: claims.filter(c => {
      const d = new Date(c.submittedDate); const now = new Date();
      return (now.getTime() - d.getTime()) < 7 * 24 * 60 * 60 * 1000;
    }).length,
    underReview: claims.filter(c => c.claimStatus === 'Under Review').length,
    highRisk: claims.filter(c => c.riskLevel === 'High').length,
    approved: claims.filter(c => c.claimStatus === 'Approved').length,
    rejected: claims.filter(c => c.claimStatus === 'Rejected').length,
  };

  const recent = claims.slice(0, 5);

  return (
    <div className="dashboard-layout">
      <AdminSidebar />
      <main className="main-content">
        <div className="page-header">
          <div className="flex-between">
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
                <div style={{ padding:'4px 12px', borderRadius:20, background:'rgba(239,68,68,0.15)', border:'1px solid rgba(239,68,68,0.3)', fontSize:12, fontWeight:700, color:'#ef4444', letterSpacing:'0.05em' }}>
                  ADMIN
                </div>
                <div style={{ fontSize:12, color:'var(--text-muted)' }}>Guidewire ClaimCenter Control Panel</div>
              </div>
              <h1 className="page-title">Admin Dashboard</h1>
              <p className="page-subtitle">Real-time claim management and risk monitoring.</p>
            </div>
            <button className="btn btn-primary" onClick={() => navigate('/admin/claims')} id="admin-view-all">
              View All Claims <ChevronRight size={16}/>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid-3 mb-8" style={{ gridTemplateColumns:'repeat(3,1fr)' }}>
          <DashboardCard title="Total Claims" value={stats.total} icon={<FileText size={22}/>} color="#6366f1" />
          <DashboardCard title="New This Week" value={stats.newClaims} icon={<TrendingUp size={22}/>} color="#22d3ee" subtitle="Last 7 days" />
          <DashboardCard title="Under Review" value={stats.underReview} icon={<Clock size={22}/>} color="#f59e0b" />
          <DashboardCard title="High Risk" value={stats.highRisk} icon={<AlertTriangle size={22}/>} color="#ef4444" subtitle="Flagged by Gosu" />
          <DashboardCard title="Approved" value={stats.approved} icon={<CheckCircle size={22}/>} color="#10b981" />
          <DashboardCard title="Rejected" value={stats.rejected} icon={<XCircle size={22}/>} color="#64748b" />
        </div>

        {/* Risk distribution */}
        <div className="grid-2 mb-6">
          <div className="card">
            <h3 style={{ fontSize:17, fontWeight:700, marginBottom:16 }}>Risk Distribution</h3>
            {(['High','Medium','Low'] as const).map(level => {
              const count = claims.filter(c => c.riskLevel === level).length;
              const pct = claims.length ? Math.round((count / claims.length) * 100) : 0;
              const color = level === 'High' ? '#ef4444' : level === 'Medium' ? '#f59e0b' : '#10b981';
              return (
                <div key={level} style={{ marginBottom:16 }}>
                  <div className="flex-between mb-1">
                    <span style={{ fontSize:13, fontWeight:600, color }}>{level} Risk</span>
                    <span style={{ fontSize:13, fontWeight:700 }}>{count} ({pct}%)</span>
                  </div>
                  <div style={{ height:8, borderRadius:4, background:'var(--bg-surface)', overflow:'hidden' }}>
                    <div style={{ width:`${pct}%`, height:'100%', borderRadius:4, background:color, transition:'width 0.8s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="card">
            <h3 style={{ fontSize:17, fontWeight:700, marginBottom:16 }}>Claim Type Breakdown</h3>
            {['Accident','Theft','Fire','Natural Disaster','Other'].map(type => {
              const count = claims.filter(c => c.claimType === type).length;
              if (!count) return null;
              return (
                <div key={type} className="flex-between" style={{ padding:'10px 0', borderBottom:'1px solid var(--border-light)' }}>
                  <span style={{ fontSize:13 }}>{type}</span>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:60, height:6, borderRadius:3, background:'var(--bg-surface)', overflow:'hidden' }}>
                      <div style={{ width:`${(count/claims.length)*100}%`, height:'100%', background:'var(--primary)', borderRadius:3 }} />
                    </div>
                    <span style={{ fontSize:13, fontWeight:700, width:20 }}>{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent claims table */}
        <div className="card">
          <div className="flex-between mb-6">
            <h3 style={{ fontSize:17, fontWeight:700 }}>Recent Claims</h3>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/admin/claims')} id="admin-all-btn">
              View All <ChevronRight size={14}/>
            </button>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Claim ID</th><th>Customer</th><th>Policy</th><th>Type</th>
                  <th>Amount</th><th>Priority</th><th>Risk</th><th>Duplicate</th><th>Status</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(c => (
                  <tr key={c.claimId}>
                    <td><code style={{ color:'var(--primary-light)', fontWeight:600 }}>{c.claimId}</code></td>
                    <td style={{ fontWeight:600 }}>{c.customerName}</td>
                    <td style={{ color:'var(--text-secondary)' }}>{c.policyNumber}</td>
                    <td>{c.claimType}</td>
                    <td style={{ fontWeight:600 }}>₹{c.claimAmount.toLocaleString('en-IN')}</td>
                    <td><PriorityBadge priority={c.priority} /></td>
                    <td><RiskBadge level={c.riskLevel} /></td>
                    <td><span className={`badge ${c.duplicateClaim === 'Yes' ? 'badge-danger' : 'badge-success'}`}>{c.duplicateClaim}</span></td>
                    <td><ClaimStatus status={c.claimStatus} /></td>
                    <td>
                      <button className="btn btn-outline btn-sm" id={`admin-view-${c.claimId}`} onClick={() => navigate(`/admin/claims/${c.claimId}`)}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
