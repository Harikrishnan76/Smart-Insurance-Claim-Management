import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useApp, DEMO_USERS } from '../context/AppContext';
import { apiService } from '../services/api';

export default function Login() {
  const { setUser } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) { setError('Please fill all fields.'); return; }
    setLoading(true);
    const res = await apiService.login(form.email, form.password);
    setLoading(false);
    if (!res.success) { setError(res.message || 'Invalid credentials.'); return; }

    const demoUser = DEMO_USERS[form.email];
    if (demoUser) {
      setUser(demoUser);
      navigate(demoUser.role === 'admin' ? '/admin' : '/customer');
    } else {
      // New registered user — treat as customer
      setUser({
        id: 'CUST' + Date.now(), name: form.email.split('@')[0], email: form.email,
        mobile: '', address: '', city: '', state: '', pincode: '', role: 'customer',
      });
      navigate('/customer');
    }
  };

  const fillDemo = (role: 'customer' | 'admin') => {
    if (role === 'customer') setForm({ email: 'customer@demo.com', password: 'demo1234' });
    else setForm({ email: 'admin@demo.com', password: 'admin1234' });
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="card">
          {/* Header */}
          <div className="text-center mb-8">
            <div style={{ width:64, height:64, borderRadius:18, background:'linear-gradient(135deg,#6366f1,#22d3ee)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
              <Shield size={32} color="#fff" />
            </div>
            <h1 style={{ fontSize:28, marginBottom:6 }}>Welcome Back</h1>
            <p className="text-muted text-sm">Sign in to access your ClaimSure portal</p>
          </div>

          {/* Demo buttons */}
          <div style={{ display:'flex', gap:10, marginBottom:24 }}>
            <button className="btn btn-secondary w-full btn-sm" onClick={() => fillDemo('customer')} id="demo-customer">
              👤 Customer Demo
            </button>
            <button className="btn btn-secondary w-full btn-sm" onClick={() => fillDemo('admin')} id="demo-admin">
              🛡️ Admin Demo
            </button>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
            <div className="divider" style={{ flex:1, margin:0 }} />
            <span style={{ fontSize:12, color:'var(--text-muted)' }}>or sign in manually</span>
            <div className="divider" style={{ flex:1, margin:0 }} />
          </div>

          {error && <div className="alert alert-error mb-4"><AlertCircle size={16} style={{display:'inline',marginRight:6}} />{error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div className="relative">
                  <Mail size={16} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
                  <input id="login-email" type="email" className="form-control" placeholder="you@example.com"
                    style={{ paddingLeft:42 }} value={form.email} onChange={e => setForm({...form, email:e.target.value})} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="relative">
                  <Lock size={16} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
                  <input id="login-password" type={showPwd ? 'text' : 'password'} className="form-control" placeholder="••••••••"
                    style={{ paddingLeft:42, paddingRight:42 }} value={form.password} onChange={e => setForm({...form, password:e.target.value})} />
                  <button type="button" style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)' }} onClick={() => setShowPwd(!showPwd)}>
                    {showPwd ? <EyeOff size={16}/> : <Eye size={16}/>}
                  </button>
                </div>
              </div>

              <button id="login-submit" type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
                {loading ? <><div className="spinner" />Signing in...</> : 'Sign In'}
              </button>
            </div>
          </form>

          <p className="text-center mt-6 text-sm text-muted">
            Don't have an account?{' '}
            <Link to="/register" style={{ color:'var(--primary-light)', fontWeight:600, textDecoration:'none' }}>
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
