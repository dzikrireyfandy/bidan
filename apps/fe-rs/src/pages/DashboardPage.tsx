import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { pesanErrorApi } from '../api/errors';
import type { ApiSuccess, Ruangan } from '../api/types';

interface DashboardPageProps {
  onLogout: () => void;
}

type MenuKey =
  | 'pasien'
  | 'reservasi'
  | 'rawat-inap'
  | 'igd'
  | 'penunjang'
  | 'farmasi'
  | 'keuangan'
  | 'master'
  | 'laporan'
  | 'audit';

export const DashboardPage: React.FC<DashboardPageProps> = ({ onLogout }) => {
  const [activeMenu, setActiveMenu] = useState<MenuKey>('master');
  const [ruanganList, setRuanganList] = useState<Ruangan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const userRole = localStorage.getItem('rs_user_role') || 'STAFF';

  const menuItems: { key: MenuKey; label: string }[] = [
    { key: 'pasien', label: 'Pasien' },
    { key: 'reservasi', label: 'Reservasi' },
    { key: 'rawat-inap', label: 'Rawat Inap' },
    { key: 'igd', label: 'IGD & Triase' },
    { key: 'penunjang', label: 'Penunjang' },
    { key: 'farmasi', label: 'Farmasi & Inventaris' },
    { key: 'keuangan', label: 'Keuangan' },
    { key: 'master', label: 'Master Data (Ruangan)' },
    { key: 'laporan', label: 'Laporan' },
    { key: 'audit', label: 'Audit' },
  ];

  const fetchRuangan = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.post<ApiSuccess<Ruangan[]>>('/ruangan/list', {});
      if (res.data.success) {
        setRuanganList(res.data.data);
      }
    } catch (err: unknown) {
      setError(pesanErrorApi(err, 'Gagal memuat data ruangan dari server.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeMenu === 'master') {
      fetchRuangan();
    }
  }, [activeMenu]);

  return (
    <div className="app-container">
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            SIMRS
            <span>Rumah Sakit Umum</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              className="btn btn-outline menu-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              Menu
            </button>
            <h1 className="topbar-title">
              {menuItems.find((m) => m.key === activeMenu)?.label || 'Dashboard'}
            </h1>
          </div>
          <div className="user-menu">
            <span className="user-role-badge">{userRole}</span>
            <button className="btn btn-outline" onClick={onLogout}>
              Keluar
            </button>
          </div>
        </header>

        <main className="content-body">
          {activeMenu === 'master' ? (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Daftar Ruangan Rumah Sakit</h2>
                <button className="btn btn-outline" onClick={fetchRuangan}>
                  Muat Ulang
                </button>
              </div>

              {loading && <div className="loading-state">Memuat data ruangan...</div>}

              {error && (
                <div style={{ padding: '1.25rem' }}>
                  <div className="alert alert-danger" style={{ marginBottom: 0 }}>
                    {error} (Catatan: Basis data lokal mungkin belum berjalan atau endpoint gagal diakses)
                  </div>
                </div>
              )}

              {!loading && !error && ruanganList.length === 0 && (
                <div className="empty-state">Tidak ada data ruangan ditemukan.</div>
              )}

              {!loading && !error && ruanganList.length > 0 && (
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Kode</th>
                        <th>Nama Ruangan</th>
                        <th>Jenis</th>
                        <th>Lantai</th>
                        <th>Kapasitas</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ruanganList.map((r) => (
                        <tr key={r.ruangan_id}>
                          <td><strong>{r.kode}</strong></td>
                          <td>{r.nama}</td>
                          <td>{r.jenis}</td>
                          <td>{r.lantai ?? '-'}</td>
                          <td>{r.kapasitas} tempat tidur</td>
                          <td>
                            <span className={`badge ${r.status === 'AKTIF' || r.status === 'TERSEDIA' ? 'badge-success' : 'badge-secondary'}`}>
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Modul {menuItems.find((m) => m.key === activeMenu)?.label}</h2>
              </div>
              <div className="empty-state">
                Modul ini sedang aktif dalam kerangka kerja SIMRS. Silakan gunakan menu Master Data untuk melihat integrasi API backend.
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
