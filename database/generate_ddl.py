#!/usr/bin/env python3
"""Generate SQL Server DDL from the data dictionary in TSD.md (section 4.3 + 4.4).

Ponytail: the data dictionary already exists as a markdown table. Hand-typing 800
columns is 10x the work and drifts. Parse it instead; re-run when TSD changes.

Outputs:
  database/03_ddl_schema_gabungan.sql   -- 95 tables + indexes + FKs (final-state columns)
  database/04_ddl_ekstensi_bidan_v3.sql -- 2 newborn-care tables (total 97)

Note: TSD section 5 describes 04 as ALTERing v3 columns into 03. We emit the
FINAL column state in 03 instead (email, pasien_id, sub_peran, catatan_pulang,
5-role CHECK). Same end state on a fresh DB, no fragile ALTER NOT NULL dance.
"""
import re
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
TSD = (ROOT / "TSD.md").read_text(encoding="utf-8")

TABLE_RE = re.compile(r"^##### (\d+)\.\s+`([^`]+)`")
COL_RE = re.compile(r"^\|\s*`([^`]+)`\s*\|\s*`([^`]+)`\s*\|\s*`([^`]+)`\s*\|\s*(.*?)\s*\|\s*$")
FK_RE = re.compile(r"FK\s*→\s*`([A-Za-z_]+)\.([A-Za-z_]+)`")
DEF_RE = re.compile(r"DEFAULT\s+([A-Za-z0-9_()',. ]+?)(?:\s*[;`]|$)")
CHK_SECTION_RE = re.compile(r"^\|\s*`?(CHECK|UNIQUE INDEX|INDEX)`?\s*\|\s*`([^`]+)`\s*\|\s*`([^`]+)`\s*\|\s*(.+?)\s*\|\s*$")

NEWBORN = {"Asuhan_BBL", "Pemeriksaan_Bayi"}  # live in 04


def parse_tables(text):
    """Return ordered list of (no, name, [ {col,type,null,ket} ])."""
    lines = text.splitlines()
    tables, current = [], None
    in_dict = False
    for ln in lines:
        if ln.startswith("### 4.3"):
            in_dict = True
            continue
        if in_dict and ln.startswith("### 4.4"):
            break
        if not in_dict:
            continue
        m = TABLE_RE.match(ln)
        if m:
            current = {"no": int(m.group(1)), "name": m.group(2), "cols": []}
            tables.append(current)
            continue
        if current is None:
            continue
        c = COL_RE.match(ln)
        if c:
            current["cols"].append(
                {"col": c.group(1), "type": c.group(2), "null": c.group(3), "ket": c.group(4)}
            )
    return tables


def parse_constraints(text):
    """Return (checks, indexes) from section 4.4."""
    checks, indexes = [], []
    in_sec = False
    for ln in text.splitlines():
        if ln.startswith("### 4.4"):
            in_sec = True
            continue
        if in_sec and ln.startswith("## "):
            break
        if not in_sec:
            continue
        m = CHK_SECTION_RE.match(ln)
        if not m:
            continue
        kind, name, table, rule = m.groups()
        if kind == "CHECK":
            checks.append((name, table, rule))
        else:
            indexes.append((name, table, rule, kind == "UNIQUE INDEX"))
    return checks, indexes


def col_def(t, c, composite_pks):
    """Build one column definition line."""
    name, typ, ket = c["col"], c["type"], c["ket"]
    parts = [f"[{name}] {typ}"]
    if "IDENTITY" in ket:
        parts[0] = f"[{name}] {typ} IDENTITY(1,1)"
        parts.append("NOT NULL")
        return " ".join(parts)
    parts.append("NULL" if c["null"].strip() == "NULL" else "NOT NULL")
    if name in composite_pks:
        return " ".join(parts)  # PK declared at table level
    # FK-as-PK (mis. Staf_Medis.staf_id) tidak boleh diberi default GUID baru.
    if "PK" in ket and typ == "UNIQUEIDENTIFIER" and "DEFAULT" not in ket and not FK_RE.search(ket):
        parts.append("DEFAULT NEWSEQUENTIALID()")
    d = DEF_RE.search(ket)
    if d and "IDENTITY" not in ket:
        parts.append(f"DEFAULT {d.group(1).strip()}")
    if "PK" in ket:
        parts.append("PRIMARY KEY")
    return " ".join(parts)


def emit_table(t, checks_by_table):
    name, cols = t["name"], t["cols"]
    pk_cols = [c["col"] for c in cols if "PK (komposit)" in c["ket"]]
    if len(pk_cols) > 1:
        body = [col_def(t, c, set(pk_cols)) for c in cols]
        uniques = [c["col"] for c in cols if _is_plain_unique(c["ket"])]
        lines = [f"    {b}" for b in body]
        lines.append(f"    CONSTRAINT [PK_{name}] PRIMARY KEY ({', '.join('['+p+']' for p in pk_cols)})")
        for u in uniques:
            lines.append(f"    , CONSTRAINT [UQ_{name}_{u}] UNIQUE ([{u}])")
        out = f"CREATE TABLE dbo.[{name}] (\n" + ",\n".join(l.replace("    , ", "    ") for l in lines) + "\n);"
        return out
    body = [col_def(t, c, set()) for c in cols]
    for c in cols:
        if _is_plain_unique(c["ket"]):
            body.append(f"CONSTRAINT [UQ_{name}_{c['col']}] UNIQUE ([{c['col']}])")
    lines = ",\n".join(f"    {b}" for b in body)
    return f"CREATE TABLE dbo.[{name}] (\n{lines}\n);"


def _is_plain_unique(ket):
    for seg in ket.split(";"):
        s = seg.strip()
        if s.startswith("UNIQUE") and "bila" not in s and "(" not in s:
            return True
    return False


AUDIT_TABLES = [
    "Pasien", "Staf", "Akun_Pengguna", "Jadwal_Praktik", "Reservasi", "Kunjungan",
    "Pemeriksaan", "Alergi_Kondisi", "Kunjungan_Diagnosa", "Kehamilan", "Persalinan",
    "Bayi_Lahir", "Asuhan_BBL", "Pemeriksaan_Bayi", "Imunisasi_Pasien", "Pelayanan_KB",
    "Rawat_Inap", "Tempat_Tidur", "Operasi", "Order_Penunjang", "Obat", "Batch_Obat",
    "Stok_Batch", "Resep", "Pengeluaran_Obat", "Tagihan", "Pembayaran",
]

AUDIT_TRIGGER_SQL = """CREATE OR ALTER TRIGGER dbo.[trg_audit_{lower}] ON dbo.[{name}]
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @aksi VARCHAR(40) =
        CASE WHEN EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted) THEN 'UPDATE'
             WHEN EXISTS (SELECT 1 FROM inserted) THEN 'INSERT'
             ELSE 'DELETE' END;
    INSERT INTO dbo.[Audit_Log] ([akun_id], [aksi], [tabel], [id_baris], [nilai_lama], [nilai_baru], [ip_address], [waktu], [user_ref])
    SELECT
        TRY_CAST(SESSION_CONTEXT(N'akun_id') AS UNIQUEIDENTIFIER),
        @aksi,
        N'{name}',
        CAST(COALESCE((SELECT TOP 1 [{pk}] FROM deleted), (SELECT TOP 1 [{pk}] FROM inserted)) AS VARCHAR(40)),
        COALESCE((SELECT * FROM deleted FOR JSON PATH), N'[]'),
        COALESCE((SELECT * FROM inserted FOR JSON PATH), N'[]'),
        COALESCE(CONVERT(VARCHAR(45), CONNECTIONPROPERTY('client_net_address')), ''),
        SYSDATETIME(),
        CONVERT(NVARCHAR(50), SESSION_CONTEXT(N'user_ref'));
END
GO
"""

IMMUTABLE_TRIGGER_SQL = """CREATE OR ALTER TRIGGER dbo.[trg_audit_logs_immutable] ON dbo.[Audit_Log]
AFTER UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    THROW 50001, 'Audit_Log bersifat append-only: UPDATE/DELETE ditolak.', 1;
END
GO
"""


def emit_audit_triggers(tables):
    by_name = {t["name"]: t for t in tables}
    out = [
        "-- =====================================================================",
        "-- 07_audit_triggers.sql",
        "-- 27 trigger audit per tabel + trg_audit_logs_immutable (lihat TSD 1.3).",
        "-- Diturunkan otomatis oleh generate_ddl.py.",
        "-- SESSION_CONTEXT('akun_id') & ('user_ref') di-set backend per request.",
        "-- =====================================================================",
        "USE MiniWorldRS;",
        "GO",
        "",
    ]
    for name in AUDIT_TABLES:
        pk = by_name[name]["cols"][0]["col"]
        out.append(AUDIT_TRIGGER_SQL.format(lower=name.lower(), name=name, pk=pk))
    out.append(IMMUTABLE_TRIGGER_SQL)
    return "\n".join(out)


def main():
    tables = parse_tables(TSD)
    checks, indexes = parse_constraints(TSD)
    assert len(tables) == 97, f"expected 97 tables in dictionary, got {len(tables)}"

    base = [t for t in tables if t["name"] not in NEWBORN]
    ext = [t for t in tables if t["name"] in NEWBORN]
    assert len(base) == 95 and len(ext) == 2, (len(base), len(ext))

    # ---- foreign keys -------------------------------------------------
    fks = []
    for t in tables:
        for c in t["cols"]:
            m = FK_RE.search(c["ket"])
            if m:
                fks.append((t["name"], c["col"], m.group(1), m.group(2)))

    header = (
        "-- =====================================================================\n"
        "-- 03_ddl_schema_gabungan.sql\n"
        "-- Mini World Rumah Sakit + praktik mandiri bidan -- 95 tabel.\n"
        "-- Diturunkan otomatis dari TSD.md Bagian 4.3/4.4 oleh generate_ddl.py.\n"
        "-- Jalankan pada database kosong, lalu 04, 05, 06, 07, 08.\n"
        "-- =====================================================================\n"
        "USE MiniWorldRS;\nGO\nSET XACT_ABORT ON;\nGO\n\n"
    )

    def render(tset):
        out = []
        for t in tset:
            out.append(f"-- No. {t['no']}: {t['name']}")
            out.append(emit_table(t, {}))
            out.append("GO")
        return "\n".join(out)

    names = {t["name"] for t in tables}
    fk_sql = [
        "-- ===== Foreign keys (ditambahkan setelah semua tabel ada => siklus aman) ====="
    ]
    for tbl, col, rtbl, rcol in fks:
        if tbl not in names or rtbl not in names:
            continue
        cname = f"FK_{tbl}_{col}"
        fk_sql.append(
            f"ALTER TABLE dbo.[{tbl}] ADD CONSTRAINT [{cname}] "
            f"FOREIGN KEY ([{col}]) REFERENCES dbo.[{rtbl}] ([{rcol}]);"
        )
    fk_sql.append("GO")

    def render_checks(tset):
        keep = {t["name"] for t in tset}
        out = ["-- ===== CHECK constraints ====="]
        for cname, tbl, rule in checks:
            if tbl in keep:
                out.append(
                    f"ALTER TABLE dbo.[{tbl}] ADD CONSTRAINT [{cname}] "
                    f"CHECK ({rule.replace('`', '')});"
                )
        out.append("GO")
        return "\n".join(out)

    def render_indexes(tset):
        keep = {t["name"] for t in tset}
        out = ["-- ===== Indexes ====="]
        for iname, tbl, rule, uniq in indexes:
            if tbl not in keep:
                continue
            kw = "CREATE UNIQUE INDEX" if uniq else "CREATE INDEX"
            out.append(f"{kw} [{iname}] ON dbo.[{tbl}] {rule.replace('`', '')};")
        out.append("GO")
        return "\n".join(out)

    sql03 = header + render(base) + "\n\n" + "\n".join(fk_sql) + "\n\n" + render_checks(base) + "\n\n" + render_indexes(base) + "\n"

    sql04 = (
        "-- =====================================================================\n"
        "-- 04_ddl_ekstensi_bidan_v3.sql\n"
        "-- Ekstensi KIA: 2 tabel asuhan bayi baru lahir (total 97 tabel).\n"
        "-- (Kolom v3 lain -- email, pasien_id, sub_peran, catatan_pulang, CHECK\n"
        "--  peran 5 role -- sudah final di 03, lihat catatan generate_ddl.py)\n"
        "-- =====================================================================\n"
        "USE MiniWorldRS;\nGO\n\n"
        + render(ext)
        + "\n\n" + "\n".join(fk_sql) + "\n\n"
        + render_checks(ext) + "\n\n" + render_indexes(ext) + "\n"
    )

    (ROOT / "database" / "03_ddl_schema_gabungan.sql").write_text(sql03, encoding="utf-8")
    (ROOT / "database" / "04_ddl_ekstensi_bidan_v3.sql").write_text(sql04, encoding="utf-8")
    (ROOT / "database" / "07_audit_triggers.sql").write_text(emit_audit_triggers(tables), encoding="utf-8")

    print(f"tables: base={len(base)} ext={len(ext)} total={len(tables)}")
    print(f"fks: {len(fks)}  checks: {len(checks)}  indexes: {len(indexes)}")


if __name__ == "__main__":
    main()
