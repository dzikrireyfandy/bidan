import db from '../db/pool';

export interface Periode {
  dari: string | null;
  sampai: string | null;
  [key: string]: unknown;
}

export interface KontenBaru {
  tipe: string;
  judul: string;
  isi: string;
  media_url: string;
  urutan: number;
  terbit: boolean;
  [key: string]: unknown;
}

export class LaporanRepository {
  async ringkasanKunjungan(periode: Periode): Promise<Record<string, unknown>> {
    const result = await db.query<Record<string, unknown>>(
      `SELECT COUNT(*) AS total_kunjungan,
              SUM(CASE WHEN jenis_kunjungan = 'RAWAT_JALAN' THEN 1 ELSE 0 END) AS rawat_jalan,
              SUM(CASE WHEN jenis_kunjungan = 'RAWAT_INAP' THEN 1 ELSE 0 END) AS rawat_inap
         FROM [Kunjungan]
        WHERE (@dari IS NULL OR tgl_masuk >= CAST(@dari AS DATE))
          AND (@sampai IS NULL OR tgl_masuk < DATEADD(DAY, 1, CAST(@sampai AS DATE)))`,
      periode
    );
    return result.recordset[0] ?? {};
  }

  async ringkasanPendapatan(periode: Periode): Promise<Record<string, unknown>> {
    const result = await db.query<Record<string, unknown>>(
      `SELECT ISNULL(SUM(pb.jumlah), 0) AS total_pendapatan
         FROM [Pembayaran] pb
        WHERE (@dari IS NULL OR pb.waktu_bayar >= CAST(@dari AS DATE))
          AND (@sampai IS NULL OR pb.waktu_bayar < DATEADD(DAY, 1, CAST(@sampai AS DATE)))`,
      periode
    );
    return result.recordset[0] ?? {};
  }

  async ringkasanRawatInap(periode: Periode): Promise<Record<string, unknown>> {
    const result = await db.query<Record<string, unknown>>(
      `SELECT CAST(COUNT(*) AS DECIMAL(10,2)) AS episode_rawat_inap
         FROM [Rawat_Inap]
        WHERE (@dari IS NULL OR tgl_masuk >= CAST(@dari AS DATE))
          AND (@sampai IS NULL OR tgl_masuk < DATEADD(DAY, 1, CAST(@sampai AS DATE)))`,
      periode
    );
    return result.recordset[0] ?? {};
  }

  async trenLayanan(limit: number, periode: Periode): Promise<Record<string, unknown>[]> {
    const result = await db.query<Record<string, unknown>>(
      `SELECT TOP (@limit) d.kode_icd, d.nama, COUNT(*) AS jumlah
         FROM [Kunjungan_Diagnosa] kd
         JOIN [Diagnosa] d ON d.diagnosa_id = kd.diagnosa_id
         JOIN [Kunjungan] k ON k.kunjungan_id = kd.kunjungan_id
        WHERE (@dari IS NULL OR k.tgl_masuk >= CAST(@dari AS DATE))
          AND (@sampai IS NULL OR k.tgl_masuk < DATEADD(DAY, 1, CAST(@sampai AS DATE)))
        GROUP BY d.kode_icd, d.nama
        ORDER BY jumlah DESC`,
      { limit, ...periode }
    );
    return result.recordset;
  }

  async jamTersibuk(): Promise<Record<string, unknown>[]> {
    const result = await db.query<Record<string, unknown>>(
      `SELECT DATEPART(HOUR, created_at) AS jam, COUNT(*) AS jumlah
         FROM [Kunjungan]
        WHERE created_at >= DATEADD(DAY, -30, SYSDATETIME())
        GROUP BY DATEPART(HOUR, created_at)
        ORDER BY jumlah DESC`
    );
    return result.recordset;
  }

  async perbandingan(periode: Periode): Promise<Record<string, unknown>[]> {
    const result = await db.query<Record<string, unknown>>(
      `SELECT CAST(pb.waktu_bayar AS DATE) AS tanggal,
              COUNT(DISTINCT pb.tagihan_id) AS jumlah_transaksi,
              SUM(pb.jumlah) AS total_pendapatan,
              CAST(SUM(pb.jumlah) / NULLIF(COUNT(DISTINCT pb.tagihan_id), 0) AS DECIMAL(18,2)) AS rata_rata_tagihan
         FROM [Pembayaran] pb
        WHERE (@dari IS NULL OR pb.waktu_bayar >= CAST(@dari AS DATE))
          AND (@sampai IS NULL OR pb.waktu_bayar < DATEADD(DAY, 1, CAST(@sampai AS DATE)))
        GROUP BY CAST(pb.waktu_bayar AS DATE)
        ORDER BY tanggal ASC`,
      periode
    );
    return result.recordset;
  }

  async export(periode: Periode): Promise<Record<string, unknown>[]> {
    const result = await db.query<Record<string, unknown>>(
      `SELECT k.kunjungan_id, k.tgl_masuk, k.jenis_kunjungan, p.nama AS nama_pasien,
              t.total_tagihan, t.total_dibayar, t.status
         FROM [Kunjungan] k
         JOIN [Pasien] p ON p.pasien_id = k.pasien_id
         LEFT JOIN [Tagihan] t ON t.kunjungan_id = k.kunjungan_id
        WHERE (@dari IS NULL OR k.tgl_masuk >= CAST(@dari AS DATE))
          AND (@sampai IS NULL OR k.tgl_masuk < DATEADD(DAY, 1, CAST(@sampai AS DATE)))
        ORDER BY k.tgl_masuk DESC`,
      periode
    );
    return result.recordset;
  }

  async listKonten(limit: number): Promise<Record<string, unknown>[]> {
    const result = await db.query<Record<string, unknown>>(
      `SELECT TOP (@limit) * FROM [Konten_Publik] ORDER BY urutan ASC`,
      { limit }
    );
    return result.recordset;
  }

  async createKonten(body: KontenBaru): Promise<Record<string, unknown> | undefined> {
    const result = await db.query<Record<string, unknown>>(
      `INSERT INTO [Konten_Publik] (tipe, judul, isi, media_url, urutan, terbit)
       OUTPUT INSERTED.*
       VALUES (@tipe, @judul, @isi, @media_url, @urutan, @terbit)`,
      body
    );
    return result.recordset[0];
  }

  async updateKonten(
    id: string,
    values: Record<string, unknown>
  ): Promise<Record<string, unknown> | undefined> {
    const allowed = ['tipe', 'judul', 'isi', 'media_url', 'urutan', 'terbit'];
    const keys = Object.keys(values);
    for (const key of keys) {
      if (!allowed.includes(key)) {
        throw new Error(`Kolom konten tidak valid: ${key}`);
      }
    }
    const assignments = keys.map((key) => `${key} = @${key}`).join(', ');
    const result = await db.query<Record<string, unknown>>(
      `UPDATE [Konten_Publik] SET ${assignments}, updated_at = SYSDATETIME()
       OUTPUT INSERTED.* WHERE konten_id = @id`,
      { ...values, id }
    );
    return result.recordset[0];
  }

  async softDeleteKonten(id: string): Promise<Record<string, unknown> | undefined> {
    const result = await db.query<Record<string, unknown>>(
      `UPDATE [Konten_Publik] SET terbit = 0, updated_at = SYSDATETIME()
       OUTPUT INSERTED.* WHERE konten_id = @id`,
      { id }
    );
    return result.recordset[0];
  }

  async listNotifikasi(limit: number): Promise<Record<string, unknown>[]> {
    const result = await db.query<Record<string, unknown>>(
      `SELECT TOP (@limit) * FROM [Notifikasi_Log] ORDER BY created_at DESC`,
      { limit }
    );
    return result.recordset;
  }

  async kirimUlangNotifikasi(id: string): Promise<Record<string, unknown> | undefined> {
    const result = await db.query<Record<string, unknown>>(
      `UPDATE [Notifikasi_Log]
          SET status = 'ANTRE', retry_count = retry_count + 1, waktu_kirim = SYSDATETIME()
        OUTPUT INSERTED.*
        WHERE notif_id = @id`,
      { id }
    );
    return result.recordset[0];
  }

  async listAudit(limit: number, periode: Periode): Promise<Record<string, unknown>[]> {
    const result = await db.query<Record<string, unknown>>(
      `SELECT TOP (@limit) log_id, akun_id, aksi, tabel, id_baris, ip_address, waktu, user_ref,
              COALESCE(keterangan, aksi + ' ' + tabel) AS keterangan
         FROM [Audit_Log]
        WHERE (@dari IS NULL OR waktu >= CAST(@dari AS DATE))
          AND (@sampai IS NULL OR waktu < DATEADD(DAY, 1, CAST(@sampai AS DATE)))
        ORDER BY waktu DESC`,
      { limit, ...periode }
    );
    return result.recordset;
  }
}

export default LaporanRepository;
