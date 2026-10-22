import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, color = '#6366f1', glowColor = 'rgba(99, 102, 241, 0.15)' }) {
  return (
    <div className="card stat-card" style={{ borderTop: `2px solid ${color}` }}>
      <div className="stat-header">
        <span className="stat-title">{title}</span>
        <div className="stat-icon" style={{ background: glowColor, color: color }}>
          {Icon && <Icon size={20} />}
        </div>
      </div>
      <div className="stat-value">{value}</div>
      {subtitle && <div className="stat-footer">{subtitle}</div>}
    </div>
  );
}
