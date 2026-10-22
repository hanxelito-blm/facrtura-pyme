import React, { useState } from 'react';
import {
  ArrowLeft, Plus, Trash2, FileCheck,
  AlertCircle, ChevronDown, Info
} from 'lucide-react';

const fmt = (n) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);

function nextDate(days = 30) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export default function NuevaFacturaPage({ clientes, productos, onSubmit, onCancel, isSubmitting }) {
  const [clienteId, setClienteId]         = useState('');
  const [fechaVenc, setFechaVenc]         = useState(nextDate(30));
  const [impuestoPct, setImpuestoPct]     = useState('16');
  const [notas, setNotas]                 = useState('');
  const [lineas, setLineas]               = useState([newRow()]);
  const [error, setError]                 = useState('');

  function newRow() {
    return { _id: Date.now() + Math.random(), producto_id: '', cantidad: 1, precio_unitario: 0, descuento_pct: 0, stock: 0 };
  }

  const onProductChange = (idx, prodId) => {
    const p = productos.find((x) => String(x.id) === String(prodId));
    setLineas((prev) => prev.map((r, i) => i !== idx ? r : {
      ...r, producto_id: prodId,
      precio_unitario: p ? p.precio : 0,
      stock: p ? p.stock : 0,
      cantidad: 1,
    }));
  };

  const onFieldChange = (idx, field, val) => {
    setLineas((prev) => prev.map((r, i) => i !== idx ? r : { ...r, [field]: val }));
  };

  const addRow = () => setLineas((p) => [...p, newRow()]);
  const removeRow = (idx) => {
    if (lineas.length <= 1) return;
    setLineas((p) => p.filter((_, i) => i !== idx));
  };

  const lineTotal = (r) => {
    const cant = Number(r.cantidad) || 0;
    const pu   = Number(r.precio_unitario) || 0;
    const desc = Number(r.descuento_pct) || 0;
    return Math.round(cant * pu * (1 - desc / 100) * 100) / 100;
  };

  const subtotal = lineas.reduce((s, r) => s + lineTotal(r), 0);
  const iva      = Math.round(subtotal * (Number(impuestoPct) / 100) * 100) / 100;
  const total    = Math.round((subtotal + iva) * 100) / 100;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!clienteId) return setError('Selecciona un cliente receptor.');
    if (lineas.some((r) => !r.producto_id)) return setError('Todos los conceptos deben tener producto seleccionado.');
    for (let i = 0; i < lineas.length; i++) {
      const r = lineas[i];
      if (Number(r.cantidad) <= 0) return setError(`Fila #${i+1}: la cantidad debe ser mayor a 0.`);
      if (Number(r.cantidad) > r.stock) {
        const p = productos.find((x) => String(x.id) === String(r.producto_id));
        return setError(`Fila #${i+1}: stock insuficiente para "${p?.nombre}" (disponible: ${r.stock}).`);
      }
    }
    onSubmit({
      cliente_id: Number(clienteId),
      fecha_vencimiento: fechaVenc,
      impuesto_pct: Number(impuestoPct),
      notas,
      lineas: lineas.map((r) => ({
        producto_id:     Number(r.producto_id),
        cantidad:        Number(r.cantidad),
        precio_unitario: Number(r.precio_unitario),
        descuento_pct:   Number(r.descuento_pct) || 0,
      })),
    });
  };

  const selectedCliente = clientes.find((c) => String(c.id) === String(clienteId));

  return (
    <div className="animate-in" style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={onCancel} className="btn btn-ghost btn-icon" title="Volver">
          <ArrowLeft size={16} />
        </button>
        <div>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 2 }}>
            Facturación / Nuevo Comprobante
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 700 }}>Emisión de Comprobante Fiscal</div>
        </div>
      </div>

      {error && (
        <div className="alert-banner alert-error mb-4">
          <AlertCircle size={15} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Section 1: Client & Dates */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <div>
              <div className="card-title">1. Información del Receptor y Condiciones</div>
            </div>
          </div>
          <div className="card-body">
            <div className="form-grid-3">
              <div className="form-group">
                <label className="form-label">Cliente Receptor <span className="required">*</span></label>
                <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} className="form-select" required>
                  <option value="">— Seleccionar cliente —</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}{c.rfc ? ` (${c.rfc})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Fecha de Vencimiento <span className="required">*</span></label>
                <input type="date" value={fechaVenc} onChange={(e) => setFechaVenc(e.target.value)} className="form-input" required />
              </div>
              <div className="form-group">
                <label className="form-label">Tasa de Impuesto (IVA)</label>
                <select value={impuestoPct} onChange={(e) => setImpuestoPct(e.target.value)} className="form-select">
                  <option value="16">16% — Tasa General</option>
                  <option value="8">8% — Zona Fronteriza</option>
                  <option value="0">0% — Exento / Exportación</option>
                </select>
              </div>
            </div>

            {selectedCliente && (
              <div className="alert-banner alert-info" style={{ marginTop: 4, marginBottom: 0 }}>
                <Info size={14} style={{ flexShrink: 0 }} />
                <span>
                  <strong>{selectedCliente.nombre}</strong> — {selectedCliente.email}
                  {selectedCliente.rfc ? ` · RFC: ${selectedCliente.rfc}` : ''}
                  {selectedCliente.telefono ? ` · Tel: ${selectedCliente.telefono}` : ''}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Line Items */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <div>
              <div className="card-title">2. Conceptos del Comprobante</div>
              <div className="card-subtitle">El stock se actualizará automáticamente al confirmar</div>
            </div>
            <button type="button" onClick={addRow} className="btn btn-outline btn-sm">
              <Plus size={13} /> Agregar Concepto
            </button>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>Producto / Servicio</th>
                  <th style={{ width: '12%', textAlign: 'center' }}>Cantidad</th>
                  <th style={{ width: '14%', textAlign: 'right' }}>Precio Unitario</th>
                  <th style={{ width: '10%', textAlign: 'right' }}>Desc %</th>
                  <th style={{ width: '14%', textAlign: 'right' }}>Importe</th>
                  <th style={{ width: '40px' }}></th>
                </tr>
              </thead>
              <tbody>
                {lineas.map((r, idx) => (
                  <tr key={r._id}>
                    <td>
                      <select
                        value={r.producto_id}
                        onChange={(e) => onProductChange(idx, e.target.value)}
                        className="form-select"
                        style={{ height: 32, fontSize: '0.78rem' }}
                        required
                      >
                        <option value="">— Seleccionar producto —</option>
                        {productos.map((p) => (
                          <option key={p.id} value={p.id} disabled={p.stock <= 0 || !p.activo}>
                            {p.nombre} · Stock: {p.stock} {p.unidad}{p.stock <= 0 ? ' [AGOTADO]' : ''}
                          </option>
                        ))}
                      </select>
                      {r.producto_id && (
                        <div className="text-xs text-muted" style={{ marginTop: 3 }}>
                          Stock disponible: <strong style={{ color: r.stock <= 10 ? 'var(--amber-500)' : 'var(--text-secondary)' }}>{r.stock}</strong>
                        </div>
                      )}
                    </td>
                    <td>
                      <input
                        type="number" min="0.01" step="any"
                        value={r.cantidad}
                        onChange={(e) => onFieldChange(idx, 'cantidad', e.target.value)}
                        className="form-input"
                        style={{ textAlign: 'center', height: 32 }}
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="number" step="0.01" min="0.01"
                        value={r.precio_unitario}
                        onChange={(e) => onFieldChange(idx, 'precio_unitario', e.target.value)}
                        className="form-input"
                        style={{ textAlign: 'right', height: 32 }}
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="number" min="0" max="99" step="0.5"
                        value={r.descuento_pct}
                        onChange={(e) => onFieldChange(idx, 'descuento_pct', e.target.value)}
                        className="form-input"
                        style={{ textAlign: 'right', height: 32 }}
                      />
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {fmt(lineTotal(r))}
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => removeRow(idx)}
                        className="btn btn-ghost btn-icon btn-sm"
                        style={{ color: 'var(--red-500)' }}
                        disabled={lineas.length <= 1}
                        title="Eliminar fila"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Notes */}
          <div className="card-body" style={{ paddingTop: 12 }}>
            <div className="form-group">
              <label className="form-label">Observaciones / Notas</label>
              <textarea
                rows={2}
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                className="form-textarea"
                placeholder="Condiciones de pago, número de orden de compra, instrucciones especiales…"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Totals & Submit */}
        <div className="card">
          <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24, flexWrap: 'wrap' }}>
            <div className="text-xs text-muted" style={{ maxWidth: 400, lineHeight: 1.6 }}>
              Al confirmar, se ejecutará una <strong style={{ color: 'var(--text-secondary)' }}>transacción SQL atómica</strong>:
              se registrarán las líneas de factura, se descontará el stock y se calcularán los totales.
              En caso de error, la operación se revertirá automáticamente (ROLLBACK).
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 32 }}>
              <div className="totals-block">
                <div className="total-row">
                  <span>Subtotal</span><span>{fmt(subtotal)}</span>
                </div>
                <div className="total-row">
                  <span>IVA ({impuestoPct}%)</span><span>{fmt(iva)}</span>
                </div>
                <div className="total-row grand">
                  <span>Total</span>
                  <span className="total-amount">{fmt(total)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={onCancel} className="btn btn-outline">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="btn btn-primary">
                  {isSubmitting ? (
                    <><span className="spinner" />&nbsp;Procesando…</>
                  ) : (
                    <><FileCheck size={15} /> Emitir Comprobante</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
