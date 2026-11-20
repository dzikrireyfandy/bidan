-- =====================================================================
-- 07_audit_triggers.sql
-- 27 trigger audit per tabel + trg_audit_logs_immutable (lihat TSD 1.3).
-- Diturunkan otomatis oleh generate_ddl.py.
-- SESSION_CONTEXT('akun_id') & ('user_ref') di-set backend per request.
-- =====================================================================
USE MiniWorldRS;
GO

CREATE OR ALTER TRIGGER dbo.[trg_audit_pasien] ON dbo.[Pasien]
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted) RETURN;
    DECLARE @aksi VARCHAR(40) =
        CASE WHEN EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted) THEN 'UPDATE'
             WHEN EXISTS (SELECT 1 FROM inserted) THEN 'INSERT'
             ELSE 'DELETE' END;
    INSERT INTO dbo.[Audit_Log] ([akun_id], [aksi], [tabel], [id_baris], [nilai_lama], [nilai_baru], [ip_address], [waktu], [user_ref])
    SELECT
        TRY_CAST(SESSION_CONTEXT(N'akun_id') AS UNIQUEIDENTIFIER),
        @aksi,
        N'Pasien',
        CAST(COALESCE((SELECT TOP 1 [pasien_id] FROM deleted), (SELECT TOP 1 [pasien_id] FROM inserted)) AS VARCHAR(40)),
        COALESCE((SELECT * FROM deleted FOR JSON PATH), N'[]'),
        COALESCE((SELECT * FROM inserted FOR JSON PATH), N'[]'),
        COALESCE(CONVERT(VARCHAR(45), CONNECTIONPROPERTY('client_net_address')), ''),
        SYSDATETIME(),
        CONVERT(NVARCHAR(50), SESSION_CONTEXT(N'user_ref'));
END
GO

CREATE OR ALTER TRIGGER dbo.[trg_audit_staf] ON dbo.[Staf]
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted) RETURN;
    DECLARE @aksi VARCHAR(40) =
        CASE WHEN EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted) THEN 'UPDATE'
             WHEN EXISTS (SELECT 1 FROM inserted) THEN 'INSERT'
             ELSE 'DELETE' END;
    INSERT INTO dbo.[Audit_Log] ([akun_id], [aksi], [tabel], [id_baris], [nilai_lama], [nilai_baru], [ip_address], [waktu], [user_ref])
    SELECT
        TRY_CAST(SESSION_CONTEXT(N'akun_id') AS UNIQUEIDENTIFIER),
        @aksi,
        N'Staf',
        CAST(COALESCE((SELECT TOP 1 [staf_id] FROM deleted), (SELECT TOP 1 [staf_id] FROM inserted)) AS VARCHAR(40)),
        COALESCE((SELECT * FROM deleted FOR JSON PATH), N'[]'),
        COALESCE((SELECT * FROM inserted FOR JSON PATH), N'[]'),
        COALESCE(CONVERT(VARCHAR(45), CONNECTIONPROPERTY('client_net_address')), ''),
        SYSDATETIME(),
        CONVERT(NVARCHAR(50), SESSION_CONTEXT(N'user_ref'));
END
GO

CREATE OR ALTER TRIGGER dbo.[trg_audit_akun_pengguna] ON dbo.[Akun_Pengguna]
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted) RETURN;
    DECLARE @aksi VARCHAR(40) =
        CASE WHEN EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted) THEN 'UPDATE'
             WHEN EXISTS (SELECT 1 FROM inserted) THEN 'INSERT'
             ELSE 'DELETE' END;
    INSERT INTO dbo.[Audit_Log] ([akun_id], [aksi], [tabel], [id_baris], [nilai_lama], [nilai_baru], [ip_address], [waktu], [user_ref])
    SELECT
        TRY_CAST(SESSION_CONTEXT(N'akun_id') AS UNIQUEIDENTIFIER),
        @aksi,
        N'Akun_Pengguna',
        CAST(COALESCE((SELECT TOP 1 [akun_id] FROM deleted), (SELECT TOP 1 [akun_id] FROM inserted)) AS VARCHAR(40)),
        COALESCE((SELECT * FROM deleted FOR JSON PATH), N'[]'),
        COALESCE((SELECT * FROM inserted FOR JSON PATH), N'[]'),
        COALESCE(CONVERT(VARCHAR(45), CONNECTIONPROPERTY('client_net_address')), ''),
        SYSDATETIME(),
        CONVERT(NVARCHAR(50), SESSION_CONTEXT(N'user_ref'));
END
GO

CREATE OR ALTER TRIGGER dbo.[trg_audit_jadwal_praktik] ON dbo.[Jadwal_Praktik]
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted) RETURN;
    DECLARE @aksi VARCHAR(40) =
        CASE WHEN EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted) THEN 'UPDATE'
             WHEN EXISTS (SELECT 1 FROM inserted) THEN 'INSERT'
             ELSE 'DELETE' END;
    INSERT INTO dbo.[Audit_Log] ([akun_id], [aksi], [tabel], [id_baris], [nilai_lama], [nilai_baru], [ip_address], [waktu], [user_ref])
    SELECT
        TRY_CAST(SESSION_CONTEXT(N'akun_id') AS UNIQUEIDENTIFIER),
        @aksi,
        N'Jadwal_Praktik',
        CAST(COALESCE((SELECT TOP 1 [jadwal_id] FROM deleted), (SELECT TOP 1 [jadwal_id] FROM inserted)) AS VARCHAR(40)),
        COALESCE((SELECT * FROM deleted FOR JSON PATH), N'[]'),
        COALESCE((SELECT * FROM inserted FOR JSON PATH), N'[]'),
        COALESCE(CONVERT(VARCHAR(45), CONNECTIONPROPERTY('client_net_address')), ''),
        SYSDATETIME(),
        CONVERT(NVARCHAR(50), SESSION_CONTEXT(N'user_ref'));
END
GO

CREATE OR ALTER TRIGGER dbo.[trg_audit_reservasi] ON dbo.[Reservasi]
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted) RETURN;
    DECLARE @aksi VARCHAR(40) =
        CASE WHEN EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted) THEN 'UPDATE'
             WHEN EXISTS (SELECT 1 FROM inserted) THEN 'INSERT'
             ELSE 'DELETE' END;
    INSERT INTO dbo.[Audit_Log] ([akun_id], [aksi], [tabel], [id_baris], [nilai_lama], [nilai_baru], [ip_address], [waktu], [user_ref])
    SELECT
        TRY_CAST(SESSION_CONTEXT(N'akun_id') AS UNIQUEIDENTIFIER),
        @aksi,
        N'Reservasi',
        CAST(COALESCE((SELECT TOP 1 [reservasi_id] FROM deleted), (SELECT TOP 1 [reservasi_id] FROM inserted)) AS VARCHAR(40)),
        COALESCE((SELECT * FROM deleted FOR JSON PATH), N'[]'),
        COALESCE((SELECT * FROM inserted FOR JSON PATH), N'[]'),
        COALESCE(CONVERT(VARCHAR(45), CONNECTIONPROPERTY('client_net_address')), ''),
        SYSDATETIME(),
        CONVERT(NVARCHAR(50), SESSION_CONTEXT(N'user_ref'));
END
GO

CREATE OR ALTER TRIGGER dbo.[trg_audit_kunjungan] ON dbo.[Kunjungan]
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted) RETURN;
    DECLARE @aksi VARCHAR(40) =
        CASE WHEN EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted) THEN 'UPDATE'
             WHEN EXISTS (SELECT 1 FROM inserted) THEN 'INSERT'
             ELSE 'DELETE' END;
    INSERT INTO dbo.[Audit_Log] ([akun_id], [aksi], [tabel], [id_baris], [nilai_lama], [nilai_baru], [ip_address], [waktu], [user_ref])
    SELECT
        TRY_CAST(SESSION_CONTEXT(N'akun_id') AS UNIQUEIDENTIFIER),
        @aksi,
        N'Kunjungan',
        CAST(COALESCE((SELECT TOP 1 [kunjungan_id] FROM deleted), (SELECT TOP 1 [kunjungan_id] FROM inserted)) AS VARCHAR(40)),
        COALESCE((SELECT * FROM deleted FOR JSON PATH), N'[]'),
        COALESCE((SELECT * FROM inserted FOR JSON PATH), N'[]'),
        COALESCE(CONVERT(VARCHAR(45), CONNECTIONPROPERTY('client_net_address')), ''),
        SYSDATETIME(),
        CONVERT(NVARCHAR(50), SESSION_CONTEXT(N'user_ref'));
END
GO

CREATE OR ALTER TRIGGER dbo.[trg_audit_pemeriksaan] ON dbo.[Pemeriksaan]
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted) RETURN;
    DECLARE @aksi VARCHAR(40) =
        CASE WHEN EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted) THEN 'UPDATE'
             WHEN EXISTS (SELECT 1 FROM inserted) THEN 'INSERT'
             ELSE 'DELETE' END;
    INSERT INTO dbo.[Audit_Log] ([akun_id], [aksi], [tabel], [id_baris], [nilai_lama], [nilai_baru], [ip_address], [waktu], [user_ref])
    SELECT
        TRY_CAST(SESSION_CONTEXT(N'akun_id') AS UNIQUEIDENTIFIER),
        @aksi,
        N'Pemeriksaan',
        CAST(COALESCE((SELECT TOP 1 [pemeriksaan_id] FROM deleted), (SELECT TOP 1 [pemeriksaan_id] FROM inserted)) AS VARCHAR(40)),
        COALESCE((SELECT * FROM deleted FOR JSON PATH), N'[]'),
        COALESCE((SELECT * FROM inserted FOR JSON PATH), N'[]'),
        COALESCE(CONVERT(VARCHAR(45), CONNECTIONPROPERTY('client_net_address')), ''),
        SYSDATETIME(),
        CONVERT(NVARCHAR(50), SESSION_CONTEXT(N'user_ref'));
END
GO

CREATE OR ALTER TRIGGER dbo.[trg_audit_alergi_kondisi] ON dbo.[Alergi_Kondisi]
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted) RETURN;
    DECLARE @aksi VARCHAR(40) =
        CASE WHEN EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted) THEN 'UPDATE'
             WHEN EXISTS (SELECT 1 FROM inserted) THEN 'INSERT'
             ELSE 'DELETE' END;
    INSERT INTO dbo.[Audit_Log] ([akun_id], [aksi], [tabel], [id_baris], [nilai_lama], [nilai_baru], [ip_address], [waktu], [user_ref])
    SELECT
        TRY_CAST(SESSION_CONTEXT(N'akun_id') AS UNIQUEIDENTIFIER),
        @aksi,
        N'Alergi_Kondisi',
        CAST(COALESCE((SELECT TOP 1 [alergi_id] FROM deleted), (SELECT TOP 1 [alergi_id] FROM inserted)) AS VARCHAR(40)),
        COALESCE((SELECT * FROM deleted FOR JSON PATH), N'[]'),
        COALESCE((SELECT * FROM inserted FOR JSON PATH), N'[]'),
        COALESCE(CONVERT(VARCHAR(45), CONNECTIONPROPERTY('client_net_address')), ''),
        SYSDATETIME(),
        CONVERT(NVARCHAR(50), SESSION_CONTEXT(N'user_ref'));
END
GO

CREATE OR ALTER TRIGGER dbo.[trg_audit_kunjungan_diagnosa] ON dbo.[Kunjungan_Diagnosa]
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted) RETURN;
    DECLARE @aksi VARCHAR(40) =
        CASE WHEN EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted) THEN 'UPDATE'
             WHEN EXISTS (SELECT 1 FROM inserted) THEN 'INSERT'
             ELSE 'DELETE' END;
    INSERT INTO dbo.[Audit_Log] ([akun_id], [aksi], [tabel], [id_baris], [nilai_lama], [nilai_baru], [ip_address], [waktu], [user_ref])
    SELECT
        TRY_CAST(SESSION_CONTEXT(N'akun_id') AS UNIQUEIDENTIFIER),
        @aksi,
        N'Kunjungan_Diagnosa',
        CAST(COALESCE((SELECT TOP 1 [kunjungan_id] FROM deleted), (SELECT TOP 1 [kunjungan_id] FROM inserted)) AS VARCHAR(40)),
        COALESCE((SELECT * FROM deleted FOR JSON PATH), N'[]'),
        COALESCE((SELECT * FROM inserted FOR JSON PATH), N'[]'),
        COALESCE(CONVERT(VARCHAR(45), CONNECTIONPROPERTY('client_net_address')), ''),
        SYSDATETIME(),
        CONVERT(NVARCHAR(50), SESSION_CONTEXT(N'user_ref'));
END
GO

CREATE OR ALTER TRIGGER dbo.[trg_audit_kehamilan] ON dbo.[Kehamilan]
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted) RETURN;
    DECLARE @aksi VARCHAR(40) =
        CASE WHEN EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted) THEN 'UPDATE'
             WHEN EXISTS (SELECT 1 FROM inserted) THEN 'INSERT'
             ELSE 'DELETE' END;
    INSERT INTO dbo.[Audit_Log] ([akun_id], [aksi], [tabel], [id_baris], [nilai_lama], [nilai_baru], [ip_address], [waktu], [user_ref])
    SELECT
        TRY_CAST(SESSION_CONTEXT(N'akun_id') AS UNIQUEIDENTIFIER),
        @aksi,
        N'Kehamilan',
        CAST(COALESCE((SELECT TOP 1 [kehamilan_id] FROM deleted), (SELECT TOP 1 [kehamilan_id] FROM inserted)) AS VARCHAR(40)),
        COALESCE((SELECT * FROM deleted FOR JSON PATH), N'[]'),
        COALESCE((SELECT * FROM inserted FOR JSON PATH), N'[]'),
        COALESCE(CONVERT(VARCHAR(45), CONNECTIONPROPERTY('client_net_address')), ''),
        SYSDATETIME(),
        CONVERT(NVARCHAR(50), SESSION_CONTEXT(N'user_ref'));
END
GO

CREATE OR ALTER TRIGGER dbo.[trg_audit_persalinan] ON dbo.[Persalinan]
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted) RETURN;
    DECLARE @aksi VARCHAR(40) =
        CASE WHEN EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted) THEN 'UPDATE'
             WHEN EXISTS (SELECT 1 FROM inserted) THEN 'INSERT'
             ELSE 'DELETE' END;
    INSERT INTO dbo.[Audit_Log] ([akun_id], [aksi], [tabel], [id_baris], [nilai_lama], [nilai_baru], [ip_address], [waktu], [user_ref])
    SELECT
        TRY_CAST(SESSION_CONTEXT(N'akun_id') AS UNIQUEIDENTIFIER),
        @aksi,
        N'Persalinan',
        CAST(COALESCE((SELECT TOP 1 [persalinan_id] FROM deleted), (SELECT TOP 1 [persalinan_id] FROM inserted)) AS VARCHAR(40)),
        COALESCE((SELECT * FROM deleted FOR JSON PATH), N'[]'),
        COALESCE((SELECT * FROM inserted FOR JSON PATH), N'[]'),
        COALESCE(CONVERT(VARCHAR(45), CONNECTIONPROPERTY('client_net_address')), ''),
        SYSDATETIME(),
        CONVERT(NVARCHAR(50), SESSION_CONTEXT(N'user_ref'));
END
GO

CREATE OR ALTER TRIGGER dbo.[trg_audit_bayi_lahir] ON dbo.[Bayi_Lahir]
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted) RETURN;
    DECLARE @aksi VARCHAR(40) =
        CASE WHEN EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted) THEN 'UPDATE'
             WHEN EXISTS (SELECT 1 FROM inserted) THEN 'INSERT'
             ELSE 'DELETE' END;
    INSERT INTO dbo.[Audit_Log] ([akun_id], [aksi], [tabel], [id_baris], [nilai_lama], [nilai_baru], [ip_address], [waktu], [user_ref])
    SELECT
        TRY_CAST(SESSION_CONTEXT(N'akun_id') AS UNIQUEIDENTIFIER),
        @aksi,
        N'Bayi_Lahir',
        CAST(COALESCE((SELECT TOP 1 [bayi_id] FROM deleted), (SELECT TOP 1 [bayi_id] FROM inserted)) AS VARCHAR(40)),
        COALESCE((SELECT * FROM deleted FOR JSON PATH), N'[]'),
        COALESCE((SELECT * FROM inserted FOR JSON PATH), N'[]'),
        COALESCE(CONVERT(VARCHAR(45), CONNECTIONPROPERTY('client_net_address')), ''),
        SYSDATETIME(),
        CONVERT(NVARCHAR(50), SESSION_CONTEXT(N'user_ref'));
END
GO

CREATE OR ALTER TRIGGER dbo.[trg_audit_asuhan_bbl] ON dbo.[Asuhan_BBL]
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted) RETURN;
    DECLARE @aksi VARCHAR(40) =
        CASE WHEN EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted) THEN 'UPDATE'
             WHEN EXISTS (SELECT 1 FROM inserted) THEN 'INSERT'
             ELSE 'DELETE' END;
    INSERT INTO dbo.[Audit_Log] ([akun_id], [aksi], [tabel], [id_baris], [nilai_lama], [nilai_baru], [ip_address], [waktu], [user_ref])
    SELECT
        TRY_CAST(SESSION_CONTEXT(N'akun_id') AS UNIQUEIDENTIFIER),
        @aksi,
        N'Asuhan_BBL',
        CAST(COALESCE((SELECT TOP 1 [asuhan_bbl_id] FROM deleted), (SELECT TOP 1 [asuhan_bbl_id] FROM inserted)) AS VARCHAR(40)),
        COALESCE((SELECT * FROM deleted FOR JSON PATH), N'[]'),
        COALESCE((SELECT * FROM inserted FOR JSON PATH), N'[]'),
        COALESCE(CONVERT(VARCHAR(45), CONNECTIONPROPERTY('client_net_address')), ''),
        SYSDATETIME(),
        CONVERT(NVARCHAR(50), SESSION_CONTEXT(N'user_ref'));
END
GO

CREATE OR ALTER TRIGGER dbo.[trg_audit_pemeriksaan_bayi] ON dbo.[Pemeriksaan_Bayi]
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted) RETURN;
    DECLARE @aksi VARCHAR(40) =
        CASE WHEN EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted) THEN 'UPDATE'
             WHEN EXISTS (SELECT 1 FROM inserted) THEN 'INSERT'
             ELSE 'DELETE' END;
    INSERT INTO dbo.[Audit_Log] ([akun_id], [aksi], [tabel], [id_baris], [nilai_lama], [nilai_baru], [ip_address], [waktu], [user_ref])
    SELECT
        TRY_CAST(SESSION_CONTEXT(N'akun_id') AS UNIQUEIDENTIFIER),
        @aksi,
        N'Pemeriksaan_Bayi',
        CAST(COALESCE((SELECT TOP 1 [pemeriksaan_bayi_id] FROM deleted), (SELECT TOP 1 [pemeriksaan_bayi_id] FROM inserted)) AS VARCHAR(40)),
        COALESCE((SELECT * FROM deleted FOR JSON PATH), N'[]'),
        COALESCE((SELECT * FROM inserted FOR JSON PATH), N'[]'),
        COALESCE(CONVERT(VARCHAR(45), CONNECTIONPROPERTY('client_net_address')), ''),
        SYSDATETIME(),
        CONVERT(NVARCHAR(50), SESSION_CONTEXT(N'user_ref'));
END
GO

CREATE OR ALTER TRIGGER dbo.[trg_audit_imunisasi_pasien] ON dbo.[Imunisasi_Pasien]
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted) RETURN;
    DECLARE @aksi VARCHAR(40) =
        CASE WHEN EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted) THEN 'UPDATE'
             WHEN EXISTS (SELECT 1 FROM inserted) THEN 'INSERT'
             ELSE 'DELETE' END;
    INSERT INTO dbo.[Audit_Log] ([akun_id], [aksi], [tabel], [id_baris], [nilai_lama], [nilai_baru], [ip_address], [waktu], [user_ref])
    SELECT
        TRY_CAST(SESSION_CONTEXT(N'akun_id') AS UNIQUEIDENTIFIER),
        @aksi,
        N'Imunisasi_Pasien',
        CAST(COALESCE((SELECT TOP 1 [imunisasi_id] FROM deleted), (SELECT TOP 1 [imunisasi_id] FROM inserted)) AS VARCHAR(40)),
        COALESCE((SELECT * FROM deleted FOR JSON PATH), N'[]'),
        COALESCE((SELECT * FROM inserted FOR JSON PATH), N'[]'),
        COALESCE(CONVERT(VARCHAR(45), CONNECTIONPROPERTY('client_net_address')), ''),
        SYSDATETIME(),
        CONVERT(NVARCHAR(50), SESSION_CONTEXT(N'user_ref'));
END
GO

CREATE OR ALTER TRIGGER dbo.[trg_audit_pelayanan_kb] ON dbo.[Pelayanan_KB]
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted) RETURN;
    DECLARE @aksi VARCHAR(40) =
        CASE WHEN EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted) THEN 'UPDATE'
             WHEN EXISTS (SELECT 1 FROM inserted) THEN 'INSERT'
             ELSE 'DELETE' END;
    INSERT INTO dbo.[Audit_Log] ([akun_id], [aksi], [tabel], [id_baris], [nilai_lama], [nilai_baru], [ip_address], [waktu], [user_ref])
    SELECT
        TRY_CAST(SESSION_CONTEXT(N'akun_id') AS UNIQUEIDENTIFIER),
        @aksi,
        N'Pelayanan_KB',
        CAST(COALESCE((SELECT TOP 1 [kb_id] FROM deleted), (SELECT TOP 1 [kb_id] FROM inserted)) AS VARCHAR(40)),
        COALESCE((SELECT * FROM deleted FOR JSON PATH), N'[]'),
        COALESCE((SELECT * FROM inserted FOR JSON PATH), N'[]'),
        COALESCE(CONVERT(VARCHAR(45), CONNECTIONPROPERTY('client_net_address')), ''),
        SYSDATETIME(),
        CONVERT(NVARCHAR(50), SESSION_CONTEXT(N'user_ref'));
END
GO

CREATE OR ALTER TRIGGER dbo.[trg_audit_rawat_inap] ON dbo.[Rawat_Inap]
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted) RETURN;
    DECLARE @aksi VARCHAR(40) =
        CASE WHEN EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted) THEN 'UPDATE'
             WHEN EXISTS (SELECT 1 FROM inserted) THEN 'INSERT'
             ELSE 'DELETE' END;
    INSERT INTO dbo.[Audit_Log] ([akun_id], [aksi], [tabel], [id_baris], [nilai_lama], [nilai_baru], [ip_address], [waktu], [user_ref])
    SELECT
        TRY_CAST(SESSION_CONTEXT(N'akun_id') AS UNIQUEIDENTIFIER),
        @aksi,
        N'Rawat_Inap',
        CAST(COALESCE((SELECT TOP 1 [rawat_inap_id] FROM deleted), (SELECT TOP 1 [rawat_inap_id] FROM inserted)) AS VARCHAR(40)),
        COALESCE((SELECT * FROM deleted FOR JSON PATH), N'[]'),
        COALESCE((SELECT * FROM inserted FOR JSON PATH), N'[]'),
        COALESCE(CONVERT(VARCHAR(45), CONNECTIONPROPERTY('client_net_address')), ''),
        SYSDATETIME(),
        CONVERT(NVARCHAR(50), SESSION_CONTEXT(N'user_ref'));
END
GO

CREATE OR ALTER TRIGGER dbo.[trg_audit_tempat_tidur] ON dbo.[Tempat_Tidur]
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted) RETURN;
    DECLARE @aksi VARCHAR(40) =
        CASE WHEN EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted) THEN 'UPDATE'
             WHEN EXISTS (SELECT 1 FROM inserted) THEN 'INSERT'
             ELSE 'DELETE' END;
    INSERT INTO dbo.[Audit_Log] ([akun_id], [aksi], [tabel], [id_baris], [nilai_lama], [nilai_baru], [ip_address], [waktu], [user_ref])
    SELECT
        TRY_CAST(SESSION_CONTEXT(N'akun_id') AS UNIQUEIDENTIFIER),
        @aksi,
        N'Tempat_Tidur',
        CAST(COALESCE((SELECT TOP 1 [bed_id] FROM deleted), (SELECT TOP 1 [bed_id] FROM inserted)) AS VARCHAR(40)),
        COALESCE((SELECT * FROM deleted FOR JSON PATH), N'[]'),
        COALESCE((SELECT * FROM inserted FOR JSON PATH), N'[]'),
        COALESCE(CONVERT(VARCHAR(45), CONNECTIONPROPERTY('client_net_address')), ''),
        SYSDATETIME(),
        CONVERT(NVARCHAR(50), SESSION_CONTEXT(N'user_ref'));
END
GO

CREATE OR ALTER TRIGGER dbo.[trg_audit_operasi] ON dbo.[Operasi]
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted) RETURN;
    DECLARE @aksi VARCHAR(40) =
        CASE WHEN EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted) THEN 'UPDATE'
             WHEN EXISTS (SELECT 1 FROM inserted) THEN 'INSERT'
             ELSE 'DELETE' END;
    INSERT INTO dbo.[Audit_Log] ([akun_id], [aksi], [tabel], [id_baris], [nilai_lama], [nilai_baru], [ip_address], [waktu], [user_ref])
    SELECT
        TRY_CAST(SESSION_CONTEXT(N'akun_id') AS UNIQUEIDENTIFIER),
        @aksi,
        N'Operasi',
        CAST(COALESCE((SELECT TOP 1 [operasi_id] FROM deleted), (SELECT TOP 1 [operasi_id] FROM inserted)) AS VARCHAR(40)),
        COALESCE((SELECT * FROM deleted FOR JSON PATH), N'[]'),
        COALESCE((SELECT * FROM inserted FOR JSON PATH), N'[]'),
        COALESCE(CONVERT(VARCHAR(45), CONNECTIONPROPERTY('client_net_address')), ''),
        SYSDATETIME(),
        CONVERT(NVARCHAR(50), SESSION_CONTEXT(N'user_ref'));
END
GO

CREATE OR ALTER TRIGGER dbo.[trg_audit_order_penunjang] ON dbo.[Order_Penunjang]
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted) RETURN;
    DECLARE @aksi VARCHAR(40) =
        CASE WHEN EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted) THEN 'UPDATE'
             WHEN EXISTS (SELECT 1 FROM inserted) THEN 'INSERT'
             ELSE 'DELETE' END;
    INSERT INTO dbo.[Audit_Log] ([akun_id], [aksi], [tabel], [id_baris], [nilai_lama], [nilai_baru], [ip_address], [waktu], [user_ref])
    SELECT
        TRY_CAST(SESSION_CONTEXT(N'akun_id') AS UNIQUEIDENTIFIER),
        @aksi,
        N'Order_Penunjang',
        CAST(COALESCE((SELECT TOP 1 [order_id] FROM deleted), (SELECT TOP 1 [order_id] FROM inserted)) AS VARCHAR(40)),
        COALESCE((SELECT * FROM deleted FOR JSON PATH), N'[]'),
        COALESCE((SELECT * FROM inserted FOR JSON PATH), N'[]'),
        COALESCE(CONVERT(VARCHAR(45), CONNECTIONPROPERTY('client_net_address')), ''),
        SYSDATETIME(),
        CONVERT(NVARCHAR(50), SESSION_CONTEXT(N'user_ref'));
END
GO

CREATE OR ALTER TRIGGER dbo.[trg_audit_obat] ON dbo.[Obat]
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted) RETURN;
    DECLARE @aksi VARCHAR(40) =
        CASE WHEN EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted) THEN 'UPDATE'
             WHEN EXISTS (SELECT 1 FROM inserted) THEN 'INSERT'
             ELSE 'DELETE' END;
    INSERT INTO dbo.[Audit_Log] ([akun_id], [aksi], [tabel], [id_baris], [nilai_lama], [nilai_baru], [ip_address], [waktu], [user_ref])
    SELECT
        TRY_CAST(SESSION_CONTEXT(N'akun_id') AS UNIQUEIDENTIFIER),
        @aksi,
        N'Obat',
        CAST(COALESCE((SELECT TOP 1 [obat_id] FROM deleted), (SELECT TOP 1 [obat_id] FROM inserted)) AS VARCHAR(40)),
        COALESCE((SELECT * FROM deleted FOR JSON PATH), N'[]'),
        COALESCE((SELECT * FROM inserted FOR JSON PATH), N'[]'),
        COALESCE(CONVERT(VARCHAR(45), CONNECTIONPROPERTY('client_net_address')), ''),
        SYSDATETIME(),
        CONVERT(NVARCHAR(50), SESSION_CONTEXT(N'user_ref'));
END
GO

CREATE OR ALTER TRIGGER dbo.[trg_audit_batch_obat] ON dbo.[Batch_Obat]
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted) RETURN;
    DECLARE @aksi VARCHAR(40) =
        CASE WHEN EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted) THEN 'UPDATE'
             WHEN EXISTS (SELECT 1 FROM inserted) THEN 'INSERT'
             ELSE 'DELETE' END;
    INSERT INTO dbo.[Audit_Log] ([akun_id], [aksi], [tabel], [id_baris], [nilai_lama], [nilai_baru], [ip_address], [waktu], [user_ref])
    SELECT
        TRY_CAST(SESSION_CONTEXT(N'akun_id') AS UNIQUEIDENTIFIER),
        @aksi,
        N'Batch_Obat',
        CAST(COALESCE((SELECT TOP 1 [batch_id] FROM deleted), (SELECT TOP 1 [batch_id] FROM inserted)) AS VARCHAR(40)),
        COALESCE((SELECT * FROM deleted FOR JSON PATH), N'[]'),
        COALESCE((SELECT * FROM inserted FOR JSON PATH), N'[]'),
        COALESCE(CONVERT(VARCHAR(45), CONNECTIONPROPERTY('client_net_address')), ''),
        SYSDATETIME(),
        CONVERT(NVARCHAR(50), SESSION_CONTEXT(N'user_ref'));
END
GO

CREATE OR ALTER TRIGGER dbo.[trg_audit_stok_batch] ON dbo.[Stok_Batch]
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted) RETURN;
    DECLARE @aksi VARCHAR(40) =
        CASE WHEN EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted) THEN 'UPDATE'
             WHEN EXISTS (SELECT 1 FROM inserted) THEN 'INSERT'
             ELSE 'DELETE' END;
    INSERT INTO dbo.[Audit_Log] ([akun_id], [aksi], [tabel], [id_baris], [nilai_lama], [nilai_baru], [ip_address], [waktu], [user_ref])
    SELECT
        TRY_CAST(SESSION_CONTEXT(N'akun_id') AS UNIQUEIDENTIFIER),
        @aksi,
        N'Stok_Batch',
        CAST(COALESCE((SELECT TOP 1 [batch_id] FROM deleted), (SELECT TOP 1 [batch_id] FROM inserted)) AS VARCHAR(40)),
        COALESCE((SELECT * FROM deleted FOR JSON PATH), N'[]'),
        COALESCE((SELECT * FROM inserted FOR JSON PATH), N'[]'),
        COALESCE(CONVERT(VARCHAR(45), CONNECTIONPROPERTY('client_net_address')), ''),
        SYSDATETIME(),
        CONVERT(NVARCHAR(50), SESSION_CONTEXT(N'user_ref'));
END
GO

CREATE OR ALTER TRIGGER dbo.[trg_audit_resep] ON dbo.[Resep]
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted) RETURN;
    DECLARE @aksi VARCHAR(40) =
        CASE WHEN EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted) THEN 'UPDATE'
             WHEN EXISTS (SELECT 1 FROM inserted) THEN 'INSERT'
             ELSE 'DELETE' END;
    INSERT INTO dbo.[Audit_Log] ([akun_id], [aksi], [tabel], [id_baris], [nilai_lama], [nilai_baru], [ip_address], [waktu], [user_ref])
    SELECT
        TRY_CAST(SESSION_CONTEXT(N'akun_id') AS UNIQUEIDENTIFIER),
        @aksi,
        N'Resep',
        CAST(COALESCE((SELECT TOP 1 [resep_id] FROM deleted), (SELECT TOP 1 [resep_id] FROM inserted)) AS VARCHAR(40)),
        COALESCE((SELECT * FROM deleted FOR JSON PATH), N'[]'),
        COALESCE((SELECT * FROM inserted FOR JSON PATH), N'[]'),
        COALESCE(CONVERT(VARCHAR(45), CONNECTIONPROPERTY('client_net_address')), ''),
        SYSDATETIME(),
        CONVERT(NVARCHAR(50), SESSION_CONTEXT(N'user_ref'));
END
GO

CREATE OR ALTER TRIGGER dbo.[trg_audit_pengeluaran_obat] ON dbo.[Pengeluaran_Obat]
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted) RETURN;
    DECLARE @aksi VARCHAR(40) =
        CASE WHEN EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted) THEN 'UPDATE'
             WHEN EXISTS (SELECT 1 FROM inserted) THEN 'INSERT'
             ELSE 'DELETE' END;
    INSERT INTO dbo.[Audit_Log] ([akun_id], [aksi], [tabel], [id_baris], [nilai_lama], [nilai_baru], [ip_address], [waktu], [user_ref])
    SELECT
        TRY_CAST(SESSION_CONTEXT(N'akun_id') AS UNIQUEIDENTIFIER),
        @aksi,
        N'Pengeluaran_Obat',
        CAST(COALESCE((SELECT TOP 1 [pengeluaran_id] FROM deleted), (SELECT TOP 1 [pengeluaran_id] FROM inserted)) AS VARCHAR(40)),
        COALESCE((SELECT * FROM deleted FOR JSON PATH), N'[]'),
        COALESCE((SELECT * FROM inserted FOR JSON PATH), N'[]'),
        COALESCE(CONVERT(VARCHAR(45), CONNECTIONPROPERTY('client_net_address')), ''),
        SYSDATETIME(),
        CONVERT(NVARCHAR(50), SESSION_CONTEXT(N'user_ref'));
END
GO

CREATE OR ALTER TRIGGER dbo.[trg_audit_tagihan] ON dbo.[Tagihan]
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted) RETURN;
    DECLARE @aksi VARCHAR(40) =
        CASE WHEN EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted) THEN 'UPDATE'
             WHEN EXISTS (SELECT 1 FROM inserted) THEN 'INSERT'
             ELSE 'DELETE' END;
    INSERT INTO dbo.[Audit_Log] ([akun_id], [aksi], [tabel], [id_baris], [nilai_lama], [nilai_baru], [ip_address], [waktu], [user_ref])
    SELECT
        TRY_CAST(SESSION_CONTEXT(N'akun_id') AS UNIQUEIDENTIFIER),
        @aksi,
        N'Tagihan',
        CAST(COALESCE((SELECT TOP 1 [tagihan_id] FROM deleted), (SELECT TOP 1 [tagihan_id] FROM inserted)) AS VARCHAR(40)),
        COALESCE((SELECT * FROM deleted FOR JSON PATH), N'[]'),
        COALESCE((SELECT * FROM inserted FOR JSON PATH), N'[]'),
        COALESCE(CONVERT(VARCHAR(45), CONNECTIONPROPERTY('client_net_address')), ''),
        SYSDATETIME(),
        CONVERT(NVARCHAR(50), SESSION_CONTEXT(N'user_ref'));
END
GO

CREATE OR ALTER TRIGGER dbo.[trg_audit_pembayaran] ON dbo.[Pembayaran]
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted) RETURN;
    DECLARE @aksi VARCHAR(40) =
        CASE WHEN EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted) THEN 'UPDATE'
             WHEN EXISTS (SELECT 1 FROM inserted) THEN 'INSERT'
             ELSE 'DELETE' END;
    INSERT INTO dbo.[Audit_Log] ([akun_id], [aksi], [tabel], [id_baris], [nilai_lama], [nilai_baru], [ip_address], [waktu], [user_ref])
    SELECT
        TRY_CAST(SESSION_CONTEXT(N'akun_id') AS UNIQUEIDENTIFIER),
        @aksi,
        N'Pembayaran',
        CAST(COALESCE((SELECT TOP 1 [pembayaran_id] FROM deleted), (SELECT TOP 1 [pembayaran_id] FROM inserted)) AS VARCHAR(40)),
        COALESCE((SELECT * FROM deleted FOR JSON PATH), N'[]'),
        COALESCE((SELECT * FROM inserted FOR JSON PATH), N'[]'),
        COALESCE(CONVERT(VARCHAR(45), CONNECTIONPROPERTY('client_net_address')), ''),
        SYSDATETIME(),
        CONVERT(NVARCHAR(50), SESSION_CONTEXT(N'user_ref'));
END
GO

CREATE OR ALTER TRIGGER dbo.[trg_audit_logs_immutable] ON dbo.[Audit_Log]
AFTER UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted) RETURN;
    THROW 50001, 'Audit_Log bersifat append-only: UPDATE/DELETE ditolak.', 1;
END
GO
