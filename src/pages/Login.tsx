import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Mail, Lock, Eye, EyeOff, AlertCircle, Zap, ArrowRight, Activity } from 'lucide-react';
import { useApp, DEMO_USERS } from '../context/AppContext';
import { apiService } from '../services/api';

export default function Login() {
  const { setUser } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) { setError('Please fill all fields.'); return; }
    setLoading(true);
    const res = await apiService.login(form.email, form.password);
    setLoading(false);
    if (!res.success) { setError(res.message || 'Invalid credentials.'); return; }

    if (res.user) {
      setUser(res.user);
      navigate(res.user.role === 'admin' ? '/admin' : '/customer');
    } else {
      const demoUser = DEMO_USERS[form.email];
      if (demoUser) {
        setUser(demoUser);
        navigate(demoUser.role === 'admin' ? '/admin' : '/customer');
      } else {
        setUser({
          id: 'CUST' + Date.now(), name: form.email.split('@')[0], email: form.email,
          mobile: '', address: '', city: '', state: '', pincode: '', role: 'customer',
        });
        navigate('/customer');
      }
    }
  };

  const fillDemo = (role: 'customer' | 'admin') => {
    if (role === 'customer') setForm({ email: 'customer@demo.com', password: 'demo1234' });
    else setForm({ email: 'admin@demo.com', password: 'admin1234' });
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', background: 'var(--bg-base)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* ── Left panel (branding) ──────────────────────────────────────── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '60px 48px', position: 'relative',
        background: 'linear-gradient(135deg, #0a0b14 0%, #0d0f1a 100%)',
        borderRight: '1px solid var(--border-light)',
      }}>
        {/* Orbs */}
        <div style={{
          position: 'absolute', top: '15%', left: '10%', width: 300, height: 300,
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)',
          filter: 'blur(40px)', pointerEvents: 'none',
          animation: 'float 8s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: '15%', right: '10%', width: 250, height: 250,
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)',
          filter: 'blur(40px)', pointerEvents: 'none',
          animation: 'float 10s ease-in-out infinite reverse',
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 420, width: '100%' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 24px rgba(124,58,237,0.5)',
            }}>
              <Shield size={26} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.03em' }}
                className="gradient-text">
                ClaimSphere
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>AI-Powered Insurance</div>
            </div>
          </div>

          <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 14, lineHeight: 1.15 }}>
            Smarter Claims.<br />
            <span className="gradient-text">Faster Decisions.</span>
          </h2>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 40 }}>
            Powered by advanced OCR and AI document verification — experience next-generation insurance claim management.
          </p>

          {/* Feature pills */}
          {[
            { icon: <Zap size={13} />, label: 'AI Document Verification' },
            { icon: <Activity size={13} />, label: 'Real-time Claim Tracking' },
            { icon: <Shield size={13} />, label: 'Fraud Detection Engine' },
          ].map(f => (
            <div key={f.label} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              marginBottom: 12, color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 7,
                background: 'rgba(124,58,237,0.12)',
                border: '1px solid rgba(124,58,237,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--primary-light)',
              }}>
                {f.icon}
              </div>
              {f.label}
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel (login form) ───────────────────────────────────── */}
      <div style={{
        width: 480, flexShrink: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '48px 40px',
        background: 'var(--bg-base)',
      }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 6 }}>
            Welcome back
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 28 }}>
            Sign in to access your ClaimSphere portal
          </p>

          {/* Demo buttons */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
            {[
              { label: '👤 Customer Demo', role: 'customer' as const, color: '#7c3aed' },
              { label: '🛡️ Admin Demo',   role: 'admin'    as const, color: '#f59e0b' },
            ].map(d => (
              <button
                key={d.role}
                className="btn btn-sm"
                id={`demo-${d.role}`}
                onClick={() => fillDemo(d.role)}
                style={{
                  flex: 1, background: `${d.color}12`,
                  border: `1px solid ${d.color}30`, color: d.color,
                  borderRadius: 9, fontWeight: 700, fontSize: 12,
                  transition: 'var(--transition)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = `${d.color}20`;
                  (e.currentTarget as HTMLElement).style.borderColor = `${d.color}60`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = `${d.color}12`;
                  (e.currentTarget as HTMLElement).style.borderColor = `${d.color}30`;
                }}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border-light)' }} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>or sign in manually</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border-light)' }} />
          </div>

          {/* Error */}
          {error && (
            <div className="alert alert-error" style={{ marginBottom: 20, animation: 'fadeIn 0.3s ease' }}>
              <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Email */}
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div className="relative">
                  <Mail size={15} style={{
                    position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                    color: focusedField === 'email' ? 'var(--primary-light)' : 'var(--text-muted)',
                    transition: 'color 0.2s',
                  }} />
                  <input
                    id="login-email" type="email" className="form-control"
                    placeholder="you@example.com"
                    style={{ paddingLeft: 42 }}
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="relative">
                  <Lock size={15} style={{
                    position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                    color: focusedField === 'password' ? 'var(--primary-light)' : 'var(--text-muted)',
                    transition: 'color 0.2s',
                  }} />
                  <input
                    id="login-password" type={showPwd ? 'text' : 'password'} className="form-control"
                    placeholder="••••••••"
                    style={{ paddingLeft: 42, paddingRight: 44 }}
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                  />
                  <button
                    type="button"
                    style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--text-muted)', padding: 4, borderRadius: 6,
                      transition: 'color 0.2s',
                    }}
                    onClick={() => setShowPwd(!showPwd)}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                  >
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                id="login-submit" type="submit" className="btn btn-primary"
                disabled={loading}
                style={{ borderRadius: 12, padding: '13px 20px', marginTop: 4, fontSize: 14 }}
              >
                {loading
                  ? <><div className="spinner" />Signing in...</>
                  : <><ArrowRight size={16} />Sign In to ClaimSphere</>
                }
              </button>
            </div>
          </form>

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--text-muted)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--primary-light)', fontWeight: 700, textDecoration: 'none' }}>
              Create Account
            </Link>
          </p>

          {/* Bottom badge */}
          <div style={{
            marginTop: 32, padding: '10px 14px', borderRadius: 10,
            background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)',
            display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center',
          }}>
            <Shield size={12} color="var(--text-muted)" />
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
              Secured by end-to-end encryption · Guidewire AI
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
