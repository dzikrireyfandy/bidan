import db from '../db/pool';

export interface BarisStokMentah {
  obat_id: string;
  kode: string;
  nama_generik: string;
  nama_dagang: string;
  kategori: string;
  satuan: string;
  stok_minimum: number;
  stok_aktif: number;
  stok_kedaluwarsa: number;
  tgl_exp_aktif_terdekat: string | null;
  tgl_exp_kedaluwarsa_terdekat: string | null;
}

export class DashboardRepository {
  /**
   * 100% READ-ONLY (SELECT-only): Mengambil tanggal hari ini & batas 3 bulan dalam zona Asia/Jakarta (WIB).
   */
  async getReferensiTanggalWib(): Promise<{ hari_ini: string; batas_3_bulan: string }> {
    const result = await db.query<{ hari_ini: string; batas_3_bulan: string }>(
      `SELECT CONVERT(VARCHAR(10), CAST(SYSDATETIME() AS DATE), 23) AS hari_ini,
              CONVERT(VARCHAR(10), DATEADD(MONTH, 3, CAST(SYSDATETIME() AS DATE)), 23) AS batas_3_bulan`
    );
    return (
      result.recordset[0] ?? {
        hari_ini: new Date().toISOString().slice(0, 10),
        batas_3_bulan: new Date().toISOString().slice(0, 10)
      }
    );
  }

  /**
   * 100% READ-ONLY (SELECT-only): Ringkasan jumlah kunjungan valid (non-koreksi, tidak dibatalkan) hari ini WIB.
   */
  async getRingkasanKunjunganHariIni(): Promise<{ total: number; selesai: number; berjalan: number }> {
    const result = await db.query<{ total: number; selesai: number; berjalan: number }>(
      `SELECT COUNT(*) AS total,
              ISNULL(SUM(CASE WHEN k.status = 'SELESAI' THEN 1 ELSE 0 END), 0) AS selesai,
              ISNULL(SUM(CASE WHEN k.status <> 'SELESAI' THEN 1 ELSE 0 END), 0) AS berjalan
         FROM [Kunjungan] k
         LEFT JOIN [Reservasi] r ON r.reservasi_id = k.reservasi_id
        WHERE k.tgl_masuk = CAST(SYSDATETIME() AS DATE)
          AND k.koreksi_dari_id IS NULL
          AND k.status <> 'BATAL'
          AND (r.reservasi_id IS NULL OR r.status <> 'DIBATALKAN')`
    );
    const row = result.recordset[0];
    return {
      total: Number(row?.total ?? 0),
      selesai: Number(row?.selesai ?? 0),
      berjalan: Number(row?.berjalan ?? 0)
    };
  }

  /**
   * 100% READ-ONLY (SELECT-only): Mengambil agregat stok aktif & kedaluwarsa seluruh item aktif.
   */
  async getAgregatStokObat(): Promise<BarisStokMentah[]> {
    const result = await db.query<BarisStokMentah>(
      `DECLARE @hariIni DATE = CAST(SYSDATETIME() AS DATE);
       SELECT o.obat_id,
              o.kode,
              o.nama_generik,
              o.nama_dagang,
              o.kategori,
              o.satuan,
              CAST(o.stok_minimum AS DECIMAL(18,2)) AS stok_minimum,
              CAST(ISNULL(SUM(CASE WHEN b.tgl_kedaluwarsa >= @hariIni THEN sb.jumlah ELSE 0 END), 0) AS DECIMAL(18,2)) AS stok_aktif,
              CAST(ISNULL(SUM(CASE WHEN b.tgl_kedaluwarsa < @hariIni THEN sb.jumlah ELSE 0 END), 0) AS DECIMAL(18,2)) AS stok_kedaluwarsa,
              CONVERT(VARCHAR(10), MIN(CASE WHEN b.tgl_kedaluwarsa >= @hariIni AND sb.jumlah > 0 THEN b.tgl_kedaluwarsa END), 23) AS tgl_exp_aktif_terdekat,
              CONVERT(VARCHAR(10), MIN(CASE WHEN b.tgl_kedaluwarsa < @hariIni AND sb.jumlah > 0 THEN b.tgl_kedaluwarsa END), 23) AS tgl_exp_kedaluwarsa_terdekat
         FROM [Obat] o
         LEFT JOIN [Batch_Obat] b ON b.obat_id = o.obat_id
         LEFT JOIN [Stok_Batch] sb ON sb.batch_id = b.batch_id
        WHERE o.aktif = 1
        GROUP BY o.obat_id, o.kode, o.nama_generik, o.nama_dagang, o.kategori, o.satuan, o.stok_minimum
        ORDER BY o.nama_generik ASC`
    );
    return result.recordset;
  }

  /**
   * 100% READ-ONLY (SELECT-only): Daftar tagihan belum lunas khusus Admin.
   */
  async getTagihanBelumLunasAdmin(limit: number): Promise<{
    total_berkas: number;
    total_sisa_tagihan: number;
    items: Record<string, unknown>[];
  }> {
    const summaryRes = await db.query<{ total_berkas: number; total_sisa: number }>(
      `SELECT COUNT(*) AS total_berkas,
              CAST(ISNULL(SUM(t.total_tagihan - t.total_dibayar), 0) AS DECIMAL(18,2)) AS total_sisa
         FROM [Tagihan] t
         INNER JOIN [Kunjungan] k ON k.kunjungan_id = t.kunjungan_id
         LEFT JOIN [Reservasi] r ON r.reservasi_id = k.reservasi_id
        WHERE t.status = 'BELUM_LUNAS'
          AND k.status <> 'BATAL'
          AND (r.reservasi_id IS NULL OR r.status <> 'DIBATALKAN')`
    );

    const itemsRes = await db.query<Record<string, unknown>>(
      `SELECT TOP (@limit)
              t.tagihan_id,
              t.kunjungan_id,
              CONCAT('INV-', REPLACE(CONVERT(VARCHAR(10), t.tgl_terbit, 23), '-', ''), '-', UPPER(SUBSTRING(CAST(t.tagihan_id AS VARCHAR(36)), 1, 6))) AS no_tagihan,
              CONVERT(VARCHAR(10), t.tgl_terbit, 23) AS tgl_terbit,
              p.no_rm,
              p.nama AS nama_pasien,
              CAST(t.total_tagihan AS DECIMAL(18,2)) AS total_tagihan,
              CAST(t.total_dibayar AS DECIMAL(18,2)) AS total_dibayar,
              CAST((t.total_tagihan - t.total_dibayar) AS DECIMAL(18,2)) AS sisa_tagihan,
              t.status
         FROM [Tagihan] t
         INNER JOIN [Kunjungan] k ON k.kunjungan_id = t.kunjungan_id
         INNER JOIN [Pasien] p ON p.pasien_id = k.pasien_id
         LEFT JOIN [Reservasi] r ON r.reservasi_id = k.reservasi_id
        WHERE t.status = 'BELUM_LUNAS'
          AND k.status <> 'BATAL'
          AND (r.reservasi_id IS NULL OR r.status <> 'DIBATALKAN')
        ORDER BY t.tgl_terbit DESC, t.tagihan_id DESC`,
      { limit }
    );

    return {
      total_berkas: Number(summaryRes.recordset[0]?.total_berkas ?? 0),
      total_sisa_tagihan: Number(summaryRes.recordset[0]?.total_sisa ?? 0),
      items: itemsRes.recordset.map((r) => ({
        ...r,
        total_tagihan: Number(r['total_tagihan'] ?? 0),
        total_dibayar: Number(r['total_dibayar'] ?? 0),
        sisa_tagihan: Number(r['sisa_tagihan'] ?? 0)
      }))
    };
  }
}

export default DashboardRepository;
