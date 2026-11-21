import React from 'react';
import { MOCK_TESTIMONI } from '../api/mockData';

interface TestimonialSectionProps {
  isLoading?: boolean;
}

export const TestimonialSection: React.FC<TestimonialSectionProps> = ({ isLoading = false }) => {
  return (
    <section style={{ padding: '5.5rem 0', background: 'var(--bg-page)' }}>
      <div className="container">
        <div className="section-header">
          <div className="section-pill">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span>Ulasan Pasien</span>
          </div>
          <h2 className="section-title">Pengalaman Asuhan Kebidanan</h2>
          <p className="section-subtitle">
            Kesan nyata para ibu dan keluarga yang telah mempercayakan persalinan dan kesehatan kehamilannya.
          </p>
        </div>

        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.75rem' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="card-hover" style={{ padding: '2rem', height: '220px' }}>
                <div className="skeleton skeleton-badge" style={{ marginBottom: '1rem' }}></div>
                <div className="skeleton skeleton-text"></div>
                <div className="skeleton skeleton-text" style={{ width: '85%' }}></div>
                <div className="skeleton skeleton-text" style={{ width: '60%', marginTop: '1.5rem' }}></div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.75rem' }}>
            {MOCK_TESTIMONI.map((t) => (
              <div key={t.id} className="card-hover" style={{ padding: '2rem', background: '#ffffff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  {/* Clean SVG Stars (No Emojis) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '1rem', color: '#f59e0b' }}>
                    {[...Array(t.rating)].map((_, idx) => (
                      <svg key={idx} width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                    ))}
                  </div>

                  <p style={{ fontSize: '0.9375rem', color: 'var(--color-slate-700)', lineHeight: '1.65', fontStyle: 'italic', marginBottom: '1.5rem' }}>
                    "{t.ulasan}"
                  </p>
                </div>

                <div style={{ paddingTop: '1.25rem', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-slate-900)' }}>{t.nama}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600 }}>{t.layanan}</div>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-slate-400)' }}>{t.waktu}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
