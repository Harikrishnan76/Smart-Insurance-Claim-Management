import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CustomerSidebar } from '../../components/Sidebar';
import ClaimStatus, { PriorityBadge, RiskBadge } from '../../components/ClaimStatus';
import ClaimTimeline from '../../components/ClaimTimeline';

export default function ClaimTracking() {
  const { id } = useParams();
  const { claims } = useApp();
  const navigate = useNavigate();
  const claim = claims.find(c => c.claimId === id);

  if (!claim) return (
    <div className="dashboard-layout">
      <CustomerSidebar />
      <main className="main-content">
        <div className="text-center" style={{ padding:60 }}>
          <AlertTriangle size={48} color="var(--warning)" style={{ marginBottom:16 }} />
          <h2>Claim Not Found</h2>
          <p className="text-muted mb-4">No claim found with ID: {id}</p>
          <button className="btn btn-primary" onClick={() => navigate('/customer/my-claims')}>Back to Claims</button>
        </div>
      </main>
    </div>
  );

  return (
    <div className="dashboard-layout">
      <CustomerSidebar />
      <main className="main-content">
        <div className="breadcrumb mb-2">
          <button style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:4, fontFamily:'Inter,sans-serif', fontSize:13 }} onClick={() => navigate('/customer/my-claims')}>
            <ArrowLeft size={14} /> My Claims
          </button>
          <span className="breadcrumb-sep">/</span>
          <span>{claim.claimId}</span>
        </div>

        <div className="page-header">
          <div className="flex-between" style={{ flexWrap:'wrap', gap:12 }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:6 }}>
                <h1 className="page-title" style={{ margin:0 }}>{claim.claimId}</h1>
                <ClaimStatus status={claim.claimStatus} />
              </div>
              <p className="page-subtitle">{claim.policyType} — {claim.claimType} Claim</p>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <PriorityBadge priority={claim.priority} />
              <RiskBadge level={claim.riskLevel} />
            </div>
          </div>
        </div>

        <div className="grid-2" style={{ gap:24 }}>
          {/* Timeline */}
          <div className="card">
            <h3 style={{ fontSize:17, fontWeight:700, marginBottom:24 }}>Claim Progress</h3>
            <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', borderRadius:10, background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.2)', marginBottom:24 }}>
              <div style={{ fontSize:13, fontWeight:600 }}>Current Status:</div>
              <ClaimStatus status={claim.claimStatus} />
            </div>
            <ClaimTimeline status={claim.claimStatus} />
          </div>

          {/* Details */}
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <div className="card">
              <h3 style={{ fontSize:16, fontWeight:700, marginBottom:16 }}>Claim Details</h3>
              <div className="info-grid">
                <div><div className="info-key">Claim ID</div><div className="info-val">{claim.claimId}</div></div>
                <div><div className="info-key">Policy Number</div><div className="info-val">{claim.policyNumber}</div></div>
                <div><div className="info-key">Claim Type</div><div className="info-val">{claim.claimType}</div></div>
                <div><div className="info-key">Claim Amount</div><div className="info-val" style={{ color:'var(--primary-light)' }}>₹{claim.claimAmount.toLocaleString('en-IN')}</div></div>
                <div><div className="info-key">Incident Date</div><div className="info-val">{claim.incidentDate}</div></div>
                <div><div className="info-key">Submitted Date</div><div className="info-val">{claim.submittedDate}</div></div>
                <div><div className="info-key">Damage Severity</div><div className="info-val">{claim.damageSeverity}</div></div>
                <div><div className="info-key">Injury Involved</div><div className="info-val">{claim.injuryInvolved ? 'Yes' : 'No'}</div></div>
              </div>
            </div>

            {/* Guidewire Result */}
            <div className="card" style={{ background:'linear-gradient(135deg,rgba(99,102,241,0.07),rgba(34,211,238,0.04))', borderColor:'rgba(99,102,241,0.25)' }}>
              <h3 style={{ fontSize:16, fontWeight:700, marginBottom:16 }}>🤖 Guidewire Processing Result</h3>
              <div className="result-box" style={{ background:'transparent', border:'none', padding:0 }}>
                <div className="result-row"><span className="result-label">Priority</span><PriorityBadge priority={claim.priority} /></div>
                <div className="result-row">
                  <span className="result-label">Risk Score</span>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:80, height:8, borderRadius:4, background:'var(--bg-surface)', overflow:'hidden' }}>
                      <div style={{ width:`${claim.riskScore}%`, height:'100%', borderRadius:4, background: claim.riskScore >= 60 ? '#ef4444' : claim.riskScore >= 35 ? '#f59e0b' : '#10b981' }} />
                    </div>
                    <span style={{ fontWeight:700, fontSize:15 }}>{claim.riskScore}/100</span>
                  </div>
                </div>
                <div className="result-row"><span className="result-label">Risk Level</span><RiskBadge level={claim.riskLevel} /></div>
                <div className="result-row"><span className="result-label">Duplicate</span><span className={`badge ${claim.duplicateClaim === 'Yes' ? 'badge-danger' : 'badge-success'}`}>{claim.duplicateClaim}</span></div>
                <div className="result-row"><span className="result-label">Documents</span><span className={`badge ${claim.documentStatus === 'Verified' ? 'badge-success' : 'badge-warning'}`}>{claim.documentStatus}</span></div>
              </div>
            </div>

            <div className="card">
              <h3 style={{ fontSize:16, fontWeight:700, marginBottom:12 }}>Incident Summary</h3>
              <div style={{ color:'var(--text-secondary)', fontSize:14, lineHeight:1.7 }}>{claim.incidentDescription}</div>
              <div className="divider" />
              <div className="info-key" style={{ marginBottom:4 }}>Location</div>
              <div style={{ fontWeight:600, fontSize:14 }}>{claim.incidentLocation}</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
