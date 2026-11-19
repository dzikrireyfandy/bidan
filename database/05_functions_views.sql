-- =====================================================================
-- 05_functions_views.sql
-- 5 scalar function + 18 view pendukung backend (TSD Bagian 1.3/5).
-- Jalankan setelah 03 & 04.
-- =====================================================================
USE MiniWorldRS;
GO

-- ===== Scalar Functions =====
CREATE OR ALTER FUNCTION dbo.fn_usia_hari (@tgl_lahir DATE, @tgl_ukur DATE)
RETURNS INT
AS
BEGIN
    RETURN DATEDIFF(DAY, @tgl_lahir, @tgl_ukur);
END
GO

CREATE OR ALTER FUNCTION dbo.fn_usia_bulan (@tgl_lahir DATE, @tgl_ukur DATE)
RETURNS INT
AS
BEGIN
    RETURN DATEDIFF(MONTH, @tgl_lahir, @tgl_ukur);
END
GO

CREATE OR ALTER FUNCTION dbo.fn_hpl (@hpht DATE)
RETURNS DATE
AS
BEGIN
    RETURN DATEADD(DAY, 280, @hpht);
END
GO

CREATE OR ALTER FUNCTION dbo.fn_sisa_kuota (@jadwal_id UNIQUEIDENTIFIER)
RETURNS INT
AS
BEGIN
    DECLARE @kuota INT, @terpakai INT;
    SELECT @kuota = kuota_maks FROM dbo.Jadwal_Praktik WHERE jadwal_id = @jadwal_id;
    SELECT @terpakai = COUNT(*) FROM dbo.Reservasi
     WHERE jadwal_id = @jadwal_id AND status <> 'DIBATALKAN';
    RETURN ISNULL(@kuota, 0) - ISNULL(@terpakai, 0);
END
GO

CREATE OR ALTER FUNCTION dbo.fn_total_tagihan (@kunjungan_id UNIQUEIDENTIFIER)
RETURNS DECIMAL(14, 2)
AS
BEGIN
    DECLARE @total DECIMAL(14, 2);
    SELECT @total = ISNULL(SUM(subtotal), 0)
      FROM dbo.Tagihan_Rincian r
      JOIN dbo.Tagihan t ON t.tagihan_id = r.tagihan_id
     WHERE t.kunjungan_id = @kunjungan_id;
    RETURN @total;
END
GO

-- ===== Views =====
CREATE OR ALTER VIEW dbo.v_sesi_sisa_kuota
AS
SELECT j.jadwal_id,
       j.jadwal_id                AS sesi_id,
       j.staf_id,
       j.unit_id,
       j.ruangan_id,
       j.tanggal,
       j.jam_mulai,
       j.jam_selesai,
       j.kuota_maks,
       j.durasi_per_pasien,
       j.aktif,
       j.aktif                    AS is_active,
       dbo.fn_sisa_kuota(j.jadwal_id) AS sisa_kuota
  FROM dbo.Jadwal_Praktik j;
GO

CREATE OR ALTER VIEW dbo.v_grafik_tumbuh_kembang_bayi
AS
SELECT pb.pemeriksaan_bayi_id,
       pb.bayi_id,
       p.nama                       AS nama_bayi,
       p.tgl_lahir,
       pb.jenis,
       pb.tgl_pemeriksaan,
       dbo.fn_usia_hari(p.tgl_lahir, pb.tgl_pemeriksaan)  AS usia_hari,
       dbo.fn_usia_bulan(p.tgl_lahir, pb.tgl_pemeriksaan) AS usia_bulan,
       pb.berat_gram,
       pb.panjang_cm,
       pb.lingkar_kepala_cm,
       pb.tanda_bahaya
  FROM dbo.Pemeriksaan_Bayi pb
  JOIN dbo.Bayi_Lahir b ON b.bayi_id = pb.bayi_id
  JOIN dbo.Pasien p ON p.pasien_id = b.pasien_id;
GO

CREATE OR ALTER VIEW dbo.v_daftar_pasien
AS
SELECT pasien_id, no_rm, nik, nama, jenis_kelamin, tgl_lahir,
       alamat, no_telepon, email, ibu_pasien_id, created_at
  FROM dbo.Pasien;
GO

CREATE OR ALTER VIEW dbo.v_antrean_harian
AS
SELECT r.reservasi_id,
       r.jadwal_id,
       r.nomor_antrean,
       r.estimasi_jam,
       r.status,
       r.metode_daftar,
       p.pasien_id,
       p.no_rm,
       p.nama       AS nama_pasien,
       l.nama       AS nama_layanan,
       j.tanggal,
       j.jam_mulai,
       s.nama       AS nama_dokter_bidan
  FROM dbo.Reservasi r
  JOIN dbo.Pasien p ON p.pasien_id = r.pasien_id
  JOIN dbo.Jadwal_Praktik j ON j.jadwal_id = r.jadwal_id
  JOIN dbo.Layanan_Medis l ON l.layanan_id = r.layanan_id
  JOIN dbo.Staf s ON s.staf_id = j.staf_id
 WHERE j.tanggal = CAST(SYSDATETIME() AS DATE);
GO

CREATE OR ALTER VIEW dbo.v_kunjungan_detail
AS
SELECT k.kunjungan_id,
       k.tgl_masuk,
       k.tgl_keluar,
       k.jenis_kunjungan,
       k.status,
       k.cara_keluar,
       p.pasien_id,
       p.no_rm,
       p.nama       AS nama_pasien,
       u.nama       AS unit,
       s.nama       AS dpjp,
       pj.nama      AS penjamin
  FROM dbo.Kunjungan k
  JOIN dbo.Pasien p ON p.pasien_id = k.pasien_id
  JOIN dbo.Unit_Pelayanan u ON u.unit_id = k.unit_id
  JOIN dbo.Staf s ON s.staf_id = k.dpjp_staf_id
  JOIN dbo.Penjamin pj ON pj.penjamin_id = k.penjamin_id;
GO

CREATE OR ALTER VIEW dbo.v_alergi_aktif
AS
SELECT a.alergi_id,
       a.pasien_id,
       a.kategori,
       a.nama,
       a.keterangan,
       o.nama_generik AS nama_obat,
       a.created_at
  FROM dbo.Alergi_Kondisi a
  LEFT JOIN dbo.Obat o ON o.obat_id = a.obat_id
 WHERE a.aktif = 1;
GO

CREATE OR ALTER VIEW dbo.v_stok_tersedia
AS
SELECT sb.batch_id,
       sb.gudang_id,
       g.nama        AS nama_gudang,
       b.obat_id,
       o.kode,
       o.nama_generik,
       o.satuan,
       b.no_batch,
       b.tgl_kedaluwarsa,
       sb.jumlah
  FROM dbo.Stok_Batch sb
  JOIN dbo.Batch_Obat b ON b.batch_id = sb.batch_id
  JOIN dbo.Obat o ON o.obat_id = b.obat_id
  JOIN dbo.Gudang g ON g.gudang_id = sb.gudang_id
 WHERE sb.jumlah > 0;
GO

CREATE OR ALTER VIEW dbo.v_obat_stok_minimum
AS
SELECT o.obat_id,
       o.kode,
       o.nama_generik,
       o.satuan,
       o.stok_minimum,
       ISNULL(SUM(sb.jumlah), 0) AS stok_total
  FROM dbo.Obat o
  LEFT JOIN dbo.Batch_Obat b ON b.obat_id = o.obat_id
  LEFT JOIN dbo.Stok_Batch sb ON sb.batch_id = b.batch_id
 WHERE o.aktif = 1
 GROUP BY o.obat_id, o.kode, o.nama_generik, o.satuan, o.stok_minimum
HAVING ISNULL(SUM(sb.jumlah), 0) < o.stok_minimum;
GO

CREATE OR ALTER VIEW dbo.v_obat_kedaluwarsa
AS
SELECT b.batch_id,
       b.obat_id,
       o.nama_generik,
       b.no_batch,
       b.tgl_kedaluwarsa,
       DATEDIFF(DAY, CAST(SYSDATETIME() AS DATE), b.tgl_kedaluwarsa) AS sisa_hari,
       sb.gudang_id,
       sb.jumlah
  FROM dbo.Batch_Obat b
  JOIN dbo.Obat o ON o.obat_id = b.obat_id
  JOIN dbo.Stok_Batch sb ON sb.batch_id = b.batch_id
 WHERE sb.jumlah > 0
   AND b.tgl_kedaluwarsa <= DATEADD(DAY, 60, CAST(SYSDATETIME() AS DATE));
GO

CREATE OR ALTER VIEW dbo.v_okupansi_bed
AS
SELECT r.ruangan_id,
       r.nama       AS nama_ruangan,
       r.unit_id,
       k.kelas_id,
       k.nama       AS kelas,
       COUNT(*)                                        AS total_bed,
       SUM(CASE WHEN t.status = 'TERISI' THEN 1 ELSE 0 END) AS bed_terisi,
       SUM(CASE WHEN t.status = 'KOSONG' THEN 1 ELSE 0 END) AS bed_kosong,
       CAST(100.0 * SUM(CASE WHEN t.status = 'TERISI' THEN 1 ELSE 0 END) / COUNT(*) AS DECIMAL(5, 2)) AS bor_persen
  FROM dbo.Tempat_Tidur t
  JOIN dbo.Ruangan r ON r.ruangan_id = t.ruangan_id
  JOIN dbo.Kelas_Perawatan k ON k.kelas_id = t.kelas_id
 GROUP BY r.ruangan_id, r.nama, r.unit_id, k.kelas_id, k.nama;
GO

CREATE OR ALTER VIEW dbo.v_ringkasan_kunjungan_harian
AS
SELECT CAST(k.tgl_masuk AS DATE) AS tanggal,
       u.unit_id,
       u.nama AS unit,
       COUNT(*) AS jumlah_kunjungan,
       SUM(CASE WHEN k.jenis_kunjungan = 'RAWAT_JALAN' THEN 1 ELSE 0 END) AS rawat_jalan,
       SUM(CASE WHEN k.jenis_kunjungan = 'IGD' THEN 1 ELSE 0 END) AS igd,
       SUM(CASE WHEN k.jenis_kunjungan = 'RAWAT_INAP' THEN 1 ELSE 0 END) AS rawat_inap
  FROM dbo.Kunjungan k
  JOIN dbo.Unit_Pelayanan u ON u.unit_id = k.unit_id
 GROUP BY CAST(k.tgl_masuk AS DATE), u.unit_id, u.nama;
GO

CREATE OR ALTER VIEW dbo.v_rekap_pendapatan_bulanan
AS
SELECT YEAR(t.tgl_terbit)  AS tahun,
       MONTH(t.tgl_terbit) AS bulan,
       COUNT(DISTINCT t.tagihan_id)  AS jumlah_tagihan,
       SUM(t.total_tagihan)          AS total_tagihan,
       SUM(t.total_dibayar)          AS total_dibayar,
       SUM(t.total_tagihan - t.total_dibayar) AS sisa_piutang
  FROM dbo.Tagihan t
 GROUP BY YEAR(t.tgl_terbit), MONTH(t.tgl_terbit);
GO

CREATE OR ALTER VIEW dbo.v_tren_diagnosa_top10
AS
SELECT TOP 10
       d.diagnosa_id,
       d.kode_icd,
       d.nama,
       COUNT(*) AS jumlah_kasus
  FROM dbo.Kunjungan_Diagnosa kd
  JOIN dbo.Diagnosa d ON d.diagnosa_id = kd.diagnosa_id
 GROUP BY d.diagnosa_id, d.kode_icd, d.nama
 ORDER BY COUNT(*) DESC;
GO

CREATE OR ALTER VIEW dbo.v_jam_tersibuk
AS
SELECT DATEPART(HOUR, k.created_at) AS jam,
       COUNT(*) AS jumlah_kunjungan
  FROM dbo.Kunjungan k
 WHERE k.created_at >= DATEADD(DAY, -30, SYSDATETIME())
 GROUP BY DATEPART(HOUR, k.created_at);
GO

CREATE OR ALTER VIEW dbo.v_jadwal_h1_reservasi
AS
SELECT r.reservasi_id,
       p.email,
       p.nama   AS nama_pasien,
       j.tanggal,
       j.jam_mulai,
       s.nama   AS nama_dokter_bidan
  FROM dbo.Reservasi r
  JOIN dbo.Pasien p ON p.pasien_id = r.pasien_id
  JOIN dbo.Jadwal_Praktik j ON j.jadwal_id = r.jadwal_id
  JOIN dbo.Staf s ON s.staf_id = j.staf_id
 WHERE r.status = 'MENUNGGU'
   AND j.tanggal = DATEADD(DAY, 1, CAST(SYSDATETIME() AS DATE))
   AND p.email IS NOT NULL;
GO

CREATE OR ALTER VIEW dbo.v_jadwal_h1_kontrol_kb
AS
SELECT kb.kb_id,
       p.email,
       p.nama   AS nama_pasien,
       m.nama   AS metode_kb,
       kb.kontrol_berikutnya
  FROM dbo.Pelayanan_KB kb
  JOIN dbo.Pasien p ON p.pasien_id = kb.pasien_id
  JOIN dbo.Metode_KB m ON m.metode_id = kb.metode_id
 WHERE kb.kontrol_berikutnya = DATEADD(DAY, 1, CAST(SYSDATETIME() AS DATE))
   AND p.email IS NOT NULL;
GO

CREATE OR ALTER VIEW dbo.v_jadwal_h1_neonatal
AS
SELECT pb.pemeriksaan_bayi_id,
       p.email,
       p.nama   AS nama_bayi,
       pb.jenis,
       pb.tgl_kontrol_berikutnya
  FROM dbo.Pemeriksaan_Bayi pb
  JOIN dbo.Bayi_Lahir b ON b.bayi_id = pb.bayi_id
  JOIN dbo.Pasien p ON p.pasien_id = b.pasien_id
 WHERE pb.tgl_kontrol_berikutnya = DATEADD(DAY, 1, CAST(SYSDATETIME() AS DATE))
   AND p.email IS NOT NULL;
GO

CREATE OR ALTER VIEW dbo.v_pasien_bayi
AS
SELECT b.bayi_id,
       b.persalinan_id,
       b.pasien_id,
       p.nama       AS nama_bayi,
       p.tgl_lahir,
       ibu.pasien_id AS ibu_pasien_id,
       ibu.no_rm     AS no_rm_ibu,
       ibu.nama      AS nama_ibu,
       b.berat_lahir_gram,
       b.panjang_lahir_cm,
       b.apgar_1,
       b.apgar_5,
       b.kondisi
  FROM dbo.Bayi_Lahir b
  JOIN dbo.Pasien p ON p.pasien_id = b.pasien_id
  LEFT JOIN dbo.Pasien ibu ON ibu.pasien_id = p.ibu_pasien_id;
GO
