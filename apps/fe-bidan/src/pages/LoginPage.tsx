import React, { useState } from 'react';
import { apiClient, session } from '../api/client';
import { pesanErrorApi } from '../api/errors';
import type { ApiSuccess, LoginResponse } from '../api/types';

interface LoginPageProps {
  onLoginSuccess: (role: 'SUPERADMIN' | 'ADMIN_LOKAL' | 'DOKTER' | 'PASIEN') => void;
  onBackToHome: () => void;
  initialRole?: 'superadmin' | 'admin' | 'bidan' | 'pasien';
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onBackToHome, initialRole = 'admin' }) => {
  const [selectedRole, setSelectedRole] = useState<'superadmin' | 'admin' | 'bidan' | 'pasien'>(initialRole);
  const [identifier, setIdentifier] = useState(
    initialRole === 'pasien' ? '085377998889' : initialRole === 'bidan' ? 'bidan.ria' : initialRole === 'superadmin' ? 'superadmin' : 'admin.loket'
  );
  const [secret, setSecret] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTabChange = (roleKey: 'superadmin' | 'admin' | 'bidan' | 'pasien') => {
    setSelectedRole(roleKey);
    setError(null);
    if (roleKey === 'pasien') {
      setIdentifier('085377998889');
      setSecret('password123');
    } else if (roleKey === 'bidan') {
      setIdentifier('bidan.ria');
      setSecret('password123');
    } else if (roleKey === 'superadmin') {
      setIdentifier('superadmin');
      setSecret('password123');
    } else {
      setIdentifier('admin.loket');
      setSecret('password123');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // PANGGIL LANGSUNG ENDPOINT BACKEND /auth/login KE DATABASE SQL
      const response = await apiClient.post<ApiSuccess<LoginResponse>>('/auth/login', {
        username: identifier,
        password: secret,
      });

      if (response.data && response.data.success) {
        const { token, peran } = response.data.data;
        session.simpanToken(token);
        
        let roleType: 'SUPERADMIN' | 'ADMIN_LOKAL' | 'DOKTER' | 'PASIEN' = 'ADMIN_LOKAL';
        if (peran === 'SUPERADMIN') roleType = 'SUPERADMIN';
        else if (peran === 'DOKTER') roleType = 'DOKTER';
        else if (peran === 'PASIEN') roleType = 'PASIEN';
        else roleType = 'ADMIN_LOKAL';

        localStorage.setItem('bidan_user_role', roleType);
        setLoading(false);
        onLoginSuccess(roleType);
        return;
      }
    } catch (err: unknown) {
      const msg = pesanErrorApi(err, 'Gagal masuk. Periksa kembali username dan kata sandi di database.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at 50% 10%, #f4e8ff 0%, #fbf9fd 70%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: '520px', background: '#ffffff', borderRadius: '24px', border: '1px solid var(--border-medium)', boxShadow: '0 25px 50px -12px rgba(78, 32, 112, 0.15)', padding: '2.25rem 2rem' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <img
            src="/logo-bidan.png"
            alt="Logo Bidan Ria"
            style={{ width: '70px', height: '70px', objectFit: 'contain', margin: '0 auto 0.75rem auto', display: 'block' }}
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.src.includes('public/logo-bidan.png')) {
                target.src = './public/logo-bidan.png';
              }
            }}
          />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary-dark)', lineHeight: 1.2 }}>
            Portal Layanan Kesehatan
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-slate-500)', marginTop: '0.25rem' }}>
            Praktik Mandiri Bidan Ria Indrasti J. S.keb — Kota Jambi
          </p>
        </div>

        {/* 4 Segmented Role Tabs (Pasien, Bidan, Admin, Superadmin) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.3rem', background: '#f8f4fc', padding: '0.35rem', borderRadius: '12px', marginBottom: '1.75rem', border: '1px solid #efe8f6' }}>
          <button
            type="button"
            onClick={() => handleTabChange('pasien')}
            style={{
              padding: '0.6rem 0.25rem',
              borderRadius: '9px',
              fontSize: '0.75rem',
              fontWeight: 700,
              background: selectedRole === 'pasien' ? '#ffffff' : 'transparent',
              color: selectedRole === 'pasien' ? 'var(--color-primary-dark)' : 'var(--color-slate-600)',
              boxShadow: selectedRole === 'pasien' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.15rem'
            }}
          >
            <span>Pasien</span>
            <span style={{ fontSize: '0.625rem', fontWeight: 500, color: selectedRole === 'pasien' ? 'var(--color-primary)' : 'var(--color-slate-400)' }}>KIA</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('bidan')}
            style={{
              padding: '0.6rem 0.25rem',
              borderRadius: '9px',
              fontSize: '0.75rem',
              fontWeight: 700,
              background: selectedRole === 'bidan' ? '#ffffff' : 'transparent',
              color: selectedRole === 'bidan' ? 'var(--color-primary-dark)' : 'var(--color-slate-600)',
              boxShadow: selectedRole === 'bidan' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.15rem'
            }}
          >
            <span>Bidan Ria</span>
            <span style={{ fontSize: '0.625rem', fontWeight: 500, color: selectedRole === 'bidan' ? 'var(--color-primary)' : 'var(--color-slate-400)' }}>RME</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('admin')}
            style={{
              padding: '0.6rem 0.25rem',
              borderRadius: '9px',
              fontSize: '0.75rem',
              fontWeight: 700,
              background: selectedRole === 'admin' ? '#ffffff' : 'transparent',
              color: selectedRole === 'admin' ? 'var(--color-primary-dark)' : 'var(--color-slate-600)',
              boxShadow: selectedRole === 'admin' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.15rem'
            }}
          >
            <span>Admin Loket</span>
            <span style={{ fontSize: '0.625rem', fontWeight: 500, color: selectedRole === 'admin' ? 'var(--color-primary)' : 'var(--color-slate-400)' }}>Antrean</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('superadmin')}
            style={{
              padding: '0.6rem 0.25rem',
              borderRadius: '9px',
              fontSize: '0.75rem',
              fontWeight: 700,
              background: selectedRole === 'superadmin' ? '#ffffff' : 'transparent',
              color: selectedRole === 'superadmin' ? 'var(--color-primary-dark)' : 'var(--color-slate-600)',
              boxShadow: selectedRole === 'superadmin' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.15rem'
            }}
          >
            <span>Superadmin</span>
            <span style={{ fontSize: '0.625rem', fontWeight: 500, color: selectedRole === 'superadmin' ? 'var(--color-primary)' : 'var(--color-slate-400)' }}>Log Audit</span>
          </button>
        </div>

        {/* Error Alert from Real Backend API */}
        {error && (
          <div style={{ marginBottom: '1.25rem', padding: '0.85rem 1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', color: '#b91c1c', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span>{error}</span>
          </div>
        )}

        {/* Clean Login Form connected to backend POST /api/v1/auth/login */}
        <form onSubmit={handleFormSubmit}>
          <div style={{ marginBottom: '1.15rem' }}>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-slate-700)', marginBottom: '0.4rem' }}>
              {selectedRole === 'pasien' ? 'Nomor WhatsApp / NIK Pasien' : 'ID Petugas / Username'}
            </label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={selectedRole === 'pasien' ? 'Contoh: 085377998889' : 'Masukkan ID Pengguna'}
              style={{ width: '100%', padding: '0.75rem 0.85rem', borderRadius: '10px', border: '1px solid var(--border-medium)', fontSize: '0.9375rem', outline: 'none' }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-slate-700)', marginBottom: '0.4rem' }}>
              Kata Sandi
            </label>
            <input
              type="password"
              required
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Masukkan sandi akses"
              style={{ width: '100%', padding: '0.75rem 0.85rem', borderRadius: '10px', border: '1px solid var(--border-medium)', fontSize: '0.9375rem', outline: 'none' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-shimmer"
            style={{ width: '100%', padding: '0.85rem', fontSize: '0.9375rem', fontWeight: 700 }}
          >
            {loading ? 'Memverifikasi ke Database...' : `Masuk sebagai ${selectedRole === 'pasien' ? 'Pasien' : selectedRole === 'bidan' ? 'Bidan Ria' : selectedRole === 'superadmin' ? 'Superadmin (Log Audit)' : 'Admin Klinik (Operasional)'}`}
          </button>
        </form>

        {/* Back to Home Link */}
        <div style={{ marginTop: '1.75rem', textAlign: 'center', paddingTop: '1.15rem', borderTop: '1px solid var(--border-light)' }}>
          <button
            type="button"
            onClick={onBackToHome}
            style={{ color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
            <span>Kembali ke Halaman Utama</span>
          </button>
        </div>

      </div>
    </div>
  );
};
