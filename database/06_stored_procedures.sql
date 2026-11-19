-- =====================================================================
-- 06_stored_procedures.sql
-- 9 stored procedure atomik (TSD Bagian 1.3 & 5).
-- Kode hasil: 0 = sukses, selain itu pesan error di @kode_hasil (ERR-*).
-- Jalankan setelah 03 & 04.
-- =====================================================================
USE MiniWorldRS;
GO

-- =====================================================================
-- 1. sp_register_pasien -- buat No. RM otomatis.
-- =====================================================================
CREATE OR ALTER PROCEDURE dbo.sp_register_pasien
    @nik            CHAR(16),
    @nama           NVARCHAR(100),
    @jenis_kelamin  VARCHAR(20),
    @tgl_lahir      DATE,
    @tempat_lahir   NVARCHAR(100),
    @alamat         NVARCHAR(255),
    @no_telepon     VARCHAR(16),
    @gol_darah      VARCHAR(20),
    @status_nikah   VARCHAR(20),
    @pekerjaan      NVARCHAR(100),
    @email          VARCHAR(254) = NULL,
    @ibu_pasien_id  UNIQUEIDENTIFIER = NULL,
    @pasien_id      UNIQUEIDENTIFIER OUTPUT,
    @no_rm          VARCHAR(30) OUTPUT,
    @kode_hasil     INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @kode_hasil = 0;
    IF EXISTS (SELECT 1 FROM dbo.Pasien WHERE nik = @nik)
    BEGIN
        SET @kode_hasil = -1;
        RETURN;
    END

    BEGIN TRY
        BEGIN TRAN;
        DECLARE @urut INT = (SELECT ISNULL(MAX(TRY_CAST(RIGHT(no_rm, 6) AS INT)), 0) + 1 FROM dbo.Pasien);
        SET @no_rm = 'RM' + FORMAT(SYSDATETIME(), 'yyyyMM') + RIGHT('000000' + CAST(@urut AS VARCHAR(6)), 6);
        SET @pasien_id = NEWID();

        INSERT INTO dbo.Pasien (pasien_id, no_rm, nik, nama, jenis_kelamin, tgl_lahir, tempat_lahir,
                                alamat, no_telepon, gol_darah, status_pernikahan, pekerjaan, ibu_pasien_id, email)
        VALUES (@pasien_id, @no_rm, @nik, @nama, @jenis_kelamin, @tgl_lahir, @tempat_lahir,
                @alamat, @no_telepon, @gol_darah, @status_nikah, @pekerjaan, @ibu_pasien_id, @email);
        COMMIT;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK;
        SET @kode_hasil = -2;
        THROW;
    END CATCH
END
GO

-- =====================================================================
-- 2. sp_simpan_kunjungan -- kunjungan + pemeriksaan + resep + potong stok FEFO.
--    @items_json: [{"obat_id":"...","jumlah":2,"aturan_pakai":"3x1"}]
-- =====================================================================
CREATE OR ALTER PROCEDURE dbo.sp_simpan_kunjungan
    @pasien_id       UNIQUEIDENTIFIER,
    @unit_id         UNIQUEIDENTIFIER,
    @dpjp_staf_id    UNIQUEIDENTIFIER,
    @penjamin_id     UNIQUEIDENTIFIER,
    @jenis_kunjungan VARCHAR(20),
    @keluhan         NVARCHAR(MAX),
    @pem_fisik       NVARCHAR(MAX),
    @asesmen         NVARCHAR(MAX),
    @rencana         NVARCHAR(MAX),
    @sistolik        SMALLINT,
    @diastolik       SMALLINT,
    @nadi            SMALLINT,
    @suhu            DECIMAL(4, 1),
    @frekuensi_napas SMALLINT,
    @spo2            SMALLINT,
    @berat_badan     DECIMAL(5, 1),
    @tinggi_badan    DECIMAL(5, 1),
    @reservasi_id    UNIQUEIDENTIFIER = NULL,
    @items_json      NVARCHAR(MAX) = NULL,
    @kunjungan_id    UNIQUEIDENTIFIER OUTPUT,
    @kode_hasil      INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @kode_hasil = 0;

    BEGIN TRY
        BEGIN TRAN;
        SET @kunjungan_id = NEWID();
        INSERT INTO dbo.Kunjungan (kunjungan_id, pasien_id, reservasi_id, unit_id, dpjp_staf_id,
                                   penjamin_id, jenis_kunjungan, tgl_masuk, status)
        VALUES (@kunjungan_id, @pasien_id, @reservasi_id, @unit_id, @dpjp_staf_id,
                @penjamin_id, @jenis_kunjungan, CAST(SYSDATETIME() AS DATE), 'AKTIF');

        DECLARE @pem_id UNIQUEIDENTIFIER = NEWID();
        INSERT INTO dbo.Pemeriksaan (pemeriksaan_id, kunjungan_id, staf_id, keluhan, pemeriksaan_fisik,
                                     asesmen, rencana, waktu)
        VALUES (@pem_id, @kunjungan_id, @dpjp_staf_id, @keluhan, @pem_fisik, @asesmen, @rencana, SYSDATETIME());

        INSERT INTO dbo.Tanda_Vital (vital_id, pemeriksaan_id, sistolik, diastolik, nadi, suhu,
                                     frekuensi_napas, spo2, berat_badan, tinggi_badan, waktu)
        VALUES (NEWID(), @pem_id, @sistolik, @diastolik, @nadi, @suhu,
                @frekuensi_napas, @spo2, @berat_badan, @tinggi_badan, SYSDATETIME());

        IF @items_json IS NOT NULL AND LEN(LTRIM(RTRIM(@items_json))) > 2
        BEGIN
            DECLARE @resep_id UNIQUEIDENTIFIER = NEWID();
            INSERT INTO dbo.Resep (resep_id, kunjungan_id, staf_id, tanggal, status, override_alergi)
            VALUES (@resep_id, @kunjungan_id, @dpjp_staf_id, CAST(SYSDATETIME() AS DATE), 'BARU', 0);

            INSERT INTO dbo.Resep_Detail (resep_id, obat_id, jumlah, aturan_pakai)
            SELECT @resep_id, CAST(j.obat_id AS UNIQUEIDENTIFIER), j.jumlah, ISNULL(j.aturan_pakai, '')
              FROM OPENJSON(@items_json) WITH (
                    obat_id UNIQUEIDENTIFIER '$.obat_id',
                    jumlah DECIMAL(10, 2) '$.jumlah',
                    aturan_pakai NVARCHAR(MAX) '$.aturan_pakai'
              ) j;

            DECLARE @gudang_id UNIQUEIDENTIFIER =
                (SELECT TOP 1 gudang_id FROM dbo.Gudang WHERE unit_id = @unit_id ORDER BY nama);
            IF @gudang_id IS NULL
                SELECT TOP 1 @gudang_id = gudang_id FROM dbo.Gudang ORDER BY nama;

            IF @gudang_id IS NOT NULL
                EXEC dbo.sp_pengeluaran_resep_fefo @resep_id, @gudang_id, @dpjp_staf_id, @kunjungan_id, @kode_hasil OUTPUT;
        END

        COMMIT;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK;
        SET @kode_hasil = -2;
        THROW;
    END CATCH
END
GO

-- =====================================================================
-- 3. sp_admisi_rawat_inap -- alokasi bed, tandai TERISI.
-- =====================================================================
CREATE OR ALTER PROCEDURE dbo.sp_admisi_rawat_inap
    @kunjungan_id  UNIQUEIDENTIFIER,
    @bed_id        UNIQUEIDENTIFIER,
    @rawat_inap_id UNIQUEIDENTIFIER OUTPUT,
    @kode_hasil    INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @kode_hasil = 0;

    IF EXISTS (SELECT 1 FROM dbo.Tempat_Tidur WHERE bed_id = @bed_id AND status <> 'KOSONG')
    BEGIN
        SET @kode_hasil = -1;
        RETURN;
    END

    BEGIN TRY
        BEGIN TRAN;
        SET @rawat_inap_id = NEWID();
        INSERT INTO dbo.Rawat_Inap (rawat_inap_id, kunjungan_id, bed_id, tgl_masuk)
        VALUES (@rawat_inap_id, @kunjungan_id, @bed_id, CAST(SYSDATETIME() AS DATE));

        UPDATE dbo.Tempat_Tidur SET status = 'TERISI' WHERE bed_id = @bed_id;
        UPDATE dbo.Kunjungan SET jenis_kunjungan = 'RAWAT_INAP' WHERE kunjungan_id = @kunjungan_id;
        COMMIT;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK;
        SET @kode_hasil = -2;
        THROW;
    END CATCH
END
GO

-- =====================================================================
-- 4. sp_pindah_bed -- mutasi bed: lama PEMBERSIHAN, baru TERISI.
-- =====================================================================
CREATE OR ALTER PROCEDURE dbo.sp_pindah_bed
    @rawat_inap_id UNIQUEIDENTIFIER,
    @bed_baru_id   UNIQUEIDENTIFIER,
    @alasan        NVARCHAR(MAX),
    @kode_hasil    INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @kode_hasil = 0;

    DECLARE @bed_lama UNIQUEIDENTIFIER;
    SELECT @bed_lama = bed_id FROM dbo.Rawat_Inap WHERE rawat_inap_id = @rawat_inap_id;
    IF @bed_lama IS NULL
    BEGIN
        SET @kode_hasil = -1;
        RETURN;
    END
    IF EXISTS (SELECT 1 FROM dbo.Tempat_Tidur WHERE bed_id = @bed_baru_id AND status <> 'KOSONG')
    BEGIN
        SET @kode_hasil = -2;
        RETURN;
    END

    BEGIN TRY
        BEGIN TRAN;
        UPDATE dbo.Rawat_Inap SET bed_id = @bed_baru_id, alasan_pindah = @alasan
         WHERE rawat_inap_id = @rawat_inap_id;
        UPDATE dbo.Tempat_Tidur SET status = 'PEMBERSIHAN' WHERE bed_id = @bed_lama;
        UPDATE dbo.Tempat_Tidur SET status = 'TERISI' WHERE bed_id = @bed_baru_id;
        COMMIT;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK;
        SET @kode_hasil = -3;
        THROW;
    END CATCH
END
GO

-- =====================================================================
-- 5. sp_pulang_rawat_inap -- tutup episode rawat inap secara atomik (TSD 5).
-- =====================================================================
CREATE OR ALTER PROCEDURE dbo.sp_pulang_rawat_inap
    @rawat_inap_id UNIQUEIDENTIFIER,
    @cara_keluar   VARCHAR(20),
    @catatan_pulang NVARCHAR(MAX) = NULL,
    @kode_hasil    INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @kode_hasil = 0;

    DECLARE @kunjungan_id UNIQUEIDENTIFIER, @bed_id UNIQUEIDENTIFIER;
    SELECT @kunjungan_id = kunjungan_id, @bed_id = bed_id
      FROM dbo.Rawat_Inap WHERE rawat_inap_id = @rawat_inap_id AND tgl_keluar IS NULL;
    IF @kunjungan_id IS NULL
    BEGIN
        SET @kode_hasil = -1;
        RETURN;
    END

    BEGIN TRY
        BEGIN TRAN;
        UPDATE dbo.Rawat_Inap
           SET tgl_keluar = CAST(SYSDATETIME() AS DATE), catatan_pulang = @catatan_pulang
         WHERE rawat_inap_id = @rawat_inap_id;

        UPDATE dbo.Tempat_Tidur SET status = 'PEMBERSIHAN' WHERE bed_id = @bed_id;

        UPDATE dbo.Kunjungan
           SET tgl_keluar = CAST(SYSDATETIME() AS DATE),
               cara_keluar = @cara_keluar,
               status = 'SELESAI'
         WHERE kunjungan_id = @kunjungan_id;
        COMMIT;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK;
        SET @kode_hasil = -2;
        THROW;
    END CATCH
END
GO

-- =====================================================================
-- 6. sp_terima_batch_obat -- penerimaan barang: batch + stok + mutasi MASUK.
-- =====================================================================
CREATE OR ALTER PROCEDURE dbo.sp_terima_batch_obat
    @obat_id         UNIQUEIDENTIFIER,
    @gudang_id       UNIQUEIDENTIFIER,
    @staf_id         UNIQUEIDENTIFIER,
    @no_batch        VARCHAR(30),
    @tgl_kedaluwarsa DATE,
    @harga_beli      DECIMAL(14, 2),
    @jumlah          DECIMAL(10, 2),
    @pemasok_id      UNIQUEIDENTIFIER = NULL,
    @batch_id        UNIQUEIDENTIFIER OUTPUT,
    @kode_hasil      INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @kode_hasil = 0;
    IF @jumlah <= 0
    BEGIN
        SET @kode_hasil = -1;
        RETURN;
    END

    BEGIN TRY
        BEGIN TRAN;
        SET @batch_id = NEWID();
        INSERT INTO dbo.Batch_Obat (batch_id, obat_id, no_batch, tgl_kedaluwarsa, harga_beli, tgl_masuk)
        VALUES (@batch_id, @obat_id, @no_batch, @tgl_kedaluwarsa, @harga_beli, CAST(SYSDATETIME() AS DATE));

        INSERT INTO dbo.Stok_Batch (batch_id, gudang_id, jumlah)
        VALUES (@batch_id, @gudang_id, @jumlah);

        INSERT INTO dbo.Mutasi_Stok (mutasi_id, batch_id, gudang_id, staf_id, jenis, jumlah, waktu, keterangan)
        VALUES (NEWID(), @batch_id, @gudang_id, @staf_id, 'MASUK', @jumlah, SYSDATETIME(),
                CONCAT('Penerimaan batch ', @no_batch));
        COMMIT;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK;
        SET @kode_hasil = -2;
        THROW;
    END CATCH
END
GO

-- =====================================================================
-- 7. sp_pengeluaran_resep_fefo -- potong stok per batch, urut kedaluwarsa.
-- =====================================================================
CREATE OR ALTER PROCEDURE dbo.sp_pengeluaran_resep_fefo
    @resep_id      UNIQUEIDENTIFIER,
    @gudang_id     UNIQUEIDENTIFIER,
    @staf_id       UNIQUEIDENTIFIER,
    @kunjungan_id  UNIQUEIDENTIFIER = NULL,
    @kode_hasil    INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @kode_hasil = 0;

    DECLARE @obat_id UNIQUEIDENTIFIER, @butuh DECIMAL(10, 2);

    BEGIN TRY
        BEGIN TRAN;
        DECLARE cur CURSOR LOCAL FAST_FORWARD FOR
            SELECT obat_id, jumlah FROM dbo.Resep_Detail WHERE resep_id = @resep_id;
        OPEN cur;
        FETCH NEXT FROM cur INTO @obat_id, @butuh;
        WHILE @@FETCH_STATUS = 0
        BEGIN
            DECLARE @batch_id UNIQUEIDENTIFIER, @tersedia DECIMAL(10, 2);

            WHILE @butuh > 0
            BEGIN
                SET @batch_id = NULL;
                SELECT TOP 1 @batch_id = sb.batch_id, @tersedia = sb.jumlah
                  FROM dbo.Stok_Batch sb
                  JOIN dbo.Batch_Obat b ON b.batch_id = sb.batch_id
                 WHERE sb.gudang_id = @gudang_id
                   AND b.obat_id = @obat_id
                   AND sb.jumlah > 0
                 ORDER BY b.tgl_kedaluwarsa ASC, b.tgl_masuk ASC;

                IF @batch_id IS NULL
                BEGIN
                    SET @kode_hasil = -1;
                    ROLLBACK;
                    CLOSE cur;
                    DEALLOCATE cur;
                    RETURN;
                END

                DECLARE @ambil DECIMAL(10, 2) = CASE WHEN @tersedia >= @butuh THEN @butuh ELSE @tersedia END;

                UPDATE dbo.Stok_Batch SET jumlah = jumlah - @ambil
                 WHERE batch_id = @batch_id AND gudang_id = @gudang_id;

                INSERT INTO dbo.Pengeluaran_Obat (pengeluaran_id, resep_id, obat_id, batch_id, gudang_id,
                                                  apoteker_staf_id, jumlah, waktu)
                VALUES (NEWID(), @resep_id, @obat_id, @batch_id, @gudang_id, @staf_id, @ambil, SYSDATETIME());

                INSERT INTO dbo.Mutasi_Stok (mutasi_id, batch_id, gudang_id, kunjungan_id, staf_id,
                                             jenis, jumlah, waktu, keterangan)
                VALUES (NEWID(), @batch_id, @gudang_id, @kunjungan_id, @staf_id, 'PAKAI', @ambil,
                        SYSDATETIME(), CONCAT('Resep ', CAST(@resep_id AS VARCHAR(36))));

                SET @butuh = @butuh - @ambil;
            END
            FETCH NEXT FROM cur INTO @obat_id, @butuh;
        END
        CLOSE cur;
        DEALLOCATE cur;

        UPDATE dbo.Resep SET status = 'DISERAHKAN' WHERE resep_id = @resep_id;
        COMMIT;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK;
        SET @kode_hasil = -2;
        THROW;
    END CATCH
END
GO

-- =====================================================================
-- 8. sp_buat_tagihan_kunjungan -- tagihan dari tindakan + obat (idempoten).
-- =====================================================================
CREATE OR ALTER PROCEDURE dbo.sp_buat_tagihan_kunjungan
    @kunjungan_id UNIQUEIDENTIFIER,
    @tagihan_id   UNIQUEIDENTIFIER OUTPUT,
    @kode_hasil   INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @kode_hasil = 0;

    SELECT @tagihan_id = tagihan_id FROM dbo.Tagihan WHERE kunjungan_id = @kunjungan_id;
    IF @tagihan_id IS NOT NULL
        RETURN;

    BEGIN TRY
        BEGIN TRAN;
        SET @tagihan_id = NEWID();
        INSERT INTO dbo.Tagihan (tagihan_id, kunjungan_id, total_tagihan, total_dibayar, status, tgl_terbit)
        VALUES (@tagihan_id, @kunjungan_id, 0, 0, 'BELUM_LUNAS', CAST(SYSDATETIME() AS DATE));

        INSERT INTO dbo.Tagihan_Rincian (rincian_id, tagihan_id, layanan_id, qty, harga_satuan, subtotal)
        SELECT NEWID(), @tagihan_id, tk.layanan_id, tk.qty,
               ISNULL((SELECT TOP 1 hl.harga FROM dbo.Harga_Layanan hl
                        WHERE hl.layanan_id = tk.layanan_id
                          AND hl.berlaku_dari <= CAST(SYSDATETIME() AS DATE)
                          AND (hl.berlaku_sampai IS NULL OR hl.berlaku_sampai >= CAST(SYSDATETIME() AS DATE))
                        ORDER BY hl.berlaku_dari DESC), 0),
               tk.qty * ISNULL((SELECT TOP 1 hl.harga FROM dbo.Harga_Layanan hl
                        WHERE hl.layanan_id = tk.layanan_id
                          AND hl.berlaku_dari <= CAST(SYSDATETIME() AS DATE)
                          AND (hl.berlaku_sampai IS NULL OR hl.berlaku_sampai >= CAST(SYSDATETIME() AS DATE))
                        ORDER BY hl.berlaku_dari DESC), 0)
          FROM dbo.Tindakan_Kunjungan tk
         WHERE tk.kunjungan_id = @kunjungan_id;

        INSERT INTO dbo.Tagihan_Rincian (rincian_id, tagihan_id, obat_id, qty, harga_satuan, subtotal)
        SELECT NEWID(), @tagihan_id, po.obat_id, po.jumlah,
               ISNULL((SELECT TOP 1 ho.harga_jual FROM dbo.Harga_Obat ho
                        WHERE ho.obat_id = po.obat_id
                          AND ho.berlaku_dari <= CAST(SYSDATETIME() AS DATE)
                          AND (ho.berlaku_sampai IS NULL OR ho.berlaku_sampai >= CAST(SYSDATETIME() AS DATE))
                        ORDER BY ho.berlaku_dari DESC), 0),
               po.jumlah * ISNULL((SELECT TOP 1 ho.harga_jual FROM dbo.Harga_Obat ho
                        WHERE ho.obat_id = po.obat_id
                          AND ho.berlaku_dari <= CAST(SYSDATETIME() AS DATE)
                          AND (ho.berlaku_sampai IS NULL OR ho.berlaku_sampai >= CAST(SYSDATETIME() AS DATE))
                        ORDER BY ho.berlaku_dari DESC), 0)
          FROM dbo.Pengeluaran_Obat po
          JOIN dbo.Resep r ON r.resep_id = po.resep_id
         WHERE r.kunjungan_id = @kunjungan_id;

        UPDATE dbo.Tagihan
           SET total_tagihan = (SELECT ISNULL(SUM(subtotal), 0) FROM dbo.Tagihan_Rincian WHERE tagihan_id = @tagihan_id)
         WHERE tagihan_id = @tagihan_id;
        COMMIT;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK;
        SET @kode_hasil = -2;
        THROW;
    END CATCH
END
GO

-- =====================================================================
-- 9. sp_bayar_tagihan -- pembayaran + update status lunas.
-- =====================================================================
CREATE OR ALTER PROCEDURE dbo.sp_bayar_tagihan
    @tagihan_id   UNIQUEIDENTIFIER,
    @jumlah       DECIMAL(10, 2),
    @metode       VARCHAR(20),
    @jenis        VARCHAR(20),
    @penjamin_id  UNIQUEIDENTIFIER,
    @kasir_staf_id UNIQUEIDENTIFIER,
    @kode_hasil   INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @kode_hasil = 0;

    DECLARE @total DECIMAL(14, 2), @dibayar DECIMAL(14, 2);
    SELECT @total = total_tagihan, @dibayar = total_dibayar FROM dbo.Tagihan WHERE tagihan_id = @tagihan_id;
    IF @total IS NULL
    BEGIN
        SET @kode_hasil = -1;
        RETURN;
    END
    IF @dibayar + @jumlah > @total
    BEGIN
        SET @kode_hasil = -2;
        RETURN;
    END

    BEGIN TRY
        BEGIN TRAN;
        INSERT INTO dbo.Pembayaran (pembayaran_id, tagihan_id, penjamin_id, kasir_staf_id,
                                    jumlah, metode, jenis, waktu_bayar)
        VALUES (NEWID(), @tagihan_id, @penjamin_id, @kasir_staf_id, @jumlah, @metode, @jenis, SYSDATETIME());

        UPDATE dbo.Tagihan
           SET total_dibayar = total_dibayar + @jumlah,
               status = CASE WHEN total_dibayar + @jumlah >= total_tagihan THEN 'LUNAS' ELSE 'BELUM_LUNAS' END
         WHERE tagihan_id = @tagihan_id;
        COMMIT;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK;
        SET @kode_hasil = -3;
        THROW;
    END CATCH
END
GO
