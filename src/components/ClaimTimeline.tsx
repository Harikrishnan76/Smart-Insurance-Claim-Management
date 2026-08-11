import React from 'react';
import { Check, Circle } from 'lucide-react';

const STAGES = [
  { key: 'submitted',   label: 'Claim Submitted',    sub: 'Claim received by ClaimCenter' },
  { key: 'docs',        label: 'Documents Uploaded',  sub: 'All documents received' },
  { key: 'verified',    label: 'Documents Verified',  sub: 'Documents checked and approved' },
  { key: 'duplicate',   label: 'Duplicate Check',     sub: 'Fraud and duplicate analysis done' },
  { key: 'risk',        label: 'Risk Assessment',     sub: 'Gosu rules applied — risk scored' },
  { key: 'review',      label: 'Admin Review',        sub: 'Under manual review' },
  { key: 'decision',    label: 'Claim Decision',      sub: 'Approved / Rejected' },
  { key: 'completed',   label: 'Completed',           sub: 'Process complete' },
];

const STAGE_MAP: Record<string, number> = {
  'Submitted': 1, 'Under Review': 5, 'Approved': 7, 'Rejected': 7, 'Completed': 8,
};

interface Props { status: string; }

export default function ClaimTimeline({ status }: Props) {
  const currentStage = STAGE_MAP[status] ?? 1;

  return (
    <div className="timeline">
      {STAGES.map((s, i) => {
        const stageNum = i + 1;
        const done = stageNum < currentStage;
        const active = stageNum === currentStage;
        const pending = stageNum > currentStage;
        return (
          <div key={s.key} className="timeline-item">
            <div className={`timeline-dot ${done ? 'done' : active ? 'active' : 'pending'}`}>
              {done ? <Check size={12} color="#10b981" /> : active ? <Circle size={8} color="#6366f1" fill="#6366f1" /> : null}
            </div>
            <div>
              <div className="timeline-title" style={{ color: done ? '#10b981' : active ? 'var(--primary-light)' : 'var(--text-muted)' }}>
                {s.label}
              </div>
              <div className="timeline-subtitle">{s.sub}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
