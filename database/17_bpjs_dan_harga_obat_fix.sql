-- =====================================================================
-- 17_bpjs_dan_harga_obat_fix.sql
-- 1. Pastikan constraint CK_Pembayaran_metode pada dbo.[Pembayaran]
--    mengizinkan metode 'BPJS' di seluruh environment SQL Server.
-- 2. Pastikan master dbo.[Penjamin] memiliki entri aktif 'BPJS Kesehatan'
--    dan 'Mandiri' untuk pencatatan klaim penuh BPJS maupun pembayaran umum.
-- =====================================================================
USE MiniWorldRS;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- 1. Perbarui CK_Pembayaran_metode bila masih menggunakan definisi lama tanpa 'BPJS'
IF EXISTS (
    SELECT 1
      FROM sys.check_constraints
     WHERE parent_object_id = OBJECT_ID('dbo.Pembayaran')
       AND name = 'CK_Pembayaran_metode'
)
BEGIN
    ALTER TABLE dbo.[Pembayaran] DROP CONSTRAINT [CK_Pembayaran_metode];
END
GO

IF NOT EXISTS (
    SELECT 1
      FROM sys.check_constraints
     WHERE parent_object_id = OBJECT_ID('dbo.Pembayaran')
       AND name = 'CK_Pembayaran_metode'
)
BEGIN
    ALTER TABLE dbo.[Pembayaran]
      ADD CONSTRAINT [CK_Pembayaran_metode]
      CHECK ([metode] IN ('TUNAI', 'TRANSFER', 'QRIS', 'KARTU', 'BPJS'));
END
GO

-- 2. Pastikan penjamin BPJS Kesehatan & Mandiri tersedia dan aktif
IF NOT EXISTS (SELECT 1 FROM dbo.[Penjamin] WHERE jenis = 'BPJS')
BEGIN
    INSERT INTO dbo.[Penjamin] ([penjamin_id], [nama], [jenis], [no_kontrak], [kontak], [aktif])
    VALUES (NEWID(), N'BPJS Kesehatan', 'BPJS', '-', '-', 1);
END
ELSE
BEGIN
    UPDATE dbo.[Penjamin] SET [aktif] = 1 WHERE [jenis] = 'BPJS' AND [aktif] = 0;
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.[Penjamin] WHERE jenis = 'MANDIRI')
BEGIN
    INSERT INTO dbo.[Penjamin] ([penjamin_id], [nama], [jenis], [no_kontrak], [kontak], [aktif])
    VALUES (NEWID(), N'Mandiri', 'MANDIRI', '-', '-', 1);
END
GO
