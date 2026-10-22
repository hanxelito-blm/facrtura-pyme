import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Receipt, Mail, Phone, MapPin, Users } from 'lucide-react';
import Modal from '../components/Modal';
import Badge from '../components/Badge';

const fmt = (n) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);

function initials(name = '') {
  return name.split(' ').slice(0, 2).map((w) => w[0] || '').join('').toUpperCase() || '??';
}

export default function ClientesPage({
  clientes, loading,
  onCreateCliente, onUpdateCliente, onDeleteCliente,
  onViewClientInvoices, selectedClientDetail, setSelectedClientDetail
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', direccion: '', rfc: '', activo: true });

  const openCreate = () => {
    setEditing(null);
    setForm({ nombre: '', email: '', telefono: '', direccion: '', rfc: '', activo: true });
    setIsOpen(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({ nombre: c.nombre || '', email: c.email || '', telefono: c.telefono || '', direccion: c.direccion || '', rfc: c.rfc || '', activo: Boolean(c.activo) });
    setIsOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editing) onUpdateCliente(editing.id, form);
    else onCreateCliente(form);
    setIsOpen(false);
  };

  return (
    <div className="animate-in">
      {/* Toolbar */}
      <div className="page-toolbar">
        <div>
          <span className="text-xs text-muted">{clientes.length} cliente(s) registrado(s)</span>
        </div>
        <button onClick={openCreate} className="btn btn-primary btn-sm">
          <Plus size={14} /> Nuevo Cliente
        </button>
      </div>

      {/* Cards grid */}
      <div className="grid-auto">
        {loading ? (
          [1,2,3].map(i => (
            <div key={i} className="client-card">
              <div className="client-card-header">
                <div className="skeleton" style={{ width: 38, height: 38, borderRadius: 8 }} />
                <div style={{ flex: 1, paddingLeft: 8 }}>
                  <div className="skeleton" style={{ height: 12, width: '70%', marginBottom: 6 }} />
                  <div className="skeleton" style={{ height: 10, width: '40%' }} />
                </div>
              </div>
            </div>
          ))
        ) : clientes.length === 0 ? (
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div className="empty-state">
              <div className="empty-state-icon"><Users size={20} /></div>
              <div className="empty-state-title">Sin clientes</div>
              <div className="empty-state-desc">Registra tu primer cliente para comenzar a emitir comprobantes.</div>
            </div>
          </div>
        ) : clientes.map((c) => (
          <div key={c.id} className="client-card">
            <div className="client-card-header">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1 }}>
                <div className="client-avatar">{initials(c.nombre)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="client-name truncate" title={c.nombre}>{c.nombre}</div>
                  {c.rfc ? (
                    <div className="client-rfc">{c.rfc}</div>
                  ) : (
                    <div className="text-xs text-muted">Sin RFC</div>
                  )}
                </div>
              </div>
              <Badge status={c.activo ? 'activo' : 'inactivo'} />
            </div>

            <div className="client-info">
              <div className="client-info-row">
                <Mail size={12} />
                <span className="truncate">{c.email}</span>
              </div>
              {c.telefono && (
                <div className="client-info-row">
                  <Phone size={12} />
                  <span>{c.telefono}</span>
                </div>
              )}
              {c.direccion && (
                <div className="client-info-row">
                  <MapPin size={12} />
                  <span className="truncate text-xs" title={c.direccion}>{c.direccion}</span>
                </div>
              )}
            </div>

            <div className="client-actions">
              <button onClick={() => onViewClientInvoices(c.id)} className="btn btn-ghost btn-sm">
                <Receipt size={13} /> Comprobantes
              </button>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => openEdit(c)} className="btn btn-ghost btn-icon btn-sm" title="Editar">
                  <Edit2 size={13} />
                </button>
                <button onClick={() => onDeleteCliente(c.id)} className="btn btn-danger-soft btn-icon btn-sm" title="Eliminar">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={editing ? 'Editar Cliente' : 'Registrar Cliente'}
        subtitle={editing ? 'Actualice los datos del cliente seleccionado' : 'Complete la información del nuevo receptor'}
        maxWidth={520}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Razón Social / Nombre <span className="required">*</span></label>
            <input type="text" required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className="form-input" placeholder="Empresa o nombre completo" />
          </div>
          <div className="form-group">
            <label className="form-label">Correo Electrónico <span className="required">*</span></label>
            <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="form-input" placeholder="contacto@empresa.com" />
          </div>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Teléfono</label>
              <input type="text" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                className="form-input" placeholder="55-1234-5678" />
            </div>
            <div className="form-group">
              <label className="form-label">RFC / NIT</label>
              <input type="text" value={form.rfc} onChange={(e) => setForm({ ...form, rfc: e.target.value.toUpperCase() })}
                className="form-input font-mono" placeholder="XAXX010101000" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Dirección Fiscal</label>
            <input type="text" value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })}
              className="form-input" placeholder="Calle, número, colonia, C.P., ciudad" />
          </div>
          {editing && (
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox" id="activo-check" checked={form.activo}
                onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                style={{ width: 15, height: 15, accentColor: 'var(--blue-500)' }}
              />
              <label htmlFor="activo-check" className="form-label" style={{ margin: 0, cursor: 'pointer' }}>
                Cliente activo (permite emitir facturas)
              </label>
            </div>
          )}
          <div className="modal-foot" style={{ padding: '16px 0 0' }}>
            <button type="button" onClick={() => setIsOpen(false)} className="btn btn-outline btn-sm">Cancelar</button>
            <button type="submit" className="btn btn-primary btn-sm">
              {editing ? 'Guardar Cambios' : 'Registrar Cliente'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Client Invoice History Modal */}
      <Modal
        isOpen={Boolean(selectedClientDetail)}
        onClose={() => setSelectedClientDetail(null)}
        title={selectedClientDetail?.nombre || 'Historial'}
        subtitle="Historial de comprobantes asociados"
        maxWidth={660}
      >
        {selectedClientDetail && (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Folio</th>
                  <th>Fecha Emisión</th>
                  <th>Vencimiento</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {!selectedClientDetail.facturas?.length ? (
                  <tr><td colSpan={5}>
                    <div className="empty-state" style={{ padding: '24px' }}>
                      <div className="empty-state-title">Sin comprobantes</div>
                    </div>
                  </td></tr>
                ) : selectedClientDetail.facturas.map((f) => (
                  <tr key={f.id}>
                    <td><span className="td-mono" style={{ color: 'var(--blue-400)' }}>{f.folio}</span></td>
                    <td className="text-sm">{f.fecha_emision}</td>
                    <td className="text-sm">{f.fecha_vencimiento}</td>
                    <td><Badge status={f.estado} /></td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>{fmt(f.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  );
}
