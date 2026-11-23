-- =====================================================================
-- 14_seed_demo_pasien.sql
-- Seed 3 pasien demo + kunjungan + tagihan agar dashboard tidak kosong.
-- Idempotent: dicek berdasarkan NIK. Aman dijalankan berulang.
-- =====================================================================
USE MiniWorldRS;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

DECLARE @unit_kia UNIQUEIDENTIFIER =
  (SELECT TOP 1 unit_id FROM dbo.[Unit_Pelayanan] WHERE kode = 'UNIT_BIDAN' OR nama LIKE '%KIA%' OR nama LIKE '%Kebidanan%');
IF @unit_kia IS NULL
  SET @unit_kia = (SELECT TOP 1 unit_id FROM dbo.[Unit_Pelayanan] WHERE aktif = 1);

DECLARE @staf UNIQUEIDENTIFIER =
  (SELECT TOP 1 staf_id FROM dbo.[Staf] WHERE jabatan LIKE '%Bidan%' OR jabatan LIKE '%Dokter%' OR aktif = 1);

DECLARE @penjamin UNIQUEIDENTIFIER =
  (SELECT TOP 1 penjamin_id FROM dbo.[Penjamin] WHERE jenis = 'MANDIRI' OR nama LIKE '%Mandiri%');
IF @penjamin IS NULL
  SET @penjamin = (SELECT TOP 1 penjamin_id FROM dbo.[Penjamin] WHERE aktif = 1);

DECLARE @penjamin_bpjs UNIQUEIDENTIFIER =
  (SELECT TOP 1 penjamin_id FROM dbo.[Penjamin] WHERE jenis = 'BPJS' OR nama LIKE '%BPJS%');
IF @penjamin_bpjs IS NULL
  SET @penjamin_bpjs = @penjamin;

IF @unit_kia IS NULL OR @staf IS NULL OR @penjamin IS NULL
BEGIN
  RAISERROR('Seed demo gagal: unit KIA, staf, atau penjamin tidak ditemukan.', 16, 1);
  RETURN;
END

-- Pasien 1
IF NOT EXISTS (SELECT 1 FROM dbo.[Pasien] WHERE nik = '1571010101010001')
BEGIN
  DECLARE @p1 UNIQUEIDENTIFIER = NEWID();
  INSERT INTO dbo.[Pasien]
    (pasien_id, no_rm, nik, nama, jenis_kelamin, tgl_lahir, tempat_lahir, alamat,
     no_telepon, gol_darah, status_pernikahan, pekerjaan, email)
  VALUES
    (@p1, RIGHT('000000' + CAST(NEXT VALUE FOR dbo.Seq_NoRM AS VARCHAR(10)), 6),
     '1571010101010001', N'Siti Aminah', 'P', '1995-03-12', N'Jambi',
     N'Jl. Melati No. 1', '081234567001', 'O', 'MENIKAH', N'Ibu Rumah Tangga',
     'siti.aminah@example.com');

  DECLARE @k1 UNIQUEIDENTIFIER = NEWID();
  INSERT INTO dbo.[Kunjungan]
    (kunjungan_id, pasien_id, unit_id, dpjp_staf_id, penjamin_id, jenis_kunjungan, tgl_masuk, status)
  VALUES
    (@k1, @p1, @unit_kia, @staf, @penjamin, 'RAWAT_JALAN',
     CAST(SYSDATETIME() AS DATE), 'SELESAI');

  DECLARE @t1 UNIQUEIDENTIFIER = NEWID();
  INSERT INTO dbo.[Tagihan] (tagihan_id, kunjungan_id, total_tagihan, total_dibayar, status, tgl_terbit)
  VALUES (@t1, @k1, 150000, 150000, 'LUNAS', CAST(SYSDATETIME() AS DATE));

  INSERT INTO dbo.[Pembayaran] (pembayaran_id, tagihan_id, penjamin_id, kasir_staf_id, jumlah, metode, jenis, waktu_bayar)
  VALUES (NEWID(), @t1, @penjamin, @staf, 150000, 'TUNAI', 'PELUNASAN', SYSDATETIME());
END

-- Pasien 2
IF NOT EXISTS (SELECT 1 FROM dbo.[Pasien] WHERE nik = '1571010101010002')
BEGIN
  DECLARE @p2 UNIQUEIDENTIFIER = NEWID();
  INSERT INTO dbo.[Pasien]
    (pasien_id, no_rm, nik, nama, jenis_kelamin, tgl_lahir, tempat_lahir, alamat,
     no_telepon, gol_darah, status_pernikahan, pekerjaan, email)
  VALUES
    (@p2, RIGHT('000000' + CAST(NEXT VALUE FOR dbo.Seq_NoRM AS VARCHAR(10)), 6),
     '1571010101010002', N'Dewi Lestari', 'P', '1992-08-21', N'Jambi',
     N'Jl. Anggrek No. 7', '081234567002', 'A', 'MENIKAH', N'Karyawan Swasta',
     'dewi.lestari@example.com');

  DECLARE @k2 UNIQUEIDENTIFIER = NEWID();
  INSERT INTO dbo.[Kunjungan]
    (kunjungan_id, pasien_id, unit_id, dpjp_staf_id, penjamin_id, jenis_kunjungan, tgl_masuk, status)
  VALUES
    (@k2, @p2, @unit_kia, @staf, @penjamin, 'KONTROL',
     CAST(SYSDATETIME() AS DATE), 'SELESAI');

  DECLARE @t2 UNIQUEIDENTIFIER = NEWID();
  INSERT INTO dbo.[Tagihan] (tagihan_id, kunjungan_id, total_tagihan, total_dibayar, status, tgl_terbit)
  VALUES (@t2, @k2, 200000, 200000, 'LUNAS', CAST(SYSDATETIME() AS DATE));

  INSERT INTO dbo.[Pembayaran] (pembayaran_id, tagihan_id, penjamin_id, kasir_staf_id, jumlah, metode, jenis, waktu_bayar)
  VALUES (NEWID(), @t2, @penjamin, @staf, 200000, 'QRIS', 'PELUNASAN', SYSDATETIME());
END

-- Pasien 3
IF NOT EXISTS (SELECT 1 FROM dbo.[Pasien] WHERE nik = '1571010101010003')
BEGIN
  DECLARE @p3 UNIQUEIDENTIFIER = NEWID();
  INSERT INTO dbo.[Pasien]
    (pasien_id, no_rm, nik, nama, jenis_kelamin, tgl_lahir, tempat_lahir, alamat,
     no_telepon, gol_darah, status_pernikahan, pekerjaan, email)
  VALUES
    (@p3, RIGHT('000000' + CAST(NEXT VALUE FOR dbo.Seq_NoRM AS VARCHAR(10)), 6),
     '1571010101010003', N'Rina Wulandari', 'P', '1998-11-05', N'Jambi',
     N'Jl. Kenanga No. 12', '081234567003', 'B', 'BELUM_MENIKAH', N'Mahasiswa',
     'rina.wulandari@example.com');

  DECLARE @k3 UNIQUEIDENTIFIER = NEWID();
  INSERT INTO dbo.[Kunjungan]
    (kunjungan_id, pasien_id, unit_id, dpjp_staf_id, penjamin_id, jenis_kunjungan, tgl_masuk, status)
  VALUES
    (@k3, @p3, @unit_kia, @staf, @penjamin_bpjs, 'RAWAT_JALAN',
     CAST(SYSDATETIME() AS DATE), 'SELESAI');

  DECLARE @t3 UNIQUEIDENTIFIER = NEWID();
  INSERT INTO dbo.[Tagihan] (tagihan_id, kunjungan_id, total_tagihan, total_dibayar, status, tgl_terbit)
  VALUES (@t3, @k3, 175000, 0, 'BELUM_LUNAS', CAST(SYSDATETIME() AS DATE));
END
GO
