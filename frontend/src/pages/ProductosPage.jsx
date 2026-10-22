import React, { useState } from 'react';
import { Plus, Edit2, Trash2, BarChart2, Package, AlertTriangle } from 'lucide-react';
import Modal from '../components/Modal';

const fmt = (n) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);

const UNITS = ['pieza', 'paquete', 'caja', 'resma', 'kg', 'litro', 'hora'];

const accentFor = (p) => {
  if (!p.activo) return '#64748b';
  if (p.stock <= 0)  return '#dc2626';
  if (p.stock <= 10) return '#d97706';
  return '#059669';
};

export default function ProductosPage({
  productos, loading,
  onCreateProducto, onUpdateProducto, onDeleteProducto,
  onViewProductStats, selectedProductDetail, setSelectedProductDetail
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nombre: '', descripcion: '', precio: '', stock: '', unidad: 'pieza', activo: true });

  const openCreate = () => {
    setEditing(null);
    setForm({ nombre: '', descripcion: '', precio: '', stock: '', unidad: 'pieza', activo: true });
    setIsOpen(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({ nombre: p.nombre || '', descripcion: p.descripcion || '', precio: p.precio || '', stock: p.stock ?? '', unidad: p.unidad || 'pieza', activo: Boolean(p.activo) });
    setIsOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form, precio: Number(form.precio), stock: Number(form.stock) };
    if (editing) onUpdateProducto(editing.id, payload);
    else onCreateProducto(payload);
    setIsOpen(false);
  };

  return (
    <div className="animate-in">
      {/* Toolbar */}
      <div className="page-toolbar">
        <div>
          <span className="text-xs text-muted">{productos.length} producto(s) en catálogo</span>
        </div>
        <button onClick={openCreate} className="btn btn-primary btn-sm">
          <Plus size={14} /> Nuevo Producto
        </button>
      </div>

      {/* Cards Grid */}
      <div className="grid-auto">
        {loading ? (
          [1,2,3,4].map(i => (
            <div key={i} className="product-card">
              <div className="skeleton" style={{ height: 14, width: '60%', marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 10, width: '80%', marginBottom: 16 }} />
              <div className="product-stats">
                <div className="skeleton" style={{ height: 48, borderRadius: 8 }} />
                <div className="skeleton" style={{ height: 48, borderRadius: 8 }} />
              </div>
            </div>
          ))
        ) : productos.length === 0 ? (
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div className="empty-state">
              <div className="empty-state-icon"><Package size={20} /></div>
              <div className="empty-state-title">Inventario vacío</div>
              <div className="empty-state-desc">Agrega productos al catálogo para comenzar.</div>
            </div>
          </div>
        ) : productos.map((p) => {
          const accent = accentFor(p);
          return (
            <div key={p.id} className="product-card" style={{ '--kpi-accent': accent }}>
              <div className="product-card-accent" />

              <div style={{ paddingLeft: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <div className="product-name">{p.nombre}</div>
                  <span style={{
                    fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '0.06em', color: 'var(--text-muted)',
                    background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: 3, flexShrink: 0, marginLeft: 4
                  }}>
                    {p.unidad}
                  </span>
                </div>
                {p.descripcion && <div className="product-desc">{p.descripcion}</div>}

                <div className="product-stats">
                  <div className="product-stat">
                    <div className="product-stat-label">Precio Unit.</div>
                    <div className="product-stat-value" style={{ color: 'var(--green-700)' }}>{fmt(p.precio)}</div>
                  </div>
                  <div className="product-stat">
                    <div className="product-stat-label">Stock</div>
                    <div className="product-stat-value" style={{ color: accent, display: 'flex', alignItems: 'center', gap: 4 }}>
                      {p.stock}
                      {p.stock <= 10 && p.stock >= 0 && <AlertTriangle size={13} />}
                    </div>
                  </div>
                </div>
              </div>

              <div className="product-actions">
                <button onClick={() => onViewProductStats(p.id)} className="btn btn-ghost btn-sm">
                  <BarChart2 size={13} /> Métricas
                </button>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => openEdit(p)} className="btn btn-ghost btn-icon btn-sm" title="Editar">
                    <Edit2 size={13} />
                  </button>
                  <button onClick={() => onDeleteProducto(p.id)} className="btn btn-danger-soft btn-icon btn-sm" title="Eliminar">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create / Edit Modal */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}
        title={editing ? 'Editar Producto' : 'Nuevo Producto'}
        subtitle="Complete la información del artículo o servicio"
        maxWidth={500}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nombre del Producto / Servicio <span className="required">*</span></label>
            <input type="text" required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className="form-input" placeholder="Ej. Laptop Dell XPS 15" />
          </div>
          <div className="form-group">
            <label className="form-label">Descripción</label>
            <textarea rows={2} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              className="form-textarea" placeholder="Especificaciones técnicas, marca, modelo…" />
          </div>
          <div className="form-grid-3">
            <div className="form-group">
              <label className="form-label">Precio (MXN) <span className="required">*</span></label>
              <input type="number" step="0.01" min="0.01" required value={form.precio}
                onChange={(e) => setForm({ ...form, precio: e.target.value })}
                className="form-input" placeholder="0.00" />
            </div>
            <div className="form-group">
              <label className="form-label">Stock Inicial <span className="required">*</span></label>
              <input type="number" min="0" step="1" required value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                className="form-input" placeholder="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Unidad</label>
              <select value={form.unidad} onChange={(e) => setForm({ ...form, unidad: e.target.value })} className="form-select">
                {UNITS.map((u) => <option key={u} value={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div className="modal-foot" style={{ padding: '16px 0 0' }}>
            <button type="button" onClick={() => setIsOpen(false)} className="btn btn-outline btn-sm">Cancelar</button>
            <button type="submit" className="btn btn-primary btn-sm">
              {editing ? 'Actualizar' : 'Crear Producto'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Product Stats Modal */}
      <Modal isOpen={Boolean(selectedProductDetail)} onClose={() => setSelectedProductDetail(null)}
        title={selectedProductDetail?.nombre || 'Métricas'} subtitle="Indicadores de desempeño de ventas"
        maxWidth={440}
      >
        {selectedProductDetail && (
          <div className="grid-2" style={{ gap: 12 }}>
            {[
              { label: 'Unidades Vendidas', value: selectedProductDetail.stats?.total_unidades_vendidas || 0, accent: '#8d6e63' },
              { label: 'Total Recaudado', value: fmt(selectedProductDetail.stats?.total_recaudado), accent: '#22c55e' },
              { label: 'En Facturas', value: `${selectedProductDetail.stats?.total_facturas_incluido || 0} doc.`, accent: '#a1887f' },
              { label: 'Stock Actual', value: selectedProductDetail.stock, accent: accentFor(selectedProductDetail) },
            ].map(({ label, value, accent }) => (
              <div key={label} className="invoice-field-group" style={{ borderTop: `2px solid ${accent}` }}>
                <div className="invoice-field-label">{label}</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: accent, marginTop: 4 }}>{value}</div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
