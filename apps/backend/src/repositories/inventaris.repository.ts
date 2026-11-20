import db from '../db/pool';

export interface ObatBaru {
  kode: string;
  namaGenerik: string;
  namaDagang?: string;
  kategori: string;
  bentuk: string;
  satuan: string;
  kekuatan?: string;
  golongan?: string;
  stokMinimum: number;
}

export class InventarisRepository {
  async listObat(limit: number, term: string | null): Promise<Record<string, unknown>[]> {
    const result = await db.query<Record<string, unknown>>(
      `SELECT TOP (@limit) o.obat_id, o.kode, o.nama_generik, o.nama_dagang, o.kategori,
              o.bentuk, o.satuan, o.stok_minimum, o.aktif,
              ISNULL(SUM(sb.jumlah), 0) AS stok_total
         FROM [Obat] o
         LEFT JOIN [Batch_Obat] bo ON bo.obat_id = o.obat_id
         LEFT JOIN [Stok_Batch] sb ON sb.batch_id = bo.batch_id
        WHERE @term IS NULL OR o.nama_generik LIKE @term OR o.kode LIKE @term
        GROUP BY o.obat_id, o.kode, o.nama_generik, o.nama_dagang, o.kategori,
                 o.bentuk, o.satuan, o.stok_minimum, o.aktif
        ORDER BY o.nama_generik ASC`,
      { limit, term }
    );
    return result.recordset;
  }

  async findObat(id: string): Promise<string | null> {
    const result = await db.query<{ obat_id: string }>(
      `SELECT TOP 1 obat_id FROM [Obat] WHERE obat_id = @id`,
      { id }
    );
    return result.recordset[0]?.obat_id ?? null;
  }

  async countDuplikat(namaGenerik: string, kategori: string): Promise<number> {
    const result = await db.query<{ jumlah: number }>(
      `SELECT COUNT(*) AS jumlah FROM [Obat] WHERE nama_generik = @nama AND kategori = @kategori`,
      { nama: namaGenerik, kategori }
    );
    return result.recordset[0]?.jumlah ?? 0;
  }

  async createObat(input: ObatBaru): Promise<Record<string, unknown> | undefined> {
    const result = await db.query<Record<string, unknown>>(
      `INSERT INTO [Obat]
         (kode, nama_generik, nama_dagang, kategori, bentuk, satuan, kekuatan, golongan, stok_minimum, aktif)
       OUTPUT INSERTED.*
       VALUES (@kode, @nama_generik, @nama_dagang, @kategori, @bentuk, @satuan, @kekuatan, @golongan, @stok_minimum, 1)`,
      {
        kode: input.kode,
        nama_generik: input.namaGenerik,
        nama_dagang: input.namaDagang ?? input.namaGenerik,
        kategori: input.kategori,
        bentuk: input.bentuk,
        satuan: input.satuan,
        kekuatan: input.kekuatan ?? '-',
        golongan: input.golongan ?? '-',
        stok_minimum: input.stokMinimum
      }
    );
    return result.recordset[0];
  }

  async updateObat(
    id: string,
    values: Record<string, unknown>
  ): Promise<Record<string, unknown> | undefined> {
    const allowed = ['nama_dagang', 'stok_minimum', 'aktif'];
    const keys = Object.keys(values);
    for (const key of keys) {
      if (!allowed.includes(key)) {
        throw new Error(`Kolom obat tidak valid: ${key}`);
      }
    }
    const assignments = keys.map((key) => `${key} = @${key}`).join(', ');
    const result = await db.query<Record<string, unknown>>(
      `UPDATE [Obat] SET ${assignments} OUTPUT INSERTED.* WHERE obat_id = @id`,
      { ...values, id }
    );
    return result.recordset[0];
  }

  async createBatch(input: {
    obatId: string;
    noBatch: string;
    tglKedaluwarsa: string;
    hargaBeli: number;
  }): Promise<string | null> {
    const result = await db.query<{ batch_id: string }>(
      `INSERT INTO [Batch_Obat] (obat_id, no_batch, tgl_kedaluwarsa, harga_beli, tgl_masuk)
       OUTPUT INSERTED.batch_id
       VALUES (@obat_id, @no_batch, @kedaluwarsa, @harga, SYSDATETIME())`,
      {
        obat_id: input.obatId,
        no_batch: input.noBatch,
        kedaluwarsa: input.tglKedaluwarsa,
        harga: input.hargaBeli
      }
    );
    return result.recordset[0]?.batch_id ?? null;
  }

  async addStok(batchId: string, gudangId: string, jumlah: number): Promise<void> {
    await db.query(
      `MERGE [Stok_Batch] AS target
         USING (SELECT @batch_id AS batch_id, @gudang_id AS gudang_id) AS src
         ON target.batch_id = src.batch_id AND target.gudang_id = src.gudang_id
       WHEN MATCHED THEN UPDATE SET jumlah = target.jumlah + @jumlah
       WHEN NOT MATCHED THEN INSERT (batch_id, gudang_id, jumlah) VALUES (src.batch_id, src.gudang_id, @jumlah);`,
      { batch_id: batchId, gudang_id: gudangId, jumlah }
    );
  }

  async insertStok(batchId: string, gudangId: string, jumlah: number): Promise<void> {
    await db.query(
      `INSERT INTO [Stok_Batch] (batch_id, gudang_id, jumlah) VALUES (@batch_id, @gudang_id, @jumlah)`,
      { batch_id: batchId, gudang_id: gudangId, jumlah }
    );
  }

  async addMutasi(input: {
    batchId: string;
    gudangId: string;
    stafId: string | null;
    jumlah: number;
    keterangan: string;
  }): Promise<void> {
    await db.query(
      `INSERT INTO [Mutasi_Stok] (batch_id, gudang_id, staf_id, jenis, jumlah, waktu, keterangan)
       VALUES (@batch_id, @gudang_id, @staf_id, 'MASUK', @jumlah, SYSDATETIME(), @keterangan)`,
      {
        batch_id: input.batchId,
        gudang_id: input.gudangId,
        staf_id: input.stafId,
        jumlah: input.jumlah,
        keterangan: input.keterangan
      }
    );
  }

  async listRiwayat(obatId: string, limit: number): Promise<Record<string, unknown>[]> {
    const result = await db.query<Record<string, unknown>>(
      `SELECT TOP (@limit) m.mutasi_id, m.jenis, m.jumlah, m.waktu, m.keterangan,
              bo.no_batch, g.nama AS gudang
         FROM [Mutasi_Stok] m
         JOIN [Batch_Obat] bo ON bo.batch_id = m.batch_id
         LEFT JOIN [Gudang] g ON g.gudang_id = m.gudang_id
        WHERE bo.obat_id = @id
        ORDER BY m.waktu DESC`,
      { id: obatId, limit }
    );
    return result.recordset;
  }

  async listBatch(obatId: string): Promise<Record<string, unknown>[]> {
    const result = await db.query<Record<string, unknown>>(
      `SELECT bo.batch_id, bo.no_batch, bo.tgl_kedaluwarsa, bo.harga_beli,
              ISNULL(SUM(sb.jumlah), 0) AS stok
         FROM [Batch_Obat] bo
         LEFT JOIN [Stok_Batch] sb ON sb.batch_id = bo.batch_id
        WHERE bo.obat_id = @id
        GROUP BY bo.batch_id, bo.no_batch, bo.tgl_kedaluwarsa, bo.harga_beli
        ORDER BY bo.tgl_kedaluwarsa ASC`,
      { id: obatId }
    );
    return result.recordset;
  }

  async listGudang(): Promise<Record<string, unknown>[]> {
    const result = await db.query<Record<string, unknown>>(
      `SELECT gudang_id, unit_id, nama, jenis FROM [Gudang] ORDER BY nama ASC`
    );
    return result.recordset;
  }

  async listStokGudang(gudangId: string): Promise<Record<string, unknown>[]> {
    const result = await db.query<Record<string, unknown>>(
      `SELECT sb.batch_id, sb.jumlah, bo.no_batch, bo.tgl_kedaluwarsa,
              o.obat_id, o.kode, o.nama_generik, o.satuan
         FROM [Stok_Batch] sb
         JOIN [Batch_Obat] bo ON bo.batch_id = sb.batch_id
         JOIN [Obat] o ON o.obat_id = bo.obat_id
        WHERE sb.gudang_id = @id
        ORDER BY bo.tgl_kedaluwarsa ASC`,
      { id: gudangId }
    );
    return result.recordset;
  }

  async pengeluaranResep(input: {
    resepId: string;
    gudangId: string;
    stafId: string;
    kunjunganId?: string;
  }): Promise<number> {
    const result = await db.query<{ kode_hasil: number }>(
      `DECLARE @kode INT;
       EXEC [dbo].[sp_pengeluaran_resep_fefo]
            @resep_id = @resep_id, @gudang_id = @gudang_id, @staf_id = @staf_id,
            @kunjungan_id = @kunjungan_id, @kode_hasil = @kode OUTPUT;
       SELECT @kode AS kode_hasil;`,
      {
        resep_id: input.resepId,
        gudang_id: input.gudangId,
        staf_id: input.stafId,
        kunjungan_id: input.kunjunganId ?? null
      }
    );
    return result.recordset[0]?.kode_hasil ?? -1;
  }

  async markResepDiserahkan(resepId: string): Promise<void> {
    await db.query(`UPDATE [Resep] SET status = 'DISERAHKAN' WHERE resep_id = @id`, { id: resepId });
  }
}

export default InventarisRepository;
