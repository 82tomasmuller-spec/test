import axios from 'axios';
import type {
  AuthResponse,
  User,
  Shop,
  Monitor,
  Incident,
  Stats,
  ResponseTimeStats,
  Overview,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  register: (data: { email: string; password: string; name: string }) =>
    api.post<AuthResponse>('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', data),
  getMe: () => api.get<User>('/auth/me'),
};

// Shops
export const shopsApi = {
  getAll: () => api.get<Shop[]>('/shops'),
  getOne: (id: number) => api.get<Shop>(`/shops/${id}`),
  create: (data: { name: string; domain: string; description?: string }) =>
    api.post<Shop>('/shops', data),
  update: (id: number, data: Partial<Shop>) => api.put<Shop>(`/shops/${id}`, data),
  delete: (id: number) => api.delete(`/shops/${id}`),
};

// Monitors
export const monitorsApi = {
  getAll: () => api.get<Monitor[]>('/monitors'),
  getByShop: (shopId: number) => api.get<Monitor[]>(`/monitors/shop/${shopId}`),
  getOne: (id: number) => api.get<Monitor>(`/monitors/${id}`),
  create: (data: { shopId: number; url: string; checkInterval?: number }) =>
    api.post<Monitor>('/monitors', data),
  update: (id: number, data: Partial<Monitor>) => api.put<Monitor>(`/monitors/${id}`, data),
  delete: (id: number) => api.delete(`/monitors/${id}`),
};

// Incidents
export const incidentsApi = {
  getAll: (params?: { status?: string; limit?: number }) =>
    api.get<Incident[]>('/incidents', { params }),
  getByMonitor: (monitorId: number) => api.get<Incident[]>(`/incidents/monitor/${monitorId}`),
  getOne: (id: number) => api.get<Incident>(`/incidents/${id}`),
  exportCsv: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/incidents/export/csv', { params, responseType: 'blob' }),
};

// Stats
export const statsApi = {
  getUptime: (shopId: number, days?: number) =>
    api.get<Stats>(`/stats/uptime/${shopId}`, { params: { days } }),
  getResponseTime: (monitorId: number, days?: number) =>
    api.get<ResponseTimeStats>(`/stats/response-time/${monitorId}`, { params: { days } }),
  getOverview: () => api.get<Overview>('/stats/overview'),
};

export default api;
