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

-- 1. Pastikan kolom-kolom ekstensi pada Akun_Pengguna tersedia
IF COL_LENGTH('dbo.Akun_Pengguna', 'pasien_id') IS NULL
BEGIN
    ALTER TABLE dbo.[Akun_Pengguna] ADD [pasien_id] UNIQUEIDENTIFIER NULL;
END
GO

IF COL_LENGTH('dbo.Akun_Pengguna', 'email') IS NULL
BEGIN
    ALTER TABLE dbo.[Akun_Pengguna] ADD [email] VARCHAR(254) NULL;
END
GO

IF COL_LENGTH('dbo.Pasien', 'email') IS NULL
BEGIN
    ALTER TABLE dbo.[Pasien] ADD [email] VARCHAR(254) NULL;
END
GO

IF COL_LENGTH('dbo.Staf', 'email') IS NULL
BEGIN
    ALTER TABLE dbo.[Staf] ADD [email] VARCHAR(254) NULL;
END
GO

IF COL_LENGTH('dbo.Akun_Pengguna', 'sub_peran') IS NULL
BEGIN
    ALTER TABLE dbo.[Akun_Pengguna] ADD [sub_peran] VARCHAR(20) NULL;
END
GO

IF COL_LENGTH('dbo.Audit_Log', 'user_ref') IS NULL
BEGIN
    ALTER TABLE dbo.[Audit_Log] ADD [user_ref] NVARCHAR(50) NULL;
END
GO

IF COL_LENGTH('dbo.Audit_Log', 'keterangan') IS NULL
BEGIN
    ALTER TABLE dbo.[Audit_Log] ADD [keterangan] NVARCHAR(200) NULL;
END
GO

-- Jadikan staf_id nullable agar akun pasien dapat dibuat
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Akun_Pengguna') AND name = 'staf_id' AND is_nullable = 0)
    ALTER TABLE dbo.[Akun_Pengguna] ALTER COLUMN [staf_id] UNIQUEIDENTIFIER NULL;
GO

-- Drop constraint unik kaku pada staf_id jika ada
DECLARE @con_name NVARCHAR(128);
SELECT @con_name = name FROM sys.key_constraints WHERE parent_object_id = OBJECT_ID('dbo.Akun_Pengguna') AND type = 'UQ' AND name LIKE '%staf%';
IF @con_name IS NOT NULL
BEGIN
    EXEC('ALTER TABLE dbo.[Akun_Pengguna] DROP CONSTRAINT [' + @con_name + ']');
END
GO

-- 2. Pastikan peran RBAC standar tersedia
IF NOT EXISTS (SELECT 1 FROM dbo.[Peran] WHERE kode = 'SUPERADMIN')
    INSERT INTO dbo.[Peran] (peran_id, kode, nama) VALUES (NEWID(), 'SUPERADMIN', 'Superadmin');

IF NOT EXISTS (SELECT 1 FROM dbo.[Peran] WHERE kode = 'ADMIN_LOKAL')
    INSERT INTO dbo.[Peran] (peran_id, kode, nama) VALUES (NEWID(), 'ADMIN_LOKAL', 'Admin Lokal');

IF NOT EXISTS (SELECT 1 FROM dbo.[Peran] WHERE kode = 'DOKTER')
    INSERT INTO dbo.[Peran] (peran_id, kode, nama) VALUES (NEWID(), 'DOKTER', 'Bidan Praktik Mandiri');
ELSE
    UPDATE dbo.[Peran] SET nama = 'Bidan Praktik Mandiri' WHERE kode = 'DOKTER';

IF NOT EXISTS (SELECT 1 FROM dbo.[Peran] WHERE kode = 'STAFF')
    INSERT INTO dbo.[Peran] (peran_id, kode, nama) VALUES (NEWID(), 'STAFF', 'Staf');

IF NOT EXISTS (SELECT 1 FROM dbo.[Peran] WHERE kode = 'PASIEN')
    INSERT INTO dbo.[Peran] (peran_id, kode, nama) VALUES (NEWID(), 'PASIEN', 'Pasien');
GO

-- 3. Sinkronkan akun staf & pastikan password bcrypt valid (password: 'password123')
DECLARE @peran_super UNIQUEIDENTIFIER = (SELECT TOP 1 peran_id FROM dbo.[Peran] WHERE kode = 'SUPERADMIN');
DECLARE @peran_admin UNIQUEIDENTIFIER = (SELECT TOP 1 peran_id FROM dbo.[Peran] WHERE kode = 'ADMIN_LOKAL');
DECLARE @peran_dokter UNIQUEIDENTIFIER = (SELECT TOP 1 peran_id FROM dbo.[Peran] WHERE kode = 'DOKTER');
DECLARE @peran_pasien UNIQUEIDENTIFIER = (SELECT TOP 1 peran_id FROM dbo.[Peran] WHERE kode = 'PASIEN');

-- Hash untuk 'password123' (bcrypt)
DECLARE @hash_pw VARCHAR(100) = '$2b$10$mS3UyJqS2cChIr.tdu4tTu1kDYz9PGc6ur9REIJb4qqwNF2XBTluy';

-- Update password dummy yang lama dengan hash password123 yang valid
UPDATE dbo.[Akun_Pengguna]
   SET password_hash = @hash_pw,
       percobaan_gagal = 0,
       terkunci_sampai = NULL
 WHERE username IN ('superadmin', 'admin', 'bidan', 'sitiaminah', 'apoteker1')
    OR password_hash = 'HASH-DUMMY';

-- Map akun staf yang sudah ada ke kode peran RBAC aplikasi & sediakan username standar
IF EXISTS (SELECT 1 FROM dbo.[Akun_Pengguna] WHERE username = 'admin_sistem1')
    UPDATE dbo.[Akun_Pengguna] SET username = 'superadmin', peran_id = @peran_super WHERE username = 'admin_sistem1';

IF EXISTS (SELECT 1 FROM dbo.[Akun_Pengguna] WHERE username = 'bidan1')
    UPDATE dbo.[Akun_Pengguna] SET username = 'bidan', peran_id = @peran_dokter WHERE username = 'bidan1';

IF EXISTS (SELECT 1 FROM dbo.[Akun_Pengguna] WHERE username = 'admin_ops1')
    UPDATE dbo.[Akun_Pengguna] SET username = 'admin', peran_id = @peran_admin WHERE username = 'admin_ops1';

-- 4. Seed akun pengguna demo pasien (Siti Aminah: sitiaminah / password123)
DECLARE @pasien_siti UNIQUEIDENTIFIER = (SELECT TOP 1 pasien_id FROM dbo.[Pasien] WHERE nik IN ('1571010101010001', '3372010101900001') OR nama LIKE '%Siti Aminah%');

IF @peran_pasien IS NOT NULL AND @pasien_siti IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM dbo.[Akun_Pengguna] WHERE username = 'sitiaminah' OR pasien_id = @pasien_siti)
    BEGIN
        INSERT INTO dbo.[Akun_Pengguna]
            (akun_id, staf_id, peran_id, username, password_hash, aktif, percobaan_gagal, pasien_id, email)
        VALUES
            (NEWID(), NULL, @peran_pasien, 'sitiaminah', @hash_pw, 1, 0, @pasien_siti, 'siti.aminah@example.com');
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

-- Pastikan ada sampel pembayaran untuk metode TRANSFER dan penjamin BPJS sehingga rekapitulasi lengkap
-- CK_Pembayaran_metode hanya mengizinkan TUNAI/TRANSFER/KARTU/QRIS, jadi sampel BPJS memakai KARTU.
IF @t1 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.[Pembayaran] WHERE metode = 'TRANSFER')
BEGIN
    INSERT INTO dbo.[Pembayaran] (pembayaran_id, tagihan_id, penjamin_id, kasir_staf_id, jumlah, metode, jenis, waktu_bayar)
    VALUES (NEWID(), @t1, @penjamin_mandiri, @staf_kasir, 75000, 'TRANSFER', 'CICILAN', SYSDATETIME());
END

IF @t2 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.[Pembayaran] WHERE penjamin_id = @penjamin_bpjs)
BEGIN
    INSERT INTO dbo.[Pembayaran] (pembayaran_id, tagihan_id, penjamin_id, kasir_staf_id, jumlah, metode, jenis, waktu_bayar)
    VALUES (NEWID(), @t2, @penjamin_bpjs, @staf_kasir, 120000, 'KARTU', 'PELUNASAN', SYSDATETIME());
END
GO
