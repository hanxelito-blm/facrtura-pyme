import React from 'react';
import {
  DollarSign, CheckCircle2, Clock, Users,
  Package, AlertTriangle, ArrowRight, TrendingUp
} from 'lucide-react';
import KpiCard from '../components/KpiCard';
import Badge  from '../components/Badge';

const fmt = (n) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 }).format(n || 0);

export default function DashboardPage({ data, loading, onNavigate, onSelectInvoice }) {
  if (loading || !data) {
    return (
      <div className="animate-in">
        <div className="kpi-grid">
          {[1,2,3,4].map(i => (
            <div key={i} className="kpi-card">
              <div className="skeleton" style={{ height: 12, width: '60%', marginBottom: 14 }} />
              <div className="skeleton" style={{ height: 28, width: '80%', marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 10, width: '40%' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const { metricas = {}, porEstado = [], topProductos = [], ultimasFacturas = [] } = data;

  return (
    <div className="animate-in">
      {/* KPI Row */}
      <div className="kpi-grid">
        <KpiCard
          label="Total Facturado"
          value={fmt(metricas.totalMontoFacturado)}
          sub={`${metricas.totalFacturas || 0} comprobantes emitidos`}
          icon={TrendingUp}
          accent="#6d4c41"
        />
        <KpiCard
          label="Ingresos Cobrados"
          value={fmt(metricas.totalPagado)}
          sub="Comprobantes con estado Pagado"
          icon={CheckCircle2}
          accent="#059669"
        />
        <KpiCard
          label="Cuentas por Cobrar"
          value={fmt(metricas.totalPendiente)}
          sub="Pendiente de liquidación"
          icon={Clock}
          accent="#d97706"
        />
        <KpiCard
          label="Clientes Activos"
          value={metricas.clientesActivos ?? 0}
          sub={`De ${metricas.totalClientes || 0} registrados en el sistema`}
          icon={Users}
          accent="#8d6e63"
        />
      </div>

      {/* Stock Alert */}
      {metricas.productosBajoStock > 0 && (
        <div className="alert-banner alert-warning mb-6">
          <AlertTriangle size={16} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1 }}>
            <strong>{metricas.productosBajoStock}</strong> producto(s) con stock crítico (≤ 10 unidades).
            Considere reabastecer.
          </span>
          <button onClick={() => onNavigate('productos')} className="btn btn-ghost btn-sm">
            Revisar inventario <ArrowRight size={12} />
          </button>
        </div>
      )}

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>

        {/* Recent Invoices */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Actividad Reciente</div>
              <div className="card-subtitle">Últimos comprobantes emitidos</div>
            </div>
            <button onClick={() => onNavigate('facturas')} className="btn btn-ghost btn-sm">
              Ver todos <ArrowRight size={12} />
            </button>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Folio</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'right' }}>Importe</th>
                </tr>
              </thead>
              <tbody>
                {ultimasFacturas.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty-state" style={{ padding: '28px' }}>
                        <div className="empty-state-title">Sin comprobantes</div>
                        <div className="empty-state-desc">Emita la primera factura para comenzar.</div>
                      </div>
                    </td>
                  </tr>
                ) : ultimasFacturas.map((f) => (
                  <tr
                    key={f.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => onSelectInvoice(f.id)}
                    title="Ver detalle"
                  >
                    <td>
                      <span className="td-mono" style={{ color: 'var(--blue-400)' }}>{f.folio}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{f.cliente_nombre}</span>
                    </td>
                    <td><span className="text-sm">{f.fecha_emision}</span></td>
                    <td><Badge status={f.estado} /></td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {fmt(f.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Estado de Facturación */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Distribución de Cartera</div>
                <div className="card-subtitle">Agrupado por estado</div>
              </div>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {porEstado.length === 0 ? (
                  <p className="text-sm text-muted">Sin datos disponibles.</p>
                ) : porEstado.map((row) => {
                  const pct = metricas.totalMontoFacturado > 0
                    ? (row.monto_total / metricas.totalMontoFacturado) * 100
                    : 0;
                  const color = row.estado === 'pagada' ? '#22c55e'
                    : row.estado === 'pendiente' ? '#f59e0b'
                    : '#ef4444';
                  return (
                    <div key={row.estado}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Badge status={row.estado} />
                          <span className="text-xs text-muted">{row.cantidad} factura(s)</span>
                        </span>
                        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {fmt(row.monto_total)}
                        </span>
                      </div>
                      <div style={{ height: 4, borderRadius: 4, background: 'var(--bg-elevated)' }}>
                        <div style={{
                          height: '100%',
                          width: `${pct.toFixed(1)}%`,
                          borderRadius: 4,
                          background: color,
                          transition: 'width 0.5s ease',
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Top Products */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Top Productos</div>
                <div className="card-subtitle">Por volumen de venta</div>
              </div>
            </div>
            <div className="card-body">
              <div className="rank-list">
                {topProductos.length === 0 ? (
                  <p className="text-sm text-muted">Sin ventas registradas.</p>
                ) : topProductos.map((p, idx) => (
                  <div key={p.id} className="rank-item">
                    <span className="rank-number">{idx + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="rank-name truncate">{p.nombre}</div>
                      <div className="rank-sub">{p.unidades_vendidas} {p.unidad}(s)</div>
                    </div>
                    <span className="rank-value">{fmt(p.total_ingresos)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
