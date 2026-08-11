import React from 'react';

interface DashboardCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

export default function DashboardCard({ title, value, icon, color, subtitle }: DashboardCardProps) {
  return (
    <div className="stat-card fade-in">
      <div className="stat-icon" style={{ background: `${color}20` }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="stat-value" style={{ color }}>{value}</div>
      <div className="stat-label">{title}</div>
      {subtitle && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{subtitle}</div>}
    </div>
  );
}
