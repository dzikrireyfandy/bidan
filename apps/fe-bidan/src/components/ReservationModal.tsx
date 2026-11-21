import React, { useState } from 'react';
import { MOCK_LAYANAN, MOCK_SESI_HARI_INI, KLINIK_INFO } from '../api/mockData';
import { LayananItem, ReservasiData } from '../api/types';

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLayanan?: LayananItem | null;
}

export const ReservationModal: React.FC<ReservationModalProps> = ({
  isOpen,
  onClose,
  selectedLayanan
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successTicket, setSuccessTicket] = useState<{
    kode: string;
    nomorAntrean: string;
    estimasiJam: string;
    layananNama: string;
    sesiNama: string;
    tanggal: string;
  } | null>(null);

  const [formData, setFormData] = useState<ReservasiData>({
    nama: '',
    nik: '',
    no_hp: '',
    email: '',
    tanggal: new Date().toISOString().split('T')[0] || '',
    sesi_id: 'SESI-PAGI',
    layanan_id: selectedLayanan ? selectedLayanan.layanan_id : 'LAY-01',
    keluhan: '',
    is_pasien_lama: false
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      const targetSesi = MOCK_SESI_HARI_INI.find(s => s.sesi_id === formData.sesi_id) || MOCK_SESI_HARI_INI[0]!;
      const targetLayanan = MOCK_LAYANAN.find(l => l.layanan_id === formData.layanan_id) || MOCK_LAYANAN[0]!;
      
      const queueNumber = targetSesi.terisi + 1;
      const parts = targetSesi.jam_mulai.split(':').map(Number);
      const startHour = parts[0] ?? 8;
      const startMin = parts[1] ?? 0;
      const estMinutes = (startHour * 60) + startMin + ((queueNumber - 1) * targetSesi.durasi_per_pasien);
      const estH = Math.floor(estMinutes / 60).toString().padStart(2, '0');
      const estM = (estMinutes % 60).toString().padStart(2, '0');

      setSuccessTicket({
        kode: `RES-${Date.now().toString().slice(-6)}`,
        nomorAntrean: `A-${queueNumber.toString().padStart(3, '0')}`,
        estimasiJam: `${estH}:${estM} WIB`,
        layananNama: targetLayanan.nama,
        sesiNama: targetSesi.nama,
        tanggal: formData.tanggal
      });

      setIsSubmitting(false);
      setStep(3);
    }, 700);
  };

  const handleResetAndClose = () => {
    setStep(1);
    setSuccessTicket(null);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)' }}>
      <div style={{ background: '#ffffff', width: '100%', maxWidth: '640px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid var(--border-medium)', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* Modal Header */}
        <div style={{ padding: '1.25rem 1.75rem', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#faf8fc' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--color-primary-tint)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
                {step === 3 ? 'Tiket Reservasi Terbit' : 'Reservasi Sesi Pemeriksaan'}
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>
                Praktik Mandiri Bidan Ria Indrasti J. S.keb
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetAndClose}
            style={{ width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-slate-400)', background: '#f1f5f9' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.75rem', overflowY: 'auto' }}>
          {step === 1 && (
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-slate-900)', marginBottom: '1.25rem' }}>
                Langkah 1: Pilih Layanan & Sesi Waktu
              </h4>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-slate-700)', marginBottom: '0.5rem' }}>
                  Pilih Layanan Asuhan Kebidanan
                </label>
                <select
                  value={formData.layanan_id}
                  onChange={(e) => setFormData({ ...formData, layanan_id: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border-medium)', fontSize: '0.9375rem', outline: 'none' }}
                >
                  {MOCK_LAYANAN.map((l) => (
                    <option key={l.layanan_id} value={l.layanan_id}>
                      {l.nama} ({l.highlight})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-slate-700)', marginBottom: '0.5rem' }}>
                    Tanggal Rencana Kunjungan
                  </label>
                  <input
                    type="date"
                    value={formData.tanggal}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border-medium)', fontSize: '0.9375rem', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-slate-700)', marginBottom: '0.5rem' }}>
                    Pilihan Sesi Praktik
                  </label>
                  <select
                    value={formData.sesi_id}
                    onChange={(e) => setFormData({ ...formData, sesi_id: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border-medium)', fontSize: '0.9375rem', outline: 'none' }}
                  >
                    {MOCK_SESI_HARI_INI.map((s) => (
                      <option key={s.sesi_id} value={s.sesi_id}>
                        {s.nama} ({s.jam_mulai} - {s.jam_selesai}) - Sisa {s.sisa_kuota} Kuota
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ background: '#faf5fe', padding: '1rem', borderRadius: '12px', border: '1px solid #efe8f6', marginBottom: '1.5rem', fontSize: '0.8125rem', color: 'var(--color-slate-600)' }}>
                <strong>Catatan Alur:</strong> Setiap nomor antrean memiliki alokasi 15 menit. Anda akan mendapatkan estimasi jam kedatangan otomatis agar terhindar dari antrean panjang.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="btn btn-primary btn-shimmer"
                >
                  <span>Lanjutkan ke Data Diri</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                    <polyline points="12 5 19 12 12 19"/>
                  </svg>
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit}>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-slate-900)', marginBottom: '1.25rem' }}>
                Langkah 2: Data Pasien & Kontak
              </h4>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-slate-700)', marginBottom: '0.4rem' }}>
                  Nama Lengkap Pasien *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ny. Ratna Sari"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border-medium)', fontSize: '0.9375rem', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-slate-700)', marginBottom: '0.4rem' }}>
                    Nomor Induk Kependudukan (NIK) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={16}
                    placeholder="16 digit NIK"
                    value={formData.nik}
                    onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border-medium)', fontSize: '0.9375rem', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-slate-700)', marginBottom: '0.4rem' }}>
                    Nomor WhatsApp / HP Aktif *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Contoh: 08123456789"
                    value={formData.no_hp}
                    onChange={(e) => setFormData({ ...formData, no_hp: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border-medium)', fontSize: '0.9375rem', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-slate-700)', marginBottom: '0.4rem' }}>
                  Keluhan / Alasan Kunjungan
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Pemeriksaan rutin trimester kedua, merasakan sedikit kram perut..."
                  value={formData.keluhan}
                  onChange={(e) => setFormData({ ...formData, keluhan: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border-medium)', fontSize: '0.9375rem', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn btn-secondary"
                >
                  Kembali
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary btn-shimmer"
                >
                  {isSubmitting ? 'Memproses...' : 'Konfirmasi & Terbitkan Tiket'}
                </button>
              </div>
            </form>
          )}

          {step === 3 && successTicket && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>

              <h4 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
                Reservasi Berhasil Dikonfirmasi
              </h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-slate-600)', marginTop: '0.25rem' }}>
                Simpan nomor antrean Anda untuk ditunjukkan kepada petugas saat tiba di klinik.
              </p>

              {/* Digital Ticket Card */}
              <div style={{ margin: '1.75rem auto', padding: '1.5rem', background: '#faf5fe', border: '2px dashed var(--border-medium)', borderRadius: '16px', maxWidth: '420px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Nomor Antrean Anda
                </span>
                <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--color-primary-dark)', margin: '0.5rem 0' }}>
                  {successTicket.nomorAntrean}
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-slate-800)' }}>
                  {successTicket.layananNama}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-slate-500)', marginTop: '0.25rem' }}>
                  {successTicket.sesiNama} | Tanggal: {successTicket.tanggal}
                </div>

                <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #efe8f6', display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                  <span style={{ color: 'var(--color-slate-500)' }}>Estimasi Dipanggil:</span>
                  <strong style={{ color: '#16a34a', fontSize: '0.9375rem' }}>{successTicket.estimasiJam}</strong>
                </div>
              </div>

              <p style={{ fontSize: '0.8125rem', color: 'var(--color-slate-500)', marginBottom: '1.5rem' }}>
                Alamat: {KLINIK_INFO.alamat}
              </p>

              <button
                type="button"
                onClick={handleResetAndClose}
                className="btn btn-primary btn-shimmer"
                style={{ width: '100%' }}
              >
                Selesai & Tutup
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
