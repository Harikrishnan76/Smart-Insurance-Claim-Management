import React, { useState } from 'react';
import {
  ShieldCheck, ShieldAlert, ShieldX, Shield,
  CheckCircle2, XCircle, AlertTriangle, MinusCircle,
  ChevronDown, ChevronUp, AlertOctagon, Fingerprint,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VerificationCheck {
  check_id: string;
  label: string;
  status: 'pass' | 'fail' | 'warn' | 'skip';
  detail: string;
  field_value?: string;
}

export interface DocumentVerificationResult {
  doc_type: string;
  doc_label: string;
  trust_score: number;          // 0–100
  trust_level: 'high' | 'medium' | 'low' | 'invalid';
  overall_status: 'authentic' | 'suspicious' | 'invalid' | 'incomplete';
  checks: VerificationCheck[];
  fraud_flags: string[];
  summary: string;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const STATUS_CFG = {
  authentic:  { color: '#10b981', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.3)',  icon: ShieldCheck,  label: 'Authentic'   },
  suspicious: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.3)',  icon: ShieldAlert,  label: 'Suspicious'  },
  invalid:    { color: '#ef4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.3)',   icon: ShieldX,      label: 'Invalid'     },
  incomplete: { color: '#6366f1', bg: 'rgba(99,102,241,0.08)',  border: 'rgba(99,102,241,0.3)',  icon: Shield,       label: 'Incomplete'  },
};

const CHECK_CFG = {
  pass: { color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: CheckCircle2,    label: 'PASS' },
  fail: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  icon: XCircle,         label: 'FAIL' },
  warn: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: AlertTriangle,   label: 'WARN' },
  skip: { color: '#6b7280', bg: 'rgba(107,114,128,0.1)', icon: MinusCircle,     label: 'SKIP' },
};

const TRUST_GRADIENT = {
  high:    'conic-gradient(#10b981 var(--deg), rgba(16,185,129,0.12) 0)',
  medium:  'conic-gradient(#f59e0b var(--deg), rgba(245,158,11,0.12) 0)',
  low:     'conic-gradient(#ef4444 var(--deg), rgba(239,68,68,0.12) 0)',
  invalid: 'conic-gradient(#ef4444 var(--deg), rgba(239,68,68,0.12) 0)',
};

const TRUST_COLOR = { high: '#10b981', medium: '#f59e0b', low: '#ef4444', invalid: '#ef4444' };

// ─── Trust Ring ───────────────────────────────────────────────────────────────

function TrustRing({ score, level }: { score: number; level: string }) {
  const deg = `${(score / 100) * 360}deg`;
  const color = TRUST_COLOR[level as keyof typeof TRUST_COLOR] ?? '#6366f1';
  const gradient = TRUST_GRADIENT[level as keyof typeof TRUST_GRADIENT]
    ?? `conic-gradient(${color} ${deg}, rgba(99,102,241,0.12) 0)`;

  return (
    <div style={{
      position: 'relative', width: 90, height: 90, flexShrink: 0,
      background: gradient.replace('var(--deg)', deg),
      borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Inner white circle */}
      <div style={{
        width: 68, height: 68, borderRadius: '50%',
        background: 'var(--bg-card2)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em' }}>/ 100</span>
      </div>
    </div>
  );
}

// ─── Check Row ────────────────────────────────────────────────────────────────

function CheckRow({ check }: { check: VerificationCheck }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = CHECK_CFG[check.status] ?? CHECK_CFG.skip;
  const Icon = cfg.icon;

  return (
    <div
      onClick={() => setExpanded(p => !p)}
      style={{
        borderRadius: 9, overflow: 'hidden',
        border: `1px solid ${cfg.color}33`,
        background: 'var(--bg-surface)',
        cursor: 'pointer',
        transition: 'border-color 0.2s',
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '9px 12px',
      }}>
        <Icon size={15} color={cfg.color} style={{ flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
            {check.label}
          </span>
          {check.field_value && !expanded && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>
              → {check.field_value}
            </span>
          )}
        </div>
        <span style={{
          fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 99,
          background: cfg.bg, color: cfg.color,
          border: `1px solid ${cfg.color}44`,
          flexShrink: 0, letterSpacing: '0.05em',
        }}>
          {cfg.label}
        </span>
        {expanded ? <ChevronUp size={13} color="var(--text-muted)" /> : <ChevronDown size={13} color="var(--text-muted)" />}
      </div>
      {expanded && (
        <div style={{
          padding: '0 12px 10px 37px',
          fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6,
          borderTop: `1px solid ${cfg.color}22`,
          background: cfg.bg,
        }}>
          {check.detail}
          {check.field_value && (
            <div style={{ marginTop: 4, fontFamily: 'monospace', fontSize: 11, color: cfg.color, fontWeight: 700 }}>
              Value: {check.field_value}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  result: DocumentVerificationResult;
}

export function DocumentVerificationPanel({ result }: Props) {
  const [showChecks, setShowChecks] = useState(true);
  const cfg = STATUS_CFG[result.overall_status] ?? STATUS_CFG.incomplete;
  const StatusIcon = cfg.icon;

  const passCount = result.checks.filter(c => c.status === 'pass').length;
  const failCount = result.checks.filter(c => c.status === 'fail').length;
  const warnCount = result.checks.filter(c => c.status === 'warn').length;

  return (
    <div style={{
      marginTop: 10,
      border: `1.5px solid ${cfg.border}`,
      borderRadius: 14,
      overflow: 'hidden',
      background: 'var(--bg-surface)',
      animation: 'fadeIn 0.4s ease',
      boxShadow: `0 4px 24px ${cfg.color}18`,
    }}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 18px',
        background: `linear-gradient(135deg, ${cfg.bg}, transparent)`,
        borderBottom: `1px solid ${cfg.border}`,
      }}>
        <TrustRing score={result.trust_score} level={result.trust_level} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Fingerprint size={14} color={cfg.color} />
            <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Document Verification
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
            <StatusIcon size={16} color={cfg.color} />
            <span style={{ fontSize: 16, fontWeight: 800, color: cfg.color }}>{cfg.label}</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>· {result.doc_label}</span>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            {result.summary}
          </p>
        </div>
      </div>

      {/* ── Check Stats ─────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: 0,
        borderBottom: `1px solid var(--border-light)`,
      }}>
        {[
          { label: 'Passed',  count: passCount, color: '#10b981', bg: 'rgba(16,185,129,0.07)' },
          { label: 'Warnings', count: warnCount, color: '#f59e0b', bg: 'rgba(245,158,11,0.07)' },
          { label: 'Failed',  count: failCount, color: '#ef4444', bg: 'rgba(239,68,68,0.07)' },
          { label: 'Flags',   count: result.fraud_flags.length, color: '#a78bfa', bg: 'rgba(167,139,250,0.07)' },
        ].map((s, i) => (
          <div key={s.label} style={{
            flex: 1, textAlign: 'center', padding: '10px 0',
            background: s.bg,
            borderRight: i < 3 ? '1px solid var(--border-light)' : 'none',
          }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.count}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Fraud Flags ─────────────────────────────────────────────────── */}
      {result.fraud_flags.length > 0 && (
        <div style={{ padding: '10px 16px', background: 'rgba(239,68,68,0.05)', borderBottom: '1px solid rgba(239,68,68,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
            <AlertOctagon size={13} color="#ef4444" />
            <span style={{ fontSize: 11, fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Fraud Flags ({result.fraud_flags.length})
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {result.fraud_flags.map((flag, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 7,
                fontSize: 11, color: '#fca5a5', lineHeight: 1.5,
              }}>
                <span style={{ color: '#ef4444', flexShrink: 0, marginTop: 1 }}>⚑</span>
                {flag}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Checks Toggle ───────────────────────────────────────────────── */}
      <button
        onClick={() => setShowChecks(p => !p)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '9px 16px', background: 'none', border: 'none',
          borderBottom: showChecks ? '1px solid var(--border-light)' : 'none',
          cursor: 'pointer', fontSize: 11, fontWeight: 700,
          color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em',
        }}
      >
        <span>Verification Checks ({result.checks.length})</span>
        {showChecks ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>

      {/* ── Check List ──────────────────────────────────────────────────── */}
      {showChecks && (
        <div style={{ padding: '10px 14px 14px', display: 'flex', flexDirection: 'column', gap: 7 }}>
          {result.checks.map(check => (
            <CheckRow key={check.check_id} check={check} />
          ))}
        </div>
      )}
    </div>
  );
}
