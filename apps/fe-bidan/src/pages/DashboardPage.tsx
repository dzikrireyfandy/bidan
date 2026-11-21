import React, { useState } from 'react';
import { KLINIK_INFO, MOCK_AUDIT_LOGS, AuditLogItem } from '../api/mockData';

interface DashboardPageProps {
  onLogout: () => void;
  onGoToHome?: () => void;
  initialRole?: 'SUPERADMIN' | 'ADMIN_LOKAL' | 'DOKTER' | 'PASIEN';
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onLogout, onGoToHome, initialRole }) => {
  const [currentRole, setCurrentRole] = useState<'SUPERADMIN' | 'ADMIN_LOKAL' | 'DOKTER' | 'PASIEN'>(
    initialRole || (localStorage.getItem('bidan_user_role') as 'SUPERADMIN' | 'ADMIN_LOKAL' | 'DOKTER' | 'PASIEN') || 'ADMIN_LOKAL'
  );

  // Superadmin Audit State
  const [auditFilter, setAuditFilter] = useState<string>('SEMUA');
  const [auditSearch, setAuditSearch] = useState<string>('');
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLogItem | null>(null);

  // Admin Operational Sub-Tab State
  const [adminTab, setAdminTab] = useState<'antrean' | 'pendaftaran' | 'stok' | 'kasir'>('antrean');
  const [activeQueueNum, setActiveQueueNum] = useState<string>('A-007');
  const [callAlert, setCallAlert] = useState<string | null>(null);

  // Mock patient queue list for operational dashboard
  const [queueList, setQueueList] = useState([
    { no: 'A-006', nama: 'Ny. Siti Aminah', layanan: 'Pemeriksaan Kehamilan (ANC)', sesi: 'Sesi Pagi', jam: '09:00 WIB', status: 'SELESAI' },
    { no: 'A-007', nama: 'Ny. Ratna Dewi', layanan: 'Pemeriksaan Kehamilan (ANC)', sesi: 'Sesi Pagi', jam: '09:30 WIB', status: 'DIPANGGIL' },
    { no: 'A-008', nama: 'Ny. Desi Wulandari', layanan: 'Konsultasi KB & Kontrasepsi', sesi: 'Sesi Pagi', jam: '10:00 WIB', status: 'MENUNGGU' },
    { no: 'A-009', nama: 'Ny. Fitri Handayani', layanan: 'Pelayanan Nifas & Laktasi', sesi: 'Sesi Pagi', jam: '10:30 WIB', status: 'MENUNGGU' },
    { no: 'A-010', nama: 'Ny. Maya Anggraini', layanan: 'Pemeriksaan Bayi Baru Lahir', sesi: 'Sesi Pagi', jam: '11:00 WIB', status: 'MENUNGGU' },
  ]);

  // Operational Inventory
  const [stokAlkes] = useState([
    { kode: 'OBT-OKS-01', nama: 'Oksitosin 10 IU / mL (Injeksi)', kategori: 'Uterotonika', stok: 48, min: 20, satuan: 'Ampul', status: 'AMAN' },
    { kode: 'OBT-VK1-01', nama: 'Phytomenadione (Vitamin K1 1 mg/0.5mL)', kategori: 'Profilaksis Bayi', stok: 35, min: 15, satuan: 'Ampul', status: 'AMAN' },
    { kode: 'OBT-SLP-01', nama: 'Salep Mata Gentamisin 1%', kategori: 'Profilaksis Bayi', stok: 24, min: 10, satuan: 'Tube', status: 'AMAN' },
    { kode: 'ALKES-IUD-01', nama: 'IUD Copper T 380A Steril', kategori: 'Alat Kontrasepsi', stok: 18, min: 8, satuan: 'Set', status: 'AMAN' },
    { kode: 'ALKES-IMP-01', nama: 'Implan 2 Batang (Levonorgestrel)', kategori: 'Alat Kontrasepsi', stok: 12, min: 5, satuan: 'Set', status: 'AMAN' },
    { kode: 'OBT-KB-01', nama: 'Depo Progestin 3 Bulanan (Injeksi)', kategori: 'KB Hormonal', stok: 30, min: 12, satuan: 'Vial', status: 'AMAN' },
    { kode: 'ALKES-SPT-01', nama: 'Spuit 3cc Disposible Steril', kategori: 'Alat Medis Habis Pakai', stok: 120, min: 40, satuan: 'Pcs', status: 'AMAN' },
  ]);

  const handleCallQueue = (nomor: string, nama: string) => {
    setActiveQueueNum(nomor);
    setCallAlert(`Memanggil nomor antrean: ${nomor} (${nama}) menuju Ruang Periksa 1.`);
    setQueueList(prev => prev.map(q => q.no === nomor ? { ...q, status: 'DIPANGGIL' } : q));
    setTimeout(() => setCallAlert(null), 4000);
  };

  const handleFinishQueue = (nomor: string) => {
    setQueueList(prev => prev.map(q => q.no === nomor ? { ...q, status: 'SELESAI' } : q));
  };

  const filteredAuditLogs = MOCK_AUDIT_LOGS.filter(log => {
    const matchFilter = auditFilter === 'SEMUA' || log.aksi.includes(auditFilter) || log.tabel.includes(auditFilter);
    const matchSearch = auditSearch === '' || 
      log.user_ref.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.aksi.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.id_baris.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.ip_address.includes(auditSearch);
    return matchFilter && matchSearch;
  });

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <header style={{ background: '#ffffff', borderBottom: '1px solid var(--border-medium)', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img
            src="/logo-bidan.png"
            alt="Logo Bidan Ria"
            style={{ height: '42px', width: 'auto' }}
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.src.includes('public/logo-bidan.png')) {
                target.src = './public/logo-bidan.png';
              }
            }}
          />
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
              {KLINIK_INFO.nama}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>
              {currentRole === 'SUPERADMIN' && 'Sistem Pengawas Keamanan & Jejak Audit (Audit_Log)'}
              {currentRole === 'ADMIN_LOKAL' && 'Dashboard Operasional Loket & Monitoring Sesi Antrean (SCR-07)'}
              {currentRole === 'DOKTER' && 'Portal Rekam Medis Elektronik (RME) — Bdn. Ria Indrasti J., S.Keb'}
              {currentRole === 'PASIEN' && 'Portal Pasien & Buku KIA Digital Terintegrasi'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Quick Role Switcher Pill */}
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '0.2rem', borderRadius: '8px', gap: '0.2rem' }}>
            <button
              type="button"
              onClick={() => setCurrentRole('SUPERADMIN')}
              style={{
                padding: '0.25rem 0.6rem',
                fontSize: '0.72rem',
                fontWeight: 700,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: currentRole === 'SUPERADMIN' ? '#9333ea' : 'transparent',
                color: currentRole === 'SUPERADMIN' ? '#ffffff' : '#64748b'
              }}
            >
              Superadmin
            </button>
            <button
              type="button"
              onClick={() => setCurrentRole('ADMIN_LOKAL')}
              style={{
                padding: '0.25rem 0.6rem',
                fontSize: '0.72rem',
                fontWeight: 700,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: currentRole === 'ADMIN_LOKAL' ? '#f59e0b' : 'transparent',
                color: currentRole === 'ADMIN_LOKAL' ? '#ffffff' : '#64748b'
              }}
            >
              Admin Operasional
            </button>
            <button
              type="button"
              onClick={() => setCurrentRole('DOKTER')}
              style={{
                padding: '0.25rem 0.6rem',
                fontSize: '0.72rem',
                fontWeight: 700,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: currentRole === 'DOKTER' ? '#16a34a' : 'transparent',
                color: currentRole === 'DOKTER' ? '#ffffff' : '#64748b'
              }}
            >
              Bidan (RME)
            </button>
            <button
              type="button"
              onClick={() => setCurrentRole('PASIEN')}
              style={{
                padding: '0.25rem 0.6rem',
                fontSize: '0.72rem',
                fontWeight: 700,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: currentRole === 'PASIEN' ? '#2563eb' : 'transparent',
                color: currentRole === 'PASIEN' ? '#ffffff' : '#64748b'
              }}
            >
              Pasien
            </button>
          </div>

          {onGoToHome && (
            <button
              type="button"
              onClick={onGoToHome}
              className="btn btn-secondary"
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.8125rem' }}
            >
              &larr; Web Publik
            </button>
          )}

          <button
            type="button"
            onClick={onLogout}
            className="btn btn-secondary"
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.8125rem', color: '#dc2626' }}
          >
            Keluar
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ flex: 1, padding: '1.75rem 1.5rem', maxWidth: '1280px', width: '100%', margin: '0 auto' }}>

        {/* =========================================================================
            ROLE 1: SUPERADMIN — AUDIT TRAIL LOG VIEWER (TABLE: Audit_Log)
            ========================================================================= */}
        {currentRole === 'SUPERADMIN' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '9999px', background: '#f3e8ff', color: '#7e22ce' }}>
                    MODUL KEAMANAN SISTEM (TSD SECTION 6)
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#16a34a' }}>
                    • Append-Only Immutable (trg_audit_logs_immutable)
                  </span>
                </div>
                <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
                  Log Audit &amp; Integritas Transaksi Superadmin
                </h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-slate-600)' }}>
                  Memantau seluruh jejak riwayat mutasi tabel, rekam medis elektronik, antrean, dan autentikasi lintas unit pelayanan.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => alert('Jejak Audit_Log berhasil diekspor ke format CSV terenkripsi sesuai UU PDP No. 27/2022.')}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8125rem', padding: '0.55rem 0.95rem' }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  <span>Ekspor Log Audit (CSV)</span>
                </button>
              </div>
            </div>

            {/* Metrics Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.15rem', marginBottom: '1.75rem' }}>
              <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-medium)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)', fontWeight: 600 }}>Total Log Audit Tercatat</div>
                <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#7e22ce', margin: '0.25rem 0' }}>10.482</div>
                <div style={{ fontSize: '0.75rem', color: '#16a34a' }}>Append-only (Tidak Dapat Dimanipulasi)</div>
              </div>

              <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-medium)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)', fontWeight: 600 }}>Status Keamanan &amp; Integritas</div>
                <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#16a34a', margin: '0.25rem 0' }}>Optimal</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>0 Anomali Akses / Percobaan Ilegal</div>
              </div>

              <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-medium)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)', fontWeight: 600 }}>Akun Staf &amp; Sesi Aktif</div>
                <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-primary-dark)', margin: '0.25rem 0' }}>4 Sesi</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>Bidan Ria, Staf Loket, Superadmin, Pasien</div>
              </div>

              <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-medium)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)', fontWeight: 600 }}>Database MiniWorldRS</div>
                <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0284c7', margin: '0.25rem 0' }}>97 Tabel</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>SQL Server 2025 Sinkron 100%</div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-medium)', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {['SEMUA', 'UPDATE_RME', 'VERIFIKASI_ANTREAN', 'CREATE_PENDAFTARAN', 'MUTASI_STOK', 'AUTH_LOGIN'].map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setAuditFilter(f)}
                    style={{
                      padding: '0.45rem 0.8rem',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      border: '1px solid var(--border-medium)',
                      cursor: 'pointer',
                      background: auditFilter === f ? '#7e22ce' : '#ffffff',
                      color: auditFilter === f ? '#ffffff' : 'var(--color-slate-700)'
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <div style={{ width: '260px' }}>
                <input
                  type="text"
                  placeholder="Cari User / ID / IP..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-medium)', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            {/* Audit Log Table */}
            <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid var(--border-medium)', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid var(--border-light)', color: 'var(--color-slate-600)' }}>
                      <th style={{ padding: '0.85rem 1rem' }}>Log ID</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Waktu Kejadian</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Pelaksana (User Ref)</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Role</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Aksi Mutasi</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Tabel Target</th>
                      <th style={{ padding: '0.85rem 1rem' }}>ID Baris</th>
                      <th style={{ padding: '0.85rem 1rem' }}>IP Address</th>
                      <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Inspeksi JSON</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAuditLogs.map((log) => (
                      <tr key={log.log_id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#7e22ce' }}>#{log.log_id}</td>
                        <td style={{ padding: '0.85rem 1rem', color: 'var(--color-slate-600)', whiteSpace: 'nowrap' }}>{log.waktu}</td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--color-slate-900)' }}>{log.user_ref}</td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '9999px', background: log.peran === 'DOKTER' ? '#dcfce7' : log.peran === 'SUPERADMIN' ? '#f3e8ff' : '#fef3c7', color: log.peran === 'DOKTER' ? '#166534' : log.peran === 'SUPERADMIN' ? '#7e22ce' : '#92400e' }}>
                            {log.peran}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--color-slate-800)' }}>{log.aksi}</td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <code style={{ background: '#f1f5f9', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.8rem' }}>{log.tabel}</code>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', color: 'var(--color-slate-600)' }}>{log.id_baris}</td>
                        <td style={{ padding: '0.85rem 1rem', color: 'var(--color-slate-500)', fontSize: '0.8rem' }}>{log.ip_address}</td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => setSelectedAuditLog(log)}
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                          >
                            Lihat Nilai
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Inspeksi JSON Diff */}
            {selectedAuditLog && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                <div style={{ background: '#ffffff', borderRadius: '16px', maxWidth: '600px', width: '100%', padding: '1.75rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
                      Inspeksi Audit Log #{selectedAuditLog.log_id}
                    </h3>
                    <button type="button" onClick={() => setSelectedAuditLog(null)} style={{ border: 'none', background: '#f1f5f9', borderRadius: '8px', padding: '0.3rem 0.6rem', cursor: 'pointer' }}>✕</button>
                  </div>
                  <div style={{ fontSize: '0.85rem', marginBottom: '1rem', color: 'var(--color-slate-600)' }}>
                    <div><strong>Aksi:</strong> {selectedAuditLog.aksi} on <code>{selectedAuditLog.tabel}</code></div>
                    <div><strong>Pelaksana:</strong> {selectedAuditLog.user_ref} ({selectedAuditLog.peran})</div>
                    <div><strong>Waktu / IP:</strong> {selectedAuditLog.waktu} | {selectedAuditLog.ip_address}</div>
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#dc2626', marginBottom: '0.3rem' }}>Nilai Lama (Sebelum Mutasi):</div>
                    <pre style={{ background: '#fef2f2', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem', overflowX: 'auto', border: '1px solid #fee2e2' }}>{selectedAuditLog.nilai_lama}</pre>
                  </div>
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16a34a', marginBottom: '0.3rem' }}>Nilai Baru (Setelah Mutasi):</div>
                    <pre style={{ background: '#f0fdf4', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem', overflowX: 'auto', border: '1px solid #dcfce7' }}>{selectedAuditLog.nilai_baru}</pre>
                  </div>
                  <button type="button" onClick={() => setSelectedAuditLog(null)} className="btn btn-secondary" style={{ width: '100%', padding: '0.6rem' }}>Tutup</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            ROLE 2: ADMIN OPERASIONAL KLINIK (MODUL SCR-07 LENGKAP)
            ========================================================================= */}
        {currentRole === 'ADMIN_LOKAL' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '9999px', background: '#fef3c7', color: '#92400e' }}>
                    MODUL OPERASIONAL LOKET (SCR-07 &amp; v_sesi_sisa_kuota)
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#16a34a' }}>
                    • Sesi Pagi &amp; Sore Terbuka
                  </span>
                </div>
                <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
                  Dashboard Operasional &amp; Antrean Sesi Hari Ini
                </h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-slate-600)' }}>
                  Pengendalian antrean ruang tunggu, pendaftaran pasien walk-in, pengaturan kuota sesi, dan logistik alkes esensial.
                </p>
              </div>

              {/* Sub-Tabs Operasional */}
              <div style={{ display: 'flex', background: '#ffffff', padding: '0.3rem', borderRadius: '10px', border: '1px solid var(--border-medium)', gap: '0.3rem' }}>
                <button
                  type="button"
                  onClick={() => setAdminTab('antrean')}
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: '7px',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    background: adminTab === 'antrean' ? 'var(--color-primary)' : 'transparent',
                    color: adminTab === 'antrean' ? '#ffffff' : 'var(--color-slate-700)'
                  }}
                >
                  Live Antrean (SCR-07)
                </button>
                <button
                  type="button"
                  onClick={() => setAdminTab('pendaftaran')}
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: '7px',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    background: adminTab === 'pendaftaran' ? 'var(--color-primary)' : 'transparent',
                    color: adminTab === 'pendaftaran' ? '#ffffff' : 'var(--color-slate-700)'
                  }}
                >
                  + Pendaftaran Loket
                </button>
                <button
                  type="button"
                  onClick={() => setAdminTab('stok')}
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: '7px',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    background: adminTab === 'stok' ? 'var(--color-primary)' : 'transparent',
                    color: adminTab === 'stok' ? '#ffffff' : 'var(--color-slate-700)'
                  }}
                >
                  Logistik &amp; Alkes
                </button>
                <button
                  type="button"
                  onClick={() => setAdminTab('kasir')}
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: '7px',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    background: adminTab === 'kasir' ? 'var(--color-primary)' : 'transparent',
                    color: adminTab === 'kasir' ? '#ffffff' : 'var(--color-slate-700)'
                  }}
                >
                  Billing Kasir
                </button>
              </div>
            </div>

            {/* Notification alert if audio call simulated */}
            {callAlert && (
              <div style={{ background: '#dcfce7', border: '1px solid #bbf7d0', color: '#166534', padding: '0.85rem 1.25rem', borderRadius: '12px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600, fontSize: '0.9rem' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                <span>{callAlert}</span>
              </div>
            )}

            {/* TAB 1: LIVE ANTREAN */}
            {adminTab === 'antrean' && (
              <div>
                {/* Session Quotas */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-medium)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)', fontWeight: 600 }}>Sesi Pagi (08:00 - 12:00 WIB)</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary-dark)', margin: '0.2rem 0' }}>9 Pasien Terdaftar</div>
                    <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>Sisa 6 Kuota (Maks 15)</div>
                  </div>

                  <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-medium)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)', fontWeight: 600 }}>Sesi Sore (16:00 - 20:00 WIB)</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary-dark)', margin: '0.2rem 0' }}>5 Pasien Terdaftar</div>
                    <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>Sisa 10 Kuota (Maks 15)</div>
                  </div>

                  <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-medium)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)', fontWeight: 600 }}>Nomor Sedang Dilayani</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f59e0b', margin: '0.2rem 0' }}>{activeQueueNum}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>Ruang Periksa 1 (Bdn. Ria Indrasti)</div>
                  </div>

                  <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-medium)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)', fontWeight: 600 }}>Antrean Menunggu di Klinik</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0284c7', margin: '0.2rem 0' }}>3 Ibu Hamil</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>Estimasi Tunggu ~15 Menit/Pasien</div>
                  </div>
                </div>

                {/* Queue Table */}
                <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid var(--border-medium)', padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
                      Daftar Urutan Pasien Hari Ini (SCR-07 Live Feed)
                    </h3>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => handleCallQueue('A-008', 'Ny. Desi Wulandari')}
                        className="btn btn-primary btn-shimmer"
                        style={{ fontSize: '0.8125rem', padding: '0.5rem 0.85rem' }}
                      >
                        Panggil Antrean Berikutnya (A-008)
                      </button>
                    </div>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border-light)', color: 'var(--color-slate-600)' }}>
                        <th style={{ padding: '0.65rem' }}>No. Antrean</th>
                        <th style={{ padding: '0.65rem' }}>Nama Ibu Pasien</th>
                        <th style={{ padding: '0.65rem' }}>Layanan Asuhan</th>
                        <th style={{ padding: '0.65rem' }}>Sesi Praktik</th>
                        <th style={{ padding: '0.65rem' }}>Estimasi Jam</th>
                        <th style={{ padding: '0.65rem' }}>Status</th>
                        <th style={{ padding: '0.65rem', textAlign: 'right' }}>Aksi Operator Loket</th>
                      </tr>
                    </thead>
                    <tbody>
                      {queueList.map((q) => (
                        <tr key={q.no} style={{ borderBottom: '1px solid var(--border-light)', background: q.status === 'DIPANGGIL' ? '#faf5fe' : 'transparent' }}>
                          <td style={{ padding: '0.75rem 0.65rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>{q.no}</td>
                          <td style={{ padding: '0.75rem 0.65rem', fontWeight: 700, color: 'var(--color-slate-900)' }}>{q.nama}</td>
                          <td style={{ padding: '0.75rem 0.65rem' }}>{q.layanan}</td>
                          <td style={{ padding: '0.75rem 0.65rem', color: 'var(--color-slate-600)' }}>{q.sesi}</td>
                          <td style={{ padding: '0.75rem 0.65rem', color: 'var(--color-slate-600)' }}>{q.jam}</td>
                          <td style={{ padding: '0.75rem 0.65rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '9999px', background: q.status === 'SELESAI' ? '#dcfce7' : q.status === 'DIPANGGIL' ? '#fef3c7' : '#e2e8f0', color: q.status === 'SELESAI' ? '#166534' : q.status === 'DIPANGGIL' ? '#92400e' : '#475569' }}>
                              {q.status}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 0.65rem', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                              <button
                                type="button"
                                onClick={() => handleCallQueue(q.no, q.nama)}
                                className="btn btn-secondary"
                                style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                              >
                                Panggil
                              </button>
                              <button
                                type="button"
                                onClick={() => handleFinishQueue(q.no)}
                                className="btn btn-secondary"
                                style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', color: '#16a34a' }}
                              >
                                Selesai
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: PENDAFTARAN PASIEN BARU */}
            {adminTab === 'pendaftaran' && (
              <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid var(--border-medium)', padding: '2rem', maxWidth: '720px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-slate-900)', marginBottom: '0.35rem' }}>
                  Formulir Pendaftaran Pasien Loket (Walk-In)
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-slate-500)', marginBottom: '1.5rem' }}>
                  Petugas loket memasukkan data identitas untuk langsung menerbitkan tiket nomor antrean fisik/WhatsApp.
                </p>

                <form onSubmit={(e) => { e.preventDefault(); alert('Pendaftaran sukses! Nomor antrean A-011 berhasil diterbitkan untuk Ny. Baru.'); setAdminTab('antrean'); }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem' }}>Nomor Induk Kependudukan (NIK)</label>
                      <input type="text" required placeholder="16 digit NIK KTP" style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border-medium)' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem' }}>Nama Lengkap Ibu Pasien</label>
                      <input type="text" required placeholder="Contoh: Ny. Dewi Lestari" style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border-medium)' }} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem' }}>Nomor WhatsApp Aktif</label>
                      <input type="tel" required placeholder="08xxxxxxxxxx" style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border-medium)' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem' }}>Pilih Sesi Praktik</label>
                      <select style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border-medium)' }}>
                        <option value="SESI-PAGI">Sesi Pagi (08:00 - 12:00 WIB) — Sisa 6 Kuota</option>
                        <option value="SESI-SORE">Sesi Sore (16:00 - 20:00 WIB) — Sisa 10 Kuota</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem' }}>Layanan Kebidanan yang Dituju</label>
                    <select style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border-medium)' }}>
                      <option>Pemeriksaan Kehamilan (ANC Terpadu)</option>
                      <option>Pelayanan Kontrasepsi &amp; KB</option>
                      <option>Pemeriksaan Kesehatan Ibu Nifas &amp; Laktasi</option>
                      <option>Asuhan Bayi Baru Lahir &amp; Tumbuh Kembang</option>
                      <option>Konsultasi Pra-Konsepsi / Rujukan</option>
                    </select>
                  </div>

                  <button type="submit" className="btn btn-primary btn-shimmer" style={{ width: '100%', padding: '0.75rem', fontWeight: 700 }}>
                    Terbitkan Nomor Antrean Pasien
                  </button>
                </form>
              </div>
            )}

            {/* TAB 3: STOK ALKES & OBAT */}
            {adminTab === 'stok' && (
              <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid var(--border-medium)', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
                      Inventori Obat &amp; Alkes Esensial Kebidanan (Tabel: Obat &amp; Mutasi_Stok)
                    </h3>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--color-slate-500)' }}>
                      Ambang batas pengaman stok medis untuk persalinan 24 jam dan pelayanan KB.
                    </p>
                  </div>
                  <button type="button" onClick={() => alert('Pencatatan mutasi stok obat berhasil direkam.')} className="btn btn-secondary" style={{ fontSize: '0.8125rem' }}>
                    + Catat Masuk / Keluar Stok
                  </button>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid var(--border-light)', color: 'var(--color-slate-600)' }}>
                      <th style={{ padding: '0.75rem' }}>Kode Obat/Alkes</th>
                      <th style={{ padding: '0.75rem' }}>Nama Item Medis</th>
                      <th style={{ padding: '0.75rem' }}>Kategori</th>
                      <th style={{ padding: '0.75rem' }}>Stok Fisik</th>
                      <th style={{ padding: '0.75rem' }}>Batas Minimal</th>
                      <th style={{ padding: '0.75rem' }}>Satuan</th>
                      <th style={{ padding: '0.75rem' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stokAlkes.map((s) => (
                      <tr key={s.kode} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '0.75rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>{s.kode}</td>
                        <td style={{ padding: '0.75rem', fontWeight: 700, color: 'var(--color-slate-900)' }}>{s.nama}</td>
                        <td style={{ padding: '0.75rem', color: 'var(--color-slate-600)' }}>{s.kategori}</td>
                        <td style={{ padding: '0.75rem', fontWeight: 800, fontSize: '0.95rem', color: '#16a34a' }}>{s.stok}</td>
                        <td style={{ padding: '0.75rem', color: 'var(--color-slate-500)' }}>{s.min}</td>
                        <td style={{ padding: '0.75rem', color: 'var(--color-slate-600)' }}>{s.satuan}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '9999px', background: '#dcfce7', color: '#166534' }}>
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 4: KASIR & BILLING */}
            {adminTab === 'kasir' && (
              <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid var(--border-medium)', padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-slate-900)', marginBottom: '0.35rem' }}>
                  Rekapitulasi Billing Loket &amp; Pembayaran Sesi Hari Ini
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-slate-500)', marginBottom: '1.25rem' }}>
                  Pencatatan kasir loket untuk verifikasi status lunas sebelum pasien menerima obat/buku KIA.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ background: '#f8fafc', padding: '1.15rem', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>Total Pasien Telah Membayar</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#16a34a', margin: '0.2rem 0' }}>12 Transaksi</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>Lunas 100%</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '1.15rem', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>Metode Pembayaran</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary-dark)', margin: '0.2rem 0' }}>QRIS (60%) | Tunai (40%)</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>Terhubung Sistem MiniWorldRS</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            ROLE 3: DOKTER / BIDAN RIA — REKAM MEDIS ELEKTRONIK (RME)
            ========================================================================= */}
        {currentRole === 'DOKTER' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '9999px', background: '#dcfce7', color: '#166534' }}>
                    REKAM MEDIS ELEKTRONIK (DPJP: Bdn. Ria Indrasti J., S.Keb)
                  </span>
                </div>
                <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
                  Pemeriksaan Antenatal Care (ANC) &amp; Asuhan BBL
                </h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-slate-600)' }}>
                  Pencatatan klinis standar kebidanan mencakup SOAP, parameter obstetrik, DJJ Doppler, dan protokol neonatus.
                </p>
              </div>

              <button
                type="button"
                onClick={() => alert('Resume medis pemeriksaan ANC berhasil disimpan ke database RME terenkripsi.')}
                className="btn btn-primary btn-shimmer"
                style={{ fontSize: '0.85rem' }}
              >
                Simpan Catatan RME (CPPT)
              </button>
            </div>

            {/* Patient Header Card */}
            <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid var(--border-medium)', padding: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>Ny. Ratna Dewi (28 th)</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-slate-500)' }}>No. RM: <strong>RM-2026-0042</strong> | NIK: 1571012304950001 | Gravida: G2P1A0</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.65rem', borderRadius: '9999px', background: '#dcfce7', color: '#166534' }}>
                    Sedang Dilayani di Ruang Periksa
                  </span>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-400)', marginTop: '0.25rem' }}>HPHT: 02 Mei 2026 | Usia Kehamilan: 28 Minggu 4 Hari</div>
                </div>
              </div>

              {/* Vital Signs Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ background: '#faf8fc', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>Tekanan Darah</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-slate-900)', marginTop: '0.2rem' }}>115 / 75</div>
                  <div style={{ fontSize: '0.75rem', color: '#16a34a' }}>Normotensif</div>
                </div>
                <div style={{ background: '#faf8fc', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>Tinggi Fundus (TFU)</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-slate-900)', marginTop: '0.2rem' }}>24 cm</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>Sesuai Gestasi</div>
                </div>
                <div style={{ background: '#faf8fc', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>Detak Jantung Janin (DJJ)</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-slate-900)', marginTop: '0.2rem' }}>142 dpm</div>
                  <div style={{ fontSize: '0.75rem', color: '#16a34a' }}>Irama Kuat &amp; Reguler</div>
                </div>
                <div style={{ background: '#faf8fc', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>Presentasi Janin</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-slate-900)', marginTop: '0.2rem' }}>Kepala (Cephalic)</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>Punggung Kiri (PuKi)</div>
                </div>
              </div>

              {/* BBL Checklist */}
              <div style={{ background: '#faf5fe', border: '1px solid #efe8f6', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.25rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: '0.75rem' }}>
                  Protokol Asuhan Bayi Baru Lahir 0-6 Jam (Asuhan_BBL)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.85rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><input type="checkbox" defaultChecked /> Inisiasi Menyusu Dini (IMD)</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><input type="checkbox" defaultChecked /> Injeksi Vitamin K1 (1 mg IM)</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><input type="checkbox" defaultChecked /> Salep Mata Antibiotik Gentamisin</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><input type="checkbox" defaultChecked /> Rawat Tali Pusat Terbuka Kering</label>
                </div>
              </div>

              {/* SOAP Medical Notes */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-slate-700)', marginBottom: '0.35rem' }}>
                  Catatan Perkembangan Pasien Terintegrasi (CPPT / SOAP)
                </label>
                <textarea
                  rows={3}
                  defaultValue="S: Ibu mengeluh sedikit pegal pada punggung bawah, gerak janin aktif dirasakan rutin. O: TD 115/75 mmHg, BB 62 kg, TFU 24 cm, DJJ 142 dpm reguler kuat. A: G2P1A0 hamil 28 minggu, janin tunggal hidup intrauterin, presentasi kepala. P: Edukasi postur istirahat, berikan suplemen Fe 1x1 dan Kalsium Laktat 1x1. Jadwal kontrol 3 minggu lagi."
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-medium)', fontSize: '0.85rem', color: 'var(--color-slate-800)', lineHeight: '1.5' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            ROLE 4: PASIEN — BUKU KIA DIGITAL & TIKET ANTREAN
            ========================================================================= */}
        {currentRole === 'PASIEN' && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '9999px', background: '#e0e7ff', color: '#3730a3' }}>
                BUKU KIA DIGITAL TERINTEGRASI
              </span>
              <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-slate-900)', marginTop: '0.35rem' }}>
                Selamat Datang, Ny. Ratna Dewi
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-slate-600)' }}>
                Pantau riwayat antenatal care, nomor antrean aktif, dan tanggal jadwal kontrol kehamilan berikutnya.
              </p>
            </div>

            {/* Active Ticket Card */}
            <div style={{ background: 'linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%)', color: '#ffffff', borderRadius: '20px', padding: '1.75rem', marginBottom: '1.5rem', boxShadow: '0 10px 25px -5px rgba(88, 32, 126, 0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tiket Antrean Pemeriksaan Hari Ini</span>
                <span style={{ fontSize: '0.75rem', background: '#fef3c7', color: '#92400e', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontWeight: 800 }}>Sedang Dipanggil</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', opacity: 0.85 }}>Nomor Antrean Anda:</div>
                  <div style={{ fontSize: '3rem', fontWeight: 900, lineHeight: 1 }}>A-007</div>
                  <div style={{ fontSize: '0.85rem', marginTop: '0.4rem', opacity: 0.9 }}>Layanan: Pemeriksaan Kehamilan (ANC Terpadu)</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.85rem', opacity: 0.85 }}>Ruang Pelayanan:</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800 }}>Ruang Periksa 1</div>
                  <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Bdn. Ria Indrasti J., S.Keb</div>
                </div>
              </div>
            </div>

            {/* KIA Summary Card */}
            <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid var(--border-medium)', padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-slate-900)', marginBottom: '1rem' }}>
                Ringkasan Pemantauan Janin (Buku KIA Elektronik)
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ background: '#faf8fc', padding: '1rem', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>Usia Kehamilan Saat Ini</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary-dark)', marginTop: '0.2rem' }}>28 Minggu 4 Hari</div>
                </div>
                <div style={{ background: '#faf8fc', padding: '1rem', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>Perkiraan Hari Lahir (HPL)</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f59e0b', marginTop: '0.2rem' }}>08 Februari 2027</div>
                </div>
                <div style={{ background: '#faf8fc', padding: '1rem', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>Jadwal Kontrol Berikutnya</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#16a34a', marginTop: '0.2rem' }}>12 Desember 2026</div>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};
