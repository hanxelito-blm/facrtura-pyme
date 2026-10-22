import React, { useState } from 'react';
import {
  Search, Eye, CheckCircle2, XCircle,
  Trash2, FilePlus, Filter, AlertCircle
} from 'lucide-react';
import Badge  from '../components/Badge';
import Modal  from '../components/Modal';

const fmt = (n) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);

export default function FacturasPage({
  facturas, loading, onNewInvoice, onCambiarEstado, onEliminarFactura,
  selectedInvoice, setSelectedInvoice, onViewInvoiceDetail
}) {
  const [search, setSearch]     = useState('');
  const [estado, setEstado]     = useState('todos');
  const [confirmId, setConfirmId] = useState(null);

  const filtered = (facturas || []).filter((f) => {
    const q = search.toLowerCase();
    const matchSearch = !q || f.folio.toLowerCase().includes(q)
      || (f.cliente_nombre && f.cliente_nombre.toLowerCase().includes(q))
      || (f.cliente_rfc && f.cliente_rfc.toLowerCase().includes(q));
    return matchSearch && (estado === 'todos' || f.estado === estado);
  });

  return (
    <div className="animate-in">
      {/* Toolbar */}
      <div className="page-toolbar">
        <div className="page-toolbar-left">
          <div className="search-bar-wrap">
            <Search size={14} className="search-bar-icon" />
            <input
              type="text"
              placeholder="Buscar por folio, cliente o RFC…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={13} style={{ color: 'var(--text-muted)' }} />
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="form-select"
              style={{ height: 34, width: 160 }}
            >
              <option value="todos">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="pagada">Pagada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>
        </div>

        <div className="page-toolbar-right">
          <span className="text-xs text-muted">{filtered.length} registro(s)</span>
          <button onClick={onNewInvoice} className="btn btn-primary btn-sm">
            <FilePlus size={14} /> Emitir Factura
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Folio</th>
                <th>Cliente</th>
                <th>Fecha Emisión</th>
                <th>Vencimiento</th>
                <th>Estado</th>
                <th style={{ textAlign: 'center' }}>Ítems</th>
                <th style={{ textAlign: 'right' }}>Importe Total</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1,2,3,4,5].map(i => (
                  <tr key={i}>
                    {[1,2,3,4,5,6,7,8].map(j => (
                      <td key={j}><div className="skeleton" style={{ height: 12, borderRadius: 3 }} /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="empty-state">
                      <div className="empty-state-icon">
                        <AlertCircle size={20} />
                      </div>
                      <div className="empty-state-title">Sin resultados</div>
                      <div className="empty-state-desc">Ajusta los filtros o emite un nuevo comprobante.</div>
                    </div>
                  </td>
                </tr>
              ) : filtered.map((f) => (
                <tr key={f.id}>
                  <td>
                    <span className="td-mono" style={{ color: 'var(--blue-400)', fontWeight: 600 }}>{f.folio}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{f.cliente_nombre}</div>
                    <div className="text-xs text-muted">{f.cliente_rfc || f.cliente_email}</div>
                  </td>
                  <td className="text-sm">{f.fecha_emision}</td>
                  <td className="text-sm">{f.fecha_vencimiento}</td>
                  <td><Badge status={f.estado} /></td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="text-xs text-muted">{f.total_items}</span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {fmt(f.total)}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                      <button
                        onClick={() => onViewInvoiceDetail(f.id)}
                        className="btn btn-ghost btn-icon btn-sm"
                        title="Ver detalle"
                      >
                        <Eye size={13} />
                      </button>
                      {f.estado === 'pendiente' && (
                        <button
                          onClick={() => onCambiarEstado(f.id, 'pagada')}
                          className="btn btn-success-soft btn-icon btn-sm"
                          title="Marcar pagada"
                        >
                          <CheckCircle2 size={13} />
                        </button>
                      )}
                      {f.estado !== 'cancelada' && (
                        <button
                          onClick={() => onCambiarEstado(f.id, 'cancelada')}
                          className="btn btn-ghost btn-icon btn-sm"
                          title="Cancelar"
                          style={{ color: 'var(--amber-500)' }}
                        >
                          <XCircle size={13} />
                        </button>
                      )}
                      <button
                        onClick={() => setConfirmId(f.id)}
                        className="btn btn-danger-soft btn-icon btn-sm"
                        title="Eliminar"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Detail Modal */}
      <Modal
        isOpen={Boolean(selectedInvoice)}
        onClose={() => setSelectedInvoice(null)}
        title={selectedInvoice ? `Comprobante ${selectedInvoice.folio}` : ''}
        subtitle={selectedInvoice ? `Cliente: ${selectedInvoice.cliente_nombre}` : ''}
        maxWidth={740}
      >
        {selectedInvoice && (
          <>
            <div className="invoice-detail-header">
              <div className="invoice-field-group">
                <div className="invoice-field-label">Razón Social / Receptor</div>
                <div className="invoice-field-value">{selectedInvoice.cliente_nombre}</div>
                <div className="text-xs text-muted mt-1">RFC: {selectedInvoice.cliente_rfc || '—'}</div>
                <div className="text-xs text-muted">{selectedInvoice.cliente_email}</div>
                {selectedInvoice.cliente_direccion && (
                  <div className="text-xs text-muted">{selectedInvoice.cliente_direccion}</div>
                )}
              </div>
              <div className="invoice-field-group">
                <div className="invoice-field-label">Datos del Comprobante</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span className="td-mono" style={{ color: 'var(--blue-400)', fontWeight: 700 }}>{selectedInvoice.folio}</span>
                  <Badge status={selectedInvoice.estado} />
                </div>
                <div className="text-xs text-muted">Emisión: <strong style={{ color: 'var(--text-secondary)' }}>{selectedInvoice.fecha_emision}</strong></div>
                <div className="text-xs text-muted">Vencimiento: <strong style={{ color: 'var(--text-secondary)' }}>{selectedInvoice.fecha_vencimiento}</strong></div>
              </div>
            </div>

            {/* Line Items */}
            <div className="table-wrapper" style={{ marginBottom: 16, border: '1px solid var(--divider)', borderRadius: 'var(--r-md)' }}>
              <table>
                <thead>
                  <tr>
                    <th>Descripción del Producto</th>
                    <th style={{ textAlign: 'center' }}>Cant.</th>
                    <th style={{ textAlign: 'right' }}>Precio Unit.</th>
                    <th style={{ textAlign: 'right' }}>Desc.</th>
                    <th style={{ textAlign: 'right' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedInvoice.lineas || []).map((l) => (
                    <tr key={l.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{l.producto_nombre}</div>
                        <div className="text-xs text-muted">{l.producto_unidad}</div>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{l.cantidad}</td>
                      <td style={{ textAlign: 'right' }}>{fmt(l.precio_unitario)}</td>
                      <td style={{ textAlign: 'right' }}>{l.descuento_pct}%</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>{fmt(l.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div className="totals-block">
                <div className="total-row">
                  <span>Subtotal</span>
                  <span>{fmt(selectedInvoice.subtotal)}</span>
                </div>
                <div className="total-row">
                  <span>IVA ({selectedInvoice.impuesto_pct}%)</span>
                  <span>{fmt(selectedInvoice.total - selectedInvoice.subtotal)}</span>
                </div>
                <div className="total-row grand">
                  <span>Total a Pagar</span>
                  <span className="total-amount">{fmt(selectedInvoice.total)}</span>
                </div>
              </div>
            </div>

            {selectedInvoice.notas && (
              <div className="text-xs text-muted" style={{ marginTop: 14, fontStyle: 'italic' }}>
                <strong>Observaciones:</strong> {selectedInvoice.notas}
              </div>
            )}

            <div className="modal-foot" style={{ marginTop: 16, padding: '12px 0 0' }}>
              <button onClick={() => setSelectedInvoice(null)} className="btn btn-outline btn-sm">
                Cerrar
              </button>
              {selectedInvoice.estado === 'pendiente' && (
                <button
                  onClick={() => { onCambiarEstado(selectedInvoice.id, 'pagada'); setSelectedInvoice(null); }}
                  className="btn btn-primary btn-sm"
                >
                  <CheckCircle2 size={13} /> Registrar Pago
                </button>
              )}
            </div>
          </>
        )}
      </Modal>

      {/* Confirm Delete */}
      <Modal isOpen={Boolean(confirmId)} onClose={() => setConfirmId(null)} title="Confirmar eliminación" maxWidth={440}>
        <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
          <div style={{ width: 48, height: 48, margin: '0 auto 14px', borderRadius: '50%', background: 'var(--red-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertCircle size={22} color="var(--red-600)" />
          </div>
          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
            ¿Eliminar este comprobante de forma permanente?
          </p>
          <p className="text-sm text-muted" style={{ marginBottom: 22, lineHeight: 1.5 }}>
            El stock de los productos se repondrá automáticamente. Esta acción no se puede deshacer.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button onClick={() => setConfirmId(null)} className="btn btn-outline btn-sm">Cancelar</button>
            <button
              onClick={() => { onEliminarFactura(confirmId); setConfirmId(null); }}
              className="btn btn-danger-soft btn-sm"
            >
              Confirmar Eliminación
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
