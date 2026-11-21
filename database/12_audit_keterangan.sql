-- =====================================================================
-- 12_audit_keterangan.sql
-- Migrasi DB existing: kolom keterangan pada Audit_Log (append-only).
-- Jalankan file ini, lalu jalankan ulang 07_audit_triggers.sql
-- (trigger memakai CREATE OR ALTER).
-- =====================================================================
USE MiniWorldRS;
GO

IF COL_LENGTH('dbo.Audit_Log', 'keterangan') IS NULL
    ALTER TABLE dbo.[Audit_Log] ADD [keterangan] NVARCHAR(200) NULL;
GO
