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