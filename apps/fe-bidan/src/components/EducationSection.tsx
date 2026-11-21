import React from 'react';
import { MOCK_EDUKASI } from '../api/mockData';

export const EducationSection: React.FC = () => {
  return (
    <section style={{ padding: '5rem 0', background: '#ffffff', borderTop: '1px solid var(--border-light)' }}>
      <div className="container">
        <div className="section-header">
          <div className="section-pill">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
            <span>Informasi Kesehatan</span>
          </div>
          <h2 className="section-title">Edukasi Ibu & Anak</h2>
          <p className="section-subtitle">
            Panduan medis praktis seputar kehamilan, perawatan bayi, dan kesehatan reproduksi.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.75rem' }}>
          {MOCK_EDUKASI.map((edu) => (
            <article key={edu.id} className="card-hover" style={{ padding: '1.85rem', background: '#faf8fc', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)', background: 'var(--color-primary-tint)', padding: '0.2rem 0.6rem', borderRadius: '9999px' }}>
                    {edu.kategori}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-slate-400)' }}>
                    {edu.bacaan_menit} mnt baca
                  </span>
                </div>

                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-slate-900)', lineHeight: '1.4', marginBottom: '0.75rem' }}>
                  {edu.judul}
                </h3>

                <p style={{ fontSize: '0.875rem', color: 'var(--color-slate-600)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                  {edu.ringkasan}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>{edu.tanggal}</span>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span>Baca Selengkapnya</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                    <polyline points="12 5 19 12 12 19"/>
                  </svg>
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
