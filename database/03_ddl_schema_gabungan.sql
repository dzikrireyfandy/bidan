-- =====================================================================
-- 03_ddl_schema_gabungan.sql
-- Mini World Rumah Sakit + praktik mandiri bidan -- 95 tabel.
-- Diturunkan otomatis dari TSD.md Bagian 4.3/4.4 oleh generate_ddl.py.
-- Jalankan pada database kosong, lalu 04, 05, 06, 07, 08.
-- =====================================================================
USE MiniWorldRS;
GO
SET XACT_ABORT ON;
GO

-- No. 1: Rumah_Sakit
CREATE TABLE dbo.[Rumah_Sakit] (
    [rumah_sakit_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [kode_rs] VARCHAR(30) NOT NULL,
    [nama] NVARCHAR(100) NOT NULL,
    [kelas] VARCHAR(20) NOT NULL,
    [jenis] VARCHAR(20) NOT NULL,
    [no_izin] VARCHAR(20) NOT NULL,
    [alamat] NVARCHAR(255) NOT NULL,
    [telepon] VARCHAR(16) NOT NULL,
    [direktur_staf_id] UNIQUEIDENTIFIER NULL,
    CONSTRAINT [UQ_Rumah_Sakit_kode_rs] UNIQUE ([kode_rs])
);
GO
-- No. 2: Gedung
CREATE TABLE dbo.[Gedung] (
    [gedung_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [rumah_sakit_id] UNIQUEIDENTIFIER NOT NULL,
    [kode] VARCHAR(30) NOT NULL,
    [nama] NVARCHAR(100) NOT NULL,
    [jumlah_lantai] SMALLINT NOT NULL
);
GO
-- No. 3: Unit_Pelayanan
CREATE TABLE dbo.[Unit_Pelayanan] (
    [unit_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [rumah_sakit_id] UNIQUEIDENTIFIER NOT NULL,
    [induk_unit_id] UNIQUEIDENTIFIER NULL,
    [kepala_staf_id] UNIQUEIDENTIFIER NULL,
    [kode] VARCHAR(30) NOT NULL,
    [nama] NVARCHAR(100) NOT NULL,
    [jenis] VARCHAR(20) NOT NULL,
    [aktif] BIT NOT NULL DEFAULT 1,
    CONSTRAINT [UQ_Unit_Pelayanan_kode] UNIQUE ([kode])
);
GO
-- No. 4: Ruangan
CREATE TABLE dbo.[Ruangan] (
    [ruangan_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [unit_id] UNIQUEIDENTIFIER NOT NULL,
    [gedung_id] UNIQUEIDENTIFIER NULL,
    [kode] VARCHAR(30) NOT NULL,
    [nama] NVARCHAR(100) NOT NULL,
    [jenis] VARCHAR(20) NOT NULL,
    [lantai] SMALLINT NOT NULL,
    [kapasitas] SMALLINT NOT NULL,
    [status] VARCHAR(20) NOT NULL,
    CONSTRAINT [UQ_Ruangan_kode] UNIQUE ([kode])
);
GO
-- No. 5: Kelas_Perawatan
CREATE TABLE dbo.[Kelas_Perawatan] (
    [kelas_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [kode] VARCHAR(30) NOT NULL,
    [nama] NVARCHAR(100) NOT NULL,
    [urutan] SMALLINT NOT NULL,
    CONSTRAINT [UQ_Kelas_Perawatan_kode] UNIQUE ([kode])
);
GO
-- No. 6: Tempat_Tidur
CREATE TABLE dbo.[Tempat_Tidur] (
    [bed_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [ruangan_id] UNIQUEIDENTIFIER NOT NULL,
    [kelas_id] UNIQUEIDENTIFIER NOT NULL,
    [no_bed] VARCHAR(30) NOT NULL,
    [status] VARCHAR(20) NOT NULL
);
GO
-- No. 7: Profesi
CREATE TABLE dbo.[Profesi] (
    [profesi_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [kode] VARCHAR(30) NOT NULL,
    [nama] NVARCHAR(100) NOT NULL,
    [kategori] VARCHAR(20) NOT NULL,
    CONSTRAINT [UQ_Profesi_kode] UNIQUE ([kode])
);
GO
-- No. 8: Spesialisasi
CREATE TABLE dbo.[Spesialisasi] (
    [spesialisasi_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [kode] VARCHAR(30) NOT NULL,
    [nama] NVARCHAR(100) NOT NULL,
    CONSTRAINT [UQ_Spesialisasi_kode] UNIQUE ([kode])
);
GO
-- No. 9: Staf
CREATE TABLE dbo.[Staf] (
    [staf_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [nip] VARCHAR(30) NOT NULL,
    [nama] NVARCHAR(100) NOT NULL,
    [jenis_kelamin] VARCHAR(20) NOT NULL,
    [tgl_lahir] DATE NOT NULL,
    [no_telepon] VARCHAR(16) NOT NULL,
    [alamat] NVARCHAR(255) NOT NULL,
    [profesi_id] UNIQUEIDENTIFIER NOT NULL,
    [unit_id] UNIQUEIDENTIFIER NOT NULL,
    [jabatan] NVARCHAR(100) NOT NULL,
    [status_kepegawaian] VARCHAR(20) NOT NULL,
    [tgl_masuk] DATE NOT NULL,
    [aktif] BIT NOT NULL DEFAULT 1,
    [email] VARCHAR(254) NULL,
    CONSTRAINT [UQ_Staf_nip] UNIQUE ([nip])
);
GO
-- No. 10: Staf_Medis
CREATE TABLE dbo.[Staf_Medis] (
    [staf_id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    [no_str] VARCHAR(30) NOT NULL,
    [masa_berlaku_str] DATE NOT NULL,
    [no_sip] VARCHAR(30) NOT NULL,
    [spesialisasi_id] UNIQUEIDENTIFIER NULL,
    CONSTRAINT [UQ_Staf_Medis_no_str] UNIQUE ([no_str])
);
GO
-- No. 11: Shift
CREATE TABLE dbo.[Shift] (
    [shift_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [nama] NVARCHAR(100) NOT NULL,
    [jam_mulai] TIME(0) NOT NULL,
    [jam_selesai] TIME(0) NOT NULL
);
GO
-- No. 12: Penugasan_Shift
CREATE TABLE dbo.[Penugasan_Shift] (
    [penugasan_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [staf_id] UNIQUEIDENTIFIER NOT NULL,
    [shift_id] UNIQUEIDENTIFIER NOT NULL,
    [unit_id] UNIQUEIDENTIFIER NOT NULL,
    [tanggal] DATE NOT NULL
);
GO
-- No. 13: Cuti_Staf
CREATE TABLE dbo.[Cuti_Staf] (
    [cuti_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [staf_id] UNIQUEIDENTIFIER NOT NULL,
    [jenis] VARCHAR(20) NOT NULL,
    [tgl_mulai] DATE NOT NULL,
    [tgl_selesai] DATE NULL,
    [status] VARCHAR(20) NOT NULL
);
GO
-- No. 14: Peran
CREATE TABLE dbo.[Peran] (
    [peran_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [kode] VARCHAR(30) NOT NULL,
    [nama] NVARCHAR(100) NOT NULL,
    CONSTRAINT [UQ_Peran_kode] UNIQUE ([kode])
);
GO
-- No. 15: Akun_Pengguna
CREATE TABLE dbo.[Akun_Pengguna] (
    [akun_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [staf_id] UNIQUEIDENTIFIER NULL,
    [peran_id] UNIQUEIDENTIFIER NOT NULL,
    [username] NVARCHAR(50) NOT NULL,
    [password_hash] VARCHAR(100) NOT NULL,
    [aktif] BIT NOT NULL DEFAULT 1,
    [percobaan_gagal] SMALLINT NOT NULL,
    [terkunci_sampai] DATETIME2 NULL,
    [last_login_at] DATETIME2 NULL,
    [pasien_id] UNIQUEIDENTIFIER NULL,
    [sub_peran] VARCHAR(20) NULL,
    CONSTRAINT [UQ_Akun_Pengguna_username] UNIQUE ([username])
);
GO
-- No. 16: Otp_Reset
CREATE TABLE dbo.[Otp_Reset] (
    [otp_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [akun_id] UNIQUEIDENTIFIER NOT NULL,
    [kode_hash] VARCHAR(100) NOT NULL,
    [expired_at] DATETIME2 NOT NULL,
    [dipakai] BIT NOT NULL,
    [created_at] DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);
GO
-- No. 17: Pasien
CREATE TABLE dbo.[Pasien] (
    [pasien_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [no_rm] VARCHAR(30) NOT NULL,
    [nik] CHAR(16) NOT NULL,
    [nama] NVARCHAR(100) NOT NULL,
    [jenis_kelamin] VARCHAR(20) NOT NULL,
    [tgl_lahir] DATE NOT NULL,
    [tempat_lahir] NVARCHAR(100) NOT NULL,
    [alamat] NVARCHAR(255) NOT NULL,
    [no_telepon] VARCHAR(16) NOT NULL,
    [gol_darah] VARCHAR(20) NOT NULL,
    [status_pernikahan] VARCHAR(20) NOT NULL,
    [pekerjaan] NVARCHAR(100) NOT NULL,
    [ibu_pasien_id] UNIQUEIDENTIFIER NULL,
    [created_at] DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    [email] VARCHAR(254) NULL,
    CONSTRAINT [UQ_Pasien_no_rm] UNIQUE ([no_rm]),
    CONSTRAINT [UQ_Pasien_nik] UNIQUE ([nik])
);
GO
-- No. 18: Kontak_Darurat
CREATE TABLE dbo.[Kontak_Darurat] (
    [kontak_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [pasien_id] UNIQUEIDENTIFIER NOT NULL,
    [nama] NVARCHAR(100) NOT NULL,
    [hubungan] VARCHAR(20) NOT NULL,
    [no_telepon] VARCHAR(16) NOT NULL
);
GO
-- No. 19: Penjamin
CREATE TABLE dbo.[Penjamin] (
    [penjamin_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [nama] NVARCHAR(100) NOT NULL,
    [jenis] VARCHAR(20) NOT NULL,
    [no_kontrak] VARCHAR(30) NOT NULL,
    [kontak] VARCHAR(16) NOT NULL,
    [aktif] BIT NOT NULL DEFAULT 1
);
GO
-- No. 20: Kepesertaan_Pasien
CREATE TABLE dbo.[Kepesertaan_Pasien] (
    [kepesertaan_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [pasien_id] UNIQUEIDENTIFIER NOT NULL,
    [penjamin_id] UNIQUEIDENTIFIER NOT NULL,
    [no_kartu] VARCHAR(30) NOT NULL,
    [kelas_hak] VARCHAR(20) NOT NULL,
    [berlaku_dari] DATE NOT NULL,
    [berlaku_sampai] DATE NULL
);
GO
-- No. 21: Jadwal_Praktik
CREATE TABLE dbo.[Jadwal_Praktik] (
    [jadwal_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [staf_id] UNIQUEIDENTIFIER NOT NULL,
    [unit_id] UNIQUEIDENTIFIER NOT NULL,
    [ruangan_id] UNIQUEIDENTIFIER NOT NULL,
    [tanggal] DATE NOT NULL,
    [jam_mulai] TIME(0) NOT NULL,
    [jam_selesai] TIME(0) NOT NULL,
    [kuota_maks] SMALLINT NOT NULL,
    [durasi_per_pasien] SMALLINT NOT NULL,
    [aktif] BIT NOT NULL DEFAULT 1
);
GO
-- No. 22: Reservasi
CREATE TABLE dbo.[Reservasi] (
    [reservasi_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [pasien_id] UNIQUEIDENTIFIER NOT NULL,
    [jadwal_id] UNIQUEIDENTIFIER NOT NULL,
    [layanan_id] UNIQUEIDENTIFIER NOT NULL,
    [dibuat_oleh] UNIQUEIDENTIFIER NULL,
    [nomor_antrean] SMALLINT NOT NULL,
    [estimasi_jam] TIME(0) NOT NULL,
    [status] VARCHAR(20) NOT NULL,
    [metode_daftar] VARCHAR(20) NOT NULL,
    [created_at] DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);
GO
-- No. 23: Kunjungan
CREATE TABLE dbo.[Kunjungan] (
    [kunjungan_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [pasien_id] UNIQUEIDENTIFIER NOT NULL,
    [reservasi_id] UNIQUEIDENTIFIER NULL,
    [unit_id] UNIQUEIDENTIFIER NOT NULL,
    [dpjp_staf_id] UNIQUEIDENTIFIER NOT NULL,
    [penjamin_id] UNIQUEIDENTIFIER NOT NULL,
    [koreksi_dari_id] UNIQUEIDENTIFIER NULL,
    [jenis_kunjungan] VARCHAR(20) NOT NULL,
    [tgl_masuk] DATE NOT NULL,
    [tgl_keluar] DATE NULL,
    [cara_keluar] VARCHAR(20) NULL,
    [status] VARCHAR(20) NOT NULL,
    [created_at] DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);
GO
-- No. 24: Rujukan
CREATE TABLE dbo.[Rujukan] (
    [rujukan_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [kunjungan_id] UNIQUEIDENTIFIER NOT NULL,
    [diagnosa_id] UNIQUEIDENTIFIER NULL,
    [arah] VARCHAR(20) NOT NULL,
    [faskes_asal_tujuan] NVARCHAR(100) NOT NULL,
    [alasan] NVARCHAR(MAX) NOT NULL,
    [no_surat] VARCHAR(30) NOT NULL,
    [tanggal] DATE NOT NULL
);
GO
-- No. 25: Triase
CREATE TABLE dbo.[Triase] (
    [triase_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [kunjungan_id] UNIQUEIDENTIFIER NOT NULL,
    [staf_id] UNIQUEIDENTIFIER NOT NULL,
    [level] VARCHAR(20) NOT NULL,
    [keluhan_utama] VARCHAR(20) NOT NULL,
    [waktu] DATETIME2 NOT NULL,
    [keputusan] VARCHAR(20) NOT NULL,
    CONSTRAINT [UQ_Triase_kunjungan_id] UNIQUE ([kunjungan_id])
);
GO
-- No. 26: Rawat_Inap
CREATE TABLE dbo.[Rawat_Inap] (
    [rawat_inap_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [kunjungan_id] UNIQUEIDENTIFIER NOT NULL,
    [bed_id] UNIQUEIDENTIFIER NOT NULL,
    [tgl_masuk] DATE NOT NULL,
    [tgl_keluar] DATE NULL,
    [alasan_pindah] NVARCHAR(MAX) NULL,
    [catatan_pulang] NVARCHAR(MAX) NULL
);
GO
-- No. 27: Visite
CREATE TABLE dbo.[Visite] (
    [visite_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [kunjungan_id] UNIQUEIDENTIFIER NOT NULL,
    [staf_id] UNIQUEIDENTIFIER NOT NULL,
    [waktu] DATETIME2 NOT NULL,
    [catatan] NVARCHAR(MAX) NULL
);
GO
-- No. 28: Pemeriksaan
CREATE TABLE dbo.[Pemeriksaan] (
    [pemeriksaan_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [kunjungan_id] UNIQUEIDENTIFIER NOT NULL,
    [staf_id] UNIQUEIDENTIFIER NOT NULL,
    [keluhan] NVARCHAR(MAX) NOT NULL,
    [pemeriksaan_fisik] NVARCHAR(MAX) NOT NULL,
    [asesmen] NVARCHAR(MAX) NOT NULL,
    [rencana] NVARCHAR(MAX) NOT NULL,
    [catatan_bebas] NVARCHAR(MAX) NULL,
    [waktu] DATETIME2 NOT NULL
);
GO
-- No. 29: Tanda_Vital
CREATE TABLE dbo.[Tanda_Vital] (
    [vital_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [pemeriksaan_id] UNIQUEIDENTIFIER NOT NULL,
    [sistolik] SMALLINT NOT NULL,
    [diastolik] SMALLINT NOT NULL,
    [nadi] SMALLINT NOT NULL,
    [suhu] DECIMAL(4,1) NOT NULL,
    [frekuensi_napas] SMALLINT NOT NULL,
    [spo2] SMALLINT NOT NULL,
    [berat_badan] DECIMAL(5,1) NOT NULL,
    [tinggi_badan] DECIMAL(5,1) NOT NULL,
    [waktu] DATETIME2 NOT NULL
);
GO
-- No. 30: Diagnosa
CREATE TABLE dbo.[Diagnosa] (
    [diagnosa_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [kode_icd] VARCHAR(30) NULL,
    [nama] NVARCHAR(100) NOT NULL
);
GO
-- No. 31: Kunjungan_Diagnosa
CREATE TABLE dbo.[Kunjungan_Diagnosa] (
    [kunjungan_id] UNIQUEIDENTIFIER NOT NULL,
    [diagnosa_id] UNIQUEIDENTIFIER NOT NULL,
    [jenis] VARCHAR(20) NOT NULL,
    [keterangan] NVARCHAR(MAX) NULL,
    CONSTRAINT [PK_Kunjungan_Diagnosa] PRIMARY KEY ([kunjungan_id], [diagnosa_id])
);
GO
-- No. 32: Alergi_Kondisi
CREATE TABLE dbo.[Alergi_Kondisi] (
    [alergi_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [pasien_id] UNIQUEIDENTIFIER NOT NULL,
    [obat_id] UNIQUEIDENTIFIER NULL,
    [dicatat_oleh] UNIQUEIDENTIFIER NOT NULL,
    [kategori] VARCHAR(20) NOT NULL,
    [nama] NVARCHAR(100) NOT NULL,
    [keterangan] NVARCHAR(MAX) NULL,
    [aktif] BIT NOT NULL DEFAULT 1,
    [created_at] DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);
GO
-- No. 33: Catatan_Keperawatan
CREATE TABLE dbo.[Catatan_Keperawatan] (
    [catatan_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [kunjungan_id] UNIQUEIDENTIFIER NOT NULL,
    [staf_id] UNIQUEIDENTIFIER NOT NULL,
    [jenis] VARCHAR(20) NOT NULL,
    [isi] NVARCHAR(MAX) NOT NULL,
    [waktu] DATETIME2 NOT NULL
);
GO
-- No. 34: Konsultasi
CREATE TABLE dbo.[Konsultasi] (
    [konsultasi_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [kunjungan_id] UNIQUEIDENTIFIER NOT NULL,
    [dokter_peminta_id] UNIQUEIDENTIFIER NOT NULL,
    [dokter_tujuan_id] UNIQUEIDENTIFIER NOT NULL,
    [pertanyaan] NVARCHAR(MAX) NOT NULL,
    [jawaban] NVARCHAR(MAX) NULL,
    [waktu] DATETIME2 NOT NULL,
    [status] VARCHAR(20) NOT NULL
);
GO
-- No. 35: Persetujuan_Tindakan
CREATE TABLE dbo.[Persetujuan_Tindakan] (
    [persetujuan_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [kunjungan_id] UNIQUEIDENTIFIER NOT NULL,
    [layanan_id] UNIQUEIDENTIFIER NOT NULL,
    [staf_id] UNIQUEIDENTIFIER NOT NULL,
    [pemberi_persetujuan] NVARCHAR(100) NOT NULL,
    [hubungan] VARCHAR(20) NOT NULL,
    [waktu] DATETIME2 NOT NULL,
    [status] VARCHAR(20) NOT NULL
);
GO
-- No. 36: Dokumen_Medis
CREATE TABLE dbo.[Dokumen_Medis] (
    [dokumen_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [kunjungan_id] UNIQUEIDENTIFIER NOT NULL,
    [staf_id] UNIQUEIDENTIFIER NOT NULL,
    [jenis] VARCHAR(20) NOT NULL,
    [no_dokumen] VARCHAR(30) NOT NULL,
    [isi] NVARCHAR(MAX) NOT NULL,
    [tgl_terbit] DATE NOT NULL,
    CONSTRAINT [UQ_Dokumen_Medis_no_dokumen] UNIQUE ([no_dokumen])
);
GO
-- No. 37: Kehamilan
CREATE TABLE dbo.[Kehamilan] (
    [kehamilan_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [pasien_id] UNIQUEIDENTIFIER NOT NULL,
    [hpht] DATE NOT NULL,
    [hpl] DATE NOT NULL,
    [gravida] SMALLINT NOT NULL,
    [paritas] SMALLINT NOT NULL,
    [abortus] SMALLINT NOT NULL,
    [status_risiko] VARCHAR(20) NOT NULL,
    [status] VARCHAR(20) NOT NULL
);
GO
-- No. 38: Pemeriksaan_ANC
CREATE TABLE dbo.[Pemeriksaan_ANC] (
    [anc_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [kehamilan_id] UNIQUEIDENTIFIER NOT NULL,
    [pemeriksaan_id] UNIQUEIDENTIFIER NOT NULL,
    [kunjungan_ke] SMALLINT NOT NULL,
    [usia_kehamilan_minggu] SMALLINT NOT NULL,
    [tinggi_fundus] DECIMAL(4,1) NOT NULL,
    [djj] SMALLINT NOT NULL,
    [letak_janin] VARCHAR(20) NOT NULL,
    [tablet_fe_diberikan] VARCHAR(20) NOT NULL
);
GO
-- No. 39: Persalinan
CREATE TABLE dbo.[Persalinan] (
    [persalinan_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [kehamilan_id] UNIQUEIDENTIFIER NOT NULL,
    [kunjungan_id] UNIQUEIDENTIFIER NOT NULL,
    [penolong_staf_id] UNIQUEIDENTIFIER NOT NULL,
    [waktu_persalinan] DATETIME2 NOT NULL,
    [jenis_persalinan] VARCHAR(20) NOT NULL,
    [komplikasi] NVARCHAR(MAX) NULL,
    [kondisi_ibu] VARCHAR(20) NOT NULL
);
GO
-- No. 40: Bayi_Lahir
CREATE TABLE dbo.[Bayi_Lahir] (
    [bayi_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [persalinan_id] UNIQUEIDENTIFIER NOT NULL,
    [pasien_id] UNIQUEIDENTIFIER NOT NULL,
    [berat_lahir_gram] INT NOT NULL,
    [panjang_lahir_cm] DECIMAL(4,1) NOT NULL,
    [apgar_1] SMALLINT NOT NULL,
    [apgar_5] SMALLINT NOT NULL,
    [kondisi] VARCHAR(20) NOT NULL,
    CONSTRAINT [UQ_Bayi_Lahir_pasien_id] UNIQUE ([pasien_id])
);
GO
-- No. 41: Vaksin
CREATE TABLE dbo.[Vaksin] (
    [vaksin_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [obat_id] UNIQUEIDENTIFIER NOT NULL,
    [nama] NVARCHAR(100) NOT NULL,
    [jumlah_dosis_standar] SMALLINT NOT NULL,
    [usia_anjuran] VARCHAR(20) NOT NULL
);
GO
-- No. 42: Imunisasi_Pasien
CREATE TABLE dbo.[Imunisasi_Pasien] (
    [imunisasi_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [pasien_id] UNIQUEIDENTIFIER NOT NULL,
    [vaksin_id] UNIQUEIDENTIFIER NOT NULL,
    [kunjungan_id] UNIQUEIDENTIFIER NOT NULL,
    [batch_id] UNIQUEIDENTIFIER NULL,
    [staf_id] UNIQUEIDENTIFIER NOT NULL,
    [dosis_ke] SMALLINT NOT NULL,
    [tanggal] DATE NOT NULL
);
GO
-- No. 43: Metode_KB
CREATE TABLE dbo.[Metode_KB] (
    [metode_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [obat_id] UNIQUEIDENTIFIER NULL,
    [nama] NVARCHAR(100) NOT NULL,
    [jenis] VARCHAR(20) NOT NULL
);
GO
-- No. 44: Pelayanan_KB
CREATE TABLE dbo.[Pelayanan_KB] (
    [kb_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [pasien_id] UNIQUEIDENTIFIER NOT NULL,
    [metode_id] UNIQUEIDENTIFIER NOT NULL,
    [kunjungan_id] UNIQUEIDENTIFIER NOT NULL,
    [tanggal] DATE NOT NULL,
    [kontrol_berikutnya] DATE NULL,
    [efek_samping] NVARCHAR(MAX) NULL
);
GO
-- No. 47: Layanan_Medis
CREATE TABLE dbo.[Layanan_Medis] (
    [layanan_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [unit_id] UNIQUEIDENTIFIER NOT NULL,
    [kode] VARCHAR(30) NOT NULL,
    [nama] NVARCHAR(100) NOT NULL,
    [kategori] VARCHAR(20) NOT NULL,
    [satuan] VARCHAR(20) NOT NULL,
    [kode_icd9] VARCHAR(30) NOT NULL,
    [aktif] BIT NOT NULL DEFAULT 1,
    CONSTRAINT [UQ_Layanan_Medis_kode] UNIQUE ([kode])
);
GO
-- No. 48: Tindakan_Kunjungan
CREATE TABLE dbo.[Tindakan_Kunjungan] (
    [tindakan_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [kunjungan_id] UNIQUEIDENTIFIER NOT NULL,
    [layanan_id] UNIQUEIDENTIFIER NOT NULL,
    [staf_id] UNIQUEIDENTIFIER NOT NULL,
    [qty] DECIMAL(10,2) NOT NULL,
    [waktu] DATETIME2 NOT NULL
);
GO
-- No. 49: Paket_Layanan
CREATE TABLE dbo.[Paket_Layanan] (
    [paket_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [kode] VARCHAR(30) NOT NULL,
    [nama] NVARCHAR(100) NOT NULL,
    [jenis] VARCHAR(20) NOT NULL,
    [aktif] BIT NOT NULL DEFAULT 1,
    CONSTRAINT [UQ_Paket_Layanan_kode] UNIQUE ([kode])
);
GO
-- No. 50: Paket_Detail
CREATE TABLE dbo.[Paket_Detail] (
    [paket_id] UNIQUEIDENTIFIER NOT NULL,
    [layanan_id] UNIQUEIDENTIFIER NOT NULL,
    [qty] DECIMAL(10,2) NOT NULL,
    CONSTRAINT [PK_Paket_Detail] PRIMARY KEY ([paket_id], [layanan_id])
);
GO
-- No. 51: Harga_Layanan
CREATE TABLE dbo.[Harga_Layanan] (
    [harga_layanan_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [layanan_id] UNIQUEIDENTIFIER NOT NULL,
    [kelas_id] UNIQUEIDENTIFIER NULL,
    [penjamin_id] UNIQUEIDENTIFIER NULL,
    [diubah_oleh] UNIQUEIDENTIFIER NOT NULL,
    [harga] DECIMAL(14,2) NOT NULL,
    [berlaku_dari] DATE NOT NULL,
    [berlaku_sampai] DATE NULL,
    [alasan] NVARCHAR(MAX) NOT NULL
);
GO
-- No. 52: Harga_Paket
CREATE TABLE dbo.[Harga_Paket] (
    [harga_paket_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [paket_id] UNIQUEIDENTIFIER NOT NULL,
    [diubah_oleh] UNIQUEIDENTIFIER NOT NULL,
    [harga] DECIMAL(14,2) NOT NULL,
    [berlaku_dari] DATE NOT NULL,
    [berlaku_sampai] DATE NULL,
    [alasan] NVARCHAR(MAX) NOT NULL
);
GO
-- No. 53: Operasi
CREATE TABLE dbo.[Operasi] (
    [operasi_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [kunjungan_id] UNIQUEIDENTIFIER NOT NULL,
    [layanan_id] UNIQUEIDENTIFIER NOT NULL,
    [ruangan_id] UNIQUEIDENTIFIER NOT NULL,
    [jenis_anestesi] VARCHAR(20) NOT NULL,
    [jadwal_mulai] DATETIME2 NOT NULL,
    [waktu_mulai] DATETIME2 NOT NULL,
    [waktu_selesai] DATETIME2 NULL,
    [status] VARCHAR(20) NOT NULL,
    [laporan] NVARCHAR(MAX) NULL
);
GO
-- No. 54: Tim_Operasi
CREATE TABLE dbo.[Tim_Operasi] (
    [operasi_id] UNIQUEIDENTIFIER NOT NULL,
    [staf_id] UNIQUEIDENTIFIER NOT NULL,
    [peran_operasi] VARCHAR(20) NOT NULL,
    CONSTRAINT [PK_Tim_Operasi] PRIMARY KEY ([operasi_id], [staf_id])
);
GO
-- No. 55: Order_Penunjang
CREATE TABLE dbo.[Order_Penunjang] (
    [order_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [kunjungan_id] UNIQUEIDENTIFIER NOT NULL,
    [staf_pemesan_id] UNIQUEIDENTIFIER NOT NULL,
    [jenis] VARCHAR(20) NOT NULL,
    [waktu_order] DATETIME2 NOT NULL,
    [status] VARCHAR(20) NOT NULL
);
GO
-- No. 56: Order_Penunjang_Detail
CREATE TABLE dbo.[Order_Penunjang_Detail] (
    [order_detail_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [order_id] UNIQUEIDENTIFIER NOT NULL,
    [layanan_id] UNIQUEIDENTIFIER NOT NULL,
    [status] VARCHAR(20) NOT NULL
);
GO
-- No. 57: Parameter_Lab
CREATE TABLE dbo.[Parameter_Lab] (
    [parameter_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [layanan_id] UNIQUEIDENTIFIER NOT NULL,
    [nama] NVARCHAR(100) NOT NULL,
    [satuan] VARCHAR(20) NOT NULL,
    [nilai_rujukan_min] DECIMAL(12,3) NOT NULL,
    [nilai_rujukan_maks] DECIMAL(12,3) NOT NULL
);
GO
-- No. 58: Hasil_Lab
CREATE TABLE dbo.[Hasil_Lab] (
    [hasil_lab_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [order_detail_id] UNIQUEIDENTIFIER NOT NULL,
    [parameter_id] UNIQUEIDENTIFIER NOT NULL,
    [staf_id] UNIQUEIDENTIFIER NOT NULL,
    [nilai] VARCHAR(50) NOT NULL,
    [flag] VARCHAR(20) NOT NULL,
    [waktu] DATETIME2 NOT NULL
);
GO
-- No. 59: Hasil_Radiologi
CREATE TABLE dbo.[Hasil_Radiologi] (
    [hasil_rad_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [order_detail_id] UNIQUEIDENTIFIER NOT NULL,
    [radiolog_staf_id] UNIQUEIDENTIFIER NOT NULL,
    [temuan] NVARCHAR(MAX) NOT NULL,
    [kesan] NVARCHAR(MAX) NOT NULL,
    [berkas_gambar] VARCHAR(255) NOT NULL,
    [waktu] DATETIME2 NOT NULL,
    CONSTRAINT [UQ_Hasil_Radiologi_order_detail_id] UNIQUE ([order_detail_id])
);
GO
-- No. 60: Pendonor
CREATE TABLE dbo.[Pendonor] (
    [pendonor_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [nama] NVARCHAR(100) NOT NULL,
    [gol_darah] VARCHAR(20) NOT NULL,
    [rhesus] VARCHAR(20) NOT NULL,
    [tgl_lahir] DATE NOT NULL,
    [no_telepon] VARCHAR(16) NOT NULL
);
GO
-- No. 61: Kantong_Darah
CREATE TABLE dbo.[Kantong_Darah] (
    [kantong_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [pendonor_id] UNIQUEIDENTIFIER NULL,
    [no_kantong] VARCHAR(30) NOT NULL,
    [komponen] VARCHAR(20) NOT NULL,
    [gol_darah] VARCHAR(20) NOT NULL,
    [rhesus] VARCHAR(20) NOT NULL,
    [volume_ml] INT NOT NULL,
    [tgl_ambil] DATE NOT NULL,
    [tgl_kedaluwarsa] DATE NOT NULL,
    [status] VARCHAR(20) NOT NULL,
    CONSTRAINT [UQ_Kantong_Darah_no_kantong] UNIQUE ([no_kantong])
);
GO
-- No. 62: Transfusi
CREATE TABLE dbo.[Transfusi] (
    [transfusi_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [kunjungan_id] UNIQUEIDENTIFIER NOT NULL,
    [kantong_id] UNIQUEIDENTIFIER NOT NULL,
    [staf_id] UNIQUEIDENTIFIER NOT NULL,
    [waktu_mulai] DATETIME2 NOT NULL,
    [waktu_selesai] DATETIME2 NULL,
    [reaksi] VARCHAR(20) NULL,
    CONSTRAINT [UQ_Transfusi_kantong_id] UNIQUE ([kantong_id])
);
GO
-- No. 63: Obat
CREATE TABLE dbo.[Obat] (
    [obat_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [kode] VARCHAR(30) NOT NULL,
    [nama_generik] NVARCHAR(100) NOT NULL,
    [nama_dagang] NVARCHAR(100) NOT NULL,
    [kategori] VARCHAR(20) NOT NULL,
    [bentuk] VARCHAR(20) NOT NULL,
    [satuan] VARCHAR(20) NOT NULL,
    [kekuatan] VARCHAR(50) NOT NULL,
    [golongan] VARCHAR(20) NOT NULL,
    [stok_minimum] DECIMAL(10,2) NOT NULL,
    [aktif] BIT NOT NULL DEFAULT 1,
    CONSTRAINT [UQ_Obat_kode] UNIQUE ([kode])
);
GO
-- No. 64: Pemasok
CREATE TABLE dbo.[Pemasok] (
    [pemasok_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [nama] NVARCHAR(100) NOT NULL,
    [alamat] NVARCHAR(255) NOT NULL,
    [kontak] VARCHAR(16) NOT NULL,
    [npwp] VARCHAR(30) NOT NULL,
    [aktif] BIT NOT NULL DEFAULT 1
);
GO
-- No. 65: Gudang
CREATE TABLE dbo.[Gudang] (
    [gudang_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [unit_id] UNIQUEIDENTIFIER NOT NULL,
    [nama] NVARCHAR(100) NOT NULL,
    [jenis] VARCHAR(20) NOT NULL
);
GO
-- No. 66: Purchase_Order
CREATE TABLE dbo.[Purchase_Order] (
    [po_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [pemasok_id] UNIQUEIDENTIFIER NOT NULL,
    [dibuat_oleh] UNIQUEIDENTIFIER NOT NULL,
    [no_po] VARCHAR(30) NOT NULL,
    [tgl] DATE NOT NULL,
    [status] VARCHAR(20) NOT NULL,
    CONSTRAINT [UQ_Purchase_Order_no_po] UNIQUE ([no_po])
);
GO
-- No. 67: PO_Detail
CREATE TABLE dbo.[PO_Detail] (
    [po_id] UNIQUEIDENTIFIER NOT NULL,
    [obat_id] UNIQUEIDENTIFIER NOT NULL,
    [jumlah] DECIMAL(10,2) NOT NULL,
    [harga_satuan] DECIMAL(14,2) NOT NULL,
    CONSTRAINT [PK_PO_Detail] PRIMARY KEY ([po_id], [obat_id])
);
GO
-- No. 68: Penerimaan_Barang
CREATE TABLE dbo.[Penerimaan_Barang] (
    [penerimaan_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [po_id] UNIQUEIDENTIFIER NULL,
    [pemasok_id] UNIQUEIDENTIFIER NOT NULL,
    [staf_id] UNIQUEIDENTIFIER NOT NULL,
    [no_faktur] VARCHAR(30) NOT NULL,
    [tgl] DATE NOT NULL
);
GO
-- No. 69: Batch_Obat
CREATE TABLE dbo.[Batch_Obat] (
    [batch_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [obat_id] UNIQUEIDENTIFIER NOT NULL,
    [penerimaan_id] UNIQUEIDENTIFIER NULL,
    [no_batch] VARCHAR(30) NOT NULL,
    [tgl_kedaluwarsa] DATE NOT NULL,
    [harga_beli] DECIMAL(14,2) NOT NULL,
    [tgl_masuk] DATE NOT NULL
);
GO
-- No. 70: Stok_Batch
CREATE TABLE dbo.[Stok_Batch] (
    [batch_id] UNIQUEIDENTIFIER NOT NULL,
    [gudang_id] UNIQUEIDENTIFIER NOT NULL,
    [jumlah] DECIMAL(10,2) NOT NULL,
    CONSTRAINT [PK_Stok_Batch] PRIMARY KEY ([batch_id], [gudang_id])
);
GO
-- No. 71: Mutasi_Stok
CREATE TABLE dbo.[Mutasi_Stok] (
    [mutasi_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [batch_id] UNIQUEIDENTIFIER NOT NULL,
    [gudang_id] UNIQUEIDENTIFIER NOT NULL,
    [kunjungan_id] UNIQUEIDENTIFIER NULL,
    [staf_id] UNIQUEIDENTIFIER NOT NULL,
    [jenis] VARCHAR(20) NOT NULL,
    [jumlah] DECIMAL(10,2) NOT NULL,
    [waktu] DATETIME2 NOT NULL,
    [keterangan] NVARCHAR(MAX) NULL
);
GO
-- No. 72: Resep
CREATE TABLE dbo.[Resep] (
    [resep_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [kunjungan_id] UNIQUEIDENTIFIER NOT NULL,
    [staf_id] UNIQUEIDENTIFIER NOT NULL,
    [tanggal] DATE NOT NULL,
    [status] VARCHAR(20) NOT NULL,
    [override_alergi] BIT NOT NULL,
    [alasan_override] NVARCHAR(MAX) NULL
);
GO
-- No. 73: Resep_Detail
CREATE TABLE dbo.[Resep_Detail] (
    [resep_id] UNIQUEIDENTIFIER NOT NULL,
    [obat_id] UNIQUEIDENTIFIER NOT NULL,
    [jumlah] DECIMAL(10,2) NOT NULL,
    [aturan_pakai] NVARCHAR(MAX) NOT NULL,
    CONSTRAINT [PK_Resep_Detail] PRIMARY KEY ([resep_id], [obat_id])
);
GO
-- No. 74: Pengeluaran_Obat
CREATE TABLE dbo.[Pengeluaran_Obat] (
    [pengeluaran_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [resep_id] UNIQUEIDENTIFIER NOT NULL,
    [obat_id] UNIQUEIDENTIFIER NOT NULL,
    [batch_id] UNIQUEIDENTIFIER NOT NULL,
    [gudang_id] UNIQUEIDENTIFIER NOT NULL,
    [apoteker_staf_id] UNIQUEIDENTIFIER NOT NULL,
    [jumlah] DECIMAL(10,2) NOT NULL,
    [waktu] DATETIME2 NOT NULL
);
GO
-- No. 75: Stok_Opname
CREATE TABLE dbo.[Stok_Opname] (
    [opname_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [gudang_id] UNIQUEIDENTIFIER NOT NULL,
    [staf_id] UNIQUEIDENTIFIER NOT NULL,
    [tanggal] DATE NOT NULL,
    [status] VARCHAR(20) NOT NULL
);
GO
-- No. 76: Opname_Detail
CREATE TABLE dbo.[Opname_Detail] (
    [opname_id] UNIQUEIDENTIFIER NOT NULL,
    [batch_id] UNIQUEIDENTIFIER NOT NULL,
    [stok_sistem] DECIMAL(10,2) NOT NULL,
    [stok_fisik] DECIMAL(10,2) NOT NULL,
    CONSTRAINT [PK_Opname_Detail] PRIMARY KEY ([opname_id], [batch_id])
);
GO
-- No. 77: Harga_Obat
CREATE TABLE dbo.[Harga_Obat] (
    [harga_obat_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [obat_id] UNIQUEIDENTIFIER NOT NULL,
    [diubah_oleh] UNIQUEIDENTIFIER NOT NULL,
    [harga_jual] DECIMAL(14,2) NOT NULL,
    [berlaku_dari] DATE NOT NULL,
    [berlaku_sampai] DATE NULL,
    [alasan] NVARCHAR(MAX) NOT NULL
);
GO
-- No. 78: Jenis_Diet
CREATE TABLE dbo.[Jenis_Diet] (
    [diet_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [kode] VARCHAR(30) NOT NULL,
    [nama] NVARCHAR(100) NOT NULL,
    [keterangan] NVARCHAR(MAX) NULL,
    CONSTRAINT [UQ_Jenis_Diet_kode] UNIQUE ([kode])
);
GO
-- No. 79: Order_Gizi
CREATE TABLE dbo.[Order_Gizi] (
    [order_gizi_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [rawat_inap_id] UNIQUEIDENTIFIER NOT NULL,
    [diet_id] UNIQUEIDENTIFIER NOT NULL,
    [staf_id] UNIQUEIDENTIFIER NOT NULL,
    [tanggal] DATE NOT NULL,
    [waktu_makan] DATETIME2 NOT NULL,
    [catatan] NVARCHAR(MAX) NULL
);
GO
-- No. 80: Sesi_Terapi
CREATE TABLE dbo.[Sesi_Terapi] (
    [sesi_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [kunjungan_id] UNIQUEIDENTIFIER NOT NULL,
    [layanan_id] UNIQUEIDENTIFIER NOT NULL,
    [staf_id] UNIQUEIDENTIFIER NOT NULL,
    [aset_id] UNIQUEIDENTIFIER NULL,
    [jenis] VARCHAR(20) NOT NULL,
    [mulai] DATETIME2 NOT NULL,
    [selesai] DATETIME2 NULL,
    [catatan] NVARCHAR(MAX) NULL
);
GO
-- No. 81: Ambulans
CREATE TABLE dbo.[Ambulans] (
    [ambulans_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [aset_id] UNIQUEIDENTIFIER NULL,
    [plat_nomor] VARCHAR(30) NOT NULL,
    [jenis] VARCHAR(20) NOT NULL,
    [tahun] SMALLINT NOT NULL,
    [kapasitas] SMALLINT NOT NULL,
    [status] VARCHAR(20) NOT NULL,
    [tgl_kir_berikutnya] DATE NOT NULL,
    CONSTRAINT [UQ_Ambulans_plat_nomor] UNIQUE ([plat_nomor])
);
GO
-- No. 82: Perjalanan_Ambulans
CREATE TABLE dbo.[Perjalanan_Ambulans] (
    [perjalanan_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [ambulans_id] UNIQUEIDENTIFIER NOT NULL,
    [pasien_id] UNIQUEIDENTIFIER NOT NULL,
    [kunjungan_id] UNIQUEIDENTIFIER NULL,
    [layanan_id] UNIQUEIDENTIFIER NOT NULL,
    [sopir_staf_id] UNIQUEIDENTIFIER NOT NULL,
    [pendamping_staf_id] UNIQUEIDENTIFIER NULL,
    [asal] NVARCHAR(255) NOT NULL,
    [tujuan] NVARCHAR(255) NOT NULL,
    [waktu_berangkat] DATETIME2 NOT NULL,
    [waktu_tiba] DATETIME2 NULL,
    [jarak_km] DECIMAL(7,1) NOT NULL,
    [status] VARCHAR(20) NOT NULL
);
GO
-- No. 83: Set_Instrumen
CREATE TABLE dbo.[Set_Instrumen] (
    [set_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [unit_id] UNIQUEIDENTIFIER NOT NULL,
    [kode] VARCHAR(30) NOT NULL,
    [nama] NVARCHAR(100) NOT NULL,
    [jumlah_item] SMALLINT NOT NULL,
    CONSTRAINT [UQ_Set_Instrumen_kode] UNIQUE ([kode])
);
GO
-- No. 84: Siklus_Sterilisasi
CREATE TABLE dbo.[Siklus_Sterilisasi] (
    [siklus_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [set_id] UNIQUEIDENTIFIER NOT NULL,
    [aset_id] UNIQUEIDENTIFIER NULL,
    [staf_id] UNIQUEIDENTIFIER NOT NULL,
    [metode] VARCHAR(20) NOT NULL,
    [mulai] DATETIME2 NOT NULL,
    [selesai] DATETIME2 NULL,
    [hasil_indikator] NVARCHAR(MAX) NOT NULL
);
GO
-- No. 85: Transaksi_Laundry
CREATE TABLE dbo.[Transaksi_Laundry] (
    [laundry_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [unit_id] UNIQUEIDENTIFIER NOT NULL,
    [staf_id] UNIQUEIDENTIFIER NOT NULL,
    [jenis_linen] VARCHAR(20) NOT NULL,
    [jumlah] DECIMAL(10,2) NOT NULL,
    [tgl_kirim] DATE NOT NULL,
    [tgl_selesai] DATE NULL
);
GO
-- No. 86: Limbah
CREATE TABLE dbo.[Limbah] (
    [limbah_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [unit_id] UNIQUEIDENTIFIER NOT NULL,
    [staf_id] UNIQUEIDENTIFIER NOT NULL,
    [jenis] VARCHAR(20) NOT NULL,
    [berat_kg] DECIMAL(8,2) NOT NULL,
    [tgl] DATE NOT NULL,
    [vendor_pengangkut] NVARCHAR(100) NOT NULL
);
GO
-- No. 87: Pemulasaran_Jenazah
CREATE TABLE dbo.[Pemulasaran_Jenazah] (
    [pemulasaran_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [pasien_id] UNIQUEIDENTIFIER NOT NULL,
    [kunjungan_id] UNIQUEIDENTIFIER NULL,
    [ruangan_id] UNIQUEIDENTIFIER NOT NULL,
    [staf_id] UNIQUEIDENTIFIER NOT NULL,
    [waktu_meninggal] DATETIME2 NOT NULL,
    [penyebab] NVARCHAR(MAX) NOT NULL,
    [waktu_masuk] DATETIME2 NOT NULL,
    [waktu_diserahkan] DATETIME2 NULL,
    [penerima] NVARCHAR(100) NOT NULL
);
GO
-- No. 88: Aset
CREATE TABLE dbo.[Aset] (
    [aset_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [ruangan_id] UNIQUEIDENTIFIER NULL,
    [kode] VARCHAR(30) NOT NULL,
    [nama] NVARCHAR(100) NOT NULL,
    [kategori] VARCHAR(20) NOT NULL,
    [tgl_perolehan] DATE NOT NULL,
    [harga_perolehan] DECIMAL(14,2) NOT NULL,
    [kondisi] VARCHAR(20) NOT NULL,
    [status] VARCHAR(20) NOT NULL,
    CONSTRAINT [UQ_Aset_kode] UNIQUE ([kode])
);
GO
-- No. 89: Pemeliharaan_Aset
CREATE TABLE dbo.[Pemeliharaan_Aset] (
    [pemeliharaan_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [aset_id] UNIQUEIDENTIFIER NOT NULL,
    [teknisi_staf_id] UNIQUEIDENTIFIER NOT NULL,
    [jenis] VARCHAR(20) NOT NULL,
    [tanggal] DATE NOT NULL,
    [biaya] DECIMAL(14,2) NOT NULL,
    [hasil] NVARCHAR(MAX) NULL,
    [jadwal_berikutnya] DATE NULL
);
GO
-- No. 90: Tagihan
CREATE TABLE dbo.[Tagihan] (
    [tagihan_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [kunjungan_id] UNIQUEIDENTIFIER NOT NULL,
    [total_tagihan] DECIMAL(14,2) NOT NULL,
    [total_dibayar] DECIMAL(14,2) NOT NULL,
    [status] VARCHAR(20) NOT NULL,
    [tgl_terbit] DATE NOT NULL,
    CONSTRAINT [UQ_Tagihan_kunjungan_id] UNIQUE ([kunjungan_id])
);
GO
-- No. 91: Tagihan_Rincian
CREATE TABLE dbo.[Tagihan_Rincian] (
    [rincian_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [tagihan_id] UNIQUEIDENTIFIER NOT NULL,
    [obat_id] UNIQUEIDENTIFIER NULL,
    [layanan_id] UNIQUEIDENTIFIER NULL,
    [paket_id] UNIQUEIDENTIFIER NULL,
    [qty] DECIMAL(10,2) NOT NULL,
    [harga_satuan] DECIMAL(14,2) NOT NULL,
    [subtotal] DECIMAL(14,2) NOT NULL
);
GO
-- No. 92: Pembayaran
CREATE TABLE dbo.[Pembayaran] (
    [pembayaran_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [tagihan_id] UNIQUEIDENTIFIER NOT NULL,
    [penjamin_id] UNIQUEIDENTIFIER NOT NULL,
    [kasir_staf_id] UNIQUEIDENTIFIER NOT NULL,
    [jumlah] DECIMAL(10,2) NOT NULL,
    [metode] VARCHAR(20) NOT NULL,
    [jenis] VARCHAR(20) NOT NULL,
    [waktu_bayar] DATETIME2 NOT NULL
);
GO
-- No. 93: Klaim_Penjamin
CREATE TABLE dbo.[Klaim_Penjamin] (
    [klaim_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [tagihan_id] UNIQUEIDENTIFIER NOT NULL,
    [penjamin_id] UNIQUEIDENTIFIER NOT NULL,
    [no_sep] VARCHAR(30) NOT NULL,
    [kode_grup_tarif] VARCHAR(30) NOT NULL,
    [tarif_klaim] DECIMAL(14,2) NOT NULL,
    [status] VARCHAR(20) NOT NULL,
    [tgl_ajuan] DATE NOT NULL,
    [tgl_dibayar] DATE NULL
);
GO
-- No. 94: Notifikasi_Log
CREATE TABLE dbo.[Notifikasi_Log] (
    [notif_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [reservasi_id] UNIQUEIDENTIFIER NULL,
    [jenis] VARCHAR(20) NOT NULL,
    [tujuan] NVARCHAR(255) NOT NULL,
    [pesan] NVARCHAR(500) NOT NULL,
    [status] VARCHAR(20) NOT NULL,
    [retry_count] SMALLINT NOT NULL,
    [waktu_kirim] DATETIME2 NOT NULL,
    [created_at] DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);
GO
-- No. 95: Konten_Publik
CREATE TABLE dbo.[Konten_Publik] (
    [konten_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [tipe] VARCHAR(20) NOT NULL,
    [judul] NVARCHAR(100) NOT NULL,
    [isi] NVARCHAR(MAX) NOT NULL,
    [media_url] VARCHAR(255) NOT NULL,
    [urutan] SMALLINT NOT NULL,
    [terbit] BIT NOT NULL DEFAULT 1,
    [updated_at] DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);
GO
-- No. 96: Audit_Log
CREATE TABLE dbo.[Audit_Log] (
    [log_id] BIGINT IDENTITY(1,1) NOT NULL,
    [akun_id] UNIQUEIDENTIFIER NULL,
    [aksi] VARCHAR(40) NOT NULL,
    [tabel] VARCHAR(40) NOT NULL,
    [id_baris] VARCHAR(40) NOT NULL,
    [nilai_lama] NVARCHAR(MAX) NOT NULL,
    [nilai_baru] NVARCHAR(MAX) NOT NULL,
    [ip_address] VARCHAR(45) NOT NULL,
    [waktu] DATETIME2 NOT NULL,
    [user_ref] NVARCHAR(50) NULL
);
GO
-- No. 97: Laporan_Insiden
CREATE TABLE dbo.[Laporan_Insiden] (
    [insiden_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [kunjungan_id] UNIQUEIDENTIFIER NULL,
    [unit_id] UNIQUEIDENTIFIER NOT NULL,
    [pelapor_staf_id] UNIQUEIDENTIFIER NOT NULL,
    [jenis] VARCHAR(20) NOT NULL,
    [tingkat_keparahan] VARCHAR(20) NOT NULL,
    [deskripsi] NVARCHAR(MAX) NOT NULL,
    [tindak_lanjut] NVARCHAR(MAX) NULL,
    [status] VARCHAR(20) NOT NULL,
    [tgl] DATE NOT NULL
);
GO

-- ===== Foreign keys (ditambahkan setelah semua tabel ada => siklus aman) =====
ALTER TABLE dbo.[Rumah_Sakit] ADD CONSTRAINT [FK_Rumah_Sakit_direktur_staf_id] FOREIGN KEY ([direktur_staf_id]) REFERENCES dbo.[Staf] ([staf_id]);
ALTER TABLE dbo.[Gedung] ADD CONSTRAINT [FK_Gedung_rumah_sakit_id] FOREIGN KEY ([rumah_sakit_id]) REFERENCES dbo.[Rumah_Sakit] ([rumah_sakit_id]);
ALTER TABLE dbo.[Unit_Pelayanan] ADD CONSTRAINT [FK_Unit_Pelayanan_rumah_sakit_id] FOREIGN KEY ([rumah_sakit_id]) REFERENCES dbo.[Rumah_Sakit] ([rumah_sakit_id]);
ALTER TABLE dbo.[Unit_Pelayanan] ADD CONSTRAINT [FK_Unit_Pelayanan_induk_unit_id] FOREIGN KEY ([induk_unit_id]) REFERENCES dbo.[Unit_Pelayanan] ([unit_id]);
ALTER TABLE dbo.[Unit_Pelayanan] ADD CONSTRAINT [FK_Unit_Pelayanan_kepala_staf_id] FOREIGN KEY ([kepala_staf_id]) REFERENCES dbo.[Staf] ([staf_id]);
ALTER TABLE dbo.[Ruangan] ADD CONSTRAINT [FK_Ruangan_unit_id] FOREIGN KEY ([unit_id]) REFERENCES dbo.[Unit_Pelayanan] ([unit_id]);
ALTER TABLE dbo.[Ruangan] ADD CONSTRAINT [FK_Ruangan_gedung_id] FOREIGN KEY ([gedung_id]) REFERENCES dbo.[Gedung] ([gedung_id]);
ALTER TABLE dbo.[Tempat_Tidur] ADD CONSTRAINT [FK_Tempat_Tidur_ruangan_id] FOREIGN KEY ([ruangan_id]) REFERENCES dbo.[Ruangan] ([ruangan_id]);
ALTER TABLE dbo.[Tempat_Tidur] ADD CONSTRAINT [FK_Tempat_Tidur_kelas_id] FOREIGN KEY ([kelas_id]) REFERENCES dbo.[Kelas_Perawatan] ([kelas_id]);
ALTER TABLE dbo.[Staf] ADD CONSTRAINT [FK_Staf_profesi_id] FOREIGN KEY ([profesi_id]) REFERENCES dbo.[Profesi] ([profesi_id]);
ALTER TABLE dbo.[Staf] ADD CONSTRAINT [FK_Staf_unit_id] FOREIGN KEY ([unit_id]) REFERENCES dbo.[Unit_Pelayanan] ([unit_id]);
ALTER TABLE dbo.[Staf_Medis] ADD CONSTRAINT [FK_Staf_Medis_staf_id] FOREIGN KEY ([staf_id]) REFERENCES dbo.[Staf] ([staf_id]);
ALTER TABLE dbo.[Staf_Medis] ADD CONSTRAINT [FK_Staf_Medis_spesialisasi_id] FOREIGN KEY ([spesialisasi_id]) REFERENCES dbo.[Spesialisasi] ([spesialisasi_id]);
ALTER TABLE dbo.[Penugasan_Shift] ADD CONSTRAINT [FK_Penugasan_Shift_staf_id] FOREIGN KEY ([staf_id]) REFERENCES dbo.[Staf] ([staf_id]);
ALTER TABLE dbo.[Penugasan_Shift] ADD CONSTRAINT [FK_Penugasan_Shift_shift_id] FOREIGN KEY ([shift_id]) REFERENCES dbo.[Shift] ([shift_id]);
ALTER TABLE dbo.[Penugasan_Shift] ADD CONSTRAINT [FK_Penugasan_Shift_unit_id] FOREIGN KEY ([unit_id]) REFERENCES dbo.[Unit_Pelayanan] ([unit_id]);
ALTER TABLE dbo.[Cuti_Staf] ADD CONSTRAINT [FK_Cuti_Staf_staf_id] FOREIGN KEY ([staf_id]) REFERENCES dbo.[Staf] ([staf_id]);
ALTER TABLE dbo.[Akun_Pengguna] ADD CONSTRAINT [FK_Akun_Pengguna_staf_id] FOREIGN KEY ([staf_id]) REFERENCES dbo.[Staf] ([staf_id]);
ALTER TABLE dbo.[Akun_Pengguna] ADD CONSTRAINT [FK_Akun_Pengguna_peran_id] FOREIGN KEY ([peran_id]) REFERENCES dbo.[Peran] ([peran_id]);
ALTER TABLE dbo.[Akun_Pengguna] ADD CONSTRAINT [FK_Akun_Pengguna_pasien_id] FOREIGN KEY ([pasien_id]) REFERENCES dbo.[Pasien] ([pasien_id]);
ALTER TABLE dbo.[Otp_Reset] ADD CONSTRAINT [FK_Otp_Reset_akun_id] FOREIGN KEY ([akun_id]) REFERENCES dbo.[Akun_Pengguna] ([akun_id]);
ALTER TABLE dbo.[Pasien] ADD CONSTRAINT [FK_Pasien_ibu_pasien_id] FOREIGN KEY ([ibu_pasien_id]) REFERENCES dbo.[Pasien] ([pasien_id]);
ALTER TABLE dbo.[Kontak_Darurat] ADD CONSTRAINT [FK_Kontak_Darurat_pasien_id] FOREIGN KEY ([pasien_id]) REFERENCES dbo.[Pasien] ([pasien_id]);
ALTER TABLE dbo.[Kepesertaan_Pasien] ADD CONSTRAINT [FK_Kepesertaan_Pasien_pasien_id] FOREIGN KEY ([pasien_id]) REFERENCES dbo.[Pasien] ([pasien_id]);
ALTER TABLE dbo.[Kepesertaan_Pasien] ADD CONSTRAINT [FK_Kepesertaan_Pasien_penjamin_id] FOREIGN KEY ([penjamin_id]) REFERENCES dbo.[Penjamin] ([penjamin_id]);
ALTER TABLE dbo.[Jadwal_Praktik] ADD CONSTRAINT [FK_Jadwal_Praktik_staf_id] FOREIGN KEY ([staf_id]) REFERENCES dbo.[Staf] ([staf_id]);
ALTER TABLE dbo.[Jadwal_Praktik] ADD CONSTRAINT [FK_Jadwal_Praktik_unit_id] FOREIGN KEY ([unit_id]) REFERENCES dbo.[Unit_Pelayanan] ([unit_id]);
ALTER TABLE dbo.[Jadwal_Praktik] ADD CONSTRAINT [FK_Jadwal_Praktik_ruangan_id] FOREIGN KEY ([ruangan_id]) REFERENCES dbo.[Ruangan] ([ruangan_id]);
ALTER TABLE dbo.[Reservasi] ADD CONSTRAINT [FK_Reservasi_pasien_id] FOREIGN KEY ([pasien_id]) REFERENCES dbo.[Pasien] ([pasien_id]);
ALTER TABLE dbo.[Reservasi] ADD CONSTRAINT [FK_Reservasi_jadwal_id] FOREIGN KEY ([jadwal_id]) REFERENCES dbo.[Jadwal_Praktik] ([jadwal_id]);
ALTER TABLE dbo.[Reservasi] ADD CONSTRAINT [FK_Reservasi_layanan_id] FOREIGN KEY ([layanan_id]) REFERENCES dbo.[Layanan_Medis] ([layanan_id]);
ALTER TABLE dbo.[Reservasi] ADD CONSTRAINT [FK_Reservasi_dibuat_oleh] FOREIGN KEY ([dibuat_oleh]) REFERENCES dbo.[Akun_Pengguna] ([akun_id]);
ALTER TABLE dbo.[Kunjungan] ADD CONSTRAINT [FK_Kunjungan_pasien_id] FOREIGN KEY ([pasien_id]) REFERENCES dbo.[Pasien] ([pasien_id]);
ALTER TABLE dbo.[Kunjungan] ADD CONSTRAINT [FK_Kunjungan_reservasi_id] FOREIGN KEY ([reservasi_id]) REFERENCES dbo.[Reservasi] ([reservasi_id]);
ALTER TABLE dbo.[Kunjungan] ADD CONSTRAINT [FK_Kunjungan_unit_id] FOREIGN KEY ([unit_id]) REFERENCES dbo.[Unit_Pelayanan] ([unit_id]);
ALTER TABLE dbo.[Kunjungan] ADD CONSTRAINT [FK_Kunjungan_dpjp_staf_id] FOREIGN KEY ([dpjp_staf_id]) REFERENCES dbo.[Staf] ([staf_id]);
ALTER TABLE dbo.[Kunjungan] ADD CONSTRAINT [FK_Kunjungan_penjamin_id] FOREIGN KEY ([penjamin_id]) REFERENCES dbo.[Penjamin] ([penjamin_id]);
ALTER TABLE dbo.[Kunjungan] ADD CONSTRAINT [FK_Kunjungan_koreksi_dari_id] FOREIGN KEY ([koreksi_dari_id]) REFERENCES dbo.[Kunjungan] ([kunjungan_id]);
ALTER TABLE dbo.[Rujukan] ADD CONSTRAINT [FK_Rujukan_kunjungan_id] FOREIGN KEY ([kunjungan_id]) REFERENCES dbo.[Kunjungan] ([kunjungan_id]);
ALTER TABLE dbo.[Rujukan] ADD CONSTRAINT [FK_Rujukan_diagnosa_id] FOREIGN KEY ([diagnosa_id]) REFERENCES dbo.[Diagnosa] ([diagnosa_id]);
ALTER TABLE dbo.[Triase] ADD CONSTRAINT [FK_Triase_kunjungan_id] FOREIGN KEY ([kunjungan_id]) REFERENCES dbo.[Kunjungan] ([kunjungan_id]);
ALTER TABLE dbo.[Triase] ADD CONSTRAINT [FK_Triase_staf_id] FOREIGN KEY ([staf_id]) REFERENCES dbo.[Staf] ([staf_id]);
ALTER TABLE dbo.[Rawat_Inap] ADD CONSTRAINT [FK_Rawat_Inap_kunjungan_id] FOREIGN KEY ([kunjungan_id]) REFERENCES dbo.[Kunjungan] ([kunjungan_id]);
ALTER TABLE dbo.[Rawat_Inap] ADD CONSTRAINT [FK_Rawat_Inap_bed_id] FOREIGN KEY ([bed_id]) REFERENCES dbo.[Tempat_Tidur] ([bed_id]);
ALTER TABLE dbo.[Visite] ADD CONSTRAINT [FK_Visite_kunjungan_id] FOREIGN KEY ([kunjungan_id]) REFERENCES dbo.[Kunjungan] ([kunjungan_id]);
ALTER TABLE dbo.[Visite] ADD CONSTRAINT [FK_Visite_staf_id] FOREIGN KEY ([staf_id]) REFERENCES dbo.[Staf] ([staf_id]);
ALTER TABLE dbo.[Pemeriksaan] ADD CONSTRAINT [FK_Pemeriksaan_kunjungan_id] FOREIGN KEY ([kunjungan_id]) REFERENCES dbo.[Kunjungan] ([kunjungan_id]);
ALTER TABLE dbo.[Pemeriksaan] ADD CONSTRAINT [FK_Pemeriksaan_staf_id] FOREIGN KEY ([staf_id]) REFERENCES dbo.[Staf] ([staf_id]);
ALTER TABLE dbo.[Tanda_Vital] ADD CONSTRAINT [FK_Tanda_Vital_pemeriksaan_id] FOREIGN KEY ([pemeriksaan_id]) REFERENCES dbo.[Pemeriksaan] ([pemeriksaan_id]);
ALTER TABLE dbo.[Kunjungan_Diagnosa] ADD CONSTRAINT [FK_Kunjungan_Diagnosa_kunjungan_id] FOREIGN KEY ([kunjungan_id]) REFERENCES dbo.[Kunjungan] ([kunjungan_id]);
ALTER TABLE dbo.[Kunjungan_Diagnosa] ADD CONSTRAINT [FK_Kunjungan_Diagnosa_diagnosa_id] FOREIGN KEY ([diagnosa_id]) REFERENCES dbo.[Diagnosa] ([diagnosa_id]);
ALTER TABLE dbo.[Alergi_Kondisi] ADD CONSTRAINT [FK_Alergi_Kondisi_pasien_id] FOREIGN KEY ([pasien_id]) REFERENCES dbo.[Pasien] ([pasien_id]);
ALTER TABLE dbo.[Alergi_Kondisi] ADD CONSTRAINT [FK_Alergi_Kondisi_obat_id] FOREIGN KEY ([obat_id]) REFERENCES dbo.[Obat] ([obat_id]);
ALTER TABLE dbo.[Alergi_Kondisi] ADD CONSTRAINT [FK_Alergi_Kondisi_dicatat_oleh] FOREIGN KEY ([dicatat_oleh]) REFERENCES dbo.[Staf] ([staf_id]);
ALTER TABLE dbo.[Catatan_Keperawatan] ADD CONSTRAINT [FK_Catatan_Keperawatan_kunjungan_id] FOREIGN KEY ([kunjungan_id]) REFERENCES dbo.[Kunjungan] ([kunjungan_id]);
ALTER TABLE dbo.[Catatan_Keperawatan] ADD CONSTRAINT [FK_Catatan_Keperawatan_staf_id] FOREIGN KEY ([staf_id]) REFERENCES dbo.[Staf] ([staf_id]);
ALTER TABLE dbo.[Konsultasi] ADD CONSTRAINT [FK_Konsultasi_kunjungan_id] FOREIGN KEY ([kunjungan_id]) REFERENCES dbo.[Kunjungan] ([kunjungan_id]);
ALTER TABLE dbo.[Konsultasi] ADD CONSTRAINT [FK_Konsultasi_dokter_peminta_id] FOREIGN KEY ([dokter_peminta_id]) REFERENCES dbo.[Staf] ([staf_id]);
ALTER TABLE dbo.[Konsultasi] ADD CONSTRAINT [FK_Konsultasi_dokter_tujuan_id] FOREIGN KEY ([dokter_tujuan_id]) REFERENCES dbo.[Staf] ([staf_id]);
ALTER TABLE dbo.[Persetujuan_Tindakan] ADD CONSTRAINT [FK_Persetujuan_Tindakan_kunjungan_id] FOREIGN KEY ([kunjungan_id]) REFERENCES dbo.[Kunjungan] ([kunjungan_id]);
ALTER TABLE dbo.[Persetujuan_Tindakan] ADD CONSTRAINT [FK_Persetujuan_Tindakan_layanan_id] FOREIGN KEY ([layanan_id]) REFERENCES dbo.[Layanan_Medis] ([layanan_id]);
ALTER TABLE dbo.[Persetujuan_Tindakan] ADD CONSTRAINT [FK_Persetujuan_Tindakan_staf_id] FOREIGN KEY ([staf_id]) REFERENCES dbo.[Staf] ([staf_id]);
ALTER TABLE dbo.[Dokumen_Medis] ADD CONSTRAINT [FK_Dokumen_Medis_kunjungan_id] FOREIGN KEY ([kunjungan_id]) REFERENCES dbo.[Kunjungan] ([kunjungan_id]);
ALTER TABLE dbo.[Dokumen_Medis] ADD CONSTRAINT [FK_Dokumen_Medis_staf_id] FOREIGN KEY ([staf_id]) REFERENCES dbo.[Staf] ([staf_id]);
ALTER TABLE dbo.[Kehamilan] ADD CONSTRAINT [FK_Kehamilan_pasien_id] FOREIGN KEY ([pasien_id]) REFERENCES dbo.[Pasien] ([pasien_id]);
ALTER TABLE dbo.[Pemeriksaan_ANC] ADD CONSTRAINT [FK_Pemeriksaan_ANC_kehamilan_id] FOREIGN KEY ([kehamilan_id]) REFERENCES dbo.[Kehamilan] ([kehamilan_id]);
ALTER TABLE dbo.[Pemeriksaan_ANC] ADD CONSTRAINT [FK_Pemeriksaan_ANC_pemeriksaan_id] FOREIGN KEY ([pemeriksaan_id]) REFERENCES dbo.[Pemeriksaan] ([pemeriksaan_id]);
ALTER TABLE dbo.[Persalinan] ADD CONSTRAINT [FK_Persalinan_kehamilan_id] FOREIGN KEY ([kehamilan_id]) REFERENCES dbo.[Kehamilan] ([kehamilan_id]);
ALTER TABLE dbo.[Persalinan] ADD CONSTRAINT [FK_Persalinan_kunjungan_id] FOREIGN KEY ([kunjungan_id]) REFERENCES dbo.[Kunjungan] ([kunjungan_id]);
ALTER TABLE dbo.[Persalinan] ADD CONSTRAINT [FK_Persalinan_penolong_staf_id] FOREIGN KEY ([penolong_staf_id]) REFERENCES dbo.[Staf] ([staf_id]);
ALTER TABLE dbo.[Bayi_Lahir] ADD CONSTRAINT [FK_Bayi_Lahir_persalinan_id] FOREIGN KEY ([persalinan_id]) REFERENCES dbo.[Persalinan] ([persalinan_id]);
ALTER TABLE dbo.[Bayi_Lahir] ADD CONSTRAINT [FK_Bayi_Lahir_pasien_id] FOREIGN KEY ([pasien_id]) REFERENCES dbo.[Pasien] ([pasien_id]);
ALTER TABLE dbo.[Vaksin] ADD CONSTRAINT [FK_Vaksin_obat_id] FOREIGN KEY ([obat_id]) REFERENCES dbo.[Obat] ([obat_id]);
ALTER TABLE dbo.[Imunisasi_Pasien] ADD CONSTRAINT [FK_Imunisasi_Pasien_pasien_id] FOREIGN KEY ([pasien_id]) REFERENCES dbo.[Pasien] ([pasien_id]);
ALTER TABLE dbo.[Imunisasi_Pasien] ADD CONSTRAINT [FK_Imunisasi_Pasien_vaksin_id] FOREIGN KEY ([vaksin_id]) REFERENCES dbo.[Vaksin] ([vaksin_id]);
ALTER TABLE dbo.[Imunisasi_Pasien] ADD CONSTRAINT [FK_Imunisasi_Pasien_kunjungan_id] FOREIGN KEY ([kunjungan_id]) REFERENCES dbo.[Kunjungan] ([kunjungan_id]);
ALTER TABLE dbo.[Imunisasi_Pasien] ADD CONSTRAINT [FK_Imunisasi_Pasien_batch_id] FOREIGN KEY ([batch_id]) REFERENCES dbo.[Batch_Obat] ([batch_id]);
ALTER TABLE dbo.[Imunisasi_Pasien] ADD CONSTRAINT [FK_Imunisasi_Pasien_staf_id] FOREIGN KEY ([staf_id]) REFERENCES dbo.[Staf] ([staf_id]);
ALTER TABLE dbo.[Metode_KB] ADD CONSTRAINT [FK_Metode_KB_obat_id] FOREIGN KEY ([obat_id]) REFERENCES dbo.[Obat] ([obat_id]);
ALTER TABLE dbo.[Pelayanan_KB] ADD CONSTRAINT [FK_Pelayanan_KB_pasien_id] FOREIGN KEY ([pasien_id]) REFERENCES dbo.[Pasien] ([pasien_id]);
ALTER TABLE dbo.[Pelayanan_KB] ADD CONSTRAINT [FK_Pelayanan_KB_metode_id] FOREIGN KEY ([metode_id]) REFERENCES dbo.[Metode_KB] ([metode_id]);
ALTER TABLE dbo.[Pelayanan_KB] ADD CONSTRAINT [FK_Pelayanan_KB_kunjungan_id] FOREIGN KEY ([kunjungan_id]) REFERENCES dbo.[Kunjungan] ([kunjungan_id]);
ALTER TABLE dbo.[Asuhan_BBL] ADD CONSTRAINT [FK_Asuhan_BBL_bayi_id] FOREIGN KEY ([bayi_id]) REFERENCES dbo.[Bayi_Lahir] ([bayi_id]);
ALTER TABLE dbo.[Asuhan_BBL] ADD CONSTRAINT [FK_Asuhan_BBL_staf_id] FOREIGN KEY ([staf_id]) REFERENCES dbo.[Staf] ([staf_id]);
ALTER TABLE dbo.[Pemeriksaan_Bayi] ADD CONSTRAINT [FK_Pemeriksaan_Bayi_bayi_id] FOREIGN KEY ([bayi_id]) REFERENCES dbo.[Bayi_Lahir] ([bayi_id]);
ALTER TABLE dbo.[Pemeriksaan_Bayi] ADD CONSTRAINT [FK_Pemeriksaan_Bayi_kunjungan_id] FOREIGN KEY ([kunjungan_id]) REFERENCES dbo.[Kunjungan] ([kunjungan_id]);
ALTER TABLE dbo.[Pemeriksaan_Bayi] ADD CONSTRAINT [FK_Pemeriksaan_Bayi_staf_id] FOREIGN KEY ([staf_id]) REFERENCES dbo.[Staf] ([staf_id]);
ALTER TABLE dbo.[Layanan_Medis] ADD CONSTRAINT [FK_Layanan_Medis_unit_id] FOREIGN KEY ([unit_id]) REFERENCES dbo.[Unit_Pelayanan] ([unit_id]);
ALTER TABLE dbo.[Tindakan_Kunjungan] ADD CONSTRAINT [FK_Tindakan_Kunjungan_kunjungan_id] FOREIGN KEY ([kunjungan_id]) REFERENCES dbo.[Kunjungan] ([kunjungan_id]);
ALTER TABLE dbo.[Tindakan_Kunjungan] ADD CONSTRAINT [FK_Tindakan_Kunjungan_layanan_id] FOREIGN KEY ([layanan_id]) REFERENCES dbo.[Layanan_Medis] ([layanan_id]);
ALTER TABLE dbo.[Tindakan_Kunjungan] ADD CONSTRAINT [FK_Tindakan_Kunjungan_staf_id] FOREIGN KEY ([staf_id]) REFERENCES dbo.[Staf] ([staf_id]);
ALTER TABLE dbo.[Paket_Detail] ADD CONSTRAINT [FK_Paket_Detail_paket_id] FOREIGN KEY ([paket_id]) REFERENCES dbo.[Paket_Layanan] ([paket_id]);
ALTER TABLE dbo.[Paket_Detail] ADD CONSTRAINT [FK_Paket_Detail_layanan_id] FOREIGN KEY ([layanan_id]) REFERENCES dbo.[Layanan_Medis] ([layanan_id]);
ALTER TABLE dbo.[Harga_Layanan] ADD CONSTRAINT [FK_Harga_Layanan_layanan_id] FOREIGN KEY ([layanan_id]) REFERENCES dbo.[Layanan_Medis] ([layanan_id]);
ALTER TABLE dbo.[Harga_Layanan] ADD CONSTRAINT [FK_Harga_Layanan_kelas_id] FOREIGN KEY ([kelas_id]) REFERENCES dbo.[Kelas_Perawatan] ([kelas_id]);
ALTER TABLE dbo.[Harga_Layanan] ADD CONSTRAINT [FK_Harga_Layanan_penjamin_id] FOREIGN KEY ([penjamin_id]) REFERENCES dbo.[Penjamin] ([penjamin_id]);
ALTER TABLE dbo.[Harga_Layanan] ADD CONSTRAINT [FK_Harga_Layanan_diubah_oleh] FOREIGN KEY ([diubah_oleh]) REFERENCES dbo.[Staf] ([staf_id]);
ALTER TABLE dbo.[Harga_Paket] ADD CONSTRAINT [FK_Harga_Paket_paket_id] FOREIGN KEY ([paket_id]) REFERENCES dbo.[Paket_Layanan] ([paket_id]);
ALTER TABLE dbo.[Harga_Paket] ADD CONSTRAINT [FK_Harga_Paket_diubah_oleh] FOREIGN KEY ([diubah_oleh]) REFERENCES dbo.[Staf] ([staf_id]);
ALTER TABLE dbo.[Operasi] ADD CONSTRAINT [FK_Operasi_kunjungan_id] FOREIGN KEY ([kunjungan_id]) REFERENCES dbo.[Kunjungan] ([kunjungan_id]);
ALTER TABLE dbo.[Operasi] ADD CONSTRAINT [FK_Operasi_layanan_id] FOREIGN KEY ([layanan_id]) REFERENCES dbo.[Layanan_Medis] ([layanan_id]);
ALTER TABLE dbo.[Operasi] ADD CONSTRAINT [FK_Operasi_ruangan_id] FOREIGN KEY ([ruangan_id]) REFERENCES dbo.[Ruangan] ([ruangan_id]);
ALTER TABLE dbo.[Tim_Operasi] ADD CONSTRAINT [FK_Tim_Operasi_operasi_id] FOREIGN KEY ([operasi_id]) REFERENCES dbo.[Operasi] ([operasi_id]);
ALTER TABLE dbo.[Tim_Operasi] ADD CONSTRAINT [FK_Tim_Operasi_staf_id] FOREIGN KEY ([staf_id]) REFERENCES dbo.[Staf] ([staf_id]);
ALTER TABLE dbo.[Order_Penunjang] ADD CONSTRAINT [FK_Order_Penunjang_kunjungan_id] FOREIGN KEY ([kunjungan_id]) REFERENCES dbo.[Kunjungan] ([kunjungan_id]);
ALTER TABLE dbo.[Order_Penunjang] ADD CONSTRAINT [FK_Order_Penunjang_staf_pemesan_id] FOREIGN KEY ([staf_pemesan_id]) REFERENCES dbo.[Staf] ([staf_id]);
ALTER TABLE dbo.[Order_Penunjang_Detail] ADD CONSTRAINT [FK_Order_Penunjang_Detail_order_id] FOREIGN KEY ([order_id]) REFERENCES dbo.[Order_Penunjang] ([order_id]);
ALTER TABLE dbo.[Order_Penunjang_Detail] ADD CONSTRAINT [FK_Order_Penunjang_Detail_layanan_id] FOREIGN KEY ([layanan_id]) REFERENCES dbo.[Layanan_Medis] ([layanan_id]);
ALTER TABLE dbo.[Parameter_Lab] ADD CONSTRAINT [FK_Parameter_Lab_layanan_id] FOREIGN KEY ([layanan_id]) REFERENCES dbo.[Layanan_Medis] ([layanan_id]);
ALTER TABLE dbo.[Hasil_Lab] ADD CONSTRAINT [FK_Hasil_Lab_order_detail_id] FOREIGN KEY ([order_detail_id]) REFERENCES dbo.[Order_Penunjang_Detail] ([order_detail_id]);
ALTER TABLE dbo.[Hasil_Lab] ADD CONSTRAINT [FK_Hasil_Lab_parameter_id] FOREIGN KEY ([parameter_id]) REFERENCES dbo.[Parameter_Lab] ([parameter_id]);
ALTER TABLE dbo.[Hasil_Lab] ADD CONSTRAINT [FK_Hasil_Lab_staf_id] FOREIGN KEY ([staf_id]) REFERENCES dbo.[Staf] ([staf_id]);
ALTER TABLE dbo.[Hasil_Radiologi] ADD CONSTRAINT [FK_Hasil_Radiologi_order_detail_id] FOREIGN KEY ([order_detail_id]) REFERENCES dbo.[Order_Penunjang_Detail] ([order_detail_id]);
ALTER TABLE dbo.[Hasil_Radiologi] ADD CONSTRAINT [FK_Hasil_Radiologi_radiolog_staf_id] FOREIGN KEY ([radiolog_staf_id]) REFERENCES dbo.[Staf] ([staf_id]);
ALTER TABLE dbo.[Kantong_Darah] ADD CONSTRAINT [FK_Kantong_Darah_pendonor_id] FOREIGN KEY ([pendonor_id]) REFERENCES dbo.[Pendonor] ([pendonor_id]);
ALTER TABLE dbo.[Transfusi] ADD CONSTRAINT [FK_Transfusi_kunjungan_id] FOREIGN KEY ([kunjungan_id]) REFERENCES dbo.[Kunjungan] ([kunjungan_id]);
ALTER TABLE dbo.[Transfusi] ADD CONSTRAINT [FK_Transfusi_kantong_id] FOREIGN KEY ([kantong_id]) REFERENCES dbo.[Kantong_Darah] ([kantong_id]);
ALTER TABLE dbo.[Transfusi] ADD CONSTRAINT [FK_Transfusi_staf_id] FOREIGN KEY ([staf_id]) REFERENCES dbo.[Staf] ([staf_id]);
ALTER TABLE dbo.[Gudang] ADD CONSTRAINT [FK_Gudang_unit_id] FOREIGN KEY ([unit_id]) REFERENCES dbo.[Unit_Pelayanan] ([unit_id]);
ALTER TABLE dbo.[Purchase_Order] ADD CONSTRAINT [FK_Purchase_Order_pemasok_id] FOREIGN KEY ([pemasok_id]) REFERENCES dbo.[Pemasok] ([pemasok_id]);
ALTER TABLE dbo.[Purchase_Order] ADD CONSTRAINT [FK_Purchase_Order_dibuat_oleh] FOREIGN KEY ([dibuat_oleh]) REFERENCES dbo.[Staf] ([staf_id]);
ALTER TABLE dbo.[PO_Detail] ADD CONSTRAINT [FK_PO_Detail_po_id] FOREIGN KEY ([po_id]) REFERENCES dbo.[Purchase_Order] ([po_id]);
ALTER TABLE dbo.[PO_Detail] ADD CONSTRAINT [FK_PO_Detail_obat_id] FOREIGN KEY ([obat_id]) REFERENCES dbo.[Obat] ([obat_id]);
ALTER TABLE dbo.[Penerimaan_Barang] ADD CONSTRAINT [FK_Penerimaan_Barang_po_id] FOREIGN KEY ([po_id]) REFERENCES dbo.[Purchase_Order] ([po_id]);
ALTER TABLE dbo.[Penerimaan_Barang] ADD CONSTRAINT [FK_Penerimaan_Barang_pemasok_id] FOREIGN KEY ([pemasok_id]) REFERENCES dbo.[Pemasok] ([pemasok_id]);
ALTER TABLE dbo.[Penerimaan_Barang] ADD CONSTRAINT [FK_Penerimaan_Barang_staf_id] FOREIGN KEY ([staf_id]) REFERENCES dbo.[Staf] ([staf_id]);
ALTER TABLE dbo.[Batch_Obat] ADD CONSTRAINT [FK_Batch_Obat_obat_id] FOREIGN KEY ([obat_id]) REFERENCES dbo.[Obat] ([obat_id]);
ALTER TABLE dbo.[Batch_Obat] ADD CONSTRAINT [FK_Batch_Obat_penerimaan_id] FOREIGN KEY ([penerimaan_id]) REFERENCES dbo.[Penerimaan_Barang] ([penerimaan_id]);
ALTER TABLE dbo.[Stok_Batch] ADD CONSTRAINT [FK_Stok_Batch_batch_id] FOREIGN KEY ([batch_id]) REFERENCES dbo.[Batch_Obat] ([batch_id]);
ALTER TABLE dbo.[Stok_Batch] ADD CONSTRAINT [FK_Stok_Batch_gudang_id] FOREIGN KEY ([gudang_id]) REFERENCES dbo.[Gudang] ([gudang_id]);
ALTER TABLE dbo.[Mutasi_Stok] ADD CONSTRAINT [FK_Mutasi_Stok_batch_id] FOREIGN KEY ([batch_id]) REFERENCES dbo.[Batch_Obat] ([batch_id]);
ALTER TABLE dbo.[Mutasi_Stok] ADD CONSTRAINT [FK_Mutasi_Stok_gudang_id] FOREIGN KEY ([gudang_id]) REFERENCES dbo.[Gudang] ([gudang_id]);
ALTER TABLE dbo.[Mutasi_Stok] ADD CONSTRAINT [FK_Mutasi_Stok_kunjungan_id] FOREIGN KEY ([kunjungan_id]) REFERENCES dbo.[Kunjungan] ([kunjungan_id]);
ALTER TABLE dbo.[Mutasi_Stok] ADD CONSTRAINT [FK_Mutasi_Stok_staf_id] FOREIGN KEY ([staf_id]) REFERENCES dbo.[Staf] ([staf_id]);
ALTER TABLE dbo.[Resep] ADD CONSTRAINT [FK_Resep_kunjungan_id] FOREIGN KEY ([kunjungan_id]) REFERENCES dbo.[Kunjungan] ([kunjungan_id]);
ALTER TABLE dbo.[Resep] ADD CONSTRAINT [FK_Resep_staf_id] FOREIGN KEY ([staf_id]) REFERENCES dbo.[Staf] ([staf_id]);
ALTER TABLE dbo.[Resep_Detail] ADD CONSTRAINT [FK_Resep_Detail_resep_id] FOREIGN KEY ([resep_id]) REFERENCES dbo.[Resep] ([resep_id]);
ALTER TABLE dbo.[Resep_Detail] ADD CONSTRAINT [FK_Resep_Detail_obat_id] FOREIGN KEY ([obat_id]) REFERENCES dbo.[Obat] ([obat_id]);
ALTER TABLE dbo.[Pengeluaran_Obat] ADD CONSTRAINT [FK_Pengeluaran_Obat_resep_id] FOREIGN KEY ([resep_id]) REFERENCES dbo.[Resep] ([resep_id]);
ALTER TABLE dbo.[Pengeluaran_Obat] ADD CONSTRAINT [FK_Pengeluaran_Obat_obat_id] FOREIGN KEY ([obat_id]) REFERENCES dbo.[Obat] ([obat_id]);
ALTER TABLE dbo.[Pengeluaran_Obat] ADD CONSTRAINT [FK_Pengeluaran_Obat_batch_id] FOREIGN KEY ([batch_id]) REFERENCES dbo.[Batch_Obat] ([batch_id]);
ALTER TABLE dbo.[Pengeluaran_Obat] ADD CONSTRAINT [FK_Pengeluaran_Obat_gudang_id] FOREIGN KEY ([gudang_id]) REFERENCES dbo.[Gudang] ([gudang_id]);
ALTER TABLE dbo.[Pengeluaran_Obat] ADD CONSTRAINT [FK_Pengeluaran_Obat_apoteker_staf_id] FOREIGN KEY ([apoteker_staf_id]) REFERENCES dbo.[Staf] ([staf_id]);
ALTER TABLE dbo.[Stok_Opname] ADD CONSTRAINT [FK_Stok_Opname_gudang_id] FOREIGN KEY ([gudang_id]) REFERENCES dbo.[Gudang] ([gudang_id]);
ALTER TABLE dbo.[Stok_Opname] ADD CONSTRAINT [FK_Stok_Opname_staf_id] FOREIGN KEY ([staf_id]) REFERENCES dbo.[Staf] ([staf_id]);
ALTER TABLE dbo.[Opname_Detail] ADD CONSTRAINT [FK_Opname_Detail_opname_id] FOREIGN KEY ([opname_id]) REFERENCES dbo.[Stok_Opname] ([opname_id]);
ALTER TABLE dbo.[Opname_Detail] ADD CONSTRAINT [FK_Opname_Detail_batch_id] FOREIGN KEY ([batch_id]) REFERENCES dbo.[Batch_Obat] ([batch_id]);
ALTER TABLE dbo.[Harga_Obat] ADD CONSTRAINT [FK_Harga_Obat_obat_id] FOREIGN KEY ([obat_id]) REFERENCES dbo.[Obat] ([obat_id]);
ALTER TABLE dbo.[Harga_Obat] ADD CONSTRAINT [FK_Harga_Obat_diubah_oleh] FOREIGN KEY ([diubah_oleh]) REFERENCES dbo.[Staf] ([staf_id]);
ALTER TABLE dbo.[Order_Gizi] ADD CONSTRAINT [FK_Order_Gizi_rawat_inap_id] FOREIGN KEY ([rawat_inap_id]) REFERENCES dbo.[Rawat_Inap] ([rawat_inap_id]);
ALTER TABLE dbo.[Order_Gizi] ADD CONSTRAINT [FK_Order_Gizi_diet_id] FOREIGN KEY ([diet_id]) REFERENCES dbo.[Jenis_Diet] ([diet_id]);
ALTER TABLE dbo.[Order_Gizi] ADD CONSTRAINT [FK_Order_Gizi_staf_id] FOREIGN KEY ([staf_id]) REFERENCES dbo.[Staf] ([staf_id]);
ALTER TABLE dbo.[Sesi_Terapi] ADD CONSTRAINT [FK_Sesi_Terapi_kunjungan_id] FOREIGN KEY ([kunjungan_id]) REFERENCES dbo.[Kunjungan] ([kunjungan_id]);
ALTER TABLE dbo.[Sesi_Terapi] ADD CONSTRAINT [FK_Sesi_Terapi_layanan_id] FOREIGN KEY ([layanan_id]) REFERENCES dbo.[Layanan_Medis] ([layanan_id]);
ALTER TABLE dbo.[Sesi_Terapi] ADD CONSTRAINT [FK_Sesi_Terapi_staf_id] FOREIGN KEY ([staf_id]) REFERENCES dbo.[Staf] ([staf_id]);
ALTER TABLE dbo.[Sesi_Terapi] ADD CONSTRAINT [FK_Sesi_Terapi_aset_id] FOREIGN KEY ([aset_id]) REFERENCES dbo.[Aset] ([aset_id]);
ALTER TABLE dbo.[Ambulans] ADD CONSTRAINT [FK_Ambulans_aset_id] FOREIGN KEY ([aset_id]) REFERENCES dbo.[Aset] ([aset_id]);
ALTER TABLE dbo.[Perjalanan_Ambulans] ADD CONSTRAINT [FK_Perjalanan_Ambulans_ambulans_id] FOREIGN KEY ([ambulans_id]) REFERENCES dbo.[Ambulans] ([ambulans_id]);
ALTER TABLE dbo.[Perjalanan_Ambulans] ADD CONSTRAINT [FK_Perjalanan_Ambulans_pasien_id] FOREIGN KEY ([pasien_id]) REFERENCES dbo.[Pasien] ([pasien_id]);
ALTER TABLE dbo.[Perjalanan_Ambulans] ADD CONSTRAINT [FK_Perjalanan_Ambulans_kunjungan_id] FOREIGN KEY ([kunjungan_id]) REFERENCES dbo.[Kunjungan] ([kunjungan_id]);
ALTER TABLE dbo.[Perjalanan_Ambulans] ADD CONSTRAINT [FK_Perjalanan_Ambulans_layanan_id] FOREIGN KEY ([layanan_id]) REFERENCES dbo.[Layanan_Medis] ([layanan_id]);
ALTER TABLE dbo.[Perjalanan_Ambulans] ADD CONSTRAINT [FK_Perjalanan_Ambulans_sopir_staf_id] FOREIGN KEY ([sopir_staf_id]) REFERENCES dbo.[Staf] ([staf_id]);
ALTER TABLE dbo.[Perjalanan_Ambulans] ADD CONSTRAINT [FK_Perjalanan_Ambulans_pendamping_staf_id] FOREIGN KEY ([pendamping_staf_id]) REFERENCES dbo.[Staf] ([staf_id]);
ALTER TABLE dbo.[Set_Instrumen] ADD CONSTRAINT [FK_Set_Instrumen_unit_id] FOREIGN KEY ([unit_id]) REFERENCES dbo.[Unit_Pelayanan] ([unit_id]);
ALTER TABLE dbo.[Siklus_Sterilisasi] ADD CONSTRAINT [FK_Siklus_Sterilisasi_set_id] FOREIGN KEY ([set_id]) REFERENCES dbo.[Set_Instrumen] ([set_id]);
ALTER TABLE dbo.[Siklus_Sterilisasi] ADD CONSTRAINT [FK_Siklus_Sterilisasi_aset_id] FOREIGN KEY ([aset_id]) REFERENCES dbo.[Aset] ([aset_id]);
ALTER TABLE dbo.[Siklus_Sterilisasi] ADD CONSTRAINT [FK_Siklus_Sterilisasi_staf_id] FOREIGN KEY ([staf_id]) REFERENCES dbo.[Staf] ([staf_id]);
ALTER TABLE dbo.[Transaksi_Laundry] ADD CONSTRAINT [FK_Transaksi_Laundry_unit_id] FOREIGN KEY ([unit_id]) REFERENCES dbo.[Unit_Pelayanan] ([unit_id]);
ALTER TABLE dbo.[Transaksi_Laundry] ADD CONSTRAINT [FK_Transaksi_Laundry_staf_id] FOREIGN KEY ([staf_id]) REFERENCES dbo.[Staf] ([staf_id]);
ALTER TABLE dbo.[Limbah] ADD CONSTRAINT [FK_Limbah_unit_id] FOREIGN KEY ([unit_id]) REFERENCES dbo.[Unit_Pelayanan] ([unit_id]);
ALTER TABLE dbo.[Limbah] ADD CONSTRAINT [FK_Limbah_staf_id] FOREIGN KEY ([staf_id]) REFERENCES dbo.[Staf] ([staf_id]);
ALTER TABLE dbo.[Pemulasaran_Jenazah] ADD CONSTRAINT [FK_Pemulasaran_Jenazah_pasien_id] FOREIGN KEY ([pasien_id]) REFERENCES dbo.[Pasien] ([pasien_id]);
ALTER TABLE dbo.[Pemulasaran_Jenazah] ADD CONSTRAINT [FK_Pemulasaran_Jenazah_kunjungan_id] FOREIGN KEY ([kunjungan_id]) REFERENCES dbo.[Kunjungan] ([kunjungan_id]);
ALTER TABLE dbo.[Pemulasaran_Jenazah] ADD CONSTRAINT [FK_Pemulasaran_Jenazah_ruangan_id] FOREIGN KEY ([ruangan_id]) REFERENCES dbo.[Ruangan] ([ruangan_id]);
ALTER TABLE dbo.[Pemulasaran_Jenazah] ADD CONSTRAINT [FK_Pemulasaran_Jenazah_staf_id] FOREIGN KEY ([staf_id]) REFERENCES dbo.[Staf] ([staf_id]);
ALTER TABLE dbo.[Aset] ADD CONSTRAINT [FK_Aset_ruangan_id] FOREIGN KEY ([ruangan_id]) REFERENCES dbo.[Ruangan] ([ruangan_id]);
ALTER TABLE dbo.[Pemeliharaan_Aset] ADD CONSTRAINT [FK_Pemeliharaan_Aset_aset_id] FOREIGN KEY ([aset_id]) REFERENCES dbo.[Aset] ([aset_id]);
ALTER TABLE dbo.[Pemeliharaan_Aset] ADD CONSTRAINT [FK_Pemeliharaan_Aset_teknisi_staf_id] FOREIGN KEY ([teknisi_staf_id]) REFERENCES dbo.[Staf] ([staf_id]);
ALTER TABLE dbo.[Tagihan] ADD CONSTRAINT [FK_Tagihan_kunjungan_id] FOREIGN KEY ([kunjungan_id]) REFERENCES dbo.[Kunjungan] ([kunjungan_id]);
ALTER TABLE dbo.[Tagihan_Rincian] ADD CONSTRAINT [FK_Tagihan_Rincian_tagihan_id] FOREIGN KEY ([tagihan_id]) REFERENCES dbo.[Tagihan] ([tagihan_id]);
ALTER TABLE dbo.[Tagihan_Rincian] ADD CONSTRAINT [FK_Tagihan_Rincian_obat_id] FOREIGN KEY ([obat_id]) REFERENCES dbo.[Obat] ([obat_id]);
ALTER TABLE dbo.[Tagihan_Rincian] ADD CONSTRAINT [FK_Tagihan_Rincian_layanan_id] FOREIGN KEY ([layanan_id]) REFERENCES dbo.[Layanan_Medis] ([layanan_id]);
ALTER TABLE dbo.[Tagihan_Rincian] ADD CONSTRAINT [FK_Tagihan_Rincian_paket_id] FOREIGN KEY ([paket_id]) REFERENCES dbo.[Paket_Layanan] ([paket_id]);
ALTER TABLE dbo.[Pembayaran] ADD CONSTRAINT [FK_Pembayaran_tagihan_id] FOREIGN KEY ([tagihan_id]) REFERENCES dbo.[Tagihan] ([tagihan_id]);
ALTER TABLE dbo.[Pembayaran] ADD CONSTRAINT [FK_Pembayaran_penjamin_id] FOREIGN KEY ([penjamin_id]) REFERENCES dbo.[Penjamin] ([penjamin_id]);
ALTER TABLE dbo.[Pembayaran] ADD CONSTRAINT [FK_Pembayaran_kasir_staf_id] FOREIGN KEY ([kasir_staf_id]) REFERENCES dbo.[Staf] ([staf_id]);
ALTER TABLE dbo.[Klaim_Penjamin] ADD CONSTRAINT [FK_Klaim_Penjamin_tagihan_id] FOREIGN KEY ([tagihan_id]) REFERENCES dbo.[Tagihan] ([tagihan_id]);
ALTER TABLE dbo.[Klaim_Penjamin] ADD CONSTRAINT [FK_Klaim_Penjamin_penjamin_id] FOREIGN KEY ([penjamin_id]) REFERENCES dbo.[Penjamin] ([penjamin_id]);
ALTER TABLE dbo.[Notifikasi_Log] ADD CONSTRAINT [FK_Notifikasi_Log_reservasi_id] FOREIGN KEY ([reservasi_id]) REFERENCES dbo.[Reservasi] ([reservasi_id]);
ALTER TABLE dbo.[Audit_Log] ADD CONSTRAINT [FK_Audit_Log_akun_id] FOREIGN KEY ([akun_id]) REFERENCES dbo.[Akun_Pengguna] ([akun_id]);
ALTER TABLE dbo.[Laporan_Insiden] ADD CONSTRAINT [FK_Laporan_Insiden_kunjungan_id] FOREIGN KEY ([kunjungan_id]) REFERENCES dbo.[Kunjungan] ([kunjungan_id]);
ALTER TABLE dbo.[Laporan_Insiden] ADD CONSTRAINT [FK_Laporan_Insiden_unit_id] FOREIGN KEY ([unit_id]) REFERENCES dbo.[Unit_Pelayanan] ([unit_id]);
ALTER TABLE dbo.[Laporan_Insiden] ADD CONSTRAINT [FK_Laporan_Insiden_pelapor_staf_id] FOREIGN KEY ([pelapor_staf_id]) REFERENCES dbo.[Staf] ([staf_id]);
GO

-- ===== CHECK constraints =====
ALTER TABLE dbo.[Tempat_Tidur] ADD CONSTRAINT [CK_Tempat_Tidur_status] CHECK (status IN ('KOSONG','TERISI','PEMBERSIHAN'));
ALTER TABLE dbo.[Staf] ADD CONSTRAINT [CK_Staf_email] CHECK (email IS NULL OR email LIKE '_%@_%._%');
ALTER TABLE dbo.[Peran] ADD CONSTRAINT [CK_Peran_kode] CHECK (kode IN ('SUPERADMIN','ADMIN_LOKAL','DOKTER','STAFF','PASIEN'));
ALTER TABLE dbo.[Akun_Pengguna] ADD CONSTRAINT [CK_Akun_Pengguna_pemilik] CHECK ((CASE WHEN staf_id IS NULL THEN 0 ELSE 1 END) + (CASE WHEN pasien_id IS NULL THEN 0 ELSE 1 END) = 1);
ALTER TABLE dbo.[Akun_Pengguna] ADD CONSTRAINT [CK_Akun_Pengguna_sub_peran] CHECK (sub_peran IS NULL OR sub_peran IN ('PERAWAT','RESEPSIONIS'));
ALTER TABLE dbo.[Pasien] ADD CONSTRAINT [CK_Pasien_1] CHECK (LEN(nik) = 16);
ALTER TABLE dbo.[Pasien] ADD CONSTRAINT [CK_Pasien_email] CHECK (email IS NULL OR email LIKE '_%@_%._%');
ALTER TABLE dbo.[Penjamin] ADD CONSTRAINT [CK_Penjamin_jenis] CHECK (jenis IN ('MANDIRI','BPJS','ASURANSI'));
ALTER TABLE dbo.[Jadwal_Praktik] ADD CONSTRAINT [CK_Jadwal_Praktik_1] CHECK (kuota_maks > 0);
ALTER TABLE dbo.[Reservasi] ADD CONSTRAINT [CK_Reservasi_status] CHECK (status IN ('MENUNGGU','DIPANGGIL','SELESAI','DIBATALKAN'));
ALTER TABLE dbo.[Reservasi] ADD CONSTRAINT [CK_Reservasi_metode] CHECK (metode_daftar IN ('ONLINE','MANUAL_ADMIN'));
ALTER TABLE dbo.[Kunjungan] ADD CONSTRAINT [CK_Kunjungan_jenis] CHECK (jenis_kunjungan IN ('RAWAT_JALAN','IGD','RAWAT_INAP','PERSALINAN','KONTROL'));
ALTER TABLE dbo.[Alergi_Kondisi] ADD CONSTRAINT [CK_Alergi_kategori] CHECK (kategori IN ('ALERGI_OBAT','KEHAMILAN_RISTI','PENYAKIT_BAWAAN'));
ALTER TABLE dbo.[Harga_Layanan] ADD CONSTRAINT [CK_Harga_Layanan_1] CHECK (harga > 0);
ALTER TABLE dbo.[Harga_Paket] ADD CONSTRAINT [CK_Harga_Paket_1] CHECK (harga > 0);
ALTER TABLE dbo.[Obat] ADD CONSTRAINT [CK_Obat_kategori] CHECK (kategori IN ('OBAT','ALKES','PRODUK_KESEHATAN'));
ALTER TABLE dbo.[Stok_Batch] ADD CONSTRAINT [CK_Stok_Batch_1] CHECK (jumlah >= 0);
ALTER TABLE dbo.[Mutasi_Stok] ADD CONSTRAINT [CK_Mutasi_jenis] CHECK (jenis IN ('MASUK','PAKAI','KOREKSI','KEDALUWARSA','TRANSFER'));
ALTER TABLE dbo.[Harga_Obat] ADD CONSTRAINT [CK_Harga_Obat_1] CHECK (harga_jual > 0);
ALTER TABLE dbo.[Tagihan] ADD CONSTRAINT [CK_Tagihan_1] CHECK (total_dibayar <= total_tagihan);
ALTER TABLE dbo.[Tagihan] ADD CONSTRAINT [CK_Tagihan_status] CHECK (status IN ('BELUM_LUNAS','LUNAS'));
ALTER TABLE dbo.[Tagihan_Rincian] ADD CONSTRAINT [CK_Tagihan_Rincian_1] CHECK (qty > 0);
ALTER TABLE dbo.[Tagihan_Rincian] ADD CONSTRAINT [CK_Tagihan_Rincian_2] CHECK ((CASE WHEN obat_id IS NULL THEN 0 ELSE 1 END + CASE WHEN layanan_id IS NULL THEN 0 ELSE 1 END + CASE WHEN paket_id IS NULL THEN 0 ELSE 1 END) = 1);
ALTER TABLE dbo.[Pembayaran] ADD CONSTRAINT [CK_Pembayaran_1] CHECK (jumlah > 0);
ALTER TABLE dbo.[Pembayaran] ADD CONSTRAINT [CK_Pembayaran_metode] CHECK (metode IN ('TUNAI','TRANSFER','QRIS','KARTU'));
ALTER TABLE dbo.[Pembayaran] ADD CONSTRAINT [CK_Pembayaran_jenis] CHECK (jenis IN ('PELUNASAN','UANG_MUKA','CICILAN'));
ALTER TABLE dbo.[Notifikasi_Log] ADD CONSTRAINT [CK_Notifikasi_status] CHECK (status IN ('ANTRE','TERKIRIM','GAGAL'));
ALTER TABLE dbo.[Konten_Publik] ADD CONSTRAINT [CK_Konten_tipe] CHECK (tipe IN ('PROFIL','LAYANAN','KONTAK','GALERI','TESTIMONI'));
GO

-- ===== Indexes =====
CREATE UNIQUE INDEX [UX_Staf_email] ON dbo.[Staf] (email) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX [UX_Akun_Pengguna_staf_id] ON dbo.[Akun_Pengguna] (staf_id) WHERE staf_id IS NOT NULL;
CREATE UNIQUE INDEX [UX_Akun_Pengguna_pasien_id] ON dbo.[Akun_Pengguna] (pasien_id) WHERE pasien_id IS NOT NULL;
CREATE INDEX [IX_Pasien_nama] ON dbo.[Pasien] (nama);
CREATE UNIQUE INDEX [UX_Reservasi_antrean_per_jadwal] ON dbo.[Reservasi] (jadwal_id, nomor_antrean) WHERE status <> 'DIBATALKAN';
CREATE INDEX [IX_Reservasi_jadwal_status] ON dbo.[Reservasi] (jadwal_id, status);
CREATE UNIQUE INDEX [UX_Kunjungan_reservasi_id] ON dbo.[Kunjungan] (reservasi_id) WHERE reservasi_id IS NOT NULL;
CREATE INDEX [IX_Kunjungan_pasien_tgl] ON dbo.[Kunjungan] (pasien_id, tgl_masuk);
CREATE UNIQUE INDEX [UX_Diagnosa_kode_icd] ON dbo.[Diagnosa] (kode_icd) WHERE kode_icd IS NOT NULL;
CREATE UNIQUE INDEX [UX_Ambulans_aset_id] ON dbo.[Ambulans] (aset_id) WHERE aset_id IS NOT NULL;
CREATE INDEX [IX_Audit_waktu] ON dbo.[Audit_Log] (waktu);
GO
