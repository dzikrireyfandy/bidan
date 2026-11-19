import { Router } from 'express';
import { z } from 'zod';
import db from '../../db/pool';
import ApiError from '../../errors/ApiError';
import { asyncHandler } from '../../middleware/asyncHandler';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { parseBody } from './_validate';

const router = Router();

const klinis = requireRole('SUPERADMIN', 'DOKTER', 'STAFF');

const asuhanSchema = z.object({
  imd: z.boolean().default(false),
  vit_k1: z.boolean().default(false),
  salep_mata: z.boolean().default(false),
  hb0: z.boolean().default(false),
  keadaan_umum: z.string().min(1).max(100),
  catatan: z.string().max(1000).optional()
});

router.post('/bayi/:id/asuhan-bbl', authenticate, klinis, asyncHandler(async (req, res) => {
  const body = parseBody(asuhanSchema, req.body);

  const bayi = await db.query<{ bayi_id: string }>(
    `SELECT TOP 1 bayi_id FROM [Bayi_Lahir] WHERE bayi_id = @id`,
    { id: req.params['id'] }
  );
  if (!bayi.recordset[0]) {
    throw ApiError.notFound('Data bayi tidak ditemukan');
  }

  const existing = await db.query<{ asuhan_bbl_id: string }>(
    `SELECT TOP 1 asuhan_bbl_id FROM [Asuhan_BBL] WHERE bayi_id = @id`,
    { id: req.params['id'] }
  );
  if (existing.recordset[0]) {
    throw ApiError.conflict('Asuhan BBL untuk bayi ini sudah dicatat');
  }

  const created = await db.query<Record<string, unknown>>(
    `INSERT INTO [Asuhan_BBL] (bayi_id, staf_id, imd, vit_k1, salep_mata, hb0, keadaan_umum, catatan)
     OUTPUT INSERTED.*
     VALUES (@bayi_id, @staf_id, @imd, @vit_k1, @salep_mata, @hb0, @keadaan_umum, @catatan)`,
    {
      bayi_id: req.params['id'],
      staf_id: req.auth?.stafId ?? null,
      imd: body.imd,
      vit_k1: body.vit_k1,
      salep_mata: body.salep_mata,
      hb0: body.hb0,
      keadaan_umum: body.keadaan_umum,
      catatan: body.catatan ?? null
    }
  );

  res.status(201).json({ success: true, data: created.recordset[0] });
}));

router.post('/bayi/:id/asuhan-bbl/list', authenticate, klinis, asyncHandler(async (req, res) => {
  const result = await db.query<Record<string, unknown>>(
    `SELECT TOP 100 * FROM [Asuhan_BBL] WHERE bayi_id = @id ORDER BY dicatat_pada DESC`,
    { id: req.params['id'] }
  );
  res.status(200).json({ success: true, data: result.recordset });
}));

const pemeriksaanSchema = z.object({
  kunjungan_id: z.string().uuid().optional(),
  jenis: z.enum(['KN1', 'KN2', 'KN3', 'TUMBUH_KEMBANG']),
  tgl_pemeriksaan: z.string(),
  berat_gram: z.number().int().min(200).max(40000).optional(),
  panjang_cm: z.number().min(20).max(150).optional(),
  lingkar_kepala_cm: z.number().min(15).max(80).optional(),
  suhu_c: z.number().min(30).max(45).optional(),
  kondisi_tali_pusat: z.enum(['KERING', 'BASAH', 'INFEKSI']).optional(),
  menyusu: z.enum(['ASI_EKSKLUSIF', 'CAMPURAN', 'FORMULA']).optional(),
  ikterus: z.boolean().default(false),
  tanda_bahaya: z.boolean().default(false),
  tgl_kontrol_berikutnya: z.string().optional(),
  catatan: z.string().max(1000).optional()
});

router.post('/bayi/:id/pemeriksaan', authenticate, klinis, asyncHandler(async (req, res) => {
  const body = parseBody(pemeriksaanSchema, req.body);

  const created = await db.query<Record<string, unknown>>(
    `INSERT INTO [Pemeriksaan_Bayi]
       (bayi_id, kunjungan_id, staf_id, jenis, tgl_pemeriksaan, berat_gram, panjang_cm,
        lingkar_kepala_cm, suhu_c, kondisi_tali_pusat, menyusu, ikterus, tanda_bahaya,
        tgl_kontrol_berikutnya, catatan)
     OUTPUT INSERTED.*
     VALUES (@bayi_id, @kunjungan_id, @staf_id, @jenis, @tgl, @berat, @panjang, @lk, @suhu,
             @tali, @menyusu, @ikterus, @bahaya, @kontrol, @catatan)`,
    {
      bayi_id: req.params['id'],
      kunjungan_id: body.kunjungan_id ?? null,
      staf_id: req.auth?.stafId ?? null,
      jenis: body.jenis,
      tgl: body.tgl_pemeriksaan,
      berat: body.berat_gram ?? null,
      panjang: body.panjang_cm ?? null,
      lk: body.lingkar_kepala_cm ?? null,
      suhu: body.suhu_c ?? null,
      tali: body.kondisi_tali_pusat ?? null,
      menyusu: body.menyusu ?? null,
      ikterus: body.ikterus,
      bahaya: body.tanda_bahaya,
      kontrol: body.tgl_kontrol_berikutnya ?? null,
      catatan: body.catatan ?? null
    }
  );

  if (body.tgl_kontrol_berikutnya) {
    // ponytail: antrean email H-1 dikonsumsi worker cron (Todo 6)
    await db.query(
      `INSERT INTO [Notifikasi_Log] (jenis, tujuan, pesan, status, retry_count, waktu_kirim)
       SELECT 'KONTROL_NEONATAL', ISNULL(p.email, '-'),
              'Pengingat kontrol bayi pada ' + CONVERT(VARCHAR(10), @kontrol, 105),
              'ANTRE', 0, DATEADD(DAY, -1, CAST(@kontrol AS DATETIME2))
         FROM [Bayi_Lahir] b
         JOIN [Pasien] p ON p.pasien_id = b.pasien_id
        WHERE b.bayi_id = @bayi_id`,
      { kontrol: body.tgl_kontrol_berikutnya, bayi_id: req.params['id'] }
    );
  }

  res.status(201).json({ success: true, data: created.recordset[0] });
}));

router.post('/bayi/:id/pemeriksaan/list', authenticate, klinis, asyncHandler(async (req, res) => {
  const result = await db.query<Record<string, unknown>>(
    `SELECT * FROM [Pemeriksaan_Bayi] WHERE bayi_id = @id ORDER BY tgl_pemeriksaan ASC`,
    { id: req.params['id'] }
  );
  res.status(200).json({ success: true, data: result.recordset });
}));

router.post('/bayi/:id/tumbuh-kembang/grafik', authenticate, klinis, asyncHandler(async (req, res) => {
  const result = await db.query<Record<string, unknown>>(
    `SELECT * FROM [v_grafik_tumbuh_kembang_bayi] WHERE bayi_id = @id`,
    { id: req.params['id'] }
  );
  res.status(200).json({ success: true, data: result.recordset });
}));

export default router;
