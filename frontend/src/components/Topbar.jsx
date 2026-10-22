import React from 'react';
import { RefreshCw, FilePlus, Sun, Moon } from 'lucide-react';

const PAGE_META = {
  dashboard:      { breadcrumb: 'Inicio',        title: 'Panel de Control' },
  facturas:       { breadcrumb: 'Facturación',   title: 'Comprobantes Fiscales' },
  'nueva-factura':{ breadcrumb: 'Facturación',   title: 'Emitir Nuevo Comprobante' },
  clientes:       { breadcrumb: 'Administración',title: 'Gestión de Clientes' },
  productos:      { breadcrumb: 'Administración',title: 'Control de Inventario' },
};

export default function Topbar({ currentPage, onRefresh, isRefreshing, onNewInvoice, theme, onToggleTheme }) {
  const meta = PAGE_META[currentPage] || PAGE_META.dashboard;

  return (
    <header className="app-topbar">
      <div className="topbar-left">
        <div className="topbar-breadcrumb">
          <span>FacturaPyME</span>
          <span style={{ color: 'var(--text-disabled)' }}>/</span>
          <span>{meta.breadcrumb}</span>
        </div>
        <div className="topbar-title">{meta.title}</div>
      </div>

      <div className="topbar-actions">
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className="btn btn-ghost btn-icon"
            title={theme === 'office-dark' ? 'Cambiar a Oficina Claro' : 'Cambiar a Modo Nocturno'}
          >
            {theme === 'office-dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        )}

        <button
          onClick={onRefresh}
          className="btn btn-ghost btn-icon"
          title="Actualizar datos"
          disabled={isRefreshing}
        >
          <RefreshCw
            size={15}
            style={{
              transition: 'transform 0.5s',
              transform: isRefreshing ? 'rotate(360deg)' : 'rotate(0deg)',
              opacity: isRefreshing ? 0.5 : 1
            }}
          />
        </button>

        {currentPage !== 'nueva-factura' && (
          <button onClick={onNewInvoice} className="btn btn-primary btn-sm">
            <FilePlus size={14} />
            Emitir Factura
          </button>
        )}
      </div>
    </header>
  );
}
