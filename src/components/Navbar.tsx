import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, Bell, LogOut, ChevronDown, Zap } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Navbar() {
  const { user, setUser } = useApp();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    setUserMenuOpen(false);
    setUser(null);
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <nav className="navbar" style={{
      boxShadow: scrolled ? '0 4px 32px rgba(0,0,0,0.5)' : 'none',
      transition: 'box-shadow 0.3s ease',
    }}>
      {/* Animated top border */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: 'linear-gradient(90deg, transparent 0%, #7c3aed 30%, #06b6d4 60%, #10b981 80%, transparent 100%)',
        opacity: 0.8,
      }} />

      <div className="container navbar-inner">
        {/* Brand */}
        <a
          className="navbar-brand"
          href={user ? (user.role === 'admin' ? '/admin' : '/customer') : '/'}
          style={{ gap: 12 }}
        >
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 16px rgba(124,58,237,0.5)',
            flexShrink: 0,
          }}>
            <Shield size={18} color="#fff" />
          </div>
          <div>
            <span className="navbar-brand-text gradient-text">ClaimSphere</span>
          </div>
          <div style={{
            fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 99,
            background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.25)',
            color: '#22d3ee', letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>
            AI-Powered
          </div>
        </a>

        {/* Right section */}
        <div className="navbar-nav">
          {!user && (
            <>
              <button className="nav-link" onClick={() => navigate('/login')} id="nav-login">
                Sign In
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => navigate('/register')}
                id="nav-register"
                style={{ borderRadius: 8 }}
              >
                <Zap size={13} />
                Get Started
              </button>
            </>
          )}

          {user && (
            <>
              {/* Notification bell */}
              <button style={{
                width: 36, height: 36, borderRadius: 9,
                background: 'var(--bg-surface)', border: '1px solid var(--border-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'var(--text-secondary)', position: 'relative',
                transition: 'var(--transition)',
              }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,58,237,0.4)';
                  (e.currentTarget as HTMLElement).style.color = 'var(--primary-light)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-light)';
                  (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                }}
              >
                <Bell size={15} />
                <span style={{
                  position: 'absolute', top: 7, right: 7,
                  width: 7, height: 7, borderRadius: '50%',
                  background: '#7c3aed',
                  boxShadow: '0 0 6px rgba(124,58,237,0.8)',
                }} />
              </button>

              {/* User menu */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setUserMenuOpen(p => !p)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 9, padding: '6px 10px 6px 6px',
                    borderRadius: 10, background: 'var(--bg-surface)',
                    border: userMenuOpen ? '1px solid rgba(124,58,237,0.4)' : '1px solid var(--border-light)',
                    cursor: 'pointer', transition: 'var(--transition)',
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0,
                  }}>
                    {initials}
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                      {user.name.split(' ')[0]}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'capitalize', lineHeight: 1.2 }}>
                      {user.role}
                    </div>
                  </div>
                  <ChevronDown size={13} color="var(--text-muted)" style={{
                    transform: userMenuOpen ? 'rotate(180deg)' : 'rotate(0)',
                    transition: 'transform 0.2s',
                  }} />
                </button>

                {/* Dropdown */}
                {userMenuOpen && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                    width: 180, background: 'var(--bg-card)',
                    border: '1px solid var(--border-light)', borderRadius: 12,
                    overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                    animation: 'fadeIn 0.15s ease',
                    zIndex: 200,
                  }}>
                    <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-light)' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{user.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{user.email}</div>
                    </div>
                    <button
                      onClick={handleLogout}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                        padding: '10px 14px', background: 'none', border: 'none',
                        cursor: 'pointer', fontSize: 13, color: '#f87171', fontWeight: 600,
                        transition: 'var(--transition)',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      <LogOut size={14} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
