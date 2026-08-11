import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, CheckCircle, Zap, BarChart2, FileText, ArrowRight } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();
  const features = [
    { icon:<Shield size={24}/>, title:'Guidewire Integrated', desc:'Direct integration with ClaimCenter for real-time processing', color:'#6366f1' },
    { icon:<Zap size={24}/>, title:'Gosu Risk Engine', desc:'AI-powered risk scoring and duplicate detection via Gosu rules', color:'#22d3ee' },
    { icon:<BarChart2 size={24}/>, title:'Real-time Analytics', desc:'Live dashboards for both customers and admin teams', color:'#10b981' },
    { icon:<FileText size={24}/>, title:'Smart Document Handling', desc:'Conditional document requirements based on claim type', color:'#f59e0b' },
  ];

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-base)', paddingTop:72 }}>
      {/* Hero */}
      <section style={{ padding:'80px 0 60px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-100, left:'50%', transform:'translateX(-50%)', width:800, height:800, borderRadius:'50%', background:'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)', pointerEvents:'none' }} />
        <div className="container text-center" style={{ position:'relative' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 16px', borderRadius:20, background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.2)', fontSize:13, fontWeight:600, color:'var(--primary-light)', marginBottom:24 }}>
            <Zap size={14}/> Powered by Guidewire ClaimCenter
          </div>
          <h1 style={{ fontSize:'clamp(36px,6vw,72px)', fontWeight:800, lineHeight:1.1, marginBottom:20 }}>
            Insurance Claims,<br/><span className="gradient-text">Intelligently Managed</span>
          </h1>
          <p style={{ fontSize:18, color:'var(--text-secondary)', maxWidth:560, margin:'0 auto 36px', lineHeight:1.7 }}>
            ClaimSure connects your insurance claims directly to Guidewire ClaimCenter — with AI-powered risk scoring, duplicate detection, and real-time status tracking.
          </p>
          <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/register')} id="hero-register">
              Get Started <ArrowRight size={18}/>
            </button>
            <button className="btn btn-secondary btn-lg" onClick={() => navigate('/login')} id="hero-login">
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding:'60px 0' }}>
        <div className="container">
          <div className="text-center mb-8">
            <h2 style={{ fontSize:32, fontWeight:800, marginBottom:8 }}>Why ClaimSure?</h2>
            <p className="text-muted">End-to-end claim management powered by enterprise-grade technology</p>
          </div>
          <div className="grid-4">
            {features.map(f => (
              <div key={f.title} className="card text-center">
                <div style={{ width:56, height:56, borderRadius:16, background:`${f.color}18`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', color:f.color }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize:16, fontWeight:700, marginBottom:8 }}>{f.title}</h3>
                <p className="text-muted text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Data contract */}
      <section style={{ padding:'60px 0', background:'linear-gradient(135deg,rgba(99,102,241,0.06),rgba(34,211,238,0.03))' }}>
        <div className="container">
          <div className="text-center mb-8">
            <h2 style={{ fontSize:28, fontWeight:800 }}>Frontend ↔ Guidewire Data Contract</h2>
            <p className="text-muted mt-2">Agreed field mapping between React frontend and Guidewire ClaimCenter</p>
          </div>
          <div className="grid-2" style={{ maxWidth:900, margin:'0 auto' }}>
            <div className="card">
              <div style={{ fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--primary-light)', marginBottom:12 }}>→ Frontend to Guidewire</div>
              {[['customerId','CustomerID'],['policyNumber','PolicyNumber'],['claimType','ClaimType'],['incidentDate','IncidentDate'],['claimAmount','ClaimAmount'],['damageSeverity','DamageSeverity'],['injuryInvolved','InjuryInvolved']].map(([f,g]) => (
                <div key={f} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border-light)', fontSize:13 }}>
                  <code style={{ color:'var(--primary-light)' }}>{f}</code>
                  <span style={{ color:'var(--text-muted)' }}>→</span>
                  <code style={{ color:'#22d3ee' }}>{g}</code>
                </div>
              ))}
            </div>
            <div className="card">
              <div style={{ fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'#22d3ee', marginBottom:12 }}>← Guidewire to Frontend</div>
              {[['claimId','Claim ID'],['claimStatus','Status'],['priority','Priority'],['riskScore','Risk Score'],['riskLevel','Risk Level'],['duplicateClaim','Duplicate'],['documentStatus','Documents']].map(([g,f]) => (
                <div key={g} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border-light)', fontSize:13 }}>
                  <code style={{ color:'#22d3ee' }}>{g}</code>
                  <span style={{ color:'var(--text-muted)' }}>←</span>
                  <code style={{ color:'var(--primary-light)' }}>{f}</code>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding:'80px 0', textAlign:'center' }}>
        <div className="container">
          <h2 style={{ fontSize:36, fontWeight:800, marginBottom:12 }}>Ready to Submit a Claim?</h2>
          <p className="text-muted mb-8">Create an account and get started in minutes.</p>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/register')} id="cta-register">
            Create Free Account <ArrowRight size={18}/>
          </button>
        </div>
      </section>
    </div>
  );
}
