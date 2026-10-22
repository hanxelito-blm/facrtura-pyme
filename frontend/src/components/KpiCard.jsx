import React from 'react';

export default function KpiCard({ label, value, sub, icon: Icon, accent = '#8d6e63', iconBg }) {
  return (
    <div
      className="kpi-card"
      style={{ '--kpi-accent': accent, '--kpi-icon-bg': iconBg || `${accent}20` }}
    >
      <div className="kpi-header">
        <span className="kpi-label">{label}</span>
        {Icon && (
          <div className="kpi-icon-box">
            <Icon size={16} strokeWidth={2} />
          </div>
        )}
      </div>
      <div className="kpi-value">{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}
