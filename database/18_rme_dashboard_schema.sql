-- =============================================================================
-- 18_rme_dashboard_schema.sql
-- Migrasi Idempotent: Master Diagnosa Kebidanan, Sinkronisasi Batch Stok Awal,
-- serta Indeks Performa Dashboard & Laporan Read-Only (Tanpa Mengubah DDL Dasar)
-- =============================================================================

SET NOCOUNT ON;

-- 1. Seed Idempotent Master Diagnosa Kebidanan (ICD-10, >= 15 Diagnosis Standar PMB)
DECLARE @DiagnosaSeed TABLE (
    kode_icd VARCHAR(30) NOT NULL,
    nama NVARCHAR(100) NOT NULL
);

INSERT INTO @DiagnosaSeed (kode_icd, nama) VALUES
('Z34.0', N'Pengawasan Kehamilan Normal Pertama (ANC K1)'),
('Z34.8', N'Pengawasan Kehamilan Normal Rutin (ANC Terpadu)'),
('O80',   N'Persalinan Tunggal Spontan Normal'),
('Z39.1', N'Asuhan & Konseling Ibu Menyusui (Laktasi)'),
('Z39.2', N'Pemeriksaan Rutin Pascapersalinan (Nifas KF)'),
('Z30.0', N'Konseling & Nasehat Umum Kontrasepsi (KB)'),
('Z30.4', N'Pengawasan Kontrasepsi Suntik / Pil Rutin'),
('Z30.5', N'Pengawasan Alat Kontrasepsi Dalam Rahim (IUD/Implan)'),
('Z00.1', N'Pemeriksaan Kesehatan & Tumbuh Kembang Bayi/Anak'),
('Z23',   N'Pelayanan Imunisasi Dasar Bayi'),
('O21.0', N'Hiperemesis Gravidarum Ringan'),
('O13',   N'Hipertensi Gestasional Tanpa Proteinuria'),
('O20.0', N'Ancaman Abortus / Perdarahan Awal Kehamilan'),
('D50.9', N'Anemia Defisiensi Besi pada Ibu Hamil'),
('P07.3', N'Pemantauan Bayi Berat Lahir Rendah / Prematur Ringan'),
('N76.0', N'Vaginitis Akut / Keputihan pada Masa Reproduksi');

INSERT INTO dbo.[Diagnosa] (diagnosa_id, kode_icd, nama)
SELECT NEWID(), s.kode_icd, s.nama
FROM @DiagnosaSeed s
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.[Diagnosa] d WHERE d.kode_icd = s.kode_icd
);
GO

-- 2. Pastikan minimal ada 1 Gudang aktif untuk pencatatan Stok_Batch & Mutasi_Stok
IF NOT EXISTS (SELECT 1 FROM dbo.[Gudang])
BEGIN
    DECLARE @unitDefault UNIQUEIDENTIFIER = (SELECT TOP 1 unit_id FROM dbo.[Unit_Pelayanan] WHERE aktif = 1);
    IF @unitDefault IS NOT NULL
    BEGIN
        INSERT INTO dbo.[Gudang] (gudang_id, unit_id, nama, jenis)
        VALUES (NEWID(), @unitDefault, N'Gudang Farmasi Utama PMB', 'UTAMA');
    END
END
GO

-- 3. Sinkronisasi Idempotent: Obat yang punya stok_saat_ini > 0 tetapi belum punya Batch_Obat aktif
DECLARE @gudangUtama UNIQUEIDENTIFIER = (SELECT TOP 1 gudang_id FROM dbo.[Gudang] ORDER BY nama ASC);
DECLARE @stafUtama UNIQUEIDENTIFIER = (SELECT TOP 1 staf_id FROM dbo.[Staf] WHERE aktif = 1 ORDER BY nama ASC);
DECLARE @hariIni DATE = CAST(SYSDATETIME() AS DATE);

IF @gudangUtama IS NOT NULL AND @stafUtama IS NOT NULL
BEGIN
    DECLARE @oid UNIQUEIDENTIFIER, @kodeObat VARCHAR(30), @selisih INT;
    DECLARE cur_sync_obat CURSOR LOCAL FAST_FORWARD FOR
        SELECT o.obat_id,
               o.kode,
               o.stok_saat_ini - ISNULL(agg.stok_aktif, 0) AS selisih
          FROM dbo.[Obat] o
          OUTER APPLY (
              SELECT CAST(ISNULL(SUM(sb.jumlah), 0) AS INT) AS stok_aktif
                FROM dbo.[Batch_Obat] b
                INNER JOIN dbo.[Stok_Batch] sb ON sb.batch_id = b.batch_id
               WHERE b.obat_id = o.obat_id
                 AND b.tgl_kedaluwarsa >= @hariIni
          ) agg
         WHERE o.stok_saat_ini > ISNULL(agg.stok_aktif, 0);

    OPEN cur_sync_obat;
    FETCH NEXT FROM cur_sync_obat INTO @oid, @kodeObat, @selisih;
    WHILE @@FETCH_STATUS = 0
    BEGIN
        DECLARE @newBatchId UNIQUEIDENTIFIER = NEWID();
        DECLARE @noBatch VARCHAR(50) = LEFT('INIT-' + @kodeObat + '-' + CONVERT(VARCHAR(8), @hariIni, 112), 50);

        IF NOT EXISTS (SELECT 1 FROM dbo.[Batch_Obat] WHERE obat_id = @oid AND no_batch = @noBatch)
        BEGIN
            INSERT INTO dbo.[Batch_Obat] (batch_id, obat_id, penerimaan_id, no_batch, tgl_kedaluwarsa, harga_beli, tgl_masuk)
            VALUES (@newBatchId, @oid, NULL, @noBatch, DATEADD(MONTH, 12, @hariIni), 1000, @hariIni);

            INSERT INTO dbo.[Stok_Batch] (batch_id, gudang_id, jumlah)
            VALUES (@newBatchId, @gudangUtama, @selisih);

            INSERT INTO dbo.[Mutasi_Stok] (mutasi_id, batch_id, gudang_id, kunjungan_id, staf_id, jenis, jumlah, waktu, keterangan)
            VALUES (NEWID(), @newBatchId, @gudangUtama, NULL, @stafUtama, 'MASUK', @selisih, SYSDATETIME(), N'Sinkronisasi saldo awal batch inventaris');
        END

        FETCH NEXT FROM cur_sync_obat INTO @oid, @kodeObat, @selisih;
    END
    CLOSE cur_sync_obat;
    DEALLOCATE cur_sync_obat;

    -- Selaraskan kembali Obat.stok_saat_ini agar sama persis dengan SUM(Stok_Batch aktif belum kedaluwarsa)
    UPDATE o
       SET o.stok_saat_ini = ISNULL(agg.stok_aktif, 0)
      FROM dbo.[Obat] o
      OUTER APPLY (
          SELECT CAST(ISNULL(SUM(sb.jumlah), 0) AS INT) AS stok_aktif
            FROM dbo.[Batch_Obat] b
            INNER JOIN dbo.[Stok_Batch] sb ON sb.batch_id = b.batch_id
           WHERE b.obat_id = o.obat_id
             AND b.tgl_kedaluwarsa >= @hariIni
      ) agg
     WHERE o.stok_saat_ini <> ISNULL(agg.stok_aktif, 0);
END
GO

-- 4. Indeks Non-Clustered Idempotent untuk Performa Endpoint Dashboard & Laporan (p95 < 2s)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Kunjungan_Dash_TglMasuk' AND object_id = OBJECT_ID('dbo.Kunjungan'))
BEGIN
    CREATE NONCLUSTERED INDEX [IX_Kunjungan_Dash_TglMasuk]
    ON dbo.[Kunjungan] ([tgl_masuk], [status], [koreksi_dari_id])
    INCLUDE ([pasien_id], [reservasi_id], [jenis_kunjungan], [created_at]);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Kunjungan_Dash_CreatedAt' AND object_id = OBJECT_ID('dbo.Kunjungan'))
BEGIN
    CREATE NONCLUSTERED INDEX [IX_Kunjungan_Dash_CreatedAt]
    ON dbo.[Kunjungan] ([created_at], [koreksi_dari_id], [status])
    INCLUDE ([reservasi_id], [tgl_masuk]);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Kunjungan_Dash_KoreksiDari' AND object_id = OBJECT_ID('dbo.Kunjungan'))
BEGIN
    CREATE NONCLUSTERED INDEX [IX_Kunjungan_Dash_KoreksiDari]
    ON dbo.[Kunjungan] ([koreksi_dari_id], [status])
    WHERE [koreksi_dari_id] IS NOT NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Pembayaran_Dash_WaktuBayar' AND object_id = OBJECT_ID('dbo.Pembayaran'))
BEGIN
    CREATE NONCLUSTERED INDEX [IX_Pembayaran_Dash_WaktuBayar]
    ON dbo.[Pembayaran] ([waktu_bayar], [tagihan_id], [penjamin_id])
    INCLUDE ([jumlah], [metode], [jenis]);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Tagihan_Dash_StatusKunjungan' AND object_id = OBJECT_ID('dbo.Tagihan'))
BEGIN
    CREATE NONCLUSTERED INDEX [IX_Tagihan_Dash_StatusKunjungan]
    ON dbo.[Tagihan] ([status], [kunjungan_id])
    INCLUDE ([total_tagihan], [total_dibayar], [tgl_terbit]);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_BatchObat_Dash_ObatExp' AND object_id = OBJECT_ID('dbo.Batch_Obat'))
BEGIN
    CREATE NONCLUSTERED INDEX [IX_BatchObat_Dash_ObatExp]
    ON dbo.[Batch_Obat] ([obat_id], [tgl_kedaluwarsa])
    INCLUDE ([no_batch], [harga_beli], [tgl_masuk]);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_TagihanRincian_Dash_Tagihan' AND object_id = OBJECT_ID('dbo.Tagihan_Rincian'))
BEGIN
    CREATE NONCLUSTERED INDEX [IX_TagihanRincian_Dash_Tagihan]
    ON dbo.[Tagihan_Rincian] ([tagihan_id])
    INCLUDE ([layanan_id], [obat_id], [paket_id], [qty], [harga_satuan], [subtotal]);
END
GO
