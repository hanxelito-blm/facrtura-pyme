import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ICONS = {
  success: <CheckCircle2 size={16} color="var(--green-500)" />,
  error:   <AlertCircle  size={16} color="var(--red-500)"   />,
  warning: <AlertCircle  size={16} color="var(--amber-500)" />,
  info:    <Info         size={16} color="var(--blue-400)"  />,
};

export default function Toast({ toasts, onClose }) {
  if (!toasts?.length) return null;
  return (
    <div className="toast-stack">
      {toasts.map((t) => (
        <div key={t.id} className={`toast-item ${t.type}`}>
          <span className="toast-icon">{ICONS[t.type] || ICONS.info}</span>
          <span className="toast-message">{t.message}</span>
          <button className="toast-close" onClick={() => onClose(t.id)} aria-label="Cerrar">
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}
