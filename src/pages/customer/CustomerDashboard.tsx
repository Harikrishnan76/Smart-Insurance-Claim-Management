import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, PlusCircle, Clock, CheckCircle, XCircle,
  Shield, ChevronRight, TrendingUp, Activity, Zap,
  AlertTriangle, ArrowUpRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CustomerSidebar } from '../../components/Sidebar';
import ClaimStatus, { PriorityBadge } from '../../components/ClaimStatus';

// ── Stat Card ──────────────────────────────────────────────────────────────────
function StatCard({
  title, value, icon, color, bg, subtitle, trend,
}: {
  title: string; value: number | string; icon: React.ReactNode;
  color: string; bg: string; subtitle?: string; trend?: string;
}) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-light)',
      borderRadius: 16,
      padding: '20px 22px',
      position: 'relative',
      overflow: 'hidden',
      transition: 'var(--transition)',
      cursor: 'default',
    }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = `${color}44`;
        el.style.transform = 'translateY(-4px)';
        el.style.boxShadow = `0 8px 32px ${color}20`;
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = 'var(--border-light)';
        el.style.transform = 'translateY(0)';
        el.style.boxShadow = 'none';
      }}
    >
      {/* Glow orb */}
      <div style={{
        position: 'absolute', top: -20, right: -20,
        width: 80, height: 80, borderRadius: '50%',
        background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: bg,
          border: `1px solid ${color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: color,
        }}>
          {icon}
        </div>
        {trend && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 3,
            fontSize: 11, fontWeight: 700, color: color,
            background: `${color}12`, borderRadius: 99, padding: '2px 8px',
            border: `1px solid ${color}25`,
          }}>
            <ArrowUpRight size={10} />
            {trend}
          </div>
        )}
      </div>

      <div style={{ fontSize: 32, fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", color: 'var(--text-primary)', lineHeight: 1, marginBottom: 4 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {title}
      </div>
      {subtitle && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{subtitle}</div>
      )}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function CustomerDashboard() {
  const { user, claims } = useApp();
  const navigate = useNavigate();
  const myClaims = claims.filter(c => c.customerId === user?.id || c.customerName === user?.name);

  const stats = {
    total:    myClaims.length,
    pending:  myClaims.filter(c => c.claimStatus === 'Under Review').length,
    approved: myClaims.filter(c => c.claimStatus === 'Approved').length,
    rejected: myClaims.filter(c => c.claimStatus === 'Rejected').length,
  };

  const recent = myClaims.slice(0, 6);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="dashboard-layout">
      <CustomerSidebar />
      <main className="main-content" style={{ position: 'relative' }}>

        {/* Aurora background */}
        <div style={{
          position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
          background: `
            radial-gradient(ellipse 60% 40% at 80% 20%, rgba(124,58,237,0.06) 0%, transparent 60%),
            radial-gradient(ellipse 40% 30% at 20% 80%, rgba(6,182,212,0.04) 0%, transparent 60%)
          `,
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* ── Page header ─────────────────────────────────────────────────── */}
          <div style={{
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
            marginBottom: 28, paddingBottom: 22,
            borderBottom: '1px solid var(--border-light)',
          }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 6px #10b981' }} />
                {greeting}
              </div>
              <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 4 }}>
                Welcome, <span className="gradient-text">{user?.name?.split(' ')[0]}</span> 👋
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                Here's your insurance claim overview for today.
              </p>
            </div>

            <button
              className="btn btn-primary"
              onClick={() => navigate('/customer/claim-form')}
              id="btn-new-claim"
              style={{ gap: 8, borderRadius: 12, padding: '12px 20px' }}
            >
              <PlusCircle size={17} />
              New Claim
              <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.15)', padding: '1px 6px', borderRadius: 99 }}>AI-Powered</span>
            </button>
          </div>

          {/* ── Stats grid ──────────────────────────────────────────────────── */}
          <div className="grid-4 mb-8" style={{ gap: 16 }}>
            <StatCard
              title="My Policies" value={2} trend="+1"
              icon={<Shield size={19} />}
              color="#7c3aed" bg="rgba(124,58,237,0.1)"
              subtitle="Vehicle Insurance"
            />
            <StatCard
              title="Total Claims" value={stats.total}
              icon={<FileText size={19} />}
              color="#06b6d4" bg="rgba(6,182,212,0.1)"
              subtitle="All time"
            />
            <StatCard
              title="Under Review" value={stats.pending}
              icon={<Clock size={19} />}
              color="#f59e0b" bg="rgba(245,158,11,0.1)"
              subtitle="Awaiting decision"
            />
            <StatCard
              title="Approved" value={stats.approved} trend="100%"
              icon={<CheckCircle size={19} />}
              color="#10b981" bg="rgba(16,185,129,0.1)"
              subtitle="Successfully settled"
            />
          </div>

          {/* ── Main content row ─────────────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, marginBottom: 20 }}>

            {/* Recent claims table */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              borderRadius: 18, overflow: 'hidden',
            }}>
              {/* Table header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '20px 24px',
                borderBottom: '1px solid var(--border-light)',
                background: 'linear-gradient(135deg, rgba(124,58,237,0.04), transparent)',
              }}>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>Recent Claims</h2>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Your latest submissions</p>
                </div>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => navigate('/customer/my-claims')}
                  id="btn-view-all"
                  style={{ borderRadius: 8, fontSize: 12 }}
                >
                  View All <ChevronRight size={13} />
                </button>
              </div>

              {recent.length === 0 ? (
                <div style={{ padding: 48, textAlign: 'center' }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: 18,
                    background: 'rgba(124,58,237,0.08)',
                    border: '1px solid rgba(124,58,237,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}>
                    <FileText size={28} color="var(--primary-light)" />
                  </div>
                  <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>No Claims Yet</p>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>Submit your first claim to get started</p>
                  <button className="btn btn-primary btn-sm" onClick={() => navigate('/customer/claim-form')} id="btn-first-claim">
                    <PlusCircle size={14} /> Submit Claim
                  </button>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-card2)' }}>
                      {['Claim ID', 'Type', 'Date', 'Amount', 'Priority', 'Status', ''].map(h => (
                        <th key={h} style={{
                          padding: '10px 16px', textAlign: 'left',
                          fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
                          letterSpacing: '0.08em', color: 'var(--text-muted)',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((c, i) => (
                      <tr
                        key={c.claimId}
                        style={{ borderTop: '1px solid var(--border-light)', transition: 'background 0.15s', animationDelay: `${i * 0.05}s` }}
                        className="fade-in"
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.035)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ padding: '12px 16px' }}>
                          <code style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary-light)', fontFamily: "'JetBrains Mono', monospace" }}>
                            {c.claimId}
                          </code>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 13 }}>{c.claimType}</td>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-secondary)' }}>{c.submittedDate}</td>
                        <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700 }}>
                          ₹{c.claimAmount?.toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <PriorityBadge priority={c.priority} />
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <ClaimStatus status={c.claimStatus} />
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => navigate(`/customer/claim-tracking/${c.claimId}`)}
                            id={`track-${c.claimId}`}
                            style={{ fontSize: 12, borderRadius: 7 }}
                          >
                            Track <ChevronRight size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Right column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Active Policy Card */}
              <div style={{
                borderRadius: 16, overflow: 'hidden',
                background: 'linear-gradient(135deg, #0d0f1a 0%, #111420 100%)',
                border: '1px solid rgba(124,58,237,0.2)',
                position: 'relative',
              }}>
                {/* Glow effect */}
                <div style={{
                  position: 'absolute', top: -30, right: -30, width: 100, height: 100,
                  borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)',
                  pointerEvents: 'none',
                }} />
                <div style={{
                  padding: '16px 18px',
                  background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(6,182,212,0.05))',
                  borderBottom: '1px solid rgba(124,58,237,0.15)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
                      Active Policy
                    </div>
                    <span className="badge badge-success">Active</span>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                    POL10025
                  </div>
                </div>
                <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { k: 'Type',     v: 'Vehicle Insurance' },
                    { k: 'Valid Until', v: '01 Jan 2027' },
                    { k: 'Coverage', v: '₹5,00,000' },
                  ].map(row => (
                    <div key={row.k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{row.k}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>{row.v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-light)',
                borderRadius: 16, padding: '16px 18px',
              }}>
                <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 12 }}>
                  Quick Actions
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { label: 'Submit New Claim', icon: <PlusCircle size={14} />, action: () => navigate('/customer/claim-form'), id: 'qa-claim', primary: true },
                    { label: 'View My Claims', icon: <FileText size={14} />, action: () => navigate('/customer/my-claims'), id: 'qa-claims', primary: false },
                    { label: 'My Profile', icon: <Activity size={14} />, action: () => navigate('/customer/profile'), id: 'qa-profile', primary: false },
                  ].map(a => (
                    <button
                      key={a.id}
                      id={a.id}
                      onClick={a.action}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 14px', borderRadius: 10, border: 'none',
                        cursor: 'pointer', width: '100%', fontFamily: "'Inter', sans-serif",
                        fontSize: 13, fontWeight: 600, transition: 'var(--transition)',
                        background: a.primary
                          ? 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(6,182,212,0.1))'
                          : 'var(--bg-surface)',
                        color: a.primary ? 'var(--primary-light)' : 'var(--text-secondary)',
                        border: a.primary ? '1px solid rgba(124,58,237,0.25)' : '1px solid var(--border-light)',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.transform = 'translateX(4px)';
                        (e.currentTarget as HTMLElement).style.color = a.primary ? '#c4b5fd' : 'var(--text-primary)';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.transform = 'translateX(0)';
                        (e.currentTarget as HTMLElement).style.color = a.primary ? 'var(--primary-light)' : 'var(--text-secondary)';
                      }}
                    >
                      {a.icon}
                      {a.label}
                      <ChevronRight size={13} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                    </button>
                  ))}
                </div>
              </div>

              {/* AI insight box */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(6,182,212,0.06))',
                border: '1px solid rgba(124,58,237,0.2)',
                borderRadius: 14, padding: '14px 16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: 6, background: 'rgba(124,58,237,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Zap size={12} color="var(--primary-light)" />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--primary-light)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    AI Insight
                  </span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Your policy is valid and active. OCR document verification is powered by Guidewire AI for faster claim processing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
