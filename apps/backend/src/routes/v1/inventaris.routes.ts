import { Router } from 'express';
import { z } from 'zod';
import db from '../../db/pool';
import ApiError from '../../errors/ApiError';
import { asyncHandler } from '../../middleware/asyncHandler';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { parseBody, paginate } from './_validate';

const router = Router();

const ADMIN = requireRole('SUPERADMIN', 'ADMIN_LOKAL');
const BACA_STOK = requireRole('SUPERADMIN', 'ADMIN_LOKAL', 'DOKTER', 'STAFF');

const listSchema = z.object({
  q: z.string().max(100).optional(),
  limit: z.number().int().min(1).max(500).optional()
});

const obatSchema = z.object({
  kode: z.string().min(1).max(30),
  nama_generik: z.string().min(1).max(150),
  nama_dagang: z.string().max(150).optional(),
  kategori: z.string().max(30),
  bentuk: z.string().max(30),
  satuan: z.string().max(20),
  kekuatan: z.string().max(30).optional(),
  golongan: z.string().max(30).optional(),
  stok_minimum: z.number().int().min(0).default(0)
});

const obatUpdateSchema = z.object({
  nama_dagang: z.string().max(150).optional(),
  stok_minimum: z.number().int().min(0).optional(),
  aktif: z.boolean().optional()
});

const daftarObat = asyncHandler(async (req, res) => {
  const { q, limit } = parseBody(listSchema, req.body ?? {});
  const term = q ? `%${q}%` : null;
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
    { limit: paginate(limit, 100, 500), term }
  );
  res.status(200).json({ success: true, data: result.recordset });
});

const buatObat = asyncHandler(async (req, res) => {
  const body = parseBody(obatSchema, req.body ?? {});
  const created = await db.query<Record<string, unknown>>(
    `INSERT INTO [Obat]
       (kode, nama_generik, nama_dagang, kategori, bentuk, satuan, kekuatan, golongan, stok_minimum, aktif)
     OUTPUT INSERTED.*
     VALUES (@kode, @nama_generik, @nama_dagang, @kategori, @bentuk, @satuan, @kekuatan, @golongan, @stok_minimum, 1)`,
    {
      kode: body.kode,
      nama_generik: body.nama_generik,
      nama_dagang: body.nama_dagang ?? body.nama_generik,
      kategori: body.kategori,
      bentuk: body.bentuk,
      satuan: body.satuan,
      kekuatan: body.kekuatan ?? '-',
      golongan: body.golongan ?? '-',
      stok_minimum: body.stok_minimum
    }
  );
  res.status(201).json({ success: true, data: created.recordset[0] });
});

const ubahObat = asyncHandler(async (req, res) => {
  const body = parseBody(obatUpdateSchema, req.body ?? {});
  const keys = Object.keys(body);
  if (keys.length === 0) {
    throw ApiError.badRequest('Tidak ada perubahan');
  }
  const assignments = keys.map((key) => `${key} = @${key}`).join(', ');
  const updated = await db.query<Record<string, unknown>>(
    `UPDATE [Obat] SET ${assignments} OUTPUT INSERTED.* WHERE obat_id = @id`,
    { ...body, id: req.params['id'] }
  );
  const row = updated.recordset[0];
  if (!row) {
    throw ApiError.notFound('Obat tidak ditemukan');
  }
  res.status(200).json({ success: true, data: row });
});

router.post('/inventaris/list', authenticate, BACA_STOK, daftarObat);
router.post('/inventaris', authenticate, ADMIN, buatObat);
router.patch('/inventaris/:id', authenticate, ADMIN, ubahObat);
router.post('/obat/list', authenticate, BACA_STOK, daftarObat);
router.post('/obat', authenticate, ADMIN, buatObat);
router.patch('/obat/:id', authenticate, ADMIN, ubahObat);

const restockSchema = z.object({
  gudang_id: z.string().uuid(),
  no_batch: z.string().min(1).max(50),
  tgl_kedaluwarsa: z.string(),
  harga_beli: z.number().min(0),
  jumlah: z.number().int().min(1),
  keterangan: z.string().max(255).optional()
});

router.post('/inventaris/:id/restock', authenticate, ADMIN, asyncHandler(async (req, res) => {
  const body = parseBody(restockSchema, req.body);

  const batch = await db.query<{ batch_id: string }>(
    `INSERT INTO [Batch_Obat] (obat_id, no_batch, tgl_kedaluwarsa, harga_beli, tgl_masuk)
     OUTPUT INSERTED.batch_id
     VALUES (@obat_id, @no_batch, @kedaluwarsa, @harga, SYSDATETIME())`,
    {
      obat_id: req.params['id'],
      no_batch: body.no_batch,
      kedaluwarsa: body.tgl_kedaluwarsa,
      harga: body.harga_beli
    }
  );
  const batchId = batch.recordset[0]?.batch_id;
  if (!batchId) {
    throw ApiError.internal('Gagal membuat batch obat');
  }

  await db.query(
    `MERGE [Stok_Batch] AS target
       USING (SELECT @batch_id AS batch_id, @gudang_id AS gudang_id) AS src
       ON target.batch_id = src.batch_id AND target.gudang_id = src.gudang_id
     WHEN MATCHED THEN UPDATE SET jumlah = target.jumlah + @jumlah
     WHEN NOT MATCHED THEN INSERT (batch_id, gudang_id, jumlah) VALUES (src.batch_id, src.gudang_id, @jumlah);`,
    { batch_id: batchId, gudang_id: body.gudang_id, jumlah: body.jumlah }
  );

  await db.query(
    `INSERT INTO [Mutasi_Stok] (batch_id, gudang_id, staf_id, jenis, jumlah, waktu, keterangan)
     VALUES (@batch_id, @gudang_id, @staf_id, 'MASUK', @jumlah, SYSDATETIME(), @keterangan)`,
    {
      batch_id: batchId,
      gudang_id: body.gudang_id,
      staf_id: req.auth?.stafId ?? null,
      jumlah: body.jumlah,
      keterangan: body.keterangan ?? 'Restock'
    }
  );

  res.status(201).json({ success: true, data: { batch_id: batchId, jumlah: body.jumlah } });
}));

router.post('/inventaris/:id/riwayat/list', authenticate, ADMIN, asyncHandler(async (req, res) => {
  const { limit } = parseBody(listSchema, req.body ?? {});
  const result = await db.query<Record<string, unknown>>(
    `SELECT TOP (@limit) m.mutasi_id, m.jenis, m.jumlah, m.waktu, m.keterangan,
            bo.no_batch, g.nama AS gudang
       FROM [Mutasi_Stok] m
       JOIN [Batch_Obat] bo ON bo.batch_id = m.batch_id
       LEFT JOIN [Gudang] g ON g.gudang_id = m.gudang_id
      WHERE bo.obat_id = @id
      ORDER BY m.waktu DESC`,
    { id: req.params['id'], limit: paginate(limit, 100, 500) }
  );
  res.status(200).json({ success: true, data: result.recordset });
}));

router.post('/obat/:id/batch/list', authenticate, BACA_STOK, asyncHandler(async (req, res) => {
  const result = await db.query<Record<string, unknown>>(
    `SELECT bo.batch_id, bo.no_batch, bo.tgl_kedaluwarsa, bo.harga_beli,
            ISNULL(SUM(sb.jumlah), 0) AS stok
       FROM [Batch_Obat] bo
       LEFT JOIN [Stok_Batch] sb ON sb.batch_id = bo.batch_id
      WHERE bo.obat_id = @id
      GROUP BY bo.batch_id, bo.no_batch, bo.tgl_kedaluwarsa, bo.harga_beli
      ORDER BY bo.tgl_kedaluwarsa ASC`,
    { id: req.params['id'] }
  );
  res.status(200).json({ success: true, data: result.recordset });
}));

router.post('/obat/:id/batch', authenticate, ADMIN, asyncHandler(async (req, res) => {
  const body = parseBody(
    z.object({
      no_batch: z.string().min(1).max(50),
      tgl_kedaluwarsa: z.string(),
      harga_beli: z.number().min(0),
      gudang_id: z.string().uuid(),
      jumlah: z.number().int().min(1)
    }),
    req.body
  );

  const batch = await db.query<{ batch_id: string }>(
    `INSERT INTO [Batch_Obat] (obat_id, no_batch, tgl_kedaluwarsa, harga_beli, tgl_masuk)
     OUTPUT INSERTED.batch_id
     VALUES (@obat_id, @no_batch, @kedaluwarsa, @harga, SYSDATETIME())`,
    {
      obat_id: req.params['id'],
      no_batch: body.no_batch,
      kedaluwarsa: body.tgl_kedaluwarsa,
      harga: body.harga_beli
    }
  );
  const batchId = batch.recordset[0]?.batch_id;
  if (!batchId) {
    throw ApiError.internal('Gagal membuat batch obat');
  }

  await db.query(
    `INSERT INTO [Stok_Batch] (batch_id, gudang_id, jumlah) VALUES (@batch_id, @gudang_id, @jumlah)`,
    { batch_id: batchId, gudang_id: body.gudang_id, jumlah: body.jumlah }
  );

  res.status(201).json({ success: true, data: { batch_id: batchId } });
}));

router.post('/gudang/list', authenticate, BACA_STOK, asyncHandler(async (_req, res) => {
  const result = await db.query<Record<string, unknown>>(
    `SELECT gudang_id, unit_id, nama, jenis FROM [Gudang] ORDER BY nama ASC`,
    {}
  );
  res.status(200).json({ success: true, data: result.recordset });
}));

router.post('/gudang/:id/stok/list', authenticate, BACA_STOK, asyncHandler(async (req, res) => {
  const result = await db.query<Record<string, unknown>>(
    `SELECT sb.batch_id, sb.jumlah, bo.no_batch, bo.tgl_kedaluwarsa,
            o.obat_id, o.kode, o.nama_generik, o.satuan
       FROM [Stok_Batch] sb
       JOIN [Batch_Obat] bo ON bo.batch_id = sb.batch_id
       JOIN [Obat] o ON o.obat_id = bo.obat_id
      WHERE sb.gudang_id = @id
      ORDER BY bo.tgl_kedaluwarsa ASC`,
    { id: req.params['id'] }
  );
  res.status(200).json({ success: true, data: result.recordset });
}));

router.post('/resep/:id/pengeluaran', authenticate, BACA_STOK, asyncHandler(async (req, res) => {
  const body = parseBody(
    z.object({
      gudang_id: z.string().uuid(),
      kunjungan_id: z.string().uuid().optional()
    }),
    req.body
  );
  const stafId = req.auth?.stafId;
  if (!stafId) {
    throw ApiError.forbidden('Pengeluaran obat memerlukan akun staf');
  }

  const result = await db.query<{ kode_hasil: number }>(
    `DECLARE @kode INT;
     EXEC [dbo].[sp_pengeluaran_resep_fefo]
          @resep_id = @resep_id, @gudang_id = @gudang_id, @staf_id = @staf_id,
          @kunjungan_id = @kunjungan_id, @kode_hasil = @kode OUTPUT;
     SELECT @kode AS kode_hasil;`,
    {
      resep_id: req.params['id'],
      gudang_id: body.gudang_id,
      staf_id: stafId,
      kunjungan_id: body.kunjungan_id ?? null
    }
  );

  const kode = result.recordset[0]?.kode_hasil ?? -1;
  if (kode !== 0) {
    throw ApiError.conflict(`Pengeluaran obat gagal (kode ${kode})`);
  }
  await db.query(`UPDATE [Resep] SET status = 'DISERAHKAN' WHERE resep_id = @id`, {
    id: req.params['id']
  });

  res.status(200).json({ success: true, data: { resep_id: req.params['id'], kode_hasil: kode } });
}));

export default router;
