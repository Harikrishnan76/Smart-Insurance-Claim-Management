import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AdminSidebar } from '../../components/Sidebar';
import ClaimStatus, { PriorityBadge, RiskBadge } from '../../components/ClaimStatus';

export default function ClaimsList() {
  const { claims } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterRisk, setFilterRisk] = useState('');

  const filtered = claims.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !search || c.claimId.toLowerCase().includes(q) || c.customerName.toLowerCase().includes(q) || c.policyNumber.toLowerCase().includes(q);
    const matchStatus = !filterStatus || c.claimStatus === filterStatus;
    const matchPriority = !filterPriority || c.priority === filterPriority;
    const matchRisk = !filterRisk || c.riskLevel === filterRisk;
    return matchSearch && matchStatus && matchPriority && matchRisk;
  });

  return (
    <div className="dashboard-layout">
      <AdminSidebar />
      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">All Claims</h1>
          <p className="page-subtitle">Complete list of all insurance claims — sorted by submission date.</p>
        </div>

        <div className="card">
          <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:20 }}>
            <div className="relative" style={{ flex:1, minWidth:200 }}>
              <Search size={16} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
              <input id="admin-search" className="form-control" placeholder="Search by ID, name, policy..." style={{ paddingLeft:40 }} value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select id="admin-filter-status" className="form-control" style={{ width:160 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">All Status</option>
              <option value="Under Review">Under Review</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
            <select id="admin-filter-priority" className="form-control" style={{ width:140 }} value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
              <option value="">All Priority</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <select id="admin-filter-risk" className="form-control" style={{ width:130 }} value={filterRisk} onChange={e => setFilterRisk(e.target.value)}>
              <option value="">All Risk</option>
              <option value="High">High Risk</option>
              <option value="Medium">Medium Risk</option>
              <option value="Low">Low Risk</option>
            </select>
          </div>

          <div style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:12 }}>
            Showing <strong style={{ color:'var(--text-primary)' }}>{filtered.length}</strong> of {claims.length} claims
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Claim ID</th><th>Customer</th><th>Policy</th><th>Type</th>
                  <th>Amount</th><th>Incident Date</th><th>Priority</th>
                  <th>Risk Score</th><th>Risk Level</th><th>Duplicate</th><th>Status</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.claimId}>
                    <td><code style={{ color:'var(--primary-light)', fontWeight:600 }}>{c.claimId}</code></td>
                    <td style={{ fontWeight:600 }}>{c.customerName}</td>
                    <td style={{ color:'var(--text-secondary)' }}>{c.policyNumber}</td>
                    <td>{c.claimType}</td>
                    <td style={{ fontWeight:600 }}>₹{c.claimAmount.toLocaleString('en-IN')}</td>
                    <td style={{ color:'var(--text-secondary)' }}>{c.incidentDate}</td>
                    <td><PriorityBadge priority={c.priority} /></td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <div style={{ width:50, height:6, borderRadius:3, background:'var(--bg-surface)', overflow:'hidden' }}>
                          <div style={{ width:`${c.riskScore}%`, height:'100%', borderRadius:3, background: c.riskScore >= 60 ? '#ef4444' : c.riskScore >= 35 ? '#f59e0b' : '#10b981' }} />
                        </div>
                        <span style={{ fontWeight:700, fontSize:13 }}>{c.riskScore}</span>
                      </div>
                    </td>
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
