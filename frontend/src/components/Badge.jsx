import React from 'react';

export default function Badge({ status }) {
  const s = String(status || '').toLowerCase();
  const label =
    s === 'pagada'    ? 'Pagada'    :
    s === 'pendiente' ? 'Pendiente' :
    s === 'cancelada' ? 'Cancelada' :
    s === 'activo'    ? 'Activo'    :
    s === 'inactivo'  ? 'Inactivo'  :
    status;

  return (
    <span className={`badge badge-${s}`}>
      <span className="badge-dot" />
      {label}
    </span>
  );
}
