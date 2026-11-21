import React from 'react';

export const GallerySection: React.FC = () => {
  const fasilitas = [
    {
      title: 'Ruang Periksa & Konsultasi',
      desc: 'Ruang pemeriksaan antenatal care yang privat, tenang, dan dilengkapi peralatan pemeriksaan kehamilan standar.',
      tag: 'Privat & Higienis'
    },
    {
      title: 'Kamar Bersalin Siaga 24 Jam',
      desc: 'Ruang persalinan dengan pencahayaan hangat, tempat tidur persalinan ergonomis, dan instrumen steril siap pakai.',
      tag: 'Siaga 24 Jam'
    },
    {
      title: 'Ruang Rawat Nifas & Laktasi',
      desc: 'Area pemulihan ibu pasca melahirkan dengan suasana kekeluargaan untuk mendukung keberhasilan inisiasi menyusui.',
      tag: 'Ramah Ibu & Bayi'
    },
    {
      title: 'Ruang Tunggu & Front Office',
      desc: 'Area tunggu tertata rapi, bersih, dan nyaman dengan sirkulasi udara yang baik.',
      tag: 'Kenyamanan Pasien'
    }
  ];

  return (
    <section id="fasilitas" style={{ padding: '5rem 0', background: '#ffffff', borderTop: '1px solid var(--border-light)' }}>
      <div className="container">
        <div className="section-header">
          <div className="section-pill">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="3" y1="9" x2="21" y2="9"/>
              <line x1="9" y1="21" x2="9" y2="9"/>
            </svg>
            <span>Lingkungan Asuhan</span>
          </div>
          <h2 className="section-title">Fasilitas Praktik Mandiri</h2>
          <p className="section-subtitle">
            Ruang pelayanan yang dirancang khusus untuk menciptakan kenyamanan psikologis dan keamanan medis maksimal.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.75rem' }}>
          {fasilitas.map((f, idx) => (
            <div key={idx} className="card-hover" style={{ padding: '1.75rem', background: '#faf8fc', border: '1px solid var(--border-light)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--color-primary-tint)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </div>

              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-accent-dark)', background: 'var(--color-accent-tint)', padding: '0.2rem 0.6rem', borderRadius: '9999px', display: 'inline-block', marginBottom: '0.65rem' }}>
                {f.tag}
              </span>

              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-slate-900)', marginBottom: '0.5rem' }}>
                {f.title}
              </h3>

              <p style={{ fontSize: '0.875rem', color: 'var(--color-slate-600)', lineHeight: '1.6' }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
