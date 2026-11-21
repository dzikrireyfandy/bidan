import React from 'react';
import { KLINIK_INFO } from '../api/mockData';

interface HeroProps {
  onOpenBooking: () => void;
  isLoading?: boolean;
}

export const Hero: React.FC<HeroProps> = ({ onOpenBooking, isLoading = false }) => {
  if (isLoading) {
    return (
      <section className="hero-section" id="beranda">
        <div className="container">
          <div className="hero-grid">
            <div>
              <div className="skeleton skeleton-badge" style={{ marginBottom: '1.25rem' }}></div>
              <div className="skeleton skeleton-title" style={{ height: '44px', width: '90%' }}></div>
              <div className="skeleton skeleton-title" style={{ height: '44px', width: '70%', marginBottom: '1.5rem' }}></div>
              <div className="skeleton skeleton-text" style={{ width: '85%' }}></div>
              <div className="skeleton skeleton-text" style={{ width: '65%', marginBottom: '2rem' }}></div>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem' }}>
                <div className="skeleton" style={{ width: '160px', height: '48px', borderRadius: '12px' }}></div>
                <div className="skeleton" style={{ width: '160px', height: '48px', borderRadius: '12px' }}></div>
              </div>
              <div className="hero-stats-row">
                <div className="skeleton" style={{ height: '60px' }}></div>
                <div className="skeleton" style={{ height: '60px' }}></div>
                <div className="skeleton" style={{ height: '60px' }}></div>
              </div>
            </div>
            <div>
              <div className="skeleton" style={{ height: '420px', borderRadius: '24px' }}></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="hero-section" id="beranda">
      <div className="container">
        <div className="hero-grid">
          {/* Left Column: Hero Content */}
          <div>
            <div className="hero-tag">
              <span className="pulse-indicator">
                <span className="pulse-indicator-ping"></span>
                <span className="pulse-indicator-dot"></span>
              </span>
              <span>Siaga 24 Jam Non-Stop</span>
              <span style={{ color: '#cbd5e1' }}>|</span>
              <span style={{ color: '#475569' }}>Kota Jambi</span>
            </div>

            <h1 className="hero-title">
              Asuhan Kebidanan Profesional & Siaga Penuh{' '}
              <span className="hero-title-highlight">24 Jam</span>
            </h1>

            <p className="hero-description">
              Dedikasi pelayanan kesehatan ibu, kehamilan, persalinan normal yang nyaman, 
              serta perawatan bayi baru lahir secara menyeluruh di bawah asuhan langsung{' '}
              <strong>{KLINIK_INFO.bidan}</strong>.
            </p>

            {/* CTAs */}
            <div className="hero-cta-group">
              <button
                type="button"
                onClick={onOpenBooking}
                className="btn btn-primary btn-shimmer"
                style={{ padding: '0.85rem 1.6rem', fontSize: '1rem' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <span>Reservasi Sesi Pemeriksaan</span>
              </button>

              <a
                href={`https://wa.me/62${KLINIK_INFO.whatsapp.replace(/^0/, '')}?text=Halo%20Bidan%20Ria,%20saya%20memerlukan%20informasi%20layanan`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-emergency btn-shimmer"
                style={{ padding: '0.85rem 1.4rem' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                <span>Siaga Darurat: {KLINIK_INFO.telepon}</span>
              </a>
            </div>

            {/* Quick Metrics */}
            <div className="hero-stats-row">
              <div className="stat-item">
                <span className="stat-value">24 Jam</span>
                <span className="stat-label">Siaga Persalinan</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">2 Sesi</span>
                <span className="stat-label">Pagi & Sore Terjadwal</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">SIPB Resmi</span>
                <span className="stat-label">Tenaga Bidan Teregistrasi</span>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Card with Official Logo */}
          <div>
            <div className="hero-visual-card card-hover">
              <div className="hero-logo-box">
                <img
                  src="/logo-bidan.png"
                  alt="Logo Praktik Bidan Ria Indrasti"
                  className="hero-logo-img"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.src.includes('public/logo-bidan.png')) {
                      target.src = './public/logo-bidan.png';
                    }
                  }}
                />
              </div>

              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
                  {KLINIK_INFO.nama}
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-slate-500)', marginTop: '0.25rem' }}>
                  {KLINIK_INFO.sipb}
                </p>
              </div>

              {/* Information Checklist */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', background: '#faf5fe', padding: '1.25rem', borderRadius: '14px', border: '1px solid #efe8f6' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', fontSize: '0.875rem' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}>
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  <span><strong>Persalinan Normal Siaga 24 Jam</strong> dengan pendampingan penuh.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', fontSize: '0.875rem' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}>
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  <span><strong>Asuhan BBL 0-6 Jam</strong> (IMD, Vitamin K1, Salep Mata steril).</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', fontSize: '0.875rem' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}>
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  <span><strong>Alamat:</strong> {KLINIK_INFO.alamat}.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
