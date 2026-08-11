import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, PlusCircle, Clock, CheckCircle, XCircle, TrendingUp, Shield, ChevronRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CustomerSidebar } from '../../components/Sidebar';
import DashboardCard from '../../components/DashboardCard';
import ClaimStatus, { PriorityBadge } from '../../components/ClaimStatus';

export default function CustomerDashboard() {
  const { user, claims } = useApp();
  const navigate = useNavigate();
  const myClaims = claims.filter(c => c.customerId === user?.id || c.customerName === user?.name);

  const stats = {
    total: myClaims.length,
    pending: myClaims.filter(c => c.claimStatus === 'Under Review').length,
    approved: myClaims.filter(c => c.claimStatus === 'Approved').length,
    rejected: myClaims.filter(c => c.claimStatus === 'Rejected').length,
  };

  const recent = myClaims.slice(0, 5);

  return (
    <div className="dashboard-layout">
      <CustomerSidebar />
      <main className="main-content">
        <div className="page-header">
          <div className="flex-between">
            <div>
              <h1 className="page-title">Welcome, <span className="gradient-text">{user?.name}</span></h1>
              <p className="page-subtitle">Here's an overview of your insurance claims.</p>
            </div>
            <button className="btn btn-primary" onClick={() => navigate('/customer/claim-form')} id="btn-new-claim">
              <PlusCircle size={18} /> New Claim
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid-4 mb-8">
          <DashboardCard title="My Policies" value={2} icon={<Shield size={22}/>} color="#6366f1" subtitle="Vehicle Insurance" />
          <DashboardCard title="Total Claims" value={stats.total} icon={<FileText size={22}/>} color="#22d3ee" />
          <DashboardCard title="Under Review" value={stats.pending} icon={<Clock size={22}/>} color="#f59e0b" />
          <DashboardCard title="Approved" value={stats.approved} icon={<CheckCircle size={22}/>} color="#10b981" />
        </div>

        {/* Recent claims */}
        <div className="card">
          <div className="flex-between mb-6">
            <div>
              <h2 style={{ fontSize:20, fontWeight:700 }}>Recent Claims</h2>
              <p className="text-muted text-sm">Your latest claim submissions</p>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/customer/my-claims')} id="btn-view-all">
              View All <ChevronRight size={14} />
            </button>
          </div>

          {recent.length === 0 ? (
            <div className="text-center" style={{ padding:40 }}>
              <FileText size={48} color="var(--text-muted)" style={{ marginBottom:16 }} />
              <p style={{ fontSize:16, fontWeight:600, marginBottom:8 }}>No Claims Yet</p>
              <p className="text-muted text-sm mb-4">Submit your first claim to get started</p>
              <button className="btn btn-primary" onClick={() => navigate('/customer/claim-form')} id="btn-first-claim">
                <PlusCircle size={16} /> Submit Claim
              </button>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Claim ID</th><th>Policy</th><th>Claim Type</th><th>Date</th>
                    <th>Amount</th><th>Priority</th><th>Status</th><th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map(c => (
                    <tr key={c.claimId}>
                      <td><code style={{ color:'var(--primary-light)', fontWeight:600 }}>{c.claimId}</code></td>
                      <td style={{ color:'var(--text-secondary)' }}>{c.policyNumber}</td>
                      <td>{c.claimType}</td>
                      <td style={{ color:'var(--text-secondary)' }}>{c.submittedDate}</td>
                      <td style={{ fontWeight:600 }}>₹{c.claimAmount.toLocaleString('en-IN')}</td>
                      <td><PriorityBadge priority={c.priority} /></td>
                      <td><ClaimStatus status={c.claimStatus} /></td>
                      <td>
                        <button className="btn btn-outline btn-sm" onClick={() => navigate(`/customer/claim-tracking/${c.claimId}`)} id={`track-${c.claimId}`}>
                          Track
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Policy card */}
        <div className="grid-2 mt-6">
          <div className="card" style={{ background:'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(34,211,238,0.05))', borderColor:'rgba(99,102,241,0.2)' }}>
            <div className="flex-between mb-4">
              <div>
                <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text-muted)', marginBottom:4 }}>Active Policy</div>
                <div style={{ fontSize:18, fontWeight:700 }}>POL10025</div>
              </div>
              <div style={{ width:44, height:44, borderRadius:12, background:'rgba(99,102,241,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Shield size={22} color="var(--primary-light)" />
              </div>
            </div>
            <div className="info-grid">
              <div><div className="info-key">Type</div><div className="info-val">Vehicle Insurance</div></div>
              <div><div className="info-key">Valid Until</div><div className="info-val">2027-01-01</div></div>
              <div><div className="info-key">Coverage</div><div className="info-val">₹5,00,000</div></div>
              <div><div className="info-key">Status</div><div className="info-val"><span className="badge badge-success">Active</span></div></div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize:16, fontWeight:700, marginBottom:16 }}>Quick Actions</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <button className="btn btn-primary w-full" onClick={() => navigate('/customer/claim-form')} id="qa-claim">
                <PlusCircle size={16} /> Submit New Claim
              </button>
              <button className="btn btn-secondary w-full" onClick={() => navigate('/customer/my-claims')} id="qa-claims">
                <FileText size={16} /> View My Claims
              </button>
              <button className="btn btn-secondary w-full" onClick={() => navigate('/customer/profile')} id="qa-profile">
                View My Profile
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
