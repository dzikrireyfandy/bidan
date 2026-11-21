import React, { useState } from 'react';
import { apiClient } from '../api/client';
import type { ApiSuccess, LoginResponse, ApiErrorBody } from '../api/types';
import axios from 'axios';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await apiClient.post<ApiSuccess<LoginResponse>>('/auth/login', {
        username,
        password,
      });

      if (response.data.success) {
        localStorage.setItem('bidan_access_token', response.data.data.token);
        localStorage.setItem('bidan_user_role', response.data.data.peran);
        onLoginSuccess();
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const data = err.response?.data as ApiErrorBody | undefined;
        setError(data?.error?.message || 'Gagal masuk. Periksa kembali kredensial Anda.');
      } else {
        setError('Terjadi kesalahan yang tidak diketahui.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">BIDAN</h1>
        <p className="login-subtitle">Portal Layanan Ibu &amp; Anak</p>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Masukkan username"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Kata Sandi</label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Masukkan kata sandi"
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  );
};
