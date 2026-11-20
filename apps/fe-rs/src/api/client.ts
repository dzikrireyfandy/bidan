import axios from 'axios';
import { createSession } from './session';

export const session = createSession({
  storageKey: 'rs_access_token',
  roleKey: 'rs_user_role',
});

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  headers: {
    'X-Client-App': 'RS',
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async (config) => {
  const token = session.bacaToken();
  if (token) {
    if (session.perluRefresh(token)) {
      await session.refresh();
    }
    config.headers.Authorization = `Bearer ${session.bacaToken() ?? token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      session.bersihkan();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
