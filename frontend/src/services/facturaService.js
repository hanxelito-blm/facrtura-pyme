import { api } from './api';

export const facturaService = {
  getAll: () => api.get('/facturas'),
  getById: (id) => api.get(`/facturas/${id}`),
  create: (data) => api.post('/facturas', data),
  cambiarEstado: (id, estado) => api.patch(`/facturas/${id}/estado`, { estado }),
  delete: (id) => api.delete(`/facturas/${id}`),
};
