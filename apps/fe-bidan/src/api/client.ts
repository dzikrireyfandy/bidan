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

// Sinkronisasi token ke header default Authorization (Bearer)
export const sinkronisasiHeaderAuth = (token: string | null): void => {
  if (token) {
    if (typeof (apiClient.defaults.headers.common as any).set === 'function') {
      (apiClient.defaults.headers.common as any).set('Authorization', `Bearer ${token}`);
    } else {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  } else {
    if (typeof (apiClient.defaults.headers.common as any).delete === 'function') {
      (apiClient.defaults.headers.common as any).delete('Authorization');
    } else {
      delete apiClient.defaults.headers.common['Authorization'];
    }
  }
};

// Inisialisasi token saat app pertama kali dijalankan
sinkronisasiHeaderAuth(session.bacaToken());

// Wrap simpanToken & bersihkan agar setiap login/logout langsung memperbarui header axios
const originalSimpan = session.simpanToken;
session.simpanToken = (token: string) => {
  originalSimpan(token);
  sinkronisasiHeaderAuth(token);
};

const originalBersihkan = session.bersihkan;
session.bersihkan = () => {
  originalBersihkan();
  sinkronisasiHeaderAuth(null);
};

apiClient.interceptors.request.use(async (config) => {
  const token = session.bacaToken();
  if (token) {
    if (session.perluRefresh(token)) {
      try {
        await session.refresh();
      } catch {
        // Jika refresh gagal di background, tetap gunakan token saat ini
      }
    }
    const tokenTerbaru = session.bacaToken() ?? token;
    if (config.headers) {
      if (typeof (config.headers as any).set === 'function') {
        (config.headers as any).set('Authorization', `Bearer ${tokenTerbaru}`);
      } else {
        config.headers.Authorization = `Bearer ${tokenTerbaru}`;
      }
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || '';
    const isAuthEndpoint = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register');
    if (error.response && error.response.status === 401 && !isAuthEndpoint) {
      session.bersihkan();
      if (window.location.pathname.startsWith('/app')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
