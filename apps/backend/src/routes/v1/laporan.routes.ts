import { Router } from 'express';
import { z } from 'zod';
import db from '../../db/pool';
import ApiError from '../../errors/ApiError';
import { asyncHandler } from '../../middleware/asyncHandler';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { parseBody, paginate } from './_validate';

const router = Router();

const manajemen = requireRole('SUPERADMIN', 'ADMIN_LOKAL');
const pimpinan = requireRole('SUPERADMIN', 'ADMIN_LOKAL', 'DOKTER');

const periodeSchema = z.object({
  dari: z.string().optional(),
  sampai: z.string().optional(),
  limit: z.number().int().min(1).max(200).optional()
});

router.post('/laporan/ringkasan/list', authenticate, pimpinan, asyncHandler(async (req, res) => {
  const { dari, sampai } = parseBody(periodeSchema, req.body ?? {});
  const periode = { dari: dari ?? null, sampai: sampai ?? null };

  const [kunjungan, pendapatan, bor] = await Promise.all([
    db.query<Record<string, unknown>>(
      `SELECT COUNT(*) AS total_kunjungan,
              SUM(CASE WHEN jenis_kunjungan = 'RAWAT_JALAN' THEN 1 ELSE 0 END) AS rawat_jalan,
              SUM(CASE WHEN jenis_kunjungan = 'RAWAT_INAP' THEN 1 ELSE 0 END) AS rawat_inap
         FROM [Kunjungan]
        WHERE (@dari IS NULL OR tgl_masuk >= CAST(@dari AS DATE))
          AND (@sampai IS NULL OR tgl_masuk < DATEADD(DAY, 1, CAST(@sampai AS DATE)))`,
      periode
    ),
    db.query<Record<string, unknown>>(
      `SELECT ISNULL(SUM(pb.jumlah), 0) AS total_pendapatan
         FROM [Pembayaran] pb
        WHERE (@dari IS NULL OR pb.waktu_bayar >= CAST(@dari AS DATE))
          AND (@sampai IS NULL OR pb.waktu_bayar < DATEADD(DAY, 1, CAST(@sampai AS DATE)))`,
      periode
    ),
    db.query<Record<string, unknown>>(
      `SELECT CAST(COUNT(*) AS DECIMAL(10,2)) AS episode_rawat_inap
         FROM [Rawat_Inap]
        WHERE (@dari IS NULL OR tgl_masuk >= CAST(@dari AS DATE))
          AND (@sampai IS NULL OR tgl_masuk < DATEADD(DAY, 1, CAST(@sampai AS DATE)))`,
      periode
    )
  ]);

  res.status(200).json({
    success: true,
    data: {
      kunjungan: kunjungan.recordset[0] ?? {},
      pendapatan: pendapatan.recordset[0] ?? {},
      rawat_inap: bor.recordset[0] ?? {}
    }
  });
}));

router.post('/laporan/tren-layanan/list', authenticate, pimpinan, asyncHandler(async (req, res) => {
  const { dari, sampai, limit } = parseBody(periodeSchema, req.body ?? {});
  const result = await db.query<Record<string, unknown>>(
    `SELECT TOP (@limit) d.kode_icd, d.nama, COUNT(*) AS jumlah
       FROM [Kunjungan_Diagnosa] kd
       JOIN [Diagnosa] d ON d.diagnosa_id = kd.diagnosa_id
       JOIN [Kunjungan] k ON k.kunjungan_id = kd.kunjungan_id
      WHERE (@dari IS NULL OR k.tgl_masuk >= CAST(@dari AS DATE))
        AND (@sampai IS NULL OR k.tgl_masuk < DATEADD(DAY, 1, CAST(@sampai AS DATE)))
      GROUP BY d.kode_icd, d.nama
      ORDER BY jumlah DESC`,
    {
      limit: paginate(limit, 10, 200),
      dari: dari ?? null,
      sampai: sampai ?? null
    }
  );
  res.status(200).json({ success: true, data: result.recordset });
}));

router.post('/laporan/jam-tersibuk/list', authenticate, pimpinan, asyncHandler(async (_req, res) => {
  const result = await db.query<Record<string, unknown>>(
    `SELECT DATEPART(HOUR, tgl_masuk) AS jam, COUNT(*) AS jumlah
       FROM [Kunjungan]
      WHERE tgl_masuk >= DATEADD(DAY, -30, SYSDATETIME())
      GROUP BY DATEPART(HOUR, tgl_masuk)
      ORDER BY jumlah DESC`,
    {}
  );
  res.status(200).json({ success: true, data: result.recordset });
}));

router.post('/laporan/perbandingan/list', authenticate, manajemen, asyncHandler(async (req, res) => {
  const { dari, sampai } = parseBody(periodeSchema, req.body ?? {});
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
    { dari: dari ?? null, sampai: sampai ?? null }
  );
  res.status(200).json({ success: true, data: result.recordset });
}));

router.post('/laporan/export', authenticate, pimpinan, asyncHandler(async (req, res) => {
  const { dari, sampai } = parseBody(periodeSchema, req.body ?? {});
  // ponytail: ekspor JSON dulu; xlsx/pdf ditambahkan saat pustaka dipilih
  const result = await db.query<Record<string, unknown>>(
    `SELECT k.kunjungan_id, k.tgl_masuk, k.jenis_kunjungan, p.nama AS nama_pasien,
            t.total_tagihan, t.total_dibayar, t.status
       FROM [Kunjungan] k
       JOIN [Pasien] p ON p.pasien_id = k.pasien_id
       LEFT JOIN [Tagihan] t ON t.kunjungan_id = k.kunjungan_id
      WHERE (@dari IS NULL OR k.tgl_masuk >= CAST(@dari AS DATE))
        AND (@sampai IS NULL OR k.tgl_masuk < DATEADD(DAY, 1, CAST(@sampai AS DATE)))
      ORDER BY k.tgl_masuk DESC`,
    { dari: dari ?? null, sampai: sampai ?? null }
  );
  res.status(200).json({ success: true, data: { format: 'JSON', rows: result.recordset } });
}));

const kontenSchema = z.object({
  tipe: z.string().max(20),
  judul: z.string().min(1).max(100),
  isi: z.string().min(1),
  media_url: z.string().max(255).default(''),
  urutan: z.number().int().min(0).default(0),
  terbit: z.boolean().default(true)
});

router.post('/konten/list', authenticate, manajemen, asyncHandler(async (req, res) => {
  const { limit } = parseBody(periodeSchema, req.body ?? {});
  const result = await db.query<Record<string, unknown>>(
    `SELECT TOP (@limit) * FROM [Konten_Publik] ORDER BY urutan ASC`,
    { limit: paginate(limit, 100, 200) }
  );
  res.status(200).json({ success: true, data: result.recordset });
}));

router.post('/konten', authenticate, manajemen, asyncHandler(async (req, res) => {
  const body = parseBody(kontenSchema, req.body);
  const created = await db.query<Record<string, unknown>>(
    `INSERT INTO [Konten_Publik] (tipe, judul, isi, media_url, urutan, terbit)
     OUTPUT INSERTED.*
     VALUES (@tipe, @judul, @isi, @media_url, @urutan, @terbit)`,
    body
  );
  res.status(201).json({ success: true, data: created.recordset[0] });
}));

router.patch('/konten/:id', authenticate, manajemen, asyncHandler(async (req, res) => {
  const body = parseBody(kontenSchema.partial(), req.body);
  const keys = Object.keys(body);
  if (keys.length === 0) {
    throw ApiError.badRequest('Tidak ada perubahan');
  }
  const assignments = keys.map((key) => `${key} = @${key}`).join(', ');
  const updated = await db.query<Record<string, unknown>>(
    `UPDATE [Konten_Publik] SET ${assignments}, updated_at = SYSDATETIME()
     OUTPUT INSERTED.* WHERE konten_id = @id`,
    { ...body, id: req.params['id'] }
  );
  const row = updated.recordset[0];
  if (!row) {
    throw ApiError.notFound('Konten tidak ditemukan');
  }
  res.status(200).json({ success: true, data: row });
}));

router.delete('/konten/:id', authenticate, manajemen, asyncHandler(async (req, res) => {
  const updated = await db.query<Record<string, unknown>>(
    `UPDATE [Konten_Publik] SET terbit = 0, updated_at = SYSDATETIME()
     OUTPUT INSERTED.* WHERE konten_id = @id`,
    { id: req.params['id'] }
  );
  const row = updated.recordset[0];
  if (!row) {
    throw ApiError.notFound('Konten tidak ditemukan');
  }
  res.status(200).json({ success: true, data: row });
}));

router.post('/notifikasi/log/list', authenticate, requireRole('SUPERADMIN', 'ADMIN_LOKAL', 'STAFF'), asyncHandler(async (req, res) => {
  const { limit } = parseBody(periodeSchema, req.body ?? {});
  const result = await db.query<Record<string, unknown>>(
    `SELECT TOP (@limit) * FROM [Notifikasi_Log] ORDER BY created_at DESC`,
    { limit: paginate(limit, 100, 200) }
  );
  res.status(200).json({ success: true, data: result.recordset });
}));

router.post('/notifikasi/:id/kirim-ulang', authenticate, requireRole('SUPERADMIN', 'ADMIN_LOKAL', 'STAFF'), asyncHandler(async (req, res) => {
  const updated = await db.query<Record<string, unknown>>(
    `UPDATE [Notifikasi_Log]
        SET status = 'ANTRE', retry_count = retry_count + 1, waktu_kirim = SYSDATETIME()
      OUTPUT INSERTED.*
      WHERE notif_id = @id`,
    { id: req.params['id'] }
  );
  const row = updated.recordset[0];
  if (!row) {
    throw ApiError.notFound('Log notifikasi tidak ditemukan');
  }
  res.status(200).json({ success: true, data: row });
}));

router.post('/audit-logs/list', authenticate, manajemen, asyncHandler(async (req, res) => {
  const { dari, sampai, limit } = parseBody(periodeSchema, req.body ?? {});
  const result = await db.query<Record<string, unknown>>(
    `SELECT TOP (@limit) log_id, akun_id, aksi, tabel, id_baris, ip_address, waktu, user_ref
       FROM [Audit_Log]
      WHERE (@dari IS NULL OR waktu >= CAST(@dari AS DATE))
        AND (@sampai IS NULL OR waktu < DATEADD(DAY, 1, CAST(@sampai AS DATE)))
      ORDER BY waktu DESC`,
    {
      limit: paginate(limit, 100, 200),
      dari: dari ?? null,
      sampai: sampai ?? null
    }
  );
  res.status(200).json({ success: true, data: result.recordset });
}));

export default router;
