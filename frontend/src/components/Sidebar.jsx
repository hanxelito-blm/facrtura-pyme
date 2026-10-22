import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  FilePlus,
  Users,
  Package,
  ChevronRight,
  Shield
} from 'lucide-react';

export default function Sidebar({ currentPage, setCurrentPage, healthOk }) {
  const navGroups = [
    {
      label: 'Principal',
      items: [
        { id: 'dashboard', label: 'Panel de Control', icon: LayoutDashboard },
      ]
    },
    {
      label: 'Facturación',
      items: [
        { id: 'facturas',      label: 'Comprobantes',   icon: Receipt },
        { id: 'nueva-factura', label: 'Emitir Factura', icon: FilePlus },
      ]
    },
    {
      label: 'Administración',
      items: [
        { id: 'clientes',  label: 'Clientes',   icon: Users },
        { id: 'productos', label: 'Inventario', icon: Package },
      ]
    },
  ];

  return (
    <aside className="app-sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="brand-logo">
          <Shield size={16} strokeWidth={2.5} />
        </div>
        <div className="brand-text">
          <div className="brand-name">FacturaPyME</div>
          <div className="brand-tagline">Enterprise Suite v1.0</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navGroups.map((group) => (
          <React.Fragment key={group.label}>
            <div className="sidebar-section-label">{group.label}</div>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={`nav-item${isActive ? ' active' : ''}`}
                >
                  <Icon size={15} className="nav-icon" />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {isActive && (
                    <ChevronRight size={13} style={{ color: 'var(--blue-400)', opacity: 0.7 }} />
                  )}
                </button>
              );
            })}
          </React.Fragment>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="server-status">
          <div className="status-indicator">
            <span className={`status-dot${healthOk ? '' : ' offline'}`} />
            <span className={`status-text${healthOk ? '' : ' offline'}`}>
              {healthOk ? 'Sistema Operativo' : 'Sin Conexión'}
            </span>
          </div>
        </div>
        <div className="sidebar-version">API v1.0 · SQLite</div>
      </div>
    </aside>
  );
}
