-- =====================================================================
-- 13_audit_scrub_password_hash.sql
-- Satu kali: hapus kunci password_hash dari baris Audit_Log lama.
-- Audit_Log append-only, jadi trigger immutable dimatikan sementara.
-- =====================================================================
USE MiniWorldRS;
GO

ALTER TABLE dbo.[Audit_Log] DISABLE TRIGGER [trg_audit_logs_immutable];
GO

DECLARE @i INT = 0;
WHILE @i < 20
BEGIN
    UPDATE dbo.[Audit_Log]
       SET nilai_lama = JSON_MODIFY(nilai_lama, CONCAT('$[', @i, '].password_hash'), NULL),
           nilai_baru = JSON_MODIFY(nilai_baru, CONCAT('$[', @i, '].password_hash'), NULL)
     WHERE nilai_lama LIKE '%"password_hash"%' OR nilai_baru LIKE '%"password_hash"%';
    SET @i += 1;
END
GO

ALTER TABLE dbo.[Audit_Log] ENABLE TRIGGER [trg_audit_logs_immutable];
GO
