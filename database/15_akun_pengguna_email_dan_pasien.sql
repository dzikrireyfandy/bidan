-- =====================================================================
-- 15_akun_pengguna_email_dan_pasien.sql
-- Tambah kolom email pada Akun_Pengguna jika belum ada, serta
-- pastikan peran PASIEN terdaftar dan seed akun & data klinis pasien demo.
-- =====================================================================
USE MiniWorldRS;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF COL_LENGTH('dbo.Akun_Pengguna', 'email') IS NULL
BEGIN
    ALTER TABLE dbo.[Akun_Pengguna] ADD [email] VARCHAR(254) NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.[Peran] WHERE kode = 'PASIEN')
BEGIN
    INSERT INTO dbo.[Peran] (peran_id, kode, nama)
    VALUES (NEWID(), 'PASIEN', 'Pasien');
END
GO

-- Seed akun pengguna untuk demo pasien (Siti Aminah: sitiaminah / password123)
DECLARE @peran_pasien UNIQUEIDENTIFIER = (SELECT TOP 1 peran_id FROM dbo.[Peran] WHERE kode = 'PASIEN');
DECLARE @pasien_siti UNIQUEIDENTIFIER = (SELECT TOP 1 pasien_id FROM dbo.[Pasien] WHERE nik = '1571010101010001');

-- Hash untuk 'password123' (bcrypt)
DECLARE @hash_pw VARCHAR(100) = '$2a$10$w0M89y4fO6N0HwA9rT8nSeYh5fFjC3L4sR.5Dk2M8tI9hN6rE4B9u';

IF @peran_pasien IS NOT NULL AND @pasien_siti IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM dbo.[Akun_Pengguna] WHERE username = 'sitiaminah' OR pasien_id = @pasien_siti)
    BEGIN
        INSERT INTO dbo.[Akun_Pengguna]
            (akun_id, peran_id, username, password_hash, aktif, percobaan_gagal, pasien_id, email)
        VALUES
            (NEWID(), @peran_pasien, 'sitiaminah', @hash_pw, 1, 0, @pasien_siti, 'siti.aminah@example.com');
    END
END
GO

-- Pastikan ada data Tagihan_Rincian untuk rincian arus pendapatan per pos layanan
DECLARE @t1 UNIQUEIDENTIFIER = (SELECT TOP 1 tagihan_id FROM dbo.[Tagihan] WHERE total_tagihan = 150000);
DECLARE @t2 UNIQUEIDENTIFIER = (SELECT TOP 1 tagihan_id FROM dbo.[Tagihan] WHERE total_tagihan = 200000);
DECLARE @t3 UNIQUEIDENTIFIER = (SELECT TOP 1 tagihan_id FROM dbo.[Tagihan] WHERE total_tagihan = 175000);
DECLARE @layanan_anc UNIQUEIDENTIFIER = (SELECT TOP 1 layanan_id FROM dbo.[Layanan_Medis] WHERE nama LIKE '%ANC%' OR nama LIKE '%Kehamilan%');
DECLARE @layanan_kb UNIQUEIDENTIFIER = (SELECT TOP 1 layanan_id FROM dbo.[Layanan_Medis] WHERE nama LIKE '%KB%' OR nama LIKE '%Kontrasepsi%');
DECLARE @layanan_umum UNIQUEIDENTIFIER = (SELECT TOP 1 layanan_id FROM dbo.[Layanan_Medis] WHERE nama LIKE '%Umum%');
DECLARE @staf_kasir UNIQUEIDENTIFIER = (SELECT TOP 1 staf_id FROM dbo.[Staf]);
DECLARE @penjamin_bpjs UNIQUEIDENTIFIER = (SELECT TOP 1 penjamin_id FROM dbo.[Penjamin] WHERE jenis = 'BPJS');
DECLARE @penjamin_mandiri UNIQUEIDENTIFIER = (SELECT TOP 1 penjamin_id FROM dbo.[Penjamin] WHERE jenis = 'MANDIRI');

IF @layanan_anc IS NULL
  SET @layanan_anc = (SELECT TOP 1 layanan_id FROM dbo.[Layanan_Medis]);

IF @t1 IS NOT NULL AND @layanan_anc IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM dbo.[Tagihan_Rincian] WHERE tagihan_id = @t1)
    BEGIN
        INSERT INTO dbo.[Tagihan_Rincian] (rincian_id, tagihan_id, layanan_id, qty, harga_satuan, subtotal)
        VALUES (NEWID(), @t1, @layanan_anc, 1, 150000, 150000);
    END
END

IF @t2 IS NOT NULL AND @layanan_kb IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM dbo.[Tagihan_Rincian] WHERE tagihan_id = @t2)
    BEGIN
        INSERT INTO dbo.[Tagihan_Rincian] (rincian_id, tagihan_id, layanan_id, qty, harga_satuan, subtotal)
        VALUES (NEWID(), @t2, @layanan_kb, 1, 200000, 200000);
    END
END

IF @t3 IS NOT NULL AND @layanan_umum IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM dbo.[Tagihan_Rincian] WHERE tagihan_id = @t3)
    BEGIN
        INSERT INTO dbo.[Tagihan_Rincian] (rincian_id, tagihan_id, layanan_id, qty, harga_satuan, subtotal)
        VALUES (NEWID(), @t3, @layanan_umum, 1, 175000, 175000);
    END
END

-- Pastikan ada sampel pembayaran untuk metode TRANSFER dan BPJS sehingga rekapitulasi lengkap
IF @t1 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.[Pembayaran] WHERE metode = 'TRANSFER')
BEGIN
    INSERT INTO dbo.[Pembayaran] (pembayaran_id, tagihan_id, penjamin_id, kasir_staf_id, jumlah, metode, jenis, waktu_bayar)
    VALUES (NEWID(), @t1, @penjamin_mandiri, @staf_kasir, 75000, 'TRANSFER', 'CICILAN', SYSDATETIME());
END

IF @t2 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.[Pembayaran] WHERE metode = 'BPJS')
BEGIN
    INSERT INTO dbo.[Pembayaran] (pembayaran_id, tagihan_id, penjamin_id, kasir_staf_id, jumlah, metode, jenis, waktu_bayar)
    VALUES (NEWID(), @t2, @penjamin_bpjs, @staf_kasir, 120000, 'BPJS', 'PELUNASAN', SYSDATETIME());
END
GO
