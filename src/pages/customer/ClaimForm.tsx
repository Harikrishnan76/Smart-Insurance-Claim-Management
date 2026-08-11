import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, CheckCircle, AlertCircle, ChevronRight, ChevronLeft, Car, FileText, Camera } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CustomerSidebar } from '../../components/Sidebar';
import { apiService } from '../../services/api';
import { Claim } from '../../context/AppContext';

const STEPS = ['Customer Info', 'Policy Details', 'Claim Details', 'Documents', 'Result'];

const CLAIM_TYPES = ['Accident', 'Theft', 'Fire', 'Natural Disaster', 'Other'];
const SEVERITY_OPTS = ['Minor', 'Moderate', 'Major'];

function StepBar({ current }: { current: number }) {
  return (
    <div style={{ display:'flex', gap:0, marginBottom:36 }}>
      {STEPS.map((s, i) => {
        const done = i < current, active = i === current;
        return (
          <div key={s} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center' }}>
            <div style={{ display:'flex', alignItems:'center', width:'100%' }}>
              {i > 0 && <div style={{ flex:1, height:2, background: done ? '#10b981' : 'var(--border-light)' }} />}
              <div style={{ width:32, height:32, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, flexShrink:0,
                background: done ? 'rgba(16,185,129,0.15)' : active ? 'rgba(99,102,241,0.15)' : 'var(--bg-card2)',
                border: `2px solid ${done ? '#10b981' : active ? '#6366f1' : 'var(--border-light)'}`,
                color: done ? '#10b981' : active ? '#818cf8' : 'var(--text-muted)',
              }}>
                {done ? <CheckCircle size={16} /> : i + 1}
              </div>
              {i < STEPS.length - 1 && <div style={{ flex:1, height:2, background: done ? '#10b981' : 'var(--border-light)' }} />}
            </div>
            <div style={{ fontSize:10, fontWeight:600, marginTop:6, color: done ? '#10b981' : active ? 'var(--primary-light)' : 'var(--text-muted)', textAlign:'center' }}>
              {s}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ClaimForm() {
  const { user, addClaim } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Claim | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, boolean>>({});

  const [form, setForm] = useState({
    policyNumber: 'POL10025',
    policyType: 'Vehicle Insurance',
    policyStartDate: '2026-01-01',
    policyEndDate: '2027-01-01',
    claimType: '',
    incidentDate: '',
    incidentTime: '',
    incidentLocation: '',
    incidentDescription: '',
    claimAmount: '',
    damageSeverity: '',
    injuryInvolved: '',
    policeReportAvailable: '',
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const needsPoliceReport = ['Accident', 'Theft'].includes(form.claimType);
  const needsMedical = form.injuryInvolved === 'yes';

  const docs = [
    { key: 'policy', label: 'Policy Document', required: true },
    { key: 'license', label: 'Driving License', required: true },
    { key: 'registration', label: 'Vehicle Registration', required: true },
    { key: 'photos', label: 'Accident Photos', required: true },
    { key: 'police', label: 'Police Report', required: needsPoliceReport, conditional: 'Required for Accident/Theft claims' },
    { key: 'medical', label: 'Medical Report', required: needsMedical, conditional: 'Required if injury involved' },
  ];

  const validateStep = () => {
    setError('');
    if (step === 2) {
      if (!form.claimType || !form.incidentDate || !form.incidentTime || !form.incidentLocation || !form.incidentDescription || !form.claimAmount || !form.damageSeverity || !form.injuryInvolved || !form.policeReportAvailable)
        return setError('Please fill all required fields.'), false;
    }
    return true;
  };

  const next = () => { if (validateStep()) setStep(s => Math.min(s + 1, 4)); };
  const prev = () => setStep(s => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    setLoading(true);
    const claimData = {
      customerId: user?.id || '', customerName: user?.name || '', email: user?.email || '', mobile: user?.mobile || '',
      ...form,
      claimAmount: parseFloat(form.claimAmount),
      injuryInvolved: form.injuryInvolved === 'yes',
      policeReportAvailable: form.policeReportAvailable === 'yes',
      documents: docs.filter(d => uploadedDocs[d.key]).map(d => d.label),
    };
    const claim = await apiService.submitClaim(claimData);
    addClaim(claim);
    setResult(claim);
    setLoading(false);
    setStep(4);
  };

  return (
    <div className="dashboard-layout">
      <CustomerSidebar />
      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">Submit New Claim</h1>
          <p className="page-subtitle">Complete all sections to submit your insurance claim.</p>
        </div>

        <div className="card" style={{ maxWidth:760, margin:'0 auto' }}>
          <StepBar current={step} />

          {error && <div className="alert alert-error mb-4">{error}</div>}

          {/* Step 0: Customer Info */}
          {step === 0 && (
            <div className="fade-in">
              <h3 style={{ fontSize:18, fontWeight:700, marginBottom:20 }}>Section A — Customer Information</h3>
              <div className="alert alert-info mb-6">Your details are auto-filled from your profile. No changes needed.</div>
              <div className="grid-2">
                <div className="form-group"><label className="form-label">Customer ID</label><input className="form-control" value={user?.id || ''} disabled /></div>
                <div className="form-group"><label className="form-label">Full Name</label><input className="form-control" value={user?.name || ''} disabled /></div>
                <div className="form-group"><label className="form-label">Email</label><input className="form-control" value={user?.email || ''} disabled /></div>
                <div className="form-group"><label className="form-label">Mobile</label><input className="form-control" value={user?.mobile || ''} disabled /></div>
              </div>
            </div>
          )}

          {/* Step 1: Policy Info */}
          {step === 1 && (
            <div className="fade-in">
              <h3 style={{ fontSize:18, fontWeight:700, marginBottom:20 }}>Section B — Policy Information</h3>
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                <div className="form-group">
                  <label className="form-label">Policy Number *</label>
                  <input id="policy-number" className="form-control" value={form.policyNumber} onChange={set('policyNumber')} placeholder="e.g. POL10025" />
                </div>
                <div className="form-group">
                  <label className="form-label">Policy Type</label>
                  <select id="policy-type" className="form-control" value={form.policyType} onChange={set('policyType')}>
                    <option value="Vehicle Insurance">Vehicle Insurance</option>
                    <option value="Health Insurance">Health Insurance</option>
                    <option value="Home Insurance">Home Insurance</option>
                  </select>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Policy Start Date</label>
                    <input className="form-control" type="date" value={form.policyStartDate} disabled />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Policy End Date</label>
                    <input className="form-control" type="date" value={form.policyEndDate} disabled />
                  </div>
                </div>
                <div className="alert alert-info">
                  <Car size={16} style={{ display:'inline', marginRight:6 }} />
                  Policy dates are fetched automatically from Guidewire ClaimCenter.
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Claim Details */}
          {step === 2 && (
            <div className="fade-in">
              <h3 style={{ fontSize:18, fontWeight:700, marginBottom:20 }}>Section C — Claim Details</h3>
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Claim Type *</label>
                    <select id="claim-type" className="form-control" value={form.claimType} onChange={set('claimType')}>
                      <option value="">Select Type</option>
                      {CLAIM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Damage Severity *</label>
                    <select id="damage-severity" className="form-control" value={form.damageSeverity} onChange={set('damageSeverity')}>
                      <option value="">Select Severity</option>
                      {SEVERITY_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Incident Date *</label>
                    <input id="incident-date" type="date" className="form-control" value={form.incidentDate} onChange={set('incidentDate')} max={new Date().toISOString().split('T')[0]} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Incident Time *</label>
                    <input id="incident-time" type="time" className="form-control" value={form.incidentTime} onChange={set('incidentTime')} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Incident Location *</label>
                  <input id="incident-location" className="form-control" placeholder="e.g. NH-44, Chennai Highway" value={form.incidentLocation} onChange={set('incidentLocation')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Incident Description *</label>
                  <textarea id="incident-desc" className="form-control" placeholder="Describe the incident in detail..." value={form.incidentDescription} onChange={set('incidentDescription')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Estimated Claim Amount (₹) *</label>
                  <input id="claim-amount" type="number" className="form-control" placeholder="e.g. 85000" value={form.claimAmount} onChange={set('claimAmount')} min={0} />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Injury Involved? *</label>
                    <select id="injury-involved" className="form-control" value={form.injuryInvolved} onChange={set('injuryInvolved')}>
                      <option value="">Select</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Police Report Available? *</label>
                    <select id="police-report" className="form-control" value={form.policeReportAvailable} onChange={set('policeReportAvailable')}>
                      <option value="">Select</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Documents */}
          {step === 3 && (
            <div className="fade-in">
              <h3 style={{ fontSize:18, fontWeight:700, marginBottom:8 }}>Section D — Document Upload</h3>
              <p className="text-muted text-sm mb-6">Upload supporting documents. Required fields are marked with *</p>
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {docs.map(d => (
                  <div key={d.key} className={`upload-area ${uploadedDocs[d.key] ? 'uploaded' : ''}`}
                    onClick={() => setUploadedDocs(u => ({ ...u, [d.key]: !u[d.key] }))}>
                    <div>
                      <div className="upload-label">{d.label} {d.required ? '*' : ''}</div>
                      {d.conditional && <div className="upload-sub">{d.conditional}</div>}
                      {uploadedDocs[d.key] && <div style={{ fontSize:11, color:'#10b981', marginTop:2, fontWeight:600 }}>✓ File selected</div>}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      {uploadedDocs[d.key]
                        ? <span className="badge badge-success"><CheckCircle size={12} /> Uploaded</span>
                        : <span className="btn btn-secondary btn-sm"><Upload size={14} /> Choose File</span>}
                    </div>
                  </div>
                ))}
              </div>
              <div className="alert alert-info mt-4">
                <AlertCircle size={14} style={{ display:'inline', marginRight:6 }} />
                Click on a document to toggle upload. In production, this connects to the Guidewire document service.
              </div>
            </div>
          )}

          {/* Step 4: Result */}
          {step === 4 && result && (
            <div className="fade-in">
              <div className="text-center mb-6">
                <div style={{ width:72, height:72, borderRadius:'50%', background:'rgba(99,102,241,0.15)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
                  <CheckCircle size={36} color="#6366f1" />
                </div>
                <h2 style={{ fontSize:24, marginBottom:6 }}>Claim Submission Result</h2>
                <p className="text-muted text-sm">Processed by Guidewire ClaimCenter via Gosu Rules Engine</p>
              </div>

              <div className="result-box mb-6">
                <div className="result-row"><span className="result-label">Claim ID</span><code style={{ color:'var(--primary-light)', fontWeight:700, fontSize:15 }}>{result.claimId}</code></div>
                <div className="result-row"><span className="result-label">Policy Number</span><span className="result-value">{result.policyNumber}</span></div>
                <div className="result-row"><span className="result-label">Status</span><span className={`badge ${result.claimStatus === 'Under Review' ? 'badge-warning' : result.claimStatus === 'Approved' ? 'badge-success' : 'badge-danger'}`}>{result.claimStatus.toUpperCase()}</span></div>
                <div className="result-row"><span className="result-label">Priority</span><span className={`badge ${result.priority === 'High' ? 'badge-danger' : result.priority === 'Medium' ? 'badge-warning' : 'badge-success'}`}>{result.priority.toUpperCase()}</span></div>
                <div className="result-row"><span className="result-label">Risk Score</span><span className="result-value" style={{ fontSize:18, fontWeight:800 }}>{result.riskScore} / 100</span></div>
                <div className="result-row"><span className="result-label">Risk Level</span><span className={`badge ${result.riskLevel === 'High' ? 'badge-danger' : result.riskLevel === 'Medium' ? 'badge-warning' : 'badge-success'}`}>{result.riskLevel.toUpperCase()}</span></div>
                <div className="result-row"><span className="result-label">Duplicate Claim</span><span className={`badge ${result.duplicateClaim === 'Yes' ? 'badge-danger' : 'badge-success'}`}>{result.duplicateClaim.toUpperCase()}</span></div>
                <div className="result-row"><span className="result-label">Document Status</span><span className="badge badge-success">{result.documentStatus.toUpperCase()}</span></div>
              </div>

              <div style={{ display:'flex', gap:12 }}>
                <button className="btn btn-primary w-full" onClick={() => navigate(`/customer/claim-tracking/${result.claimId}`)} id="btn-track-claim">
                  <FileText size={16} /> Track This Claim
                </button>
                <button className="btn btn-secondary w-full" onClick={() => navigate('/customer')} id="btn-back-dash">
                  Back to Dashboard
                </button>
              </div>
            </div>
          )}

          {step < 4 && (
            <div className="flex-between mt-8">
              <button className="btn btn-secondary" onClick={prev} disabled={step === 0} id="btn-prev">
                <ChevronLeft size={16} /> Previous
              </button>
              {step < 3 && (
                <button className="btn btn-primary" onClick={next} id="btn-next">
                  Next <ChevronRight size={16} />
                </button>
              )}
              {step === 3 && (
                <button className="btn btn-success" onClick={handleSubmit} disabled={loading} id="btn-submit-claim">
                  {loading ? <><div className="spinner" />Submitting...</> : <><CheckCircle size={16} /> Submit Claim</>}
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
