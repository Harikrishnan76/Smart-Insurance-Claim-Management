import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Search, SlidersHorizontal } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CustomerSidebar } from '../../components/Sidebar';
import ClaimStatus, { PriorityBadge, RiskBadge } from '../../components/ClaimStatus';

export default function MyClaims() {
  const { user, claims } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const myClaims = claims.filter(c => c.customerId === user?.id || c.customerName === user?.name);
  const filtered = myClaims.filter(c => {
    const matchSearch = !search || c.claimId.toLowerCase().includes(search.toLowerCase()) || c.claimType.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || c.claimStatus === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="dashboard-layout">
      <CustomerSidebar />
      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">My Claims</h1>
          <p className="page-subtitle">Track and manage all your submitted insurance claims.</p>
        </div>

        <div className="card">
          <div className="flex-between mb-6 gap-3" style={{ flexWrap:'wrap' }}>
            <div className="relative" style={{ flex:1, minWidth:200 }}>
              <Search size={16} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
              <input id="claims-search" className="form-control" placeholder="Search claims..." style={{ paddingLeft:40 }} value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select id="filter-status" className="form-control" style={{ width:'auto' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">All Status</option>
              <option value="Under Review">Under Review</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center" style={{ padding:40 }}>
              <FileText size={48} color="var(--text-muted)" style={{ marginBottom:16 }} />
              <p style={{ fontWeight:600, fontSize:16 }}>No claims found</p>
              <p className="text-muted text-sm">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Claim ID</th><th>Policy</th><th>Type</th><th>Amount</th>
                    <th>Date</th><th>Priority</th><th>Risk</th><th>Status</th><th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <tr key={c.claimId}>
                      <td><code style={{ color:'var(--primary-light)', fontWeight:600 }}>{c.claimId}</code></td>
                      <td>{c.policyNumber}</td>
                      <td>{c.claimType}</td>
                      <td style={{ fontWeight:600 }}>₹{c.claimAmount.toLocaleString('en-IN')}</td>
                      <td style={{ color:'var(--text-secondary)' }}>{c.submittedDate}</td>
                      <td><PriorityBadge priority={c.priority} /></td>
                      <td><RiskBadge level={c.riskLevel} /></td>
                      <td><ClaimStatus status={c.claimStatus} /></td>
                      <td>
                        <button className="btn btn-outline btn-sm" id={`track-btn-${c.claimId}`}
                          onClick={() => navigate(`/customer/claim-tracking/${c.claimId}`)}>
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
      </main>
    </div>
  );
}
