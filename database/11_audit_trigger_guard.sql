DECLARE @def NVARCHAR(MAX), @sql NVARCHAR(MAX);
DECLARE cur CURSOR LOCAL FAST_FORWARD FOR
  SELECT OBJECT_DEFINITION(t.object_id)
    FROM sys.triggers t
   WHERE t.name LIKE 'trg_audit[_]%'
     AND t.name <> 'trg_audit_logs_immutable'
     AND t.is_disabled = 0;

OPEN cur;
FETCH NEXT FROM cur INTO @def;

WHILE @@FETCH_STATUS = 0
BEGIN
  IF @def NOT LIKE '%IF NOT EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted) RETURN;%'
  BEGIN
    SET @sql = REPLACE(@def, 'SET NOCOUNT ON;',
      'SET NOCOUNT ON;' + CHAR(13) + CHAR(10) +
      '    IF NOT EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted) RETURN;');
    SET @sql = STUFF(@sql, 1, CHARINDEX('TRIGGER', @sql) - 1, 'ALTER ');
    EXEC sp_executesql @sql;
  END
  FETCH NEXT FROM cur INTO @def;
END

CLOSE cur;
DEALLOCATE cur;
GO
