import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, CheckCircle, AlertCircle, ChevronRight, ChevronLeft, Car, FileText, X, File, Image, FileBadge, ScanLine } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CustomerSidebar } from '../../components/Sidebar';
import { apiService } from '../../services/api';
import { Claim } from '../../context/AppContext';
import { OCRPanel, OCRResult } from '../../components/OCRPanel';

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

  type UploadedFile = { file: File; preview?: string };
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, UploadedFile>>({});
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // OCR state
  const [ocrResults, setOcrResults] = useState<Record<string, OCRResult>>({});
  const [ocrLoading, setOcrLoading] = useState<Record<string, boolean>>({});

  const handleOCRAnalyze = useCallback(async (key: string) => {
    const doc = uploadedDocs[key];
    if (!doc) return;
    setOcrLoading(s => ({ ...s, [key]: true }));
    try {
      const result = await apiService.analyzeDocument(doc.file, key);

      if (result.verification_status === 'unreadable') {
        // ── REJECT: auto-remove the file and show an error ──────────────
        setOcrResults(r => { const n = { ...r }; delete n[key]; return n; });
        setUploadedDocs(u => {
          const n = { ...u };
          if (n[key]?.preview) URL.revokeObjectURL(n[key].preview!);
          delete n[key];
          return n;
        });
        if (inputRefs.current[key]) inputRefs.current[key]!.value = '';
        setUploadErrors(e => ({
          ...e,
          [key]: '⛔ Document rejected by OCR — unreadable or invalid. Please upload a clear, valid document.',
        }));
      } else {
        // ── ACCEPT (verified or partial) ────────────────────────────────
        setOcrResults(r => ({ ...r, [key]: result }));
        if (result.verification_status === 'partial') {
          setUploadErrors(e => ({
            ...e,
            [key]: '⚠ OCR partially verified this document. Please ensure it is correct before submitting.',
          }));
        } else {
          // Clear any previous error on full verification
          setUploadErrors(e => { const n = { ...e }; delete n[key]; return n; });
        }
      }
    } catch {
      setOcrResults(r => ({ ...r, [key]: {
        success: false, doc_type: key, raw_text: '',
        extracted_fields: {}, verification_status: 'unreadable',
        verification_notes: ['OCR analysis failed — please try again'],
      }}));
      setUploadErrors(e => ({
        ...e,
        [key]: '⛔ OCR scan failed. Please try again or upload a clearer document.',
      }));
    } finally {
      setOcrLoading(s => ({ ...s, [key]: false }));
    }
  }, [uploadedDocs]);

  const handleOCRAutoFill = useCallback((fields: Record<string, string>) => {
    const mapping: Record<string, string> = {
      policy_number: 'policyNumber',
      incident_date: 'incidentDate',
      incident_location: 'incidentLocation',
    };
    const updates: Record<string, string> = {};
    Object.entries(fields).forEach(([k, v]) => {
      if (mapping[k]) updates[mapping[k]] = v;
    });
    if (Object.keys(updates).length > 0) {
      setForm(f => ({ ...f, ...updates }));
    }
  }, []);

  const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
  const MAX_SIZE_MB = 10;

  const handleFileSelect = useCallback((key: string, file: File | undefined) => {
    if (!file) return;
    const newErrors = { ...uploadErrors };
    if (!ALLOWED_TYPES.includes(file.type)) {
      newErrors[key] = 'Invalid format. Use PDF, PNG, or JPG.';
      setUploadErrors(newErrors);
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      newErrors[key] = `File too large. Max ${MAX_SIZE_MB}MB.`;
      setUploadErrors(newErrors);
      return;
    }
    delete newErrors[key];
    setUploadErrors(newErrors);
    // Clear previous OCR result when a new file is selected
    setOcrResults(r => { const n = { ...r }; delete n[key]; return n; });
    const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
    setUploadedDocs(u => ({ ...u, [key]: { file, preview } }));
  }, [uploadErrors]);

  const removeFile = useCallback((key: string) => {
    setUploadedDocs(u => { const n = { ...u }; if (n[key]?.preview) URL.revokeObjectURL(n[key].preview!); delete n[key]; return n; });
    setUploadErrors(e => { const n = { ...e }; delete n[key]; return n; });
    setOcrResults(r => { const n = { ...r }; delete n[key]; return n; }); // clear OCR on removal
    if (inputRefs.current[key]) inputRefs.current[key]!.value = '';
  }, []);

  const formatSize = (bytes: number) => bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  const FileIcon = ({ type }: { type: string }) => {
    if (type === 'application/pdf') return <FileBadge size={20} style={{ color: '#ef4444' }} />;
    if (type.startsWith('image/')) return <Image size={20} style={{ color: '#22d3ee' }} />;
    return <File size={20} style={{ color: 'var(--primary-light)' }} />;
  };

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
    // Block submission if any uploaded doc has a failed OCR scan
    const failedScans = docs.filter(d =>
      uploadedDocs[d.key] &&
      ocrResults[d.key] &&
      ocrResults[d.key].verification_status === 'unreadable'
    );
    if (failedScans.length > 0) {
      setError(`OCR verification failed for: ${failedScans.map(d => d.label).join(', ')}. Please remove and re-upload valid documents.`);
      return;
    }
    // Warn if required docs haven't been scanned yet
    const unscannedRequired = docs.filter(d =>
      d.required && uploadedDocs[d.key] && !ocrResults[d.key]
    );
    if (unscannedRequired.length > 0) {
      setError(`Please run OCR scan on: ${unscannedRequired.map(d => d.label).join(', ')} before submitting.`);
      return;
    }
    setLoading(true);
    const claimData = {
      customerId: user?.id || '', customerName: user?.name || '', email: user?.email || '', mobile: user?.mobile || '',
      ...form,
      claimAmount: parseFloat(form.claimAmount),
      injuryInvolved: form.injuryInvolved === 'yes',
      policeReportAvailable: form.policeReportAvailable === 'yes',
      documents: docs.filter(d => uploadedDocs[d.key]).map(d =>
        `${d.label} (${uploadedDocs[d.key].file.name}) [OCR: ${ocrResults[d.key]?.verification_status ?? 'not scanned'}]`
      ),
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
              <h3 style={{ fontSize:18, fontWeight:700, marginBottom:4 }}>Section D — Document Upload</h3>
              <p className="text-muted text-sm mb-6">Drag & drop or click to upload. Accepted: PDF, PNG, JPG — Max 10 MB each.</p>

              {/* Progress bar */}
              <div style={{ marginBottom:20 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--text-secondary)', marginBottom:6 }}>
                  <span>Upload Progress</span>
                  <span style={{ fontWeight:700, color:'var(--primary-light)' }}>
                    {docs.filter(d => uploadedDocs[d.key]).length} / {docs.filter(d => d.required).length} required
                  </span>
                </div>
                <div style={{ height:6, background:'var(--bg-surface)', borderRadius:99, overflow:'hidden' }}>
                  <div style={{
                    height:'100%', borderRadius:99,
                    width: `${(docs.filter(d => d.required && uploadedDocs[d.key]).length / docs.filter(d => d.required).length) * 100}%`,
                    background:'linear-gradient(90deg, var(--primary), var(--accent))',
                    transition:'width 0.5s cubic-bezier(0.4,0,0.2,1)'
                  }} />
                </div>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                {docs.map(d => {
                  const uploaded = uploadedDocs[d.key];
                  const isDragging = dragOver === d.key;
                  const err = uploadErrors[d.key];
                  return (
                    <div key={d.key}>
                      <input
                        ref={el => { inputRefs.current[d.key] = el; }}
                        id={`file-input-${d.key}`}
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        style={{ display:'none' }}
                        onChange={e => handleFileSelect(d.key, e.target.files?.[0])}
                      />

                      {!uploaded ? (
                        <div
                          onDragOver={e => { e.preventDefault(); setDragOver(d.key); }}
                          onDragLeave={() => setDragOver(null)}
                          onDrop={e => { e.preventDefault(); setDragOver(null); handleFileSelect(d.key, e.dataTransfer.files?.[0]); }}
                          onClick={() => inputRefs.current[d.key]?.click()}
                          style={{
                            border: `2px dashed ${isDragging ? 'var(--primary)' : err ? 'var(--danger)' : 'var(--border-light)'}`,
                            borderRadius:12, padding:'18px 20px',
                            background: isDragging ? 'rgba(99,102,241,0.08)' : err ? 'rgba(239,68,68,0.06)' : 'var(--bg-surface)',
                            cursor:'pointer', transition:'all 0.2s',
                            display:'flex', alignItems:'center', justifyContent:'space-between', gap:16,
                          }}
                        >
                          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                            <div style={{ width:42, height:42, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center',
                              background: isDragging ? 'rgba(99,102,241,0.2)' : 'var(--bg-card2)',
                              border:'1px solid var(--border-light)', flexShrink:0 }}>
                              <Upload size={18} style={{ color: isDragging ? 'var(--primary-light)' : 'var(--text-muted)' }} />
                            </div>
                            <div>
                              <div style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)' }}>
                                {d.label} {d.required ? <span style={{ color:'var(--danger)' }}>*</span> : <span style={{ fontSize:11, color:'var(--text-muted)', fontWeight:400 }}>(optional)</span>}
                              </div>
                              {d.conditional && <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>{d.conditional}</div>}
                              {err && <div style={{ fontSize:11, color:'var(--danger)', marginTop:3, fontWeight:600 }}>⚠ {err}</div>}
                            </div>
                          </div>
                          <span style={{ fontSize:12, color: isDragging ? 'var(--primary-light)' : 'var(--text-muted)', whiteSpace:'nowrap',
                            fontWeight:500, padding:'6px 14px', border:'1px solid var(--border)', borderRadius:8, background:'var(--bg-card2)' }}>
                            {isDragging ? '📂 Drop here' : 'Choose / Drop'}
                          </span>
                        </div>
                      ) : (
                        <>
                        <div style={{
                          border:'1px solid rgba(16,185,129,0.4)', borderRadius:12, padding:'14px 20px',
                          background:'rgba(16,185,129,0.07)', display:'flex', alignItems:'center',
                          justifyContent:'space-between', gap:12, animation:'fadeIn 0.3s ease',
                        }}>
                          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                            {uploaded.preview ? (
                              <img src={uploaded.preview} alt="preview"
                                style={{ width:42, height:42, borderRadius:8, objectFit:'cover', border:'1px solid rgba(16,185,129,0.3)' }} />
                            ) : (
                              <div style={{ width:42, height:42, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center',
                                background:'rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.3)', flexShrink:0 }}>
                                <FileIcon type={uploaded.file.type} />
                              </div>
                            )}
                            <div>
                              <div style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)', maxWidth:240, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                {uploaded.file.name}
                              </div>
                              <div style={{ display:'flex', gap:8, marginTop:3, alignItems:'center' }}>
                                <span style={{ fontSize:11, color:'#10b981', fontWeight:600 }}>✓ {d.label}</span>
                                <span style={{ fontSize:10, color:'var(--text-muted)' }}>•</span>
                                <span style={{ fontSize:11, color:'var(--text-muted)' }}>{formatSize(uploaded.file.size)}</span>
                                <span style={{ fontSize:10, color:'var(--text-muted)' }}>•</span>
                                <span style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase' }}>{uploaded.file.name.split('.').pop()}</span>
                              </div>
                            </div>
                          </div>
                          <div style={{ display:'flex', gap:8, alignItems:'center', flexShrink:0 }}>
                            <button
                              onClick={() => handleOCRAnalyze(d.key)}
                              disabled={ocrLoading[d.key]}
                              title="Analyze document with OCR"
                              style={{
                                display:'flex', alignItems:'center', gap:5,
                                fontSize:11, fontWeight:700,
                                padding:'5px 10px', borderRadius:7,
                                background: ocrResults[d.key] ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.15)',
                                border: ocrResults[d.key] ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(99,102,241,0.4)',
                                color: ocrResults[d.key] ? '#10b981' : '#818cf8',
                                cursor: ocrLoading[d.key] ? 'wait' : 'pointer',
                                transition:'all 0.2s', whiteSpace:'nowrap',
                              }}
                            >
                              {ocrLoading[d.key]
                                ? <><div className="spinner" style={{ width:12, height:12, borderWidth:2 }} /> Scanning…</>
                                : <><ScanLine size={12} /> {ocrResults[d.key] ? 'Re-scan' : 'Scan OCR'}</>
                              }
                            </button>
                            <button
                              onClick={() => removeFile(d.key)}
                              title="Remove file"
                              style={{ background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8,
                                width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center',
                                cursor:'pointer', transition:'all 0.2s', flexShrink:0 }}
                              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.25)')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.12)')}
                            >
                              <X size={14} color="#ef4444" />
                            </button>
                          </div>
                        </div>
                        {/* OCR Result Panel */}
                        {ocrResults[d.key] && (
                          <OCRPanel
                            result={ocrResults[d.key]}
                            onAutoFill={handleOCRAutoFill}
                          />
                        )}
                      </>
                    )}
                    </div>
                  );
                })}
              </div>

              <div className="alert alert-info mt-4" style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                <AlertCircle size={16} style={{ flexShrink:0, marginTop:1 }} />
                <span>In production, uploaded files are securely transmitted to the <strong>Guidewire Document Management Service</strong>. Supported formats: PDF, PNG, JPG.</span>
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
