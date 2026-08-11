import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, FileText, AlertTriangle, Eye } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AdminSidebar } from '../../components/Sidebar';
import ClaimStatus, { PriorityBadge, RiskBadge } from '../../components/ClaimStatus';
import { apiService } from '../../services/api';

export default function ClaimDetails() {
  const { id } = useParams();
  const { claims, updateClaim } = useApp();
  const navigate = useNavigate();
  const claim = claims.find(c => c.claimId === id);
  const [actionLoading, setActionLoading] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  if (!claim) return (
    <div className="dashboard-layout">
      <AdminSidebar />
      <main className="main-content">
        <div className="text-center" style={{ padding:60 }}>
          <AlertTriangle size={48} color="var(--warning)" style={{ marginBottom:16 }} />
          <h2>Claim Not Found</h2>
          <button className="btn btn-primary mt-4" onClick={() => navigate('/admin/claims')}>Back to Claims</button>
        </div>
      </main>
    </div>
  );

  const takeAction = async (action: 'Approve' | 'Reject' | 'Request') => {
    setActionLoading(action);
    await apiService.updateClaimStatus(claim.claimId, action);
    if (action === 'Approve') updateClaim(claim.claimId, { claimStatus: 'Approved' });
    else if (action === 'Reject') updateClaim(claim.claimId, { claimStatus: 'Rejected' });
    setActionLoading('');
    setActionMsg(action === 'Approve' ? 'Claim approved successfully.' : action === 'Reject' ? 'Claim rejected.' : 'Document request sent to customer.');
  };

  const SectionTitle = ({ t }: { t: string }) => (
    <div style={{ fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--primary-light)', marginBottom:16, paddingBottom:10, borderBottom:'1px solid var(--border-light)' }}>
      {t}
    </div>
  );

  return (
    <div className="dashboard-layout">
      <AdminSidebar />
      <main className="main-content">
        <div className="breadcrumb mb-2">
          <button style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:4, fontFamily:'Inter,sans-serif', fontSize:13 }} onClick={() => navigate('/admin/claims')}>
            <ArrowLeft size={14} /> All Claims
          </button>
          <span className="breadcrumb-sep">/</span>
          <span>{claim.claimId}</span>
        </div>

        <div className="page-header">
          <div className="flex-between" style={{ flexWrap:'wrap', gap:12 }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
                <h1 className="page-title" style={{ margin:0 }}>{claim.claimId}</h1>
                <ClaimStatus status={claim.claimStatus} />
              </div>
              <p className="page-subtitle">{claim.policyType} · {claim.claimType} · Submitted {claim.submittedDate}</p>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <PriorityBadge priority={claim.priority} />
              <RiskBadge level={claim.riskLevel} />
              <span className={`badge ${claim.duplicateClaim === 'Yes' ? 'badge-danger' : 'badge-success'}`}>
                {claim.duplicateClaim === 'Yes' ? '⚠ Duplicate' : '✓ No Duplicate'}
              </span>
            </div>
          </div>
        </div>

        {actionMsg && <div className="alert alert-success mb-6">{actionMsg}</div>}

        <div style={{ display:'grid', gridTemplateColumns:'1fr 380px', gap:24 }}>
          {/* Left column */}
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <div className="card">
              <SectionTitle t="Customer Information" />
              <div className="info-grid">
                <div><div className="info-key">Customer Name</div><div className="info-val">{claim.customerName}</div></div>
                <div><div className="info-key">Customer ID</div><div className="info-val">{claim.customerId}</div></div>
                <div><div className="info-key">Email</div><div className="info-val">{claim.email}</div></div>
                <div><div className="info-key">Mobile</div><div className="info-val">{claim.mobile}</div></div>
              </div>
            </div>

            <div className="card">
              <SectionTitle t="Policy Information" />
              <div className="info-grid">
                <div><div className="info-key">Policy Number</div><div className="info-val">{claim.policyNumber}</div></div>
                <div><div className="info-key">Policy Type</div><div className="info-val">{claim.policyType}</div></div>
                <div><div className="info-key">Start Date</div><div className="info-val">{claim.policyStartDate}</div></div>
                <div><div className="info-key">End Date</div><div className="info-val">{claim.policyEndDate}</div></div>
              </div>
            </div>

            <div className="card">
              <SectionTitle t="Claim Information" />
              <div className="info-grid">
                <div><div className="info-key">Claim ID</div><div className="info-val">{claim.claimId}</div></div>
                <div><div className="info-key">Claim Type</div><div className="info-val">{claim.claimType}</div></div>
                <div><div className="info-key">Incident Date</div><div className="info-val">{claim.incidentDate}</div></div>
                <div><div className="info-key">Incident Time</div><div className="info-val">{claim.incidentTime}</div></div>
                <div><div className="info-key">Location</div><div className="info-val">{claim.incidentLocation}</div></div>
                <div><div className="info-key">Claim Amount</div><div className="info-val" style={{ color:'var(--primary-light)', fontSize:16, fontWeight:800 }}>₹{claim.claimAmount.toLocaleString('en-IN')}</div></div>
                <div><div className="info-key">Damage Severity</div><div className="info-val">{claim.damageSeverity}</div></div>
                <div><div className="info-key">Injury Involved</div><div className="info-val">{claim.injuryInvolved ? 'Yes' : 'No'}</div></div>
                <div><div className="info-key">Police Report</div><div className="info-val">{claim.policeReportAvailable ? 'Yes' : 'No'}</div></div>
                <div><div className="info-key">Submitted Date</div><div className="info-val">{claim.submittedDate}</div></div>
              </div>
              <div className="divider" />
              <div className="info-key">Incident Description</div>
              <p style={{ color:'var(--text-secondary)', fontSize:14, lineHeight:1.7, marginTop:6 }}>{claim.incidentDescription}</p>
            </div>

            {/* Documents */}
            <div className="card">
              <SectionTitle t="Documents" />
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {(claim.documents || ['Policy Document', 'Driving License', 'Vehicle Registration']).map(doc => (
                  <div key={doc} className="upload-area uploaded" style={{ cursor:'default' }}>
                    <div>
                      <div className="upload-label">{doc}</div>
                      <div className="upload-sub">Uploaded · Verified by system</div>
                    </div>
                    <button className="btn btn-outline btn-sm" id={`view-doc-${doc.replace(/\s/g,'')}`}>
                      <Eye size={13} /> View
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            {/* Guidewire result */}
            <div className="card" style={{ background:'linear-gradient(135deg,rgba(99,102,241,0.08),rgba(34,211,238,0.04))', borderColor:'rgba(99,102,241,0.25)' }}>
              <SectionTitle t="🤖 Guidewire Processing Result" />
              <div className="result-box" style={{ background:'transparent', border:'none', padding:0 }}>
                <div className="result-row"><span className="result-label">Priority</span><PriorityBadge priority={claim.priority} /></div>
                <div className="result-row">
                  <span className="result-label">Risk Score</span>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontWeight:800, fontSize:22, color: claim.riskScore >= 60 ? '#ef4444' : claim.riskScore >= 35 ? '#f59e0b' : '#10b981' }}>
                      {claim.riskScore}
                    </div>
                    <div style={{ fontSize:10, color:'var(--text-muted)' }}>out of 100</div>
                  </div>
                </div>
                <div className="result-row"><span className="result-label">Risk Level</span><RiskBadge level={claim.riskLevel} /></div>
                <div className="result-row">
                  <span className="result-label">Duplicate</span>
                  <span className={`badge ${claim.duplicateClaim === 'Yes' ? 'badge-danger' : 'badge-success'}`}>{claim.duplicateClaim}</span>
                </div>
                <div className="result-row">
                  <span className="result-label">Document Check</span>
                  <span className={`badge ${claim.documentStatus === 'Verified' ? 'badge-success' : 'badge-warning'}`}>{claim.documentStatus}</span>
                </div>
              </div>
            </div>

            {/* Admin Actions */}
            <div className="card">
              <SectionTitle t="Admin Actions" />
              <p className="text-muted text-sm mb-4">Current status: <strong style={{ color:'var(--text-primary)' }}>{claim.claimStatus}</strong></p>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <button className="btn btn-success w-full" id="btn-approve" disabled={claim.claimStatus === 'Approved' || !!actionLoading} onClick={() => takeAction('Approve')}>
                  {actionLoading === 'Approve' ? <><div className="spinner" />Processing...</> : <><CheckCircle size={16} /> Approve Claim</>}
                </button>
                <button className="btn btn-danger w-full" id="btn-reject" disabled={claim.claimStatus === 'Rejected' || !!actionLoading} onClick={() => takeAction('Reject')}>
                  {actionLoading === 'Reject' ? <><div className="spinner" />Processing...</> : <><XCircle size={16} /> Reject Claim</>}
                </button>
                <button className="btn btn-warning w-full" id="btn-request-docs" disabled={!!actionLoading} onClick={() => takeAction('Request')}>
                  {actionLoading === 'Request' ? <><div className="spinner" />Sending...</> : <><FileText size={16} /> Request Documents</>}
                </button>
              </div>
            </div>

            {/* Risk gauge */}
            <div className="card">
              <SectionTitle t="Risk Assessment" />
              <div className="text-center" style={{ padding:'16px 0' }}>
                <div style={{ fontSize:52, fontWeight:800, fontFamily:'Space Grotesk,sans-serif', color: claim.riskScore >= 60 ? '#ef4444' : claim.riskScore >= 35 ? '#f59e0b' : '#10b981' }}>
                  {claim.riskScore}
                </div>
                <div style={{ fontSize:14, color:'var(--text-secondary)', marginBottom:12 }}>Risk Score / 100</div>
                <div style={{ height:12, borderRadius:6, background:'var(--bg-surface)', overflow:'hidden', margin:'0 auto', maxWidth:200 }}>
                  <div style={{ width:`${claim.riskScore}%`, height:'100%', borderRadius:6, background: claim.riskScore >= 60 ? 'linear-gradient(90deg,#f59e0b,#ef4444)' : claim.riskScore >= 35 ? '#f59e0b' : '#10b981', transition:'width 1s ease' }} />
                </div>
                <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:8 }}>Calculated by Gosu Rules Engine</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
