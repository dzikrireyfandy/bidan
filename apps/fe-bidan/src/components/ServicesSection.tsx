import React from 'react';
import { MOCK_LAYANAN } from '../api/mockData';
import { LayananItem } from '../api/types';

interface ServicesSectionProps {
  onSelectService: (layanan: LayananItem) => void;
  isLoading?: boolean;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({ onSelectService, isLoading = false }) => {
  const renderIcon = (iconType: string) => {
    switch (iconType) {
      case 'anc':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4.5 3v5a4.5 4.5 0 0 0 9 0V3"/>
            <path d="M9 12.5v4.5a3 3 0 0 0 6 0v-4.5"/>
            <circle cx="15" cy="17" r="2"/>
            <circle cx="4.5" cy="3" r="1"/>
            <circle cx="13.5" cy="3" r="1"/>
          </svg>
        );
      case 'persalinan':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        );
      case 'kb':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        );
      case 'newborn':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="5"/>
            <path d="M20 21a8 8 0 1 0-16 0"/>
          </svg>
        );
      case 'neonatal':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
        );
      case 'laktasi':
      default:
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        );
    }
  };

  return (
    <section id="layanan" style={{ padding: '5.5rem 0', background: 'var(--bg-page)' }}>
      <div className="container">
        <div className="section-header">
          <div className="section-pill">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <span>Cakupan Asuhan Medis</span>
          </div>
          <h2 className="section-title">Layanan Asuhan Kebidanan</h2>
          <p className="section-subtitle">
            Pelayanan kebidanan menyeluruh bagi kesehatan ibu hamil, proses persalinan, 
            asuhan bayi baru lahir, dan perencanaan keluarga.
          </p>
        </div>

        {/* Services Grid (Without Prices & Without Vaccines) */}
        {isLoading ? (
          <div className="services-grid">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="card-hover" style={{ padding: '1.85rem', height: '340px' }}>
                <div className="skeleton skeleton-icon" style={{ marginBottom: '1.25rem' }}></div>
                <div className="skeleton skeleton-badge" style={{ marginBottom: '0.75rem' }}></div>
                <div className="skeleton skeleton-title"></div>
                <div className="skeleton skeleton-text"></div>
                <div className="skeleton skeleton-text" style={{ width: '80%' }}></div>
                <div style={{ marginTop: '1.5rem' }}>
                  <div className="skeleton skeleton-text" style={{ width: '90%' }}></div>
                  <div className="skeleton skeleton-text" style={{ width: '85%' }}></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="services-grid">
            {MOCK_LAYANAN.map((item) => (
              <div key={item.layanan_id} className="service-card card-hover">
                <div className="service-card-top">
                  <div className="service-icon-box icon-wrapper">
                    {renderIcon(item.icon)}
                  </div>

                  <span className="service-badge">
                    {item.highlight}
                  </span>

                  <h3 className="service-card-title">
                    {item.nama}
                  </h3>

                  <p className="service-card-desc">
                    {item.deskripsi}
                  </p>

                  {/* Scope Checklist */}
                  <ul className="service-features-list">
                    {item.cakupan.map((cakup, idx) => (
                      <li key={idx} className="service-feature-item">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        <span>{cakup}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div style={{ paddingTop: '1.25rem', borderTop: '1px solid var(--border-light)' }}>
                  <button
                    type="button"
                    onClick={() => onSelectService(item)}
                    className="btn btn-secondary btn-shimmer"
                    style={{ width: '100%', fontSize: '0.875rem', justifyContent: 'center' }}
                  >
                    <span>Reservasi Layanan Ini</span>
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
