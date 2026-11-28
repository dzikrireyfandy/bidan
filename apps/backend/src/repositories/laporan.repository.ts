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

export interface AgregatItemPeriode {
  tipe_item: string;
  item_id: string;
  kode_item: string;
  nama_item: string;
  qty: number;
  pendapatan: number;
}

export class LaporanRepository {
  async getBatasBulanBerjalanWib(): Promise<{ dari: string; sampai: string; hari_ini: string }> {
    const result = await db.query<{ dari: string; sampai: string; hari_ini: string }>(
      `DECLARE @today DATE = CAST(SYSDATETIME() AS DATE);
       SELECT CONVERT(VARCHAR(10), DATEFROMPARTS(YEAR(@today), MONTH(@today), 1), 23) AS dari,
              CONVERT(VARCHAR(10), EOMONTH(@today), 23) AS sampai,
              CONVERT(VARCHAR(10), @today, 23) AS hari_ini`
    );
    const today = new Date().toISOString().slice(0, 10);
    return (
      result.recordset[0] ?? {
        dari: `${today.slice(0, 7)}-01`,
        sampai: today,
        hari_ini: today
      }
    );
  }

  /**
   * 100% SELECT-only: Kunjungan valid = non-koreksi (koreksi_dari_id IS NULL), status <> 'BATAL',
   * dan bukan dari Reservasi berstatus 'DIBATALKAN'.
   */
  async ringkasanKunjungan(periode: Periode): Promise<Record<string, unknown>> {
    const result = await db.query<Record<string, unknown>>(
      `SELECT COUNT(*) AS total_kunjungan,
              ISNULL(SUM(CASE WHEN k.jenis_kunjungan = 'RAWAT_JALAN' THEN 1 ELSE 0 END), 0) AS rawat_jalan,
              ISNULL(SUM(CASE WHEN k.jenis_kunjungan = 'RAWAT_INAP' THEN 1 ELSE 0 END), 0) AS rawat_inap
         FROM [Kunjungan] k
         LEFT JOIN [Reservasi] r ON r.reservasi_id = k.reservasi_id
        WHERE k.koreksi_dari_id IS NULL
          AND k.status <> 'BATAL'
          AND (r.reservasi_id IS NULL OR r.status <> 'DIBATALKAN')
          AND (@dari IS NULL OR k.tgl_masuk >= CAST(@dari AS DATE))
          AND (@sampai IS NULL OR k.tgl_masuk <= CAST(@sampai AS DATE))`,
      periode
    );
    return result.recordset[0] ?? {};
  }

  /**
   * 100% SELECT-only: Pendapatan = pembayaran pada Tagihan berstatus 'LUNAS' dalam rentang waktu WIB.
   */
  async ringkasanPendapatan(periode: Periode): Promise<Record<string, unknown>> {
    const result = await db.query<Record<string, unknown>>(
      `SELECT CAST(ISNULL(SUM(pb.jumlah), 0) AS DECIMAL(18,2)) AS total_pendapatan,
              COUNT(DISTINCT pb.tagihan_id) AS jumlah_tagihan_lunas
         FROM [Pembayaran] pb
         INNER JOIN [Tagihan] t ON t.tagihan_id = pb.tagihan_id
         INNER JOIN [Kunjungan] k ON k.kunjungan_id = t.kunjungan_id
         LEFT JOIN [Reservasi] r ON r.reservasi_id = k.reservasi_id
        WHERE t.status = 'LUNAS'
          AND k.status <> 'BATAL'
          AND (r.reservasi_id IS NULL OR r.status <> 'DIBATALKAN')
          AND (@dari IS NULL OR pb.waktu_bayar >= CAST(@dari AS DATETIME2))
          AND (@sampai IS NULL OR pb.waktu_bayar < DATEADD(DAY, 1, CAST(@sampai AS DATETIME2)))`,
      periode
    );
    return result.recordset[0] ?? {};
  }

  async ringkasanRawatInap(periode: Periode): Promise<Record<string, unknown>> {
    const result = await db.query<Record<string, unknown>>(
      `SELECT CAST(COUNT(*) AS DECIMAL(10,2)) AS episode_rawat_inap
         FROM [Rawat_Inap]
        WHERE (@dari IS NULL OR tgl_masuk >= CAST(@dari AS DATETIME2))
          AND (@sampai IS NULL OR tgl_masuk < DATEADD(DAY, 1, CAST(@sampai AS DATETIME2)))`,
      periode
    );
    return result.recordset[0] ?? {};
  }

  /**
   * 100% SELECT-only: Seri kunjungan & pendapatan harian atau bulanan untuk grafik/tabel laporan.
   */
  async seriKunjunganDanPendapatan(
    periode: Periode,
    jenisPeriode: 'HARIAN' | 'BULANAN'
  ): Promise<Array<{ label: string; periode_key: string; jumlah_kunjungan: number; total_pendapatan: number }>> {
    if (jenisPeriode === 'HARIAN') {
      const result = await db.query<{
        periode_key: string;
        jumlah_kunjungan: number;
        total_pendapatan: number;
      }>(
        `WITH kj AS (
           SELECT CONVERT(VARCHAR(10), k.tgl_masuk, 23) AS pkey,
                  COUNT(*) AS jml
             FROM [Kunjungan] k
             LEFT JOIN [Reservasi] r ON r.reservasi_id = k.reservasi_id
            WHERE k.koreksi_dari_id IS NULL
              AND k.status <> 'BATAL'
              AND (r.reservasi_id IS NULL OR r.status <> 'DIBATALKAN')
              AND (@dari IS NULL OR k.tgl_masuk >= CAST(@dari AS DATE))
              AND (@sampai IS NULL OR k.tgl_masuk <= CAST(@sampai AS DATE))
            GROUP BY CONVERT(VARCHAR(10), k.tgl_masuk, 23)
         ),
         pd AS (
           SELECT CONVERT(VARCHAR(10), CAST(pb.waktu_bayar AS DATE), 23) AS pkey,
                  CAST(ISNULL(SUM(pb.jumlah), 0) AS DECIMAL(18,2)) AS rev
             FROM [Pembayaran] pb
             INNER JOIN [Tagihan] t ON t.tagihan_id = pb.tagihan_id
             INNER JOIN [Kunjungan] k ON k.kunjungan_id = t.kunjungan_id
             LEFT JOIN [Reservasi] r ON r.reservasi_id = k.reservasi_id
            WHERE t.status = 'LUNAS'
              AND k.status <> 'BATAL'
              AND (r.reservasi_id IS NULL OR r.status <> 'DIBATALKAN')
              AND (@dari IS NULL OR pb.waktu_bayar >= CAST(@dari AS DATETIME2))
              AND (@sampai IS NULL OR pb.waktu_bayar < DATEADD(DAY, 1, CAST(@sampai AS DATETIME2)))
            GROUP BY CONVERT(VARCHAR(10), CAST(pb.waktu_bayar AS DATE), 23)
         )
         SELECT COALESCE(kj.pkey, pd.pkey) AS periode_key,
                ISNULL(kj.jml, 0) AS jumlah_kunjungan,
                CAST(ISNULL(pd.rev, 0) AS DECIMAL(18,2)) AS total_pendapatan
           FROM kj
           FULL OUTER JOIN pd ON pd.pkey = kj.pkey
          ORDER BY COALESCE(kj.pkey, pd.pkey) ASC`,
        periode
      );
      return result.recordset.map((r) => {
        const [y = '', m = '', d = ''] = String(r.periode_key).split('-');
        return {
          periode_key: r.periode_key,
          label: `${d}/${m}/${y}`,
          jumlah_kunjungan: Number(r.jumlah_kunjungan ?? 0),
          total_pendapatan: Number(r.total_pendapatan ?? 0)
        };
      });
    }

    const result = await db.query<{
      periode_key: string;
      jumlah_kunjungan: number;
      total_pendapatan: number;
    }>(
      `WITH kj AS (
         SELECT LEFT(CONVERT(VARCHAR(10), k.tgl_masuk, 23), 7) AS pkey,
                COUNT(*) AS jml
           FROM [Kunjungan] k
           LEFT JOIN [Reservasi] r ON r.reservasi_id = k.reservasi_id
          WHERE k.koreksi_dari_id IS NULL
            AND k.status <> 'BATAL'
            AND (r.reservasi_id IS NULL OR r.status <> 'DIBATALKAN')
            AND (@dari IS NULL OR k.tgl_masuk >= CAST(@dari AS DATE))
            AND (@sampai IS NULL OR k.tgl_masuk <= CAST(@sampai AS DATE))
          GROUP BY LEFT(CONVERT(VARCHAR(10), k.tgl_masuk, 23), 7)
       ),
       pd AS (
         SELECT LEFT(CONVERT(VARCHAR(10), CAST(pb.waktu_bayar AS DATE), 23), 7) AS pkey,
                CAST(ISNULL(SUM(pb.jumlah), 0) AS DECIMAL(18,2)) AS rev
           FROM [Pembayaran] pb
           INNER JOIN [Tagihan] t ON t.tagihan_id = pb.tagihan_id
           INNER JOIN [Kunjungan] k ON k.kunjungan_id = t.kunjungan_id
           LEFT JOIN [Reservasi] r ON r.reservasi_id = k.reservasi_id
          WHERE t.status = 'LUNAS'
            AND k.status <> 'BATAL'
            AND (r.reservasi_id IS NULL OR r.status <> 'DIBATALKAN')
            AND (@dari IS NULL OR pb.waktu_bayar >= CAST(@dari AS DATETIME2))
            AND (@sampai IS NULL OR pb.waktu_bayar < DATEADD(DAY, 1, CAST(@sampai AS DATETIME2)))
          GROUP BY LEFT(CONVERT(VARCHAR(10), CAST(pb.waktu_bayar AS DATE), 23), 7)
       )
       SELECT COALESCE(kj.pkey, pd.pkey) AS periode_key,
              ISNULL(kj.jml, 0) AS jumlah_kunjungan,
              CAST(ISNULL(pd.rev, 0) AS DECIMAL(18,2)) AS total_pendapatan
         FROM kj
         FULL OUTER JOIN pd ON pd.pkey = kj.pkey
        ORDER BY COALESCE(kj.pkey, pd.pkey) ASC`,
      periode
    );
    return result.recordset.map((r) => {
      const [y = '', m = ''] = String(r.periode_key).split('-');
      return {
        periode_key: r.periode_key,
        label: `${m}/${y}`,
        jumlah_kunjungan: Number(r.jumlah_kunjungan ?? 0),
        total_pendapatan: Number(r.total_pendapatan ?? 0)
      };
    });
  }

  /**
   * 100% SELECT-only: Tren diagnosis terbanyak.
   * Mengecualikan kunjungan asal yang sudah memiliki entri koreksi (tidak hitung ganda).
   */
  async trenLayanan(limit: number, periode: Periode): Promise<Record<string, unknown>[]> {
    const result = await db.query<Record<string, unknown>>(
      `SELECT TOP (@limit)
              ISNULL(d.kode_icd, '-') AS kode_icd,
              d.nama,
              COUNT(*) AS jumlah
         FROM [Kunjungan_Diagnosa] kd
         INNER JOIN [Diagnosa] d ON d.diagnosa_id = kd.diagnosa_id
         INNER JOIN [Kunjungan] k ON k.kunjungan_id = kd.kunjungan_id
         LEFT JOIN [Reservasi] r ON r.reservasi_id = k.reservasi_id
        WHERE k.status <> 'BATAL'
          AND (r.reservasi_id IS NULL OR r.status <> 'DIBATALKAN')
          AND NOT EXISTS (
            SELECT 1
              FROM [Kunjungan] k_kor
             WHERE k_kor.koreksi_dari_id = k.kunjungan_id
               AND k_kor.status <> 'BATAL'
          )
          AND (@dari IS NULL OR k.tgl_masuk >= CAST(@dari AS DATE))
          AND (@sampai IS NULL OR k.tgl_masuk <= CAST(@sampai AS DATE))
        GROUP BY d.kode_icd, d.nama
        ORDER BY jumlah DESC, d.kode_icd ASC`,
      { limit, ...periode }
    );
    return result.recordset.map((r) => ({
      kode_icd: r['kode_icd'],
      nama: r['nama'],
      jumlah: Number(r['jumlah'] ?? 0)
    }));
  }

  /**
   * 100% SELECT-only: Tren jenis layanan medis terbanyak tanpa hitung ganda entri asal koreksi.
   */
  async trenTindakanMedis(limit: number, periode: Periode): Promise<Record<string, unknown>[]> {
    const result = await db.query<Record<string, unknown>>(
      `SELECT TOP (@limit)
              lm.kode,
              lm.nama,
              lm.kategori,
              CAST(ISNULL(SUM(tk.qty), 0) AS INT) AS jumlah
         FROM [Tindakan_Kunjungan] tk
         INNER JOIN [Layanan_Medis] lm ON lm.layanan_id = tk.layanan_id
         INNER JOIN [Kunjungan] k ON k.kunjungan_id = tk.kunjungan_id
         LEFT JOIN [Reservasi] r ON r.reservasi_id = k.reservasi_id
        WHERE k.status <> 'BATAL'
          AND (r.reservasi_id IS NULL OR r.status <> 'DIBATALKAN')
          AND NOT EXISTS (
            SELECT 1
              FROM [Kunjungan] k_kor
             WHERE k_kor.koreksi_dari_id = k.kunjungan_id
               AND k_kor.status <> 'BATAL'
          )
          AND (@dari IS NULL OR k.tgl_masuk >= CAST(@dari AS DATE))
          AND (@sampai IS NULL OR k.tgl_masuk <= CAST(@sampai AS DATE))
        GROUP BY lm.kode, lm.nama, lm.kategori
        ORDER BY jumlah DESC, lm.nama ASC`,
      { limit, ...periode }
    );
    return result.recordset.map((r) => ({
      kode: r['kode'],
      nama: r['nama'],
      kategori: r['kategori'],
      jumlah: Number(r['jumlah'] ?? 0)
    }));
  }

  /**
   * 100% SELECT-only: Distribusi jam kunjungan tersibuk berdasarkan 30 hari kalender terakhir WIB
   * (hari_ini - 29 hari s/d hari_ini inklusif) untuk kunjungan valid non-koreksi.
   */
  async jamTersibuk(): Promise<Record<string, unknown>[]> {
    const result = await db.query<{ jam: number; jumlah: number }>(
      `DECLARE @hariIni DATE = CAST(SYSDATETIME() AS DATE);
       SELECT DATEPART(HOUR, k.created_at) AS jam,
              COUNT(*) AS jumlah
         FROM [Kunjungan] k
         LEFT JOIN [Reservasi] r ON r.reservasi_id = k.reservasi_id
        WHERE k.koreksi_dari_id IS NULL
          AND k.status <> 'BATAL'
          AND (r.reservasi_id IS NULL OR r.status <> 'DIBATALKAN')
          AND k.created_at >= CAST(DATEADD(DAY, -29, @hariIni) AS DATETIME2)
          AND k.created_at < DATEADD(DAY, 1, CAST(@hariIni AS DATETIME2))
        GROUP BY DATEPART(HOUR, k.created_at)
        ORDER BY jam ASC`
    );

    const byHour = new Map<number, number>();
    for (const row of result.recordset) {
      byHour.set(Number(row.jam), Number(row.jumlah));
    }

    const full24Hours: Record<string, unknown>[] = [];
    for (let h = 0; h < 24; h++) {
      full24Hours.push({
        jam: h,
        label_jam: `${String(h).padStart(2, '0')}:00`,
        jumlah: byHour.get(h) ?? 0
      });
    }
    return full24Hours;
  }

  /**
   * 100% SELECT-only: Agregasi kuantitas dan pendapatan per item pada Tagihan LUNAS
   * untuk perhitungan Efek Volume & Efek Harga.
   */
  async agregasiItemPeriode(periode: Periode): Promise<AgregatItemPeriode[]> {
    const result = await db.query<AgregatItemPeriode>(
      `SELECT CASE
                WHEN tr.layanan_id IS NOT NULL THEN 'LAYANAN'
                WHEN tr.obat_id IS NOT NULL THEN 'OBAT'
                ELSE 'PAKET'
              END AS tipe_item,
              UPPER(CAST(COALESCE(tr.layanan_id, tr.obat_id, tr.paket_id) AS VARCHAR(36))) AS item_id,
              COALESCE(lm.kode, ob.kode, pk.kode, '-') AS kode_item,
              COALESCE(lm.nama, ob.nama_dagang, ob.nama_generik, pk.nama, N'Item Lainnya') AS nama_item,
              CAST(ISNULL(SUM(tr.qty), 0) AS DECIMAL(18,2)) AS qty,
              CAST(ISNULL(SUM(tr.subtotal), 0) AS DECIMAL(18,2)) AS pendapatan
         FROM [Tagihan_Rincian] tr
         INNER JOIN [Tagihan] t ON t.tagihan_id = tr.tagihan_id
         INNER JOIN [Kunjungan] k ON k.kunjungan_id = t.kunjungan_id
         LEFT JOIN [Reservasi] r ON r.reservasi_id = k.reservasi_id
         LEFT JOIN [Layanan_Medis] lm ON lm.layanan_id = tr.layanan_id
         LEFT JOIN [Obat] ob ON ob.obat_id = tr.obat_id
         LEFT JOIN [Paket_Layanan] pk ON pk.paket_id = tr.paket_id
        WHERE t.status = 'LUNAS'
          AND k.status <> 'BATAL'
          AND (r.reservasi_id IS NULL OR r.status <> 'DIBATALKAN')
          AND (@dari IS NULL OR t.tgl_terbit >= CAST(@dari AS DATE))
          AND (@sampai IS NULL OR t.tgl_terbit <= CAST(@sampai AS DATE))
        GROUP BY CASE
                   WHEN tr.layanan_id IS NOT NULL THEN 'LAYANAN'
                   WHEN tr.obat_id IS NOT NULL THEN 'OBAT'
                   ELSE 'PAKET'
                 END,
                 UPPER(CAST(COALESCE(tr.layanan_id, tr.obat_id, tr.paket_id) AS VARCHAR(36))),
                 COALESCE(lm.kode, ob.kode, pk.kode, '-'),
                 COALESCE(lm.nama, ob.nama_dagang, ob.nama_generik, pk.nama, N'Item Lainnya')
        ORDER BY nama_item ASC`,
      periode
    );
    return result.recordset.map((r) => ({
      tipe_item: r.tipe_item,
      item_id: r.item_id,
      kode_item: r.kode_item,
      nama_item: r.nama_item,
      qty: Number(r.qty ?? 0),
      pendapatan: Number(r.pendapatan ?? 0)
    }));
  }

  async perbandingan(periode: Periode): Promise<Record<string, unknown>[]> {
    const result = await db.query<Record<string, unknown>>(
      `SELECT CONVERT(VARCHAR(10), CAST(pb.waktu_bayar AS DATE), 23) AS tanggal,
              COUNT(DISTINCT pb.tagihan_id) AS jumlah_transaksi,
              CAST(ISNULL(SUM(pb.jumlah), 0) AS DECIMAL(18,2)) AS total_pendapatan,
              CAST(ISNULL(SUM(pb.jumlah) / NULLIF(COUNT(DISTINCT pb.tagihan_id), 0), 0) AS DECIMAL(18,2)) AS rata_rata_tagihan
         FROM [Pembayaran] pb
         INNER JOIN [Tagihan] t ON t.tagihan_id = pb.tagihan_id
        WHERE t.status = 'LUNAS'
          AND (@dari IS NULL OR pb.waktu_bayar >= CAST(@dari AS DATETIME2))
          AND (@sampai IS NULL OR pb.waktu_bayar < DATEADD(DAY, 1, CAST(@sampai AS DATETIME2)))
        GROUP BY CONVERT(VARCHAR(10), CAST(pb.waktu_bayar AS DATE), 23)
        ORDER BY tanggal ASC`,
      periode
    );
    return result.recordset;
  }

  /**
   * 100% SELECT-only & bebas PII pasien (tidak memuat nama_pasien / NIK / telepon).
   */
  async export(periode: Periode): Promise<Record<string, unknown>[]> {
    const result = await db.query<Record<string, unknown>>(
      `SELECT k.kunjungan_id,
              CONVERT(VARCHAR(10), k.tgl_masuk, 23) AS tgl_masuk,
              k.jenis_kunjungan,
              CAST(ISNULL(t.total_tagihan, 0) AS DECIMAL(18,2)) AS total_tagihan,
              CAST(ISNULL(t.total_dibayar, 0) AS DECIMAL(18,2)) AS total_dibayar,
              ISNULL(t.status, 'BELUM_LUNAS') AS status
         FROM [Kunjungan] k
         LEFT JOIN [Reservasi] r ON r.reservasi_id = k.reservasi_id
         LEFT JOIN [Tagihan] t ON t.kunjungan_id = k.kunjungan_id
        WHERE k.koreksi_dari_id IS NULL
          AND k.status <> 'BATAL'
          AND (r.reservasi_id IS NULL OR r.status <> 'DIBATALKAN')
          AND (@dari IS NULL OR k.tgl_masuk >= CAST(@dari AS DATE))
          AND (@sampai IS NULL OR k.tgl_masuk <= CAST(@sampai AS DATE))
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
      `SELECT TOP (@limit)
              n.notif_id,
              n.reservasi_id,
              n.jenis,
              n.tujuan,
              n.pesan,
              n.status,
              n.retry_count,
              n.waktu_kirim,
              n.created_at,
              COALESCE(pInfo.nama, N'Pengguna Akun') AS pasien_nama,
              CASE
                WHEN r.nomor_antrean IS NOT NULL THEN 'A-' + RIGHT('000' + CAST(r.nomor_antrean AS VARCHAR(10)), 3)
                ELSE NULL
              END AS nomor_antrean,
              l.nama AS nama_layanan,
              CONVERT(VARCHAR(10), j.tanggal, 105) AS tanggal_kunjungan,
              CASE
                WHEN j.jam_mulai IS NOT NULL AND j.jam_selesai IS NOT NULL
                THEN LEFT(CONVERT(VARCHAR(8), j.jam_mulai, 108), 5) + ' - ' + LEFT(CONVERT(VARCHAR(8), j.jam_selesai, 108), 5) + ' WIB'
                ELSE NULL
              END AS sesi_praktik,
              CASE
                WHEN n.jenis = 'OTP_RESET' THEN N'Kode Verifikasi (OTP) - Praktek Mandiri Bidan Ria Indrasti J., S.Keb'
                ELSE N'Pengingat Jadwal Kunjungan - Praktek Mandiri Bidan Ria Indrasti J., S.Keb'
              END AS subjek
         FROM [Notifikasi_Log] n
         LEFT JOIN [Reservasi] r ON r.reservasi_id = n.reservasi_id
         LEFT JOIN [Jadwal_Praktik] j ON j.jadwal_id = r.jadwal_id
         LEFT JOIN [Layanan_Medis] l ON l.layanan_id = r.layanan_id
         OUTER APPLY (
           SELECT TOP 1 ps.nama
             FROM [Pasien] ps
            WHERE (r.pasien_id IS NOT NULL AND ps.pasien_id = r.pasien_id)
               OR (r.pasien_id IS NULL AND ps.email = n.tujuan)
            ORDER BY CASE WHEN ps.pasien_id = r.pasien_id THEN 0 ELSE 1 END ASC
         ) pInfo
        ORDER BY n.created_at DESC`,
      { limit }
    );
    return result.recordset;
  }

  async kirimUlangNotifikasi(id: string): Promise<Record<string, unknown> | undefined> {
    const result = await db.query<Record<string, unknown>>(
      `UPDATE [Notifikasi_Log] SET status = 'ANTRE', retry_count = retry_count + 1
       OUTPUT INSERTED.* WHERE notif_id = @id`,
      { id }
    );
    return result.recordset[0];
  }

  async listAudit(limit: number, periode: Periode): Promise<Record<string, unknown>[]> {
    const result = await db.query<Record<string, unknown>>(
      `SELECT TOP (@limit) l.*, a.username
         FROM [Audit_Log] l
         LEFT JOIN [Akun_Pengguna] a ON a.akun_id = l.akun_id
        WHERE (@dari IS NULL OR l.waktu >= CAST(@dari AS DATETIME2))
          AND (@sampai IS NULL OR l.waktu < DATEADD(DAY, 1, CAST(@sampai AS DATETIME2)))
        ORDER BY l.waktu DESC`,
      { limit, ...periode }
    );
    return result.recordset;
  }

  async totalPengguna(): Promise<number> {
    const result = await db.query<{ total: number }>(
      `SELECT COUNT(*) AS total FROM [Akun_Pengguna]`
    );
    return Number(result.recordset[0]?.total ?? 0);
  }
}

export default LaporanRepository;
