import { api } from './api';

export const resumenService = {
  getMetricas: () => api.get('/resumen'),
  getHealth: () => api.get('/health'),
};
