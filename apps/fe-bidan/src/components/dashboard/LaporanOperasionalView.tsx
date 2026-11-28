import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { apiClient } from '../../api/client';
import {
  formatRupiahUI,
  formatTanggalUI,
  geserTanggalIso,
  getHariIniWibIso,
  getRentangBulanWib,
  hitungHariInklusifUI,
  hitungPeriodePembandingSebanding,
  validasiRentangTanggalUI
} from './formatters';

interface SeriPeriodeRow {
  label: string;
  periode_key: string;
  jumlah_kunjungan: number;
  total_pendapatan: number;
}

interface TrenDiagnosisRow {
  kode_icd: string;
  nama: string;
  jumlah: number;
}

interface TrenLayananRow {
  kode: string;
  nama: string;
  kategori: string;
  jumlah: number;
}

interface JamTersibukRow {
  jam: number;
  label_jam: string;
  jumlah: number;
}

interface EfekHargaItem {
  tipe_item: string;
  item_id: string;
  kode_item: string;
  nama_item: string;
  qty_lama: number;
  harga_lama: number;
  pendapatan_lama: number;
  qty_baru: number;
  harga_baru: number;
  pendapatan_baru: number;
  efek_volume: number;
  efek_harga: number;
  selisih_pendapatan: number;
  hanya_satu_periode: boolean;
}

interface RingkasanLaporanResponse {
  periode: {
    jenis_periode: 'HARIAN' | 'BULANAN';
    dari: string;
    sampai: string;
    dari_tampil: string;
    sampai_tampil: string;
  };
  kunjungan: {
    total_kunjungan: number;
    rawat_jalan: number;
    rawat_inap: number;
  };
  pendapatan: {
    total_pendapatan: number;
    jumlah_tagihan_lunas: number;
  };
  seri_periode: SeriPeriodeRow[];
  tren_diagnosis: TrenDiagnosisRow[];
  tren_layanan: TrenLayananRow[];
}

interface PerbandinganEfekResponse {
  periode_utama: { dari: string; sampai: string; dari_tampil: string; sampai_tampil: string; panjang_hari: number };
  periode_pembanding: { dari: string; sampai: string; dari_tampil: string; sampai_tampil: string; panjang_hari: number };
  ringkasan: {
    total_pendapatan_lama: number;
    total_pendapatan_baru: number;
    total_selisih: number;
    total_efek_volume: number;
    total_efek_harga: number;
  };
  items: EfekHargaItem[];
}

export const LaporanOperasionalView: React.FC = () => {
  const defaultBulan = useMemo(() => getRentangBulanWib(), []);
  const [jenisPeriode, setJenisPeriode] = useState<'BULANAN' | 'HARIAN'>('BULANAN');
  const [bulanTerpilih, setBulanTerpilih] = useState<string>(defaultBulan.ym);
  const [dari, setDari] = useState<string>(defaultBulan.dari);
  const [sampai, setSampai] = useState<string>(defaultBulan.sampai);

  const [gunakanPembanding, setGunakanPembanding] = useState<boolean>(false);
  const defaultComp = useMemo(
    () => hitungPeriodePembandingSebanding(defaultBulan.dari, defaultBulan.sampai),
    [defaultBulan.dari, defaultBulan.sampai]
  );
  const [pembandingDari, setPembandingDari] = useState<string>(defaultComp.pembanding_dari);
  const [pembandingSampai, setPembandingSampai] = useState<string>(defaultComp.pembanding_sampai);

  const [laporan, setLaporan] = useState<RingkasanLaporanResponse | null>(null);
  const [jamSibuk, setJamSibuk] = useState<JamTersibukRow[]>([]);
  const [perbandingan, setPerbandingan] = useState<PerbandinganEfekResponse | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [emptyPeriodMsg, setEmptyPeriodMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [downloadingFormat, setDownloadingFormat] = useState<'PDF' | 'EXCEL' | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // Guard pencegah kondisi balapan (race condition) saat filter diganti cepat
  const activeReqIdRef = useRef<number>(0);

  const handleJenisPeriodeChange = (nextJenis: 'BULANAN' | 'HARIAN') => {
    setJenisPeriode(nextJenis);
    if (nextJenis === 'BULANAN') {
      const r = getRentangBulanWib(bulanTerpilih);
      setDari(r.dari);
      setSampai(r.sampai);
      const comp = hitungPeriodePembandingSebanding(r.dari, r.sampai);
      setPembandingDari(comp.pembanding_dari);
      setPembandingSampai(comp.pembanding_sampai);
    } else {
      const today = getHariIniWibIso();
      const dStart = geserTanggalIso(today, -13);
      setDari(dStart);
      setSampai(today);
      const comp = hitungPeriodePembandingSebanding(dStart, today);
      setPembandingDari(comp.pembanding_dari);
      setPembandingSampai(comp.pembanding_sampai);
    }
  };

  const handleBulanChange = (ym: string) => {
    setBulanTerpilih(ym);
    if (/^\d{4}-\d{2}$/.test(ym)) {
      const r = getRentangBulanWib(ym);
      setDari(r.dari);
      setSampai(r.sampai);
      const comp = hitungPeriodePembandingSebanding(r.dari, r.sampai);
      setPembandingDari(comp.pembanding_dari);
      setPembandingSampai(comp.pembanding_sampai);
    }
  };

  const handlePembandingDariChange = (nextCompDari: string) => {
    setPembandingDari(nextCompDari);
    if (dari && sampai && nextCompDari && dari <= sampai) {
      const panjangUtama = Math.max(1, hitungHariInklusifUI(dari, sampai));
      setPembandingSampai(geserTanggalIso(nextCompDari, panjangUtama - 1));
    }
  };

  const fetchAllLaporan = useCallback(
    async (signal?: AbortSignal) => {
      const validationErr = validasiRentangTanggalUI(dari, sampai);
      if (validationErr) {
        setErrorMsg(validationErr);
        setEmptyPeriodMsg(null);
        setLoading(false);
        return;
      }

      if (gunakanPembanding) {
        const compErr = validasiRentangTanggalUI(pembandingDari, pembandingSampai);
        if (compErr) {
          setErrorMsg(`Periode pembanding: ${compErr}`);
          setEmptyPeriodMsg(null);
          setLoading(false);
          return;
        }
        const lenUtama = hitungHariInklusifUI(dari, sampai);
        const lenComp = hitungHariInklusifUI(pembandingDari, pembandingSampai);
        if (lenUtama !== lenComp) {
          setErrorMsg(
            `Panjang periode pembanding (${lenComp} hari) harus sama dengan periode utama (${lenUtama} hari).`
          );
          setEmptyPeriodMsg(null);
          setLoading(false);
          return;
        }
      }

      const myReqId = ++activeReqIdRef.current;
      setLoading(true);
      setErrorMsg(null);
      setEmptyPeriodMsg(null);
      setDownloadError(null);

      try {
        // Jam tersibuk selalu diambil untuk 30 hari terakhir
        const jamPromise = apiClient.post('/laporan/jam-tersibuk/list', {}, { signal });
        const ringkasanPromise = apiClient.post(
          '/laporan/ringkasan/list',
          { jenis_periode: jenisPeriode, dari, sampai },
          { signal }
        );
        const compPromise = gunakanPembanding
          ? apiClient.post(
              '/laporan/perbandingan/list',
              {
                dari,
                sampai,
                pembanding_dari: pembandingDari,
                pembanding_sampai: pembandingSampai
              },
              { signal }
            )
          : Promise.resolve(null);

        const [jamRes, ringRes, compRes] = await Promise.allSettled([
          jamPromise,
          ringkasanPromise,
          compPromise
        ]);

        if (signal?.aborted || myReqId !== activeReqIdRef.current) return;

        if (jamRes.status === 'fulfilled') {
          setJamSibuk(Array.isArray(jamRes.value.data?.data) ? jamRes.value.data.data : []);
        }

        if (ringRes.status === 'rejected') {
          const err = ringRes.reason;
          if (axios.isCancel(err)) return;
          if (axios.isAxiosError(err) && err.response?.status === 404) {
            // Spesifikasi Bagian D: HTTP 404 ditangani UI sebagai keadaan kosong, BUKAN error!
            const msg404 =
              (err.response?.data as { error?: { message?: string } } | undefined)?.error?.message ||
              'Data belum tersedia untuk periode ini';
            setLaporan(null);
            setEmptyPeriodMsg(msg404);
          } else if (axios.isAxiosError(err)) {
            const msgErr =
              (err.response?.data as { error?: { message?: string } } | undefined)?.error?.message ||
              'Gagal memuat laporan operasional.';
            setErrorMsg(msgErr);
            setLaporan(null);
          } else {
            setErrorMsg('Gagal memuat laporan operasional.');
          }
        } else {
          setLaporan(ringRes.value.data?.data ?? null);
        }

        if (gunakanPembanding && compRes) {
          if (compRes.status === 'fulfilled' && compRes.value) {
            setPerbandingan(compRes.value.data?.data ?? null);
          } else if (compRes.status === 'rejected' && !axios.isCancel(compRes.reason)) {
            const errComp = compRes.reason;
            if (axios.isAxiosError(errComp)) {
              setErrorMsg(
                (errComp.response?.data as { error?: { message?: string } } | undefined)?.error?.message ||
                  'Gagal memuat analisis efek harga.'
              );
            }
          }
        } else {
          setPerbandingan(null);
        }
      } finally {
        if (!signal?.aborted && myReqId === activeReqIdRef.current) {
          setLoading(false);
        }
      }
    },
    [dari, sampai, jenisPeriode, gunakanPembanding, pembandingDari, pembandingSampai]
  );

  useEffect(() => {
    const controller = new AbortController();
    void fetchAllLaporan(controller.signal);
    return () => controller.abort();
  }, [fetchAllLaporan]);

  const handleUnduh = async (format: 'PDF' | 'EXCEL') => {
    setDownloadingFormat(format);
    setDownloadError(null);
    try {
      const payload: Record<string, unknown> = {
        format,
        jenis_periode: jenisPeriode,
        dari,
        sampai
      };
      if (gunakanPembanding && pembandingDari && pembandingSampai) {
        payload.pembanding_dari = pembandingDari;
        payload.pembanding_sampai = pembandingSampai;
      }

      const res = await apiClient.post('/laporan/export', payload, {
        responseType: 'blob'
      });

      const blob = new Blob([res.data], {
        type:
          format === 'PDF'
            ? 'application/pdf'
            : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Laporan-Operasional-PMB_${dari}_sd_${sampai}.${format === 'PDF' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: unknown) {
      let msg = 'Gagal membuat berkas. Silakan coba lagi.';
      if (axios.isAxiosError(err) && err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text) as { error?: { message?: string } };
          if (parsed?.error?.message) msg = parsed.error.message;
        } catch {
          // gunakan pesan standar
        }
      } else if (axios.isAxiosError(err)) {
        msg =
          (err.response?.data as { error?: { message?: string } } | undefined)?.error?.message || msg;
      }
      setDownloadError(msg);
    } finally {
      setDownloadingFormat(null);
    }
  };

  const puncakJam = useMemo(() => {
    if (jamSibuk.length === 0) return null;
    const maxRow = jamSibuk.reduce((best, cur) => (cur.jumlah > best.jumlah ? cur : best), jamSibuk[0]!);
    return maxRow.jumlah > 0 ? maxRow : null;
  }, [jamSibuk]);

  const maxJamCount = useMemo(
    () => Math.max(1, ...jamSibuk.map((j) => j.jumlah)),
    [jamSibuk]
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }} data-testid="view-laporan-operasional">
      {/* Header & Tombol Unduh */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '0.85rem'
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Laporan Operasional &amp; Analisis Efek Harga
          </h2>
          <p style={{ fontSize: '0.825rem', color: '#64748b', margin: '0.2rem 0 0' }}>
            Evaluasi jumlah kunjungan, tren diagnosis &amp; layanan terbanyak, jam tersibuk (30 hari terakhir), serta dekomposisi efek volume &amp; harga.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={loading || Boolean(emptyPeriodMsg) || Boolean(errorMsg) || downloadingFormat !== null}
            onClick={() => void handleUnduh('PDF')}
            style={{ padding: '0.48rem 0.9rem', fontSize: '0.8rem', fontWeight: 700 }}
          >
            {downloadingFormat === 'PDF' ? 'Menyiapkan PDF...' : 'Unduh PDF'}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={loading || Boolean(emptyPeriodMsg) || Boolean(errorMsg) || downloadingFormat !== null}
            onClick={() => void handleUnduh('EXCEL')}
            style={{ padding: '0.48rem 0.9rem', fontSize: '0.8rem', fontWeight: 700 }}
          >
            {downloadingFormat === 'EXCEL' ? 'Menyiapkan Excel...' : 'Unduh Excel'}
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      <div className="dash-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '0.85rem', alignItems: 'end' }}>
          <div>
            <label className="dash-label">Jenis Periode</label>
            <select
              className="dash-select"
              value={jenisPeriode}
              onChange={(e) => handleJenisPeriodeChange(e.target.value as 'BULANAN' | 'HARIAN')}
            >
              <option value="BULANAN">Bulanan (Bawaan Bulan Berjalan)</option>
              <option value="HARIAN">Harian (Rentang Tanggal)</option>
            </select>
          </div>

          {jenisPeriode === 'BULANAN' && (
            <div>
              <label className="dash-label">Pilih Bulan Cepat</label>
              <input
                type="month"
                className="dash-input"
                value={bulanTerpilih}
                onChange={(e) => handleBulanChange(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="dash-label">Tanggal Awal ({formatTanggalUI(dari)})</label>
            <input
              type="date"
              className="dash-input tabular-nums"
              value={dari}
              onChange={(e) => {
                const nextDari = e.target.value;
                setDari(nextDari);
                if (gunakanPembanding && nextDari && sampai && nextDari <= sampai) {
                  const comp = hitungPeriodePembandingSebanding(nextDari, sampai);
                  setPembandingDari(comp.pembanding_dari);
                  setPembandingSampai(comp.pembanding_sampai);
                }
              }}
            />
          </div>

          <div>
            <label className="dash-label">Tanggal Akhir ({formatTanggalUI(sampai)})</label>
            <input
              type="date"
              className="dash-input tabular-nums"
              value={sampai}
              onChange={(e) => {
                const nextSampai = e.target.value;
                setSampai(nextSampai);
                if (gunakanPembanding && dari && nextSampai && dari <= nextSampai) {
                  const comp = hitungPeriodePembandingSebanding(dari, nextSampai);
                  setPembandingDari(comp.pembanding_dari);
                  setPembandingSampai(comp.pembanding_sampai);
                }
              }}
            />
          </div>
        </div>

        {/* Opsi Periode Pembanding */}
        <div style={{ paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0' }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.84rem', fontWeight: 700, color: '#1e293b' }}>
            <input
              type="checkbox"
              checked={gunakanPembanding}
              onChange={(e) => {
                const checked = e.target.checked;
                setGunakanPembanding(checked);
                if (checked && dari && sampai && dari <= sampai) {
                  const comp = hitungPeriodePembandingSebanding(dari, sampai);
                  setPembandingDari(comp.pembanding_dari);
                  setPembandingSampai(comp.pembanding_sampai);
                }
              }}
            />
            <span>Aktifkan Periode Pembanding (Analisis Efek Volume &amp; Efek Harga per Item)</span>
          </label>

          {gunakanPembanding && (
            <div style={{ marginTop: '0.75rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.85rem', alignItems: 'end' }}>
              <div>
                <label className="dash-label">Awal Pembanding ({formatTanggalUI(pembandingDari)})</label>
                <input
                  type="date"
                  className="dash-input tabular-nums"
                  value={pembandingDari}
                  onChange={(e) => handlePembandingDariChange(e.target.value)}
                />
              </div>
              <div>
                <label className="dash-label">Akhir Pembanding ({formatTanggalUI(pembandingSampai)})</label>
                <input
                  type="date"
                  className="dash-input tabular-nums"
                  value={pembandingSampai}
                  onChange={(e) => setPembandingSampai(e.target.value)}
                />
              </div>
              <div style={{ fontSize: '0.76rem', color: '#475569', paddingBottom: '0.35rem' }}>
                Panjang periode utama:{' '}
                <strong>{dari && sampai && dari <= sampai ? hitungHariInklusifUI(dari, sampai) : 0} hari</strong> &bull; Pembanding:{' '}
                <strong>
                  {pembandingDari && pembandingSampai && pembandingDari <= pembandingSampai
                    ? hitungHariInklusifUI(pembandingDari, pembandingSampai)
                    : 0}{' '}
                  hari
                </strong>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Download Error Alert */}
      {downloadError && (
        <div
          role="alert"
          style={{
            padding: '0.85rem 1.1rem',
            borderRadius: '8px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            fontSize: '0.84rem',
            fontWeight: 600
          }}
        >
          {downloadError}
        </div>
      )}

      {/* Validation / Server Error State */}
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
            onClick={() => void fetchAllLaporan()}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
          >
            Muat Ulang
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="dash-grid-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="dash-card" style={{ minHeight: '96px' }}>
              <div className="skeleton skeleton-text" style={{ width: '55%', marginBottom: '0.65rem' }} />
              <div className="skeleton skeleton-text" style={{ width: '45%', height: '26px' }} />
            </div>
          ))}
        </div>
      )}

      {/* Empty State (HTTP 404 ERR-RPT-01 ditangani sebagai keadaan kosong, BUKAN error) */}
      {!loading && !errorMsg && emptyPeriodMsg && (
        <div
          data-testid="laporan-empty-state"
          style={{
            padding: '2.25rem 1.5rem',
            borderRadius: '12px',
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.35rem' }}>
            {emptyPeriodMsg}
          </div>
          <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
            Periode terpilih ({formatTanggalUI(dari)} s/d {formatTanggalUI(sampai)}) belum memiliki kunjungan maupun pembayaran lunas.
          </div>
        </div>
      )}

      {/* Laporan Utama */}
      {!loading && !errorMsg && laporan && (
        <>
          {/* Kartu Ringkasan */}
          <div className="dash-grid-4">
            <div className="dash-card">
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>Total Kunjungan Periode</div>
              <div className="tabular-nums" style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0.25rem 0' }}>
                {laporan.kunjungan.total_kunjungan}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {laporan.periode.dari_tampil} &ndash; {laporan.periode.sampai_tampil}
              </div>
            </div>

            <div className="dash-card">
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>Ringkasan Pendapatan Lunas</div>
              <div className="tabular-nums" style={{ fontSize: '1.55rem', fontWeight: 800, color: '#059669', margin: '0.25rem 0' }}>
                {formatRupiahUI(laporan.pendapatan.total_pendapatan)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {laporan.pendapatan.jumlah_tagihan_lunas} tagihan berstatus lunas
              </div>
            </div>

            <div className="dash-card">
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>Diagnosis Terbanyak</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '0.35rem 0 0.2rem' }}>
                {laporan.tren_diagnosis[0]
                  ? `[${laporan.tren_diagnosis[0].kode_icd}] ${laporan.tren_diagnosis[0].nama}`
                  : '-'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {laporan.tren_diagnosis[0] ? `${laporan.tren_diagnosis[0].jumlah} kasus pada periode ini` : 'Belum ada data'}
              </div>
            </div>

            <div className="dash-card">
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>Jam Puncak (30 Hari Terakhir)</div>
              <div className="tabular-nums" style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--color-primary-dark)', margin: '0.25rem 0' }}>
                {puncakJam ? `${puncakJam.label_jam} WIB` : '-'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {puncakJam ? `${puncakJam.jumlah} kunjungan pada jam puncak` : 'Belum ada kunjungan'}
              </div>
            </div>
          </div>

          {/* Tabel Seri Kunjungan & Pendapatan Harian/Bulanan */}
          <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Rincian Kunjungan &amp; Pendapatan ({jenisPeriode === 'HARIAN' ? 'Harian' : 'Bulanan'})
              </h3>
            </div>
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Periode</th>
                    <th style={{ textAlign: 'right' }}>Jumlah Kunjungan Valid</th>
                    <th style={{ textAlign: 'right' }}>Pendapatan Lunas</th>
                  </tr>
                </thead>
                <tbody>
                  {laporan.seri_periode.map((row) => (
                    <tr key={row.periode_key}>
                      <td className="tabular-nums" style={{ fontWeight: 700 }}>{row.label}</td>
                      <td className="tabular-nums" style={{ textAlign: 'right', fontWeight: 700 }}>{row.jumlah_kunjungan}</td>
                      <td className="tabular-nums" style={{ textAlign: 'right', fontWeight: 700, color: '#059669' }}>
                        {formatRupiahUI(row.total_pendapatan)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Grid 2 Kolom: Tren Diagnosis Terbanyak & Tren Jenis Layanan Terbanyak */}
          <div className="dash-grid-2">
            <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Tren Diagnosis Terbanyak (ICD-10)
                </h3>
                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.15rem 0 0' }}>
                  Tidak menghitung ganda kunjungan asal yang telah dikoreksi.
                </p>
              </div>
              <div className="dash-table-wrap">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Kode ICD</th>
                      <th>Nama Diagnosis</th>
                      <th style={{ textAlign: 'right' }}>Jumlah</th>
                    </tr>
                  </thead>
                  <tbody>
                    {laporan.tren_diagnosis.length === 0 ? (
                      <tr>
                        <td colSpan={3} style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b' }}>
                          Belum ada data diagnosis pada periode ini.
                        </td>
                      </tr>
                    ) : (
                      laporan.tren_diagnosis.map((d) => (
                        <tr key={`${d.kode_icd}-${d.nama}`}>
                          <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                            {d.kode_icd}
                          </td>
                          <td style={{ fontWeight: 600 }}>{d.nama}</td>
                          <td className="tabular-nums" style={{ textAlign: 'right', fontWeight: 800 }}>{d.jumlah}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Tren Jenis Layanan Medis Terbanyak
                </h3>
                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.15rem 0 0' }}>
                  Frekuensi tindakan kebidanan pada periode terpilih.
                </p>
              </div>
              <div className="dash-table-wrap">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Kode</th>
                      <th>Layanan Medis</th>
                      <th>Kategori</th>
                      <th style={{ textAlign: 'right' }}>Jumlah</th>
                    </tr>
                  </thead>
                  <tbody>
                    {laporan.tren_layanan.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b' }}>
                          Belum ada tindakan layanan pada periode ini.
                        </td>
                      </tr>
                    ) : (
                      laporan.tren_layanan.map((l) => (
                        <tr key={`${l.kode}-${l.nama}`}>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.76rem', color: '#475569' }}>{l.kode}</td>
                          <td style={{ fontWeight: 600 }}>{l.nama}</td>
                          <td style={{ fontSize: '0.75rem', color: '#64748b' }}>{l.kategori}</td>
                          <td className="tabular-nums" style={{ textAlign: 'right', fontWeight: 800 }}>{l.jumlah}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Grafik Jam Kunjungan Tersibuk (30 Hari Terakhir WIB) */}
      {!loading && jamSibuk.length > 0 && (
        <div className="dash-card">
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Grafik Jam Kunjungan Tersibuk (30 Hari Terakhir WIB)
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0.15rem 0 0' }}>
              Sebaran jam kedatangan pasien non-koreksi berdasarkan zona waktu Asia/Jakarta.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(24, minmax(22px, 1fr))',
              gap: '0.3rem',
              alignItems: 'end',
              height: '165px',
              paddingTop: '1.25rem',
              borderBottom: '1px solid #e2e8f0'
            }}
          >
            {jamSibuk.map((item) => {
              const pct = item.jumlah > 0 ? Math.max(8, Math.round((item.jumlah / maxJamCount) * 100)) : 2;
              const isPeak = puncakJam && item.jam === puncakJam.jam && item.jumlah > 0;
              return (
                <div
                  key={item.jam}
                  title={`Pukul ${item.label_jam} WIB: ${item.jumlah} kunjungan`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    height: '100%'
                  }}
                >
                  {item.jumlah > 0 && (
                    <span className="tabular-nums" style={{ fontSize: '0.66rem', fontWeight: 700, color: isPeak ? 'var(--color-primary-dark)' : '#475569', marginBottom: '0.2rem' }}>
                      {item.jumlah}
                    </span>
                  )}
                  <div
                    style={{
                      width: '100%',
                      height: `${pct}%`,
                      borderRadius: '4px 4px 0 0',
                      background: isPeak ? 'var(--color-primary)' : item.jumlah > 0 ? '#94a3b8' : '#f1f5f9',
                      transition: 'height 0.2s ease'
                    }}
                  />
                </div>
              );
            })}
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(24, minmax(22px, 1fr))',
              gap: '0.3rem',
              marginTop: '0.35rem'
            }}
          >
            {jamSibuk.map((item) => (
              <div key={item.jam} className="tabular-nums" style={{ textAlign: 'center', fontSize: '0.64rem', color: '#64748b' }}>
                {String(item.jam).padStart(2, '0')}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analisis Efek Volume & Efek Harga per Item */}
      {!loading && gunakanPembanding && perbandingan && (
        <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }} data-testid="panel-efek-harga">
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Analisis Dekomposisi Efek Volume &amp; Efek Harga per Item
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0.2rem 0 0' }}>
              Periode Utama ({perbandingan.periode_utama.dari_tampil} &ndash; {perbandingan.periode_utama.sampai_tampil}) dibanding
              Periode Pembanding ({perbandingan.periode_pembanding.dari_tampil} &ndash; {perbandingan.periode_pembanding.sampai_tampil},{' '}
              {perbandingan.periode_utama.panjang_hari} hari).
            </p>
          </div>

          <div className="dash-grid-4" style={{ padding: '1rem 1.25rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <div>
              <div style={{ fontSize: '0.73rem', color: '#64748b', fontWeight: 600 }}>Pendapatan Pembanding &rarr; Utama</div>
              <div className="tabular-nums" style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>
                {formatRupiahUI(perbandingan.ringkasan.total_pendapatan_lama)} &rarr; {formatRupiahUI(perbandingan.ringkasan.total_pendapatan_baru)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.73rem', color: '#64748b', fontWeight: 600 }}>Total Efek Volume</div>
              <div
                className="tabular-nums"
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  color: perbandingan.ringkasan.total_efek_volume >= 0 ? '#0369a1' : '#b91c1c',
                  marginTop: '0.2rem'
                }}
              >
                {formatRupiahUI(perbandingan.ringkasan.total_efek_volume)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.73rem', color: '#64748b', fontWeight: 600 }}>Total Efek Harga</div>
              <div
                className="tabular-nums"
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  color: perbandingan.ringkasan.total_efek_harga >= 0 ? '#059669' : '#b91c1c',
                  marginTop: '0.2rem'
                }}
              >
                {formatRupiahUI(perbandingan.ringkasan.total_efek_harga)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.73rem', color: '#64748b', fontWeight: 600 }}>Selisih Pendapatan Total</div>
              <div
                className="tabular-nums"
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  color: perbandingan.ringkasan.total_selisih >= 0 ? '#059669' : '#b91c1c',
                  marginTop: '0.2rem'
                }}
              >
                {formatRupiahUI(perbandingan.ringkasan.total_selisih)}
              </div>
            </div>
          </div>

          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Kode</th>
                  <th>Nama Layanan / Obat</th>
                  <th style={{ textAlign: 'right' }}>Qty Lama &rarr; Baru</th>
                  <th style={{ textAlign: 'right' }}>Harga Rata2 Lama &rarr; Baru</th>
                  <th style={{ textAlign: 'right' }}>Efek Volume</th>
                  <th style={{ textAlign: 'right' }}>Efek Harga</th>
                  <th style={{ textAlign: 'right' }}>Selisih Pendapatan</th>
                </tr>
              </thead>
              <tbody>
                {perbandingan.items.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '1.75rem', textAlign: 'center', color: '#64748b' }}>
                      Tidak ada rincian item lunas pada kedua periode yang dibandingkan.
                    </td>
                  </tr>
                ) : (
                  perbandingan.items.map((it) => (
                    <tr key={`${it.tipe_item}-${it.item_id}`}>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.76rem', color: '#475569' }}>{it.kode_item}</td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{it.nama_item}</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                          {it.tipe_item}
                          {it.hanya_satu_periode ? ' • Hanya di 1 periode (100% efek volume)' : ''}
                        </div>
                      </td>
                      <td className="tabular-nums" style={{ textAlign: 'right' }}>
                        {it.qty_lama} &rarr; <strong>{it.qty_baru}</strong>
                      </td>
                      <td className="tabular-nums" style={{ textAlign: 'right', fontSize: '0.78rem' }}>
                        {formatRupiahUI(it.harga_lama)} &rarr; {formatRupiahUI(it.harga_baru)}
                      </td>
                      <td
                        className="tabular-nums"
                        style={{
                          textAlign: 'right',
                          fontWeight: 700,
                          color: it.efek_volume >= 0 ? '#0369a1' : '#b91c1c'
                        }}
                      >
                        {formatRupiahUI(it.efek_volume)}
                      </td>
                      <td
                        className="tabular-nums"
                        style={{
                          textAlign: 'right',
                          fontWeight: 700,
                          color: it.efek_harga > 0 ? '#059669' : it.efek_harga < 0 ? '#b91c1c' : '#64748b'
                        }}
                      >
                        {formatRupiahUI(it.efek_harga)}
                      </td>
                      <td
                        className="tabular-nums"
                        style={{
                          textAlign: 'right',
                          fontWeight: 800,
                          color: it.selisih_pendapatan >= 0 ? '#059669' : '#b91c1c'
                        }}
                      >
                        {formatRupiahUI(it.selisih_pendapatan)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default LaporanOperasionalView;
