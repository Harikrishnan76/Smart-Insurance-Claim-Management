import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, Bell, LogOut, User, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Navbar() {
  const { user, setUser } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    setUser(null);
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <a className="navbar-brand" href={user ? (user.role === 'admin' ? '/admin' : '/customer') : '/'}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #22d3ee)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={20} color="#fff" />
          </div>
          <span className="navbar-brand-text gradient-text">ClaimSure</span>
        </a>

        <div className="navbar-nav">
          {!user && (
            <>
              <button className="nav-link" onClick={() => navigate('/login')} id="nav-login">Login</button>
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/register')} id="nav-register">Get Started</button>
            </>
          )}
          {user && (
            <>
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 14px', borderRadius:10, background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.2)' }}>
                <div style={{ width:30, height:30, borderRadius:'50%', background:'linear-gradient(135deg,#6366f1,#22d3ee)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'#fff' }}>
                  {user.name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)' }}>{user.name}</div>
                  <div style={{ fontSize:11, color:'var(--text-secondary)', textTransform:'capitalize' }}>{user.role}</div>
                </div>
              </div>
              <button className="nav-link" onClick={handleLogout} id="nav-logout" title="Logout">
                <LogOut size={16} />
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
