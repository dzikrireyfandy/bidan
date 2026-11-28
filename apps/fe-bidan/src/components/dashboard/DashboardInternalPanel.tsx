import React, { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { apiClient } from '../../api/client';
import { formatRupiahUI, formatTanggalUI } from './formatters';

interface PeringatanStokItem {
  obat_id: string;
  kode: string;
  nama_generik: string;
  nama_dagang: string;
  kategori: string;
  satuan: string;
  stok_aktif: number;
  stok_minimum: number;
  stok_kedaluwarsa: number;
  tgl_exp_terdekat: string | null;
  tgl_exp_terdekat_tampil: string | null;
  status_stok: 'AMAN' | 'MENIPIS' | 'MENDEKATI_KEDALUWARSA' | 'KEDALUWARSA';
  daftar_status: Array<'AMAN' | 'MENIPIS' | 'MENDEKATI_KEDALUWARSA' | 'KEDALUWARSA'>;
}

interface TagihanBelumLunasItem {
  tagihan_id: string;
  kunjungan_id: string;
  no_tagihan: string;
  tgl_terbit: string;
  tgl_terbit_tampil: string | null;
  no_rm: string;
  nama_pasien: string;
  total_tagihan: number;
  total_dibayar: number;
  sisa_tagihan: number;
  status: string;
}

interface DashboardInternalData {
  tanggal_hari_ini: string;
  tanggal_tampil: string | null;
  kunjungan_hari_ini: {
    total: number;
    selesai: number;
    berjalan: number;
  };
  ringkasan_stok: {
    total_item: number;
    aman: number;
    menipis: number;
    mendekati_kedaluwarsa: number;
    kedaluwarsa: number;
  };
  peringatan_stok: PeringatanStokItem[];
  tagihan_belum_lunas: {
    total_berkas: number;
    total_sisa_tagihan: number;
    items: TagihanBelumLunasItem[];
  } | null;
}

interface DashboardInternalPanelProps {
  isAdmin: boolean;
  onNavigateKasir?: (tagihanId?: string) => void;
  onNavigateStok?: () => void;
}

function statusBadgeStyle(status: string): React.CSSProperties {
  if (status === 'MENIPIS') {
    return { background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' };
  }
  if (status === 'MENDEKATI_KEDALUWARSA') {
    return { background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a' };
  }
  if (status === 'KEDALUWARSA') {
    return { background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' };
  }
  return { background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' };
}

function statusLabelText(status: string): string {
  if (status === 'MENDEKATI_KEDALUWARSA') return 'MENDEKATI KEDALUWARSA';
  return status;
}

export const DashboardInternalPanel: React.FC<DashboardInternalPanelProps> = ({
  isAdmin,
  onNavigateKasir,
  onNavigateStok
}) => {
  const [data, setData] = useState<DashboardInternalData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const reqIdRef = useRef<number>(0);

  const muatDashboard = useCallback(async (signal?: AbortSignal) => {
    const myReqId = ++reqIdRef.current;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await apiClient.post(
        '/dashboard/internal/list',
        { limit_peringatan: 50, limit_tagihan: 50 },
        { signal }
      );
      if (myReqId !== reqIdRef.current) return;
      setData(res.data?.data ?? null);
    } catch (err: unknown) {
      if (axios.isCancel(err)) return;
      if (myReqId !== reqIdRef.current) return;
      if (axios.isAxiosError(err)) {
        const msg =
          (err.response?.data as { error?: { message?: string } } | undefined)?.error?.message ||
          (err.response?.status === 503
            ? 'Layanan tidak tersedia. Silakan coba lagi.'
            : 'Gagal memuat ringkasan dashboard.');
        setErrorMsg(msg);
      } else {
        setErrorMsg('Gagal memuat ringkasan dashboard.');
      }
    } finally {
      if (myReqId === reqIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void muatDashboard(controller.signal);
    return () => controller.abort();
  }, [muatDashboard, isAdmin]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Dashboard Internal Praktik Mandiri Bidan
          </h2>
          <p style={{ fontSize: '0.825rem', color: '#64748b', margin: '0.2rem 0 0' }}>
            Ringkasan operasional kunjungan hari ini{data?.tanggal_tampil ? ` (${data.tanggal_tampil} WIB)` : ''}, status stok farmasi,
            {isAdmin ? ' dan daftar tagihan belum lunas.' : ' dalam mode baca saja.'}
          </p>
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => void muatDashboard()}
          disabled={loading}
          style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem' }}
        >
          {loading ? 'Memuat...' : 'Muat Ulang'}
        </button>
      </div>

      {/* Error State */}
      {errorMsg && (
        <div
          role="alert"
          style={{
            padding: '1rem 1.25rem',
            borderRadius: '10px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem'
          }}
        >
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{errorMsg}</span>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => void muatDashboard()}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && !data && !errorMsg && (
        <div className="dash-grid-4">
          {[1, 2, 3, 4].map((idx) => (
            <div key={idx} className="dash-card" style={{ minHeight: '104px' }}>
              <div className="skeleton skeleton-text" style={{ width: '55%', marginBottom: '0.75rem' }} />
              <div className="skeleton skeleton-text" style={{ width: '40%', height: '28px' }} />
            </div>
          ))}
        </div>
      )}

      {/* Main Content */}
      {data && (
        <>
          {/* Kartu Ringkasan Kunjungan Hari Ini & Status Stok */}
          <div className="dash-grid-4">
            <div className="dash-card" data-testid="card-kunjungan-hari-ini">
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Kunjungan Hari Ini
              </div>
              <div className="tabular-nums" style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', margin: '0.25rem 0' }}>
                {data.kunjungan_hari_ini.total}
              </div>
              <div style={{ fontSize: '0.76rem', color: '#475569' }}>
                {data.kunjungan_hari_ini.selesai} selesai &bull; {data.kunjungan_hari_ini.berjalan} berjalan
              </div>
            </div>

            <div className="dash-card">
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Stok Menipis
              </div>
              <div
                className="tabular-nums"
                style={{
                  fontSize: '1.85rem',
                  fontWeight: 800,
                  color: data.ringkasan_stok.menipis > 0 ? '#dc2626' : '#0f172a',
                  margin: '0.25rem 0'
                }}
              >
                {data.ringkasan_stok.menipis}
              </div>
              <div style={{ fontSize: '0.76rem', color: '#64748b' }}>Di bawah stok minimum item</div>
            </div>

            <div className="dash-card">
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Mendekati Kedaluwarsa
              </div>
              <div
                className="tabular-nums"
                style={{
                  fontSize: '1.85rem',
                  fontWeight: 800,
                  color: data.ringkasan_stok.mendekati_kedaluwarsa > 0 ? '#d97706' : '#0f172a',
                  margin: '0.25rem 0'
                }}
              >
                {data.ringkasan_stok.mendekati_kedaluwarsa}
              </div>
              <div style={{ fontSize: '0.76rem', color: '#64748b' }}>Kedaluwarsa &le; 3 bulan ke depan</div>
            </div>

            <div className="dash-card">
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Status Stok Lainnya
              </div>
              <div className="tabular-nums" style={{ fontSize: '1.35rem', fontWeight: 800, color: '#059669', margin: '0.35rem 0 0.2rem' }}>
                {data.ringkasan_stok.aman} AMAN
              </div>
              <div style={{ fontSize: '0.76rem', color: data.ringkasan_stok.kedaluwarsa > 0 ? '#b91c1c' : '#64748b', fontWeight: 600 }}>
                {data.ringkasan_stok.kedaluwarsa} item memiliki batch KEDALUWARSA
              </div>
            </div>
          </div>

          {/* Daftar Peringatan Stok (MENIPIS atau MENDEKATI_KEDALUWARSA) */}
          <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }} data-testid="panel-peringatan-stok">
            <div
              style={{
                padding: '1rem 1.25rem',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}
            >
              <div>
                <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Daftar Peringatan Stok Obat &amp; Alkes
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0.15rem 0 0' }}>
                  Menampilkan item berstatus MENIPIS (stok aktif &lt; stok minimum) atau MENDEKATI_KEDALUWARSA (&le; 3 bulan).
                </p>
              </div>
              {isAdmin && onNavigateStok && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onNavigateStok}
                  style={{ padding: '0.38rem 0.75rem', fontSize: '0.76rem' }}
                >
                  Kelola Inventaris &rarr;
                </button>
              )}
            </div>

            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Kode</th>
                    <th>Nama Obat / Alkes</th>
                    <th>Kategori</th>
                    <th style={{ textAlign: 'right' }}>Stok Aktif</th>
                    <th style={{ textAlign: 'right' }}>Stok Minimum</th>
                    <th>Kedaluwarsa Terdekat</th>
                    <th>Status Peringatan</th>
                  </tr>
                </thead>
                <tbody>
                  {data.peringatan_stok.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                        Seluruh stok obat dan alat kesehatan berada dalam kondisi AMAN.
                      </td>
                    </tr>
                  ) : (
                    data.peringatan_stok.map((item) => (
                      <tr key={item.obat_id}>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>
                          {item.kode}
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.nama_dagang || item.nama_generik}</div>
                          {item.nama_dagang && item.nama_dagang !== item.nama_generik && (
                            <div style={{ fontSize: '0.73rem', color: '#64748b' }}>{item.nama_generik}</div>
                          )}
                        </td>
                        <td style={{ fontSize: '0.78rem', color: '#475569' }}>{item.kategori}</td>
                        <td
                          className="tabular-nums"
                          style={{
                            textAlign: 'right',
                            fontWeight: 800,
                            color: item.stok_aktif < item.stok_minimum ? '#dc2626' : '#0f172a'
                          }}
                        >
                          {item.stok_aktif} {item.satuan}
                        </td>
                        <td className="tabular-nums" style={{ textAlign: 'right', color: '#475569' }}>
                          {item.stok_minimum} {item.satuan}
                        </td>
                        <td className="tabular-nums" style={{ fontSize: '0.8rem', color: '#334155' }}>
                          {item.tgl_exp_terdekat_tampil || formatTanggalUI(item.tgl_exp_terdekat)}
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                            {item.daftar_status.map((st) => (
                              <span
                                key={st}
                                style={{
                                  ...statusBadgeStyle(st),
                                  fontSize: '0.68rem',
                                  fontWeight: 700,
                                  padding: '0.18rem 0.5rem',
                                  borderRadius: '9999px',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {statusLabelText(st)}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Daftar Tagihan Belum Lunas — HANYA TAMPIL UNTUK ADMIN */}
          {isAdmin && data.tagihan_belum_lunas && (
            <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }} data-testid="panel-tagihan-belum-lunas-admin">
              <div
                style={{
                  padding: '1rem 1.25rem',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}
              >
                <div>
                  <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Daftar Tagihan Belum Lunas (Khusus Admin)
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0.15rem 0 0' }}>
                    {data.tagihan_belum_lunas.total_berkas} berkas menunggu pelunasan &bull; Total sisa piutang:{' '}
                    <strong style={{ color: '#b45309' }}>
                      {formatRupiahUI(data.tagihan_belum_lunas.total_sisa_tagihan)}
                    </strong>
                  </p>
                </div>
                {onNavigateKasir && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => onNavigateKasir()}
                    style={{ padding: '0.42rem 0.85rem', fontSize: '0.78rem' }}
                  >
                    Buka Kasir &amp; Tagihan
                  </button>
                )}
              </div>

              <div className="dash-table-wrap">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>No. Tagihan</th>
                      <th>Tanggal Terbit</th>
                      <th>No. RM</th>
                      <th>Nama Pasien</th>
                      <th style={{ textAlign: 'right' }}>Total Tagihan</th>
                      <th style={{ textAlign: 'right' }}>Sudah Dibayar</th>
                      <th style={{ textAlign: 'right' }}>Sisa Tagihan</th>
                      {onNavigateKasir && <th style={{ textAlign: 'right' }}>Aksi</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {data.tagihan_belum_lunas.items.length === 0 ? (
                      <tr>
                        <td colSpan={onNavigateKasir ? 8 : 7} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                          Tidak ada tagihan belum lunas saat ini. Seluruh tagihan pasien telah lunas.
                        </td>
                      </tr>
                    ) : (
                      data.tagihan_belum_lunas.items.map((t) => (
                        <tr key={t.tagihan_id}>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', fontWeight: 700 }}>
                            {t.no_tagihan}
                          </td>
                          <td className="tabular-nums">{t.tgl_terbit_tampil || formatTanggalUI(t.tgl_terbit)}</td>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#475569' }}>{t.no_rm || '-'}</td>
                          <td style={{ fontWeight: 600, color: '#0f172a' }}>{t.nama_pasien}</td>
                          <td className="tabular-nums" style={{ textAlign: 'right' }}>
                            {formatRupiahUI(t.total_tagihan)}
                          </td>
                          <td className="tabular-nums" style={{ textAlign: 'right', color: '#059669' }}>
                            {formatRupiahUI(t.total_dibayar)}
                          </td>
                          <td className="tabular-nums" style={{ textAlign: 'right', fontWeight: 800, color: '#b45309' }}>
                            {formatRupiahUI(t.sisa_tagihan)}
                          </td>
                          {onNavigateKasir && (
                            <td style={{ textAlign: 'right' }}>
                              <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => onNavigateKasir(t.tagihan_id)}
                                style={{ padding: '0.28rem 0.65rem', fontSize: '0.74rem' }}
                              >
                                Proses Bayar
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DashboardInternalPanel;
