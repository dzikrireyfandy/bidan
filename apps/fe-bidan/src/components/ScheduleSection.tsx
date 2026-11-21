import React from 'react';
import { MOCK_SESI_HARI_INI, KLINIK_INFO } from '../api/mockData';

interface ScheduleSectionProps {
  onOpenBooking: () => void;
  isLoading?: boolean;
}

export const ScheduleSection: React.FC<ScheduleSectionProps> = ({ onOpenBooking, isLoading = false }) => {
  return (
    <section id="jadwal" style={{ padding: '5rem 0', background: '#ffffff', borderBottom: '1px solid var(--border-light)' }}>
      <div className="container">
        <div className="section-header">
          <div className="section-pill">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <span>Jadwal Operasional</span>
          </div>
          <h2 className="section-title">Waktu Layanan & Sesi Praktik</h2>
          <p className="section-subtitle">
            Pelayanan persalinan siaga 24 jam penuh. Pemeriksaan kehamilan dan konsultasi 
            terbagi dalam 2 sesi teratur untuk kenyamanan antrean Anda.
          </p>
        </div>

        {/* 24-Hour Emergency Banner */}
        <div 
          className="card-hover" 
          style={{ 
            background: 'linear-gradient(135deg, #58207e 0%, #3f155c 100%)', 
            color: '#ffffff', 
            padding: '1.75rem 2rem', 
            borderRadius: '16px', 
            marginBottom: '2.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.25rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fcd34d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Pelayanan Persalinan & Gawat Darurat Kebidanan</h3>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, background: '#ef4444', color: '#ffffff', padding: '0.2rem 0.6rem', borderRadius: '9999px' }}>
                  24 JAM NON-STOP
                </span>
              </div>
              <p style={{ color: '#e2e8f0', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                Siap siaga melayani persalinan normal dan tindakan darurat kebidanan sewaktu-waktu.
              </p>
            </div>
          </div>

          <a 
            href={`tel:${KLINIK_INFO.telepon}`}
            className="btn btn-outline-white btn-shimmer"
            style={{ padding: '0.75rem 1.4rem' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            <span>Hubungi Bidan: {KLINIK_INFO.telepon}</span>
          </a>
        </div>

        {/* Regular Consultation Sessions */}
        {isLoading ? (
          <div className="schedule-grid">
            <div className="skeleton" style={{ height: '220px', borderRadius: '18px' }}></div>
            <div className="skeleton" style={{ height: '220px', borderRadius: '18px' }}></div>
          </div>
        ) : (
          <div className="schedule-grid">
            {MOCK_SESI_HARI_INI.map((sesi) => (
              <div key={sesi.sesi_id} className="schedule-card card-hover" style={{ background: '#faf8fc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)', background: 'var(--color-primary-tint)', padding: '0.25rem 0.65rem', borderRadius: '9999px' }}>
                      Sesi Konsultasi Terjadwal
                    </span>
                    <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-slate-900)', marginTop: '0.5rem' }}>
                      {sesi.nama}
                    </h3>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
                      {sesi.jam_mulai} - {sesi.jam_selesai}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>Waktu Indonesia Barat (WIB)</span>
                  </div>
                </div>

                <p style={{ fontSize: '0.875rem', color: 'var(--color-slate-600)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                  {sesi.keterangan}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1.25rem', borderTop: '1px solid var(--border-light)' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>Sisa Kuota Sesi</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: sesi.sisa_kuota > 0 ? '#16a34a' : '#dc2626' }}>
                      {sesi.sisa_kuota} dari {sesi.kuota_maks} Kuota
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onOpenBooking}
                    className="btn btn-primary btn-shimmer"
                    style={{ padding: '0.65rem 1.25rem', fontSize: '0.875rem' }}
                    disabled={sesi.sisa_kuota === 0}
                  >
                    <span>Pilih Sesi Ini</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"/>
                      <polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
