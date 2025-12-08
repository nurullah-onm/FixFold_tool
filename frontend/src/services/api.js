import axios from 'axios';

const defaultHost = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
const defaultPort = import.meta.env.VITE_API_PORT || 4000;
const API_BASE = import.meta.env.VITE_API_BASE || `http://${defaultHost}:${defaultPort}/api`;

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000
});

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

export const getHealth = () => api.get('/health');
export const login = (credentials) => api.post('/auth/login', credentials);
export const getInbounds = () => api.get('/inbounds');
export const createInbound = (data) => api.post('/inbounds', data);
export const getClients = () => api.get('/clients');
export const createClient = (data) => api.post('/clients', data);
export const getClientQr = (id) => api.get(`/clients/${id}/qrcode`);
export const getClientSubscription = (id) => api.get(`/clients/${id}/subscription`);
export const getServers = () => api.get('/servers');
export const createServer = (data) => api.post('/servers', data);
export const healthCheckServer = (id) => api.post(`/servers/${id}/health-check`);
export const autoBalanceServers = () => api.post('/servers/auto-balance');
export const getAnomalies = () => api.get('/ai/anomalies');
export const getAiStats = () => api.get('/ai/stats');
export const resolveAnomaly = (id) => api.post(`/ai/anomalies/${id}/resolve`);
export const saveSettings = (payload) => api.post('/settings/update', payload);

export default api;
