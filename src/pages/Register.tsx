import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, User, Mail, Phone, Lock, MapPin, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { apiService } from '../services/api';

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal','Delhi','Jammu & Kashmir','Ladakh',
];

export default function Register() {
  const { setUser } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name:'', email:'', mobile:'', password:'', confirmPassword:'',
    address:'', city:'', state:'', pincode:'',
  });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.email || !form.mobile || !form.password || !form.address || !form.city || !form.state || !form.pincode)
      return setError('Please fill all required fields.');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    if (!/^\d{10}$/.test(form.mobile)) return setError('Mobile number must be 10 digits.');

    setLoading(true);
    const res = await apiService.register(form);
    setLoading(false);
    if (!res.success) { setError(res.message || 'Registration failed.'); return; }

    setSuccess(true);
    setUser(res.user || {
      id: 'CUST' + Date.now(), name: form.name, email: form.email, mobile: form.mobile,
      address: form.address, city: form.city, state: form.state, pincode: form.pincode, role: 'customer',
    });
    setTimeout(() => navigate('/customer'), 1500);
  };

  if (success) return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="card text-center">
          <div style={{ width:80, height:80, borderRadius:'50%', background:'rgba(16,185,129,0.15)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
            <CheckCircle size={40} color="#10b981" />
          </div>
          <h2 style={{ fontSize:24, marginBottom:8 }}>Account Created!</h2>
          <p className="text-muted">Redirecting to your dashboard...</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="auth-page" style={{ alignItems:'flex-start', paddingTop:80 }}>
      <div className="auth-card" style={{ maxWidth:540 }}>
        <div className="card">
          <div className="text-center mb-8">
            <div style={{ width:56, height:56, borderRadius:16, background:'linear-gradient(135deg,#6366f1,#22d3ee)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
              <Shield size={28} color="#fff" />
            </div>
            <h1 style={{ fontSize:26, marginBottom:6 }}>Create Account</h1>
            <p className="text-muted text-sm">Join ClaimSure to manage your insurance claims</p>
          </div>

          {error && <div className="alert alert-error mb-4">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input id="reg-name" type="text" className="form-control" placeholder="Hari Krishnan" value={form.name} onChange={set('name')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Mobile Number *</label>
                  <input id="reg-mobile" type="tel" className="form-control" placeholder="9876543210" value={form.mobile} onChange={set('mobile')} maxLength={10} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input id="reg-email" type="email" className="form-control" placeholder="you@example.com" value={form.email} onChange={set('email')} />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <div className="relative">
                    <input id="reg-password" type={showPwd ? 'text' : 'password'} className="form-control" placeholder="Min 6 chars" value={form.password} onChange={set('password')} style={{ paddingRight:42 }} />
                    <button type="button" style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)' }} onClick={() => setShowPwd(!showPwd)}>
                      {showPwd ? <EyeOff size={16}/> : <Eye size={16}/>}
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm Password *</label>
                  <input id="reg-confirm-password" type="password" className="form-control" placeholder="Repeat password" value={form.confirmPassword} onChange={set('confirmPassword')} />
                </div>
              </div>

              <div className="divider" />
              <p style={{ fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text-muted)' }}>Address Details</p>

              <div className="form-group">
                <label className="form-label">Address *</label>
                <textarea id="reg-address" className="form-control" placeholder="House No., Street, Area" value={form.address} onChange={set('address')} style={{ minHeight:70 }} />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">City *</label>
                  <input id="reg-city" type="text" className="form-control" placeholder="Chennai" value={form.city} onChange={set('city')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Pincode *</label>
                  <input id="reg-pincode" type="number" className="form-control" placeholder="600040" value={form.pincode} onChange={set('pincode')} maxLength={6} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">State *</label>
                <select id="reg-state" className="form-control" value={form.state} onChange={set('state')}>
                  <option value="">Select State</option>
                  {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <button id="reg-submit" type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
                {loading ? <><div className="spinner" />Creating Account...</> : 'Create Account'}
              </button>
            </div>
          </form>

          <p className="text-center mt-6 text-sm text-muted">
            Already have an account?{' '}
            <Link to="/login" style={{ color:'var(--primary-light)', fontWeight:600, textDecoration:'none' }}>Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
