-- =====================================================================
-- 04_ddl_ekstensi_bidan_v3.sql
-- Ekstensi KIA: 2 tabel asuhan bayi baru lahir (total 97 tabel).
-- (Kolom v3 lain -- email, pasien_id, sub_peran, catatan_pulang, CHECK
--  peran 5 role -- sudah final di 03, lihat catatan generate_ddl.py)
-- =====================================================================
USE MiniWorldRS;
GO

-- No. 45: Asuhan_BBL
CREATE TABLE dbo.[Asuhan_BBL] (
    [asuhan_bbl_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [bayi_id] UNIQUEIDENTIFIER NOT NULL,
    [staf_id] UNIQUEIDENTIFIER NOT NULL,
    [imd] BIT NOT NULL DEFAULT 0,
    [vit_k1] BIT NOT NULL DEFAULT 0,
    [salep_mata] BIT NOT NULL DEFAULT 0,
    [hb0] BIT NOT NULL DEFAULT 0,
    [keadaan_umum] VARCHAR(20) NOT NULL,
    [catatan] NVARCHAR(500) NULL,
    [dicatat_pada] DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT [UQ_Asuhan_BBL_bayi_id] UNIQUE ([bayi_id])
);
GO
-- No. 46: Pemeriksaan_Bayi
CREATE TABLE dbo.[Pemeriksaan_Bayi] (
    [pemeriksaan_bayi_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [bayi_id] UNIQUEIDENTIFIER NOT NULL,
    [kunjungan_id] UNIQUEIDENTIFIER NOT NULL,
    [staf_id] UNIQUEIDENTIFIER NOT NULL,
    [jenis] VARCHAR(20) NOT NULL,
    [tgl_pemeriksaan] DATE NOT NULL,
    [berat_gram] INT NOT NULL,
    [panjang_cm] DECIMAL(4,1) NOT NULL,
    [lingkar_kepala_cm] DECIMAL(4,1) NULL,
    [suhu_c] DECIMAL(3,1) NULL,
    [kondisi_tali_pusat] VARCHAR(20) NULL,
    [menyusu] VARCHAR(20) NULL,
    [ikterus] BIT NOT NULL DEFAULT 0,
    [tanda_bahaya] BIT NOT NULL DEFAULT 0,
    [tgl_kontrol_berikutnya] DATE NULL,
    [catatan] NVARCHAR(500) NULL,
    [created_at] DATETIME2 NOT NULL DEFAULT SYSDATETIME()
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
ALTER TABLE dbo.[Asuhan_BBL] ADD CONSTRAINT [CK_Asuhan_BBL_keadaan] CHECK (keadaan_umum IN ('BAIK','PERLU_PEMANTAUAN','RUJUK'));
ALTER TABLE dbo.[Pemeriksaan_Bayi] ADD CONSTRAINT [CK_Pemeriksaan_Bayi_jenis] CHECK (jenis IN ('KN1','KN2','KN3','TUMBUH_KEMBANG'));
ALTER TABLE dbo.[Pemeriksaan_Bayi] ADD CONSTRAINT [CK_Pemeriksaan_Bayi_berat] CHECK (berat_gram > 0);
ALTER TABLE dbo.[Pemeriksaan_Bayi] ADD CONSTRAINT [CK_Pemeriksaan_Bayi_tali_pusat] CHECK (kondisi_tali_pusat IS NULL OR kondisi_tali_pusat IN ('KERING','BASAH','INFEKSI'));
ALTER TABLE dbo.[Pemeriksaan_Bayi] ADD CONSTRAINT [CK_Pemeriksaan_Bayi_menyusu] CHECK (menyusu IS NULL OR menyusu IN ('ASI_EKSKLUSIF','CAMPURAN','FORMULA'));
GO

-- ===== Indexes =====
CREATE UNIQUE INDEX [UX_Pemeriksaan_Bayi_KN] ON dbo.[Pemeriksaan_Bayi] (bayi_id, jenis) WHERE jenis IN ('KN1','KN2','KN3');
CREATE INDEX [IX_Pemeriksaan_Bayi_bayi_tgl] ON dbo.[Pemeriksaan_Bayi] (bayi_id, tgl_pemeriksaan);
GO
