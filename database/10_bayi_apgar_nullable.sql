use MiniWorldRS

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Bayi_Lahir') AND name = 'apgar_1' AND is_nullable = 0)
  ALTER TABLE [Bayi_Lahir] ALTER COLUMN apgar_1 SMALLINT NULL;
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Bayi_Lahir') AND name = 'apgar_5' AND is_nullable = 0)
  ALTER TABLE [Bayi_Lahir] ALTER COLUMN apgar_5 SMALLINT NULL;
GO
