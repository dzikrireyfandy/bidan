-- =====================================================================
-- 08_seed_bidan_rs.sql
-- Seed master + akun demo 5 role + katalog layanan KIA (TSD 1.3 & 5).
-- Password semua akun demo: "password" (bcrypt cost 10).
-- Jalankan setelah 03-07. Idempoten: aman diulang.
-- =====================================================================
USE MiniWorldRS;
GO
SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

BEGIN TRAN;

-- ===== Peran (5 role RBAC) =====
IF NOT EXISTS (SELECT 1 FROM dbo.Peran)
INSERT INTO dbo.Peran (peran_id, kode, nama) VALUES
 (NEWID(), 'SUPERADMIN',  'Superadmin'),
 (NEWID(), 'ADMIN_LOKAL', 'Admin Lokal'),
 (NEWID(), 'DOKTER',      'Dokter'),
 (NEWID(), 'STAFF',       'Staf'),
 (NEWID(), 'PASIEN',      'Pasien');

DECLARE @peran_super UNIQUEIDENTIFIER = (SELECT peran_id FROM dbo.Peran WHERE kode = 'SUPERADMIN');
DECLARE @peran_admin UNIQUEIDENTIFIER = (SELECT peran_id FROM dbo.Peran WHERE kode = 'ADMIN_LOKAL');
DECLARE @peran_dokter UNIQUEIDENTIFIER = (SELECT peran_id FROM dbo.Peran WHERE kode = 'DOKTER');
DECLARE @peran_staff UNIQUEIDENTIFIER = (SELECT peran_id FROM dbo.Peran WHERE kode = 'STAFF');

-- ===== Fasilitas =====
DECLARE @rs UNIQUEIDENTIFIER = (SELECT TOP 1 rumah_sakit_id FROM dbo.Rumah_Sakit);
IF @rs IS NULL
BEGIN
    SET @rs = NEWID();
    INSERT INTO dbo.Rumah_Sakit (rumah_sakit_id, kode_rs, nama, kelas, jenis, no_izin, alamat, telepon)
    VALUES (@rs, 'RS-BIDAN-01', 'Praktik Mandiri Bidan & Klinik Umum Terintegrasi', 'C', 'KLINIK',
            'IZN-2026-001', 'Jl. Kesehatan No. 1, Surakarta', '0271123456');
END

DECLARE @gedung UNIQUEIDENTIFIER = (SELECT TOP 1 gedung_id FROM dbo.Gedung);
IF @gedung IS NULL
BEGIN
    SET @gedung = NEWID();
    INSERT INTO dbo.Gedung (gedung_id, rumah_sakit_id, kode, nama, jumlah_lantai)
    VALUES (@gedung, @rs, 'GD-A', 'Gedung Utama', 2);
END

-- ===== Unit Pelayanan =====
IF NOT EXISTS (SELECT 1 FROM dbo.Unit_Pelayanan)
INSERT INTO dbo.Unit_Pelayanan (unit_id, rumah_sakit_id, kode, nama, jenis, aktif) VALUES
 (NEWID(), @rs, 'UNIT_BIDAN', 'Poli KIA / Praktik Mandiri Bidan', 'KEBIDANAN', 1),
 (NEWID(), @rs, 'POLI_UMUM',  'Poli Umum',                        'UMUM',      1),
 (NEWID(), @rs, 'IGD',        'Instalasi Gawat Darurat',          'UMUM',      1),
 (NEWID(), @rs, 'RANAP',      'Rawat Inap',                       'UMUM',      1),
 (NEWID(), @rs, 'OK',         'Kamar Operasi',                    'UMUM',      1),
 (NEWID(), @rs, 'LAB',        'Laboratorium',                     'PENUNJANG', 1),
 (NEWID(), @rs, 'RAD',        'Radiologi',                        'PENUNJANG', 1),
 (NEWID(), @rs, 'FARMASI',    'Farmasi / Depo Obat',              'PENUNJANG', 1);

DECLARE @unit_bidan UNIQUEIDENTIFIER = (SELECT unit_id FROM dbo.Unit_Pelayanan WHERE kode = 'UNIT_BIDAN');
DECLARE @unit_umum  UNIQUEIDENTIFIER = (SELECT unit_id FROM dbo.Unit_Pelayanan WHERE kode = 'POLI_UMUM');
DECLARE @unit_ranap UNIQUEIDENTIFIER = (SELECT unit_id FROM dbo.Unit_Pelayanan WHERE kode = 'RANAP');
DECLARE @unit_lab   UNIQUEIDENTIFIER = (SELECT unit_id FROM dbo.Unit_Pelayanan WHERE kode = 'LAB');
DECLARE @unit_farm  UNIQUEIDENTIFIER = (SELECT unit_id FROM dbo.Unit_Pelayanan WHERE kode = 'FARMASI');

-- ===== Ruangan =====
IF NOT EXISTS (SELECT 1 FROM dbo.Ruangan)
INSERT INTO dbo.Ruangan (ruangan_id, unit_id, gedung_id, kode, nama, jenis, lantai, kapasitas, status) VALUES
 (NEWID(), @unit_bidan, @gedung, 'RG-BIDAN', 'Ruang Praktik Bidan', 'POLI',  1, 2, 'AKTIF'),
 (NEWID(), @unit_umum,  @gedung, 'RG-POLI',  'Ruang Poli Umum',     'POLI',  1, 2, 'AKTIF'),
 (NEWID(), @unit_ranap, @gedung, 'RG-RANAP', 'Bangsal Rawat Inap',  'BANGSAL', 2, 6, 'AKTIF');

-- ===== Kelas Perawatan =====
IF NOT EXISTS (SELECT 1 FROM dbo.Kelas_Perawatan)
INSERT INTO dbo.Kelas_Perawatan (kelas_id, kode, nama, urutan) VALUES
 (NEWID(), 'VVIP', 'VVIP', 1),
 (NEWID(), 'VIP',  'VIP',  2),
 (NEWID(), 'KLS1', 'Kelas I', 3),
 (NEWID(), 'KLS2', 'Kelas II', 4),
 (NEWID(), 'KLS3', 'Kelas III', 5);

DECLARE @rg_ranap UNIQUEIDENTIFIER = (SELECT ruangan_id FROM dbo.Ruangan WHERE kode = 'RG-RANAP');
DECLARE @kelas3   UNIQUEIDENTIFIER = (SELECT kelas_id FROM dbo.Kelas_Perawatan WHERE kode = 'KLS3');

IF NOT EXISTS (SELECT 1 FROM dbo.Tempat_Tidur)
INSERT INTO dbo.Tempat_Tidur (bed_id, ruangan_id, kelas_id, no_bed, status) VALUES
 (NEWID(), @rg_ranap, @kelas3, 'B-01', 'KOSONG'),
 (NEWID(), @rg_ranap, @kelas3, 'B-02', 'KOSONG'),
 (NEWID(), @rg_ranap, @kelas3, 'B-03', 'KOSONG');

-- ===== Profesi =====
IF NOT EXISTS (SELECT 1 FROM dbo.Profesi)
INSERT INTO dbo.Profesi (profesi_id, kode, nama, kategori) VALUES
 (NEWID(), 'DOKTER_UMUM',  'Dokter Umum',      'MEDIS'),
 (NEWID(), 'DOKTER_SP',    'Dokter Spesialis', 'MEDIS'),
 (NEWID(), 'BIDAN',        'Bidan',            'MEDIS'),
 (NEWID(), 'PERAWAT',      'Perawat',          'MEDIS'),
 (NEWID(), 'APOTEKER',     'Apoteker',         'PENUNJANG'),
 (NEWID(), 'ADMIN',        'Administrasi',     'NON_MEDIS'),
 (NEWID(), 'SOPIR',        'Sopir Ambulans',   'NON_MEDIS');

DECLARE @prof_dokter  UNIQUEIDENTIFIER = (SELECT profesi_id FROM dbo.Profesi WHERE kode = 'DOKTER_UMUM');
DECLARE @prof_bidan   UNIQUEIDENTIFIER = (SELECT profesi_id FROM dbo.Profesi WHERE kode = 'BIDAN');
DECLARE @prof_perawat UNIQUEIDENTIFIER = (SELECT profesi_id FROM dbo.Profesi WHERE kode = 'PERAWAT');
DECLARE @prof_admin   UNIQUEIDENTIFIER = (SELECT profesi_id FROM dbo.Profesi WHERE kode = 'ADMIN');

-- ===== Staf demo =====
IF NOT EXISTS (SELECT 1 FROM dbo.Staf)
INSERT INTO dbo.Staf (staf_id, nip, nama, jenis_kelamin, tgl_lahir, no_telepon, alamat,
                      profesi_id, unit_id, jabatan, status_kepegawaian, tgl_masuk, aktif, email) VALUES
 (NEWID(), 'NIP-001', 'Super Admin Sistem',    'L', '1990-01-01', '081200000001', 'Jl. Kesehatan No. 1', @prof_admin,   @unit_bidan, 'Kepala IT',        'TETAP', '2024-01-01', 1, 'superadmin@klinik.test'),
 (NEWID(), 'NIP-002', 'Admin Operasional',     'P', '1992-02-02', '081200000002', 'Jl. Kesehatan No. 2', @prof_admin,   @unit_bidan, 'Kepala Tata Usaha','TETAP', '2024-01-01', 1, 'admin@klinik.test'),
 (NEWID(), 'NIP-003', 'dr. Maizola Putri',     'P', '1988-03-03', '081200000003', 'Jl. Kesehatan No. 3', @prof_dokter,  @unit_umum,  'Dokter Umum',      'TETAP', '2024-01-01', 1, 'dokter@klinik.test'),
 (NEWID(), 'NIP-004', 'Yurlina AM., KEB.',     'P', '1985-04-04', '081200000004', 'Jl. Kesehatan No. 4', @prof_bidan,   @unit_bidan, 'Bidan Pemilik',    'TETAP', '2024-01-01', 1, 'bidan@klinik.test'),
 (NEWID(), 'NIP-005', 'Ns. Rina Kusuma',       'P', '1994-05-05', '081200000005', 'Jl. Kesehatan No. 5', @prof_perawat, @unit_ranap, 'Perawat Pelaksana','TETAP', '2024-01-01', 1, 'perawat@klinik.test'),
 (NEWID(), 'NIP-006', 'Dewi Anggraini',        'P', '1996-06-06', '081200000006', 'Jl. Kesehatan No. 6', @prof_admin,   @unit_umum,  'Resepsionis',      'TETAP', '2024-01-01', 1, 'resepsionis@klinik.test');

DECLARE @staf_super      UNIQUEIDENTIFIER = (SELECT staf_id FROM dbo.Staf WHERE nip = 'NIP-001');
DECLARE @staf_admin      UNIQUEIDENTIFIER = (SELECT staf_id FROM dbo.Staf WHERE nip = 'NIP-002');
DECLARE @staf_dokter     UNIQUEIDENTIFIER = (SELECT staf_id FROM dbo.Staf WHERE nip = 'NIP-003');
DECLARE @staf_bidan      UNIQUEIDENTIFIER = (SELECT staf_id FROM dbo.Staf WHERE nip = 'NIP-004');
DECLARE @staf_perawat    UNIQUEIDENTIFIER = (SELECT staf_id FROM dbo.Staf WHERE nip = 'NIP-005');
DECLARE @staf_resepsionis UNIQUEIDENTIFIER = (SELECT staf_id FROM dbo.Staf WHERE nip = 'NIP-006');

UPDATE dbo.Rumah_Sakit SET direktur_staf_id = @staf_super WHERE rumah_sakit_id = @rs;

-- ===== Akun demo (password: "password") =====
IF NOT EXISTS (SELECT 1 FROM dbo.Akun_Pengguna)
INSERT INTO dbo.Akun_Pengguna (akun_id, staf_id, peran_id, username, password_hash, aktif, percobaan_gagal, sub_peran) VALUES
 (NEWID(), @staf_super,       @peran_super,  'superadmin',   '$2b$10$XAXUweq/JLtVd89O8cqfl.mMMxUqf7vwm.rNob7GyQBne9rC3HFG.', 1, 0, NULL),
 (NEWID(), @staf_admin,       @peran_admin,  'admin',        '$2b$10$XAXUweq/JLtVd89O8cqfl.mMMxUqf7vwm.rNob7GyQBne9rC3HFG.', 1, 0, NULL),
 (NEWID(), @staf_dokter,      @peran_dokter, 'dokter',       '$2b$10$XAXUweq/JLtVd89O8cqfl.mMMxUqf7vwm.rNob7GyQBne9rC3HFG.', 1, 0, NULL),
 (NEWID(), @staf_bidan,       @peran_dokter, 'bidan',        '$2b$10$XAXUweq/JLtVd89O8cqfl.mMMxUqf7vwm.rNob7GyQBne9rC3HFG.', 1, 0, NULL),
 (NEWID(), @staf_perawat,     @peran_staff,  'perawat',      '$2b$10$XAXUweq/JLtVd89O8cqfl.mMMxUqf7vwm.rNob7GyQBne9rC3HFG.', 1, 0, 'PERAWAT'),
 (NEWID(), @staf_resepsionis, @peran_staff,  'resepsionis',  '$2b$10$XAXUweq/JLtVd89O8cqfl.mMMxUqf7vwm.rNob7GyQBne9rC3HFG.', 1, 0, 'RESEPSIONIS');

-- ===== Penjamin =====
IF NOT EXISTS (SELECT 1 FROM dbo.Penjamin)
INSERT INTO dbo.Penjamin (penjamin_id, nama, jenis, no_kontrak, kontak, aktif) VALUES
 (NEWID(), 'Mandiri',       'MANDIRI',  'MDR-001', '0271123456', 1),
 (NEWID(), 'BPJS Kesehatan','BPJS',     'BPJS-001','0271123457', 1),
 (NEWID(), 'Asuransi Sehat','ASURANSI', 'ASR-001', '0271123458', 1);

-- ===== Layanan Medis & tarif =====
IF NOT EXISTS (SELECT 1 FROM dbo.Layanan_Medis)
INSERT INTO dbo.Layanan_Medis (layanan_id, unit_id, kode, nama, kategori, satuan, kode_icd9, aktif) VALUES
 (NEWID(), @unit_bidan, 'KIA-ANC',   'Pemeriksaan Kehamilan (ANC)',      'KEBIDANAN', 'kali', '99.01', 1),
 (NEWID(), @unit_bidan, 'KIA-PRSL',  'Persalinan Normal',                'KEBIDANAN', 'kali', '73.59', 1),
 (NEWID(), @unit_bidan, 'KIA-BBL',   'Asuhan Bayi Baru Lahir',           'KEBIDANAN', 'kali', '99.99', 1),
 (NEWID(), @unit_bidan, 'KIA-KN1',   'Kunjungan Neonatal KN1',           'KEBIDANAN', 'kali', '99.99', 1),
 (NEWID(), @unit_bidan, 'KIA-KN2',   'Kunjungan Neonatal KN2',           'KEBIDANAN', 'kali', '99.99', 1),
 (NEWID(), @unit_bidan, 'KIA-KN3',   'Kunjungan Neonatal KN3',           'KEBIDANAN', 'kali', '99.99', 1),
 (NEWID(), @unit_bidan, 'KIA-TK',    'Pemantauan Tumbuh Kembang Bayi',   'KEBIDANAN', 'kali', '99.99', 1),
 (NEWID(), @unit_bidan, 'KIA-IMN',   'Imunisasi Bayi',                   'KEBIDANAN', 'kali', '99.52', 1),
 (NEWID(), @unit_bidan, 'KIA-KBS',   'Pelayanan KB Suntik',              'KEBIDANAN', 'kali', '99.99', 1),
 (NEWID(), @unit_bidan, 'KIA-KBP',   'Pelayanan KB Pil',                 'KEBIDANAN', 'kali', '99.99', 1),
 (NEWID(), @unit_bidan, 'KIA-KBI',   'Pelayanan KB IUD',                 'KEBIDANAN', 'kali', '99.99', 1),
 (NEWID(), @unit_bidan, 'KIA-KBM',   'Pelayanan KB Implan',              'KEBIDANAN', 'kali', '99.99', 1),
 (NEWID(), @unit_umum,  'UMU-KONS',  'Konsultasi Penyakit Umum',         'UMUM',      'kali', '99.01', 1),
 (NEWID(), @unit_lab,   'LAB-DARAH', 'Pemeriksaan Darah Lengkap',        'PENUNJANG', 'kali', '90.09', 1);

INSERT INTO dbo.Harga_Layanan (harga_layanan_id, layanan_id, penjamin_id, diubah_oleh, harga, berlaku_dari, alasan)
SELECT NEWID(), l.layanan_id, NULL, @staf_admin,
       CASE l.kode
            WHEN 'KIA-ANC'  THEN 50000 WHEN 'KIA-PRSL' THEN 1500000 WHEN 'KIA-BBL' THEN 150000
            WHEN 'KIA-KN1'  THEN 75000 WHEN 'KIA-KN2'  THEN 75000   WHEN 'KIA-KN3' THEN 75000
            WHEN 'KIA-TK'   THEN 60000 WHEN 'KIA-IMN'  THEN 50000   WHEN 'KIA-KBS' THEN 60000
            WHEN 'KIA-KBP'  THEN 30000 WHEN 'KIA-KBI'  THEN 250000  WHEN 'KIA-KBM' THEN 200000
            WHEN 'UMU-KONS' THEN 75000 ELSE 100000 END,
       '2026-01-01', 'Seed tarif awal'
  FROM dbo.Layanan_Medis l
 WHERE NOT EXISTS (SELECT 1 FROM dbo.Harga_Layanan h WHERE h.layanan_id = l.layanan_id);

-- ===== Obat, vaksin, batch & stok =====
IF NOT EXISTS (SELECT 1 FROM dbo.Obat)
INSERT INTO dbo.Obat (obat_id, kode, nama_generik, nama_dagang, kategori, bentuk, satuan, kekuatan, golongan, stok_minimum, aktif) VALUES
 (NEWID(), 'OBT-PCT', 'Paracetamol',   'Paracetamol 500mg', 'OBAT',  'TABLET', 'tablet', '500 mg', 'BEBAS',     50,  1),
 (NEWID(), 'OBT-AMX', 'Amoxicillin',   'Amoxicillin 500mg', 'OBAT',  'KAPSUL', 'kapsul', '500 mg', 'KERAS',     50,  1),
 (NEWID(), 'OBT-FE',  'Tablet Fe',     'Tablet Tambah Darah','OBAT', 'TABLET', 'tablet', '60 mg',  'BEBAS',     100, 1),
 (NEWID(), 'OBT-BCG', 'Vaksin BCG',    'BCG Bio Farma',     'OBAT',  'INJEKSI','vial',   '1 dosis','VAKSIN',   5,   1),
 (NEWID(), 'OBT-HB0', 'Vaksin HepB0',  'HepB0 Bio Farma',   'OBAT',  'INJEKSI','vial',   '1 dosis','VAKSIN',   5,   1);

DECLARE @obat_pct UNIQUEIDENTIFIER = (SELECT obat_id FROM dbo.Obat WHERE kode = 'OBT-PCT');
DECLARE @obat_bcg UNIQUEIDENTIFIER = (SELECT obat_id FROM dbo.Obat WHERE kode = 'OBT-BCG');
DECLARE @obat_hb0 UNIQUEIDENTIFIER = (SELECT obat_id FROM dbo.Obat WHERE kode = 'OBT-HB0');

IF NOT EXISTS (SELECT 1 FROM dbo.Gudang)
INSERT INTO dbo.Gudang (gudang_id, unit_id, nama, jenis) VALUES
 (NEWID(), @unit_farm, 'Gudang Farmasi Utama', 'UTAMA'),
 (NEWID(), @unit_bidan,'Depo Obat Bidan',      'DEPO');

DECLARE @gudang_utama UNIQUEIDENTIFIER = (SELECT gudang_id FROM dbo.Gudang WHERE nama = 'Gudang Farmasi Utama');

DECLARE @batch_pct UNIQUEIDENTIFIER = NEWID();
DECLARE @batch_bcg UNIQUEIDENTIFIER = NEWID();
INSERT INTO dbo.Batch_Obat (batch_id, obat_id, no_batch, tgl_kedaluwarsa, harga_beli, tgl_masuk) VALUES
 (@batch_pct, @obat_pct, 'B-PCT-01', '2027-12-31', 300,  '2026-01-05'),
 (@batch_bcg, @obat_bcg, 'B-BCG-01', '2027-06-30', 25000,'2026-01-05'),
 (NEWID(),    @obat_hb0, 'B-HB0-01', '2027-06-30', 25000,'2026-01-05');

INSERT INTO dbo.Stok_Batch (batch_id, gudang_id, jumlah) VALUES
 (@batch_pct, @gudang_utama, 500),
 (@batch_bcg, @gudang_utama, 20),
 ((SELECT batch_id FROM dbo.Batch_Obat WHERE no_batch = 'B-HB0-01'), @gudang_utama, 20);

INSERT INTO dbo.Mutasi_Stok (mutasi_id, batch_id, gudang_id, staf_id, jenis, jumlah, waktu, keterangan)
SELECT NEWID(), sb.batch_id, sb.gudang_id, @staf_admin, 'MASUK', sb.jumlah, SYSDATETIME(), 'Seed stok awal'
  FROM dbo.Stok_Batch sb
 WHERE NOT EXISTS (SELECT 1 FROM dbo.Mutasi_Stok m WHERE m.batch_id = sb.batch_id);

INSERT INTO dbo.Harga_Obat (harga_obat_id, obat_id, diubah_oleh, harga_jual, berlaku_dari, alasan)
SELECT NEWID(), o.obat_id, @staf_admin, 1000, '2026-01-01', 'Seed harga obat'
  FROM dbo.Obat o
 WHERE NOT EXISTS (SELECT 1 FROM dbo.Harga_Obat ho WHERE ho.obat_id = o.obat_id);

-- ===== Vaksin =====
IF NOT EXISTS (SELECT 1 FROM dbo.Vaksin)
INSERT INTO dbo.Vaksin (vaksin_id, obat_id, nama, jumlah_dosis_standar, usia_anjuran) VALUES
 (NEWID(), @obat_bcg, 'BCG',   1, '0-1 bulan'),
 (NEWID(), @obat_hb0, 'HepB0', 1, '0-7 hari');

-- ===== Metode KB =====
IF NOT EXISTS (SELECT 1 FROM dbo.Metode_KB)
INSERT INTO dbo.Metode_KB (metode_id, obat_id, nama, jenis) VALUES
 (NEWID(), NULL, 'KB Suntik 3 Bulan', 'HORMONAL'),
 (NEWID(), NULL, 'KB Pil',            'HORMONAL'),
 (NEWID(), NULL, 'IUD',               'ALKON'),
 (NEWID(), NULL, 'Implan',            'ALKON');

-- ===== Parameter Lab =====
IF NOT EXISTS (SELECT 1 FROM dbo.Parameter_Lab)
INSERT INTO dbo.Parameter_Lab (parameter_id, layanan_id, nama, satuan, nilai_rujukan_min, nilai_rujukan_maks)
SELECT NEWID(), l.layanan_id, v.nama, v.satuan, v.vmin, v.vmax
  FROM dbo.Layanan_Medis l
 CROSS JOIN (VALUES ('Hemoglobin','g/dL',12.0,16.0),
                    ('Leukosit','10^3/uL',4.0,10.0),
                    ('Gula Darah Sewaktu','mg/dL',70,200)) v(nama, satuan, vmin, vmax)
 WHERE l.kode = 'LAB-DARAH';

-- ===== Jenis Diet =====
IF NOT EXISTS (SELECT 1 FROM dbo.Jenis_Diet)
INSERT INTO dbo.Jenis_Diet (diet_id, kode, nama, keterangan) VALUES
 (NEWID(), 'DIET-BIASA', 'Diet Biasa',        'Makanan rumah sakit standar'),
 (NEWID(), 'DIET-RENDAH', 'Diet Rendah Garam','Untuk pasien hipertensi');

-- ===== Konten publik =====
IF NOT EXISTS (SELECT 1 FROM dbo.Konten_Publik)
INSERT INTO dbo.Konten_Publik (konten_id, tipe, judul, isi, media_url, urutan, terbit) VALUES
 (NEWID(), 'PROFIL', 'Praktik Mandiri Bidan & Pelayanan Umum',
  'Melayani asuhan kehamilan, persalinan, KB, imunisasi, tumbuh kembang anak, dan konsultasi penyakit umum dalam satu pintu.',
  '', 1, 1),
 (NEWID(), 'KONTAK', 'Hubungi Kami', 'Perumahan bougenvile blok FG 12b. Simpang Rimbo Kota Jambi', '', 2, 1);

-- ===== Jadwal Praktik Sesi (Pagi & Sore) =====
IF NOT EXISTS (SELECT 1 FROM dbo.Jadwal_Praktik WHERE tanggal >= CAST(SYSDATETIME() AS DATE))
BEGIN
  DECLARE @staf_bdn_jdwl UNIQUEIDENTIFIER = (SELECT TOP 1 staf_id FROM dbo.Staf WHERE nip = 'STF-BDN-01');
  IF @staf_bdn_jdwl IS NULL SET @staf_bdn_jdwl = (SELECT TOP 1 staf_id FROM dbo.Staf WHERE aktif = 1);
  DECLARE @unit_bdn_jdwl UNIQUEIDENTIFIER = (SELECT TOP 1 unit_id FROM dbo.Unit_Pelayanan WHERE kode = 'UNIT_BIDAN');
  IF @unit_bdn_jdwl IS NULL SET @unit_bdn_jdwl = (SELECT TOP 1 unit_id FROM dbo.Unit_Pelayanan WHERE aktif = 1);
  DECLARE @rg_kia_jdwl   UNIQUEIDENTIFIER = (SELECT TOP 1 ruangan_id FROM dbo.Ruangan WHERE kode = 'RG-KIA');
  IF @rg_kia_jdwl IS NULL SET @rg_kia_jdwl = (SELECT TOP 1 ruangan_id FROM dbo.Ruangan WHERE aktif = 1);

  IF @staf_bdn_jdwl IS NOT NULL AND @unit_bdn_jdwl IS NOT NULL AND @rg_kia_jdwl IS NOT NULL
  BEGIN
    DECLARE @jdwl_i INT = 0;
    WHILE @jdwl_i < 14
    BEGIN
      DECLARE @tgl_sesi DATE = DATEADD(DAY, @jdwl_i, CAST(SYSDATETIME() AS DATE));
      INSERT INTO dbo.Jadwal_Praktik (jadwal_id, staf_id, unit_id, ruangan_id, tanggal, jam_mulai, jam_selesai, kuota_maks, durasi_per_pasien, aktif)
      VALUES (NEWID(), @staf_bdn_jdwl, @unit_bdn_jdwl, @rg_kia_jdwl, @tgl_sesi, '08:00:00', '12:00:00', 15, 20, 1);
      INSERT INTO dbo.Jadwal_Praktik (jadwal_id, staf_id, unit_id, ruangan_id, tanggal, jam_mulai, jam_selesai, kuota_maks, durasi_per_pasien, aktif)
      VALUES (NEWID(), @staf_bdn_jdwl, @unit_bdn_jdwl, @rg_kia_jdwl, @tgl_sesi, '16:00:00', '20:00:00', 15, 20, 1);
      SET @jdwl_i = @jdwl_i + 1;
    END
  END
END

COMMIT;
GO

SELECT 'peran' AS objek, COUNT(*) AS jumlah FROM dbo.Peran
UNION ALL SELECT 'unit',    COUNT(*) FROM dbo.Unit_Pelayanan
UNION ALL SELECT 'staf',    COUNT(*) FROM dbo.Staf
UNION ALL SELECT 'akun',    COUNT(*) FROM dbo.Akun_Pengguna
UNION ALL SELECT 'layanan', COUNT(*) FROM dbo.Layanan_Medis
UNION ALL SELECT 'obat',    COUNT(*) FROM dbo.Obat;
GO
