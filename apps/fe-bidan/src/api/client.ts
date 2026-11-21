import axios from 'axios';
import { createSession } from './session';

export const session = createSession({
  storageKey: 'bidan_access_token',
  roleKey: 'bidan_user_role',
});

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  headers: {
    'X-Client-App': 'BIDAN',
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async (config) => {
  const token = session.bacaToken();
  if (token) {
    if (session.perluRefresh(token)) {
      await session.refresh();
    }
    const tokenTerbaru = session.bacaToken() ?? token;
    config.headers.Authorization = `Bearer ${tokenTerbaru}`;
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
