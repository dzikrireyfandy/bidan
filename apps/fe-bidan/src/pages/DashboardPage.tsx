import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { apiClient } from '../api/client';
import type { ApiErrorBody, ApiSuccess, KontenPublik } from '../api/types';

interface DashboardPageProps {
  onLogout: () => void;
}

type MenuKey = 'konten' | 'pasien' | 'anc' | 'persalinan' | 'bayi' | 'imunisasi' | 'kb' | 'reservasi' | 'jadwal';

const MENU: Array<{ key: MenuKey; label: string }> = [
  { key: 'konten', label: 'Pengumuman & Konten' },
  { key: 'pasien', label: 'Data Pasien' },
  { key: 'anc', label: 'Kehamilan & ANC' },
  { key: 'persalinan', label: 'Persalinan' },
  { key: 'bayi', label: 'Bayi & Neonatal' },
  { key: 'imunisasi', label: 'Imunisasi' },
  { key: 'kb', label: 'Pelayanan KB' },
  { key: 'reservasi', label: 'Reservasi' },
  { key: 'jadwal', label: 'Jadwal Praktik' }
];

export const DashboardPage: React.FC<DashboardPageProps> = ({ onLogout }) => {
  const [activeMenu, setActiveMenu] = useState<MenuKey>('konten');
  const [konten, setKonten] = useState<KontenPublik[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const peran = localStorage.getItem('bidan_user_role') ?? 'STAFF';

  const muatKonten = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.post<ApiSuccess<KontenPublik[]>>('/public/konten/list', { limit: 20 });
      setKonten(res.data.success ? res.data.data : []);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const body = err.response?.data as ApiErrorBody | undefined;
        setError(body?.error.message ?? 'Gagal memuat konten dari server.');
      } else {
        setError('Gagal terhubung ke server.');
      }
      setKonten([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeMenu === 'konten') {
      void muatKonten();
    }
  }, [activeMenu, muatKonten]);

  const judulAktif = MENU.find((m) => m.key === activeMenu)?.label ?? 'Dashboard';

  return (
    <div className="app-container">
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            BIDAN
            <span>Portal Layanan Ibu & Anak</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          {MENU.map((item) => (
            <button
              key={item.key}
              className={`nav-item ${activeMenu === item.key ? 'active' : ''}`}
              onClick={() => {
                setActiveMenu(item.key);
                setSidebarOpen(false);
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button className="btn btn-outline menu-toggle" onClick={() => setSidebarOpen((v) => !v)} aria-label="Buka menu">
              Menu
            </button>
            <h1 className="topbar-title">{judulAktif}</h1>
          </div>
          <div className="user-menu">
            <span className="user-role-badge">{peran}</span>
            <button className="btn btn-outline" onClick={onLogout}>
              Keluar
            </button>
          </div>
        </header>

        <main className="content-body">
          {activeMenu === 'konten' ? (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Pengumuman untuk Ibu & Keluarga</h2>
                <button className="btn btn-outline" onClick={() => void muatKonten()}>
                  Muat Ulang
                </button>
              </div>

              {loading && <div className="loading-state">Memuat konten...</div>}

              {!loading && error && (
                <div className="card-body">
                  <div className="alert alert-danger">{error}</div>
                </div>
              )}

              {!loading && !error && konten.length === 0 && (
                <div className="empty-state">Belum ada konten yang dipublikasikan.</div>
              )}

              {!loading && !error && konten.length > 0 && (
                <div className="konten-grid">
                  {konten.map((item) => (
                    <article className="konten-card" key={item.konten_id}>
                      <span className="badge badge-success">{item.tipe}</span>
                      <h3>{item.judul}</h3>
                      <p>{item.isi}</p>
                    </article>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Modul {judulAktif}</h2>
              </div>
              <div className="empty-state">
                Modul ini tersedia di API backend. Gunakan menu Pengumuman & Konten untuk melihat integrasi data langsung.
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
