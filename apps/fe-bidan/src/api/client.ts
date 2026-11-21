import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  headers: {
    'X-Client-App': 'BIDAN',
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('bidan_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('bidan_access_token');
      localStorage.removeItem('bidan_user_role');
      // Jangan langsung redirect hard page jika di beranda publik
      if (window.location.pathname.startsWith('/app')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
