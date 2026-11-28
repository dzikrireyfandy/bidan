import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { apiClient } from '../../api/client';
import {
  formatRupiahUI,
  formatTanggalUI,
  getHariIniWibIso,
  getRentangBulanWib,
  validasiRentangTanggalUI
} from './formatters';

interface RincianJalurItem {
  jalur: 'MANDIRI' | 'BPJS' | 'ASURANSI';
  jumlah_transaksi: number;
  jumlah_tagihan: number;
  total_pendapatan: number;
}

interface RincianHarianItem {
  tanggal: string;
  tanggal_tampil: string;
  jalur: string;
  metode: string;
  jumlah_transaksi: number;
  total_pendapatan: number;
}

interface RekapPendapatanData {
  periode: {
    jenis_periode: 'HARIAN' | 'BULANAN' | 'KUSTOM';
    dari: string;
    sampai: string;
    dari_tampil: string;
    sampai_tampil: string;
  };
  total_pendapatan: number;
  total_transaksi: number;
  kosong: boolean;
  pesan_informasi: string | null;
  rincian_jalur: RincianJalurItem[];
  rincian_harian: RincianHarianItem[];
}

interface RekapPendapatanViewProps {
  readOnly: boolean;
  onNavigateKasir?: () => void;
}

export const RekapPendapatanView: React.FC<RekapPendapatanViewProps> = ({
  readOnly,
  onNavigateKasir
}) => {
  const defaultBulan = useMemo(() => getRentangBulanWib(), []);
  const [jenisPeriode, setJenisPeriode] = useState<'HARIAN' | 'BULANAN' | 'KUSTOM'>('BULANAN');
  const [hariTunggal, setHariTunggal] = useState<string>(() => getHariIniWibIso());
  const [bulanTerpilih, setBulanTerpilih] = useState<string>(defaultBulan.ym);
  const [dari, setDari] = useState<string>(defaultBulan.dari);
  const [sampai, setSampai] = useState<string>(defaultBulan.sampai);

  const [data, setData] = useState<RekapPendapatanData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const reqIdRef = useRef<number>(0);

  const handleModeChange = (mode: 'HARIAN' | 'BULANAN' | 'KUSTOM') => {
    setJenisPeriode(mode);
    if (mode === 'HARIAN') {
      const h = hariTunggal || getHariIniWibIso();
      setHariTunggal(h);
      setDari(h);
      setSampai(h);
    } else if (mode === 'BULANAN') {
      const b = getRentangBulanWib(bulanTerpilih);
      setDari(b.dari);
      setSampai(b.sampai);
    }
  };

  const muatRekap = useCallback(
    async (signal?: AbortSignal) => {
      const errVal = validasiRentangTanggalUI(dari, sampai);
      if (errVal) {
        setErrorMsg(errVal);
        setLoading(false);
        return;
      }

      const myReq = ++reqIdRef.current;
      setLoading(true);
      setErrorMsg(null);

      try {
        const res = await apiClient.post(
          '/keuangan/rekap-pendapatan/list',
          { jenis_periode: jenisPeriode, dari, sampai },
          { signal }
        );
        if (signal?.aborted || myReq !== reqIdRef.current) return;
        setData(res.data?.data ?? null);
      } catch (err: unknown) {
        if (axios.isCancel(err)) return;
        if (myReq !== reqIdRef.current) return;
        if (axios.isAxiosError(err)) {
          setErrorMsg(
            (err.response?.data as { error?: { message?: string } } | undefined)?.error?.message ||
              'Gagal memuat rekap pendapatan.'
          );
        } else {
          setErrorMsg('Gagal memuat rekap pendapatan.');
        }
      } finally {
        if (!signal?.aborted && myReq === reqIdRef.current) {
          setLoading(false);
        }
      }
    },
    [jenisPeriode, dari, sampai]
  );

  useEffect(() => {
    const controller = new AbortController();
    void muatRekap(controller.signal);
    return () => controller.abort();
  }, [muatRekap]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }} data-testid="view-rekap-pendapatan">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Rekap Pendapatan Praktik
            </h2>
            {readOnly && (
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '0.18rem 0.55rem',
                  borderRadius: '9999px',
                  background: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #cbd5e1'
                }}
              >
                Baca Saja (Bidan)
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.825rem', color: '#64748b', margin: '0.2rem 0 0' }}>
            Total pendapatan dan rincian penerimaan per jalur pembayaran (MANDIRI, BPJS, ASURANSI) dari transaksi berstatus lunas.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => void muatRekap()}
            disabled={loading}
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
          >
            {loading ? 'Memuat...' : 'Muat Ulang'}
          </button>
          {!readOnly && onNavigateKasir && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={onNavigateKasir}
              style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem', fontWeight: 700 }}
            >
              Kelola Pembayaran Kasir
            </button>
          )}
        </div>
      </div>

      {/* Filter Periode */}
      <div className="dash-card">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(195px, 1fr))', gap: '0.85rem', alignItems: 'end' }}>
          <div>
            <label className="dash-label">Jenis Periode</label>
            <select
              className="dash-select"
              value={jenisPeriode}
              onChange={(e) => handleModeChange(e.target.value as 'HARIAN' | 'BULANAN' | 'KUSTOM')}
            >
              <option value="HARIAN">Harian</option>
              <option value="BULANAN">Bulanan</option>
              <option value="KUSTOM">Rentang Tanggal Kustom</option>
            </select>
          </div>

          {jenisPeriode === 'HARIAN' && (
            <div>
              <label className="dash-label">Tanggal ({formatTanggalUI(hariTunggal)})</label>
              <input
                type="date"
                className="dash-input tabular-nums"
                value={hariTunggal}
                onChange={(e) => {
                  const v = e.target.value;
                  setHariTunggal(v);
                  setDari(v);
                  setSampai(v);
                }}
              />
            </div>
          )}

          {jenisPeriode === 'BULANAN' && (
            <div>
              <label className="dash-label">Bulan ({formatTanggalUI(dari)} &ndash; {formatTanggalUI(sampai)})</label>
              <input
                type="month"
                className="dash-input tabular-nums"
                value={bulanTerpilih}
                onChange={(e) => {
                  const ym = e.target.value;
                  setBulanTerpilih(ym);
                  if (/^\d{4}-\d{2}$/.test(ym)) {
                    const r = getRentangBulanWib(ym);
                    setDari(r.dari);
                    setSampai(r.sampai);
                  }
                }}
              />
            </div>
          )}

          {jenisPeriode === 'KUSTOM' && (
            <>
              <div>
                <label className="dash-label">Tanggal Awal ({formatTanggalUI(dari)})</label>
                <input
                  type="date"
                  className="dash-input tabular-nums"
                  value={dari}
                  onChange={(e) => setDari(e.target.value)}
                />
              </div>
              <div>
                <label className="dash-label">Tanggal Akhir ({formatTanggalUI(sampai)})</label>
                <input
                  type="date"
                  className="dash-input tabular-nums"
                  value={sampai}
                  onChange={(e) => setSampai(e.target.value)}
                />
              </div>
            </>
          )}
        </div>
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
            alignItems: 'center'
          }}
        >
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{errorMsg}</span>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => void muatRekap()}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="dash-grid-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="dash-card" style={{ minHeight: '96px' }}>
              <div className="skeleton skeleton-text" style={{ width: '55%', marginBottom: '0.65rem' }} />
              <div className="skeleton skeleton-text" style={{ width: '45%', height: '26px' }} />
            </div>
          ))}
        </div>
      )}

      {/* Hasil Rekap */}
      {!loading && !errorMsg && data && (
        <>
          {/* Pesan Informasi bila Periode Tanpa Transaksi (Rp 0) */}
          {data.kosong && (
            <div
              data-testid="rekap-empty-info"
              style={{
                padding: '0.95rem 1.25rem',
                borderRadius: '10px',
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                color: '#1e40af',
                fontSize: '0.84rem',
                fontWeight: 600
              }}
            >
              {data.pesan_informasi || 'Tidak ada transaksi berstatus lunas pada periode yang dipilih (Rp 0).'}
            </div>
          )}

          {/* Kartu Total + 3 Jalur Pembayaran (MANDIRI, BPJS, ASURANSI) */}
          <div className="dash-grid-4">
            <div className="dash-card" data-testid="rekap-total-pendapatan">
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>Total Pendapatan Lunas</div>
              <div className="tabular-nums" style={{ fontSize: '1.6rem', fontWeight: 800, color: '#059669', margin: '0.25rem 0' }}>
                {formatRupiahUI(data.total_pendapatan)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {data.total_transaksi} pembayaran ({data.periode.dari_tampil} &ndash; {data.periode.sampai_tampil})
              </div>
            </div>

            {data.rincian_jalur.map((j) => (
              <div key={j.jalur} className="dash-card" data-testid={`rekap-jalur-${j.jalur}`}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>Jalur {j.jalur}</div>
                <div className="tabular-nums" style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', margin: '0.25rem 0' }}>
                  {formatRupiahUI(j.total_pendapatan)}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {j.jumlah_transaksi} transaksi ({j.jumlah_tagihan} tagihan)
                </div>
              </div>
            ))}
          </div>

          {/* Tabel Rincian per Tanggal & Jalur Pembayaran */}
          <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Rincian Transaksi Lunas per Tanggal &amp; Jalur Pembayaran
              </h3>
            </div>
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Jalur Penjamin</th>
                    <th>Metode Pembayaran</th>
                    <th style={{ textAlign: 'right' }}>Jumlah Transaksi</th>
                    <th style={{ textAlign: 'right' }}>Total Pendapatan</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rincian_harian.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                        Belum ada rincian penerimaan lunas pada periode {data.periode.dari_tampil} s/d {data.periode.sampai_tampil} (Rp 0).
                      </td>
                    </tr>
                  ) : (
                    data.rincian_harian.map((r, idx) => (
                      <tr key={`${r.tanggal}-${r.jalur}-${r.metode}-${idx}`}>
                        <td className="tabular-nums" style={{ fontWeight: 600 }}>{r.tanggal_tampil}</td>
                        <td>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              padding: '0.16rem 0.5rem',
                              borderRadius: '6px',
                              background:
                                r.jalur === 'BPJS' ? '#ede9fe' : r.jalur === 'ASURANSI' ? '#e0f2fe' : '#f1f5f9',
                              color:
                                r.jalur === 'BPJS' ? '#5b21b6' : r.jalur === 'ASURANSI' ? '#0369a1' : '#334155'
                            }}
                          >
                            {r.jalur}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.82rem', color: '#334155' }}>{r.metode}</td>
                        <td className="tabular-nums" style={{ textAlign: 'right' }}>{r.jumlah_transaksi}</td>
                        <td className="tabular-nums" style={{ textAlign: 'right', fontWeight: 800, color: '#059669' }}>
                          {formatRupiahUI(r.total_pendapatan)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RekapPendapatanView;
