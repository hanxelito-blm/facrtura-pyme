import React from 'react';
import { Plus, RefreshCw, Bell } from 'lucide-react';

export default function Header({ title, subtitle, onRefresh, onNewInvoice, isRefreshing }) {
  return (
    <header className="app-header">
      <div className="header-left">
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>

      <div className="header-actions">
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="btn btn-secondary btn-icon"
            title="Recargar datos"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-pulse' : ''} />
          </button>
        )}

        {onNewInvoice && (
          <button onClick={onNewInvoice} className="btn btn-primary">
            <Plus size={16} />
            <span>Emitir Factura</span>
          </button>
        )}
      </div>
    </header>
  );
}
