import React, { useState } from 'react';
import { ScanLine, CheckCircle, AlertCircle, XCircle, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

export type OCRResult = {
  success: boolean;
  doc_type: string;
  raw_text: string;
  extracted_fields: Record<string, { value: string; confidence: string }>;
  verification_status: string;   // "verified" | "partial" | "unreadable"
  verification_notes: string[];
  error?: string;
};

interface OCRPanelProps {
  result: OCRResult;
  onAutoFill?: (fields: Record<string, string>) => void;
}

const CONFIDENCE_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  high:   { color: '#10b981', bg: 'rgba(16,185,129,0.12)',  label: 'High' },
  medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  label: 'Medium' },
  low:    { color: '#6366f1', bg: 'rgba(99,102,241,0.12)',   label: 'Low' },
};

const STATUS_STYLE: Record<string, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
  verified:   { color: '#10b981', bg: 'rgba(16,185,129,0.1)',  icon: <CheckCircle size={15} />, label: 'Verified' },
  partial:    { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  icon: <AlertCircle size={15} />, label: 'Partial' },
  unreadable: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   icon: <XCircle size={15} />,     label: 'Unreadable' },
};

function toLabel(key: string) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function OCRPanel({ result, onAutoFill }: OCRPanelProps) {
  const [showRaw, setShowRaw] = useState(false);

  const st = STATUS_STYLE[result.verification_status] ?? STATUS_STYLE.partial;
  const fields = result.extracted_fields;
  const fieldCount = Object.keys(fields).length;

  return (
    <div style={{
      marginTop: 12,
      border: `1px solid ${st.color}44`,
      borderRadius: 12,
      overflow: 'hidden',
      background: 'var(--bg-surface)',
      animation: 'fadeIn 0.35s ease',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px',
        background: st.bg,
        borderBottom: `1px solid ${st.color}33`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ScanLine size={15} color={st.color} />
          <span style={{ fontWeight: 700, fontSize: 12, color: st.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            OCR Analysis
          </span>
          <span style={{
            fontSize: 11, padding: '2px 8px', borderRadius: 99,
            background: st.bg, border: `1px solid ${st.color}55`,
            color: st.color, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
          }}>
            {st.icon} {st.label}
          </span>
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {fieldCount} field{fieldCount !== 1 ? 's' : ''} extracted
        </span>
      </div>

      {/* Fields */}
      {fieldCount > 0 ? (
        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Object.entries(fields).map(([key, f]) => {
            const conf = CONFIDENCE_STYLE[f.confidence] ?? CONFIDENCE_STYLE.low;
            return (
              <div key={key} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '6px 10px', borderRadius: 8,
                background: 'var(--bg-card2)', border: '1px solid var(--border-light)',
              }}>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {toLabel(key)}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginTop: 1 }}>
                    {f.value}
                  </div>
                </div>
                <span style={{
                  fontSize: 10, padding: '2px 7px', borderRadius: 99, fontWeight: 700,
                  background: conf.bg, color: conf.color, border: `1px solid ${conf.color}44`,
                  flexShrink: 0,
                }}>
                  {conf.label}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-muted)' }}>
          No structured fields could be extracted from this document.
        </div>
      )}

      {/* Notes */}
      {result.verification_notes.length > 0 && (
        <div style={{ padding: '0 16px 10px' }}>
          {result.verification_notes.map((n, i) => (
            <div key={i} style={{ fontSize: 11, color: '#f59e0b', marginTop: 2 }}>
              ⚠ {n}
            </div>
          ))}
        </div>
      )}

      {/* Footer row */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderTop: '1px solid var(--border-light)', padding: '8px 14px',
        gap: 8,
      }}>
        {onAutoFill && fieldCount > 0 && (
          <button
            onClick={() => onAutoFill(Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, v.value])))}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 12, fontWeight: 700,
              padding: '5px 12px', borderRadius: 7,
              background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.35)',
              color: '#818cf8', cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.28)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.15)')}
          >
            <Sparkles size={12} /> Auto-fill Form
          </button>
        )}
        <button
          onClick={() => setShowRaw(p => !p)}
          style={{
            marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5,
            fontSize: 11, color: 'var(--text-muted)', background: 'none',
            border: 'none', cursor: 'pointer',
          }}
        >
          {showRaw ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          {showRaw ? 'Hide' : 'View'} raw text
        </button>
      </div>

      {/* Raw text */}
      {showRaw && (
        <pre style={{
          margin: 0, padding: '10px 16px 14px',
          fontSize: 11, lineHeight: 1.6, color: 'var(--text-secondary)',
          background: 'var(--bg-card2)', borderTop: '1px solid var(--border-light)',
          whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 200, overflowY: 'auto',
        }}>
          {result.raw_text || '(no text extracted)'}
        </pre>
      )}
    </div>
  );
}
