import { Router } from 'express';
import { z } from 'zod';
import db from '../../db/pool';
import ApiError from '../../errors/ApiError';
import { asyncHandler } from '../../middleware/asyncHandler';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { parseBody, paginate } from './_validate';

const router = Router();

const stafInternal = requireRole('SUPERADMIN', 'ADMIN_LOKAL', 'DOKTER', 'STAFF');
const frontOffice = requireRole('SUPERADMIN', 'ADMIN_LOKAL', 'STAFF');
const admin = requireRole('SUPERADMIN', 'ADMIN_LOKAL');

const listSchema = z.object({
  tanggal: z.string().optional(),
  limit: z.number().int().min(1).max(200).optional()
});

router.post('/reservasi/list', authenticate, stafInternal, asyncHandler(async (req, res) => {
  const { tanggal, limit } = parseBody(listSchema, req.body ?? {});
  const result = await db.query<Record<string, unknown>>(
    `SELECT TOP (@limit) r.reservasi_id, r.pasien_id, p.nama AS nama_pasien, r.jadwal_id,
            r.nomor_antrean, r.estimasi_jam, r.status, r.metode_daftar, j.tanggal
       FROM [Reservasi] r
       JOIN [Pasien] p ON p.pasien_id = r.pasien_id
       JOIN [Jadwal_Praktik] j ON j.jadwal_id = r.jadwal_id
      WHERE @tanggal IS NULL OR CAST(j.tanggal AS VARCHAR(10)) = @tanggal
      ORDER BY j.tanggal ASC, r.nomor_antrean ASC`,
    { limit: paginate(limit, 100, 200), tanggal: tanggal ?? null }
  );
  res.status(200).json({ success: true, data: result.recordset });
}));

const jadwalUlangSchema = z.object({
  jadwal_id: z.string().uuid(),
  nomor_antrean: z.number().int().min(1).optional(),
  estimasi_jam: z.string().optional()
});

router.patch('/reservasi/:id/jadwal', authenticate, frontOffice, asyncHandler(async (req, res) => {
  const body = parseBody(jadwalUlangSchema, req.body);

  const jadwal = await db.query<{ jam_mulai: string }>(
    `SELECT jam_mulai FROM [Jadwal_Praktik] WHERE jadwal_id = @id AND aktif = 1`,
    { id: body.jadwal_id }
  );
  const slot = jadwal.recordset[0];
  if (!slot) {
    throw ApiError.notFound('Jadwal tidak ditemukan');
  }

  const updated = await db.query<Record<string, unknown>>(
    `UPDATE [Reservasi]
        SET jadwal_id = @jadwal_id,
            nomor_antrean = ISNULL(@nomor, nomor_antrean),
            estimasi_jam = ISNULL(@jam, estimasi_jam),
            status = 'MENUNGGU'
      OUTPUT INSERTED.*
      WHERE reservasi_id = @id`,
    {
      id: req.params['id'],
      jadwal_id: body.jadwal_id,
      nomor: body.nomor_antrean ?? null,
      jam: body.estimasi_jam ?? null
    }
  );
  const row = updated.recordset[0];
  if (!row) {
    throw ApiError.notFound('Reservasi tidak ditemukan');
  }
  res.status(200).json({ success: true, data: row });
}));

router.patch('/reservasi/:id/batal', authenticate, frontOffice, asyncHandler(async (req, res) => {
  const updated = await db.query<Record<string, unknown>>(
    `UPDATE [Reservasi] SET status = 'BATAL' OUTPUT INSERTED.* WHERE reservasi_id = @id`,
    { id: req.params['id'] }
  );
  const row = updated.recordset[0];
  if (!row) {
    throw ApiError.notFound('Reservasi tidak ditemukan');
  }
  res.status(200).json({ success: true, data: row });
}));

const statusSchema = z.object({
  status: z.enum(['MENUNGGU', 'DIPANGGIL', 'DILAYANI', 'SELESAI', 'BATAL', 'TIDAK_HADIR'])
});

router.patch('/reservasi/:id/status', authenticate, frontOffice, asyncHandler(async (req, res) => {
  const { status } = parseBody(statusSchema, req.body);
  const updated = await db.query<Record<string, unknown>>(
    `UPDATE [Reservasi] SET status = @status OUTPUT INSERTED.* WHERE reservasi_id = @id`,
    { id: req.params['id'], status }
  );
  const row = updated.recordset[0];
  if (!row) {
    throw ApiError.notFound('Reservasi tidak ditemukan');
  }
  res.status(200).json({ success: true, data: row });
}));

const jadwalList = asyncHandler(async (req, res) => {
  const { tanggal, limit } = parseBody(listSchema, req.body ?? {});
  const result = await db.query<Record<string, unknown>>(
    `SELECT TOP (@limit) j.* FROM [Jadwal_Praktik] j
      WHERE j.aktif = 1 AND (@tanggal IS NULL OR CAST(j.tanggal AS VARCHAR(10)) = @tanggal)
      ORDER BY j.tanggal ASC, j.jam_mulai ASC`,
    { limit: paginate(limit, 100, 200), tanggal: tanggal ?? null }
  );
  res.status(200).json({ success: true, data: result.recordset });
});

const jadwalSchema = z.object({
  staf_id: z.string().uuid().optional(),
  unit_id: z.string().uuid().optional(),
  ruangan_id: z.string().uuid().optional(),
  tanggal: z.string(),
  jam_mulai: z.string(),
  jam_selesai: z.string(),
  kuota_maks: z.number().int().min(1).max(500),
  durasi_per_pasien: z.number().int().min(5).max(240)
});

const createJadwal = asyncHandler(async (req, res) => {
  const body = parseBody(jadwalSchema, req.body);
  const stafId = body.staf_id ?? req.auth?.stafId;
  if (!stafId || !body.unit_id || !body.ruangan_id) {
    throw ApiError.badRequest('staf_id, unit_id, dan ruangan_id wajib diisi');
  }

  const created = await db.query<Record<string, unknown>>(
    `INSERT INTO [Jadwal_Praktik]
       (staf_id, unit_id, ruangan_id, tanggal, jam_mulai, jam_selesai, kuota_maks, durasi_per_pasien, aktif)
     OUTPUT INSERTED.*
     VALUES (@staf_id, @unit_id, @ruangan_id, @tanggal, @jam_mulai, @jam_selesai, @kuota_maks, @durasi, 1)`,
    {
      staf_id: stafId,
      unit_id: body.unit_id,
      ruangan_id: body.ruangan_id,
      tanggal: body.tanggal,
      jam_mulai: body.jam_mulai,
      jam_selesai: body.jam_selesai,
      kuota_maks: body.kuota_maks,
      durasi: body.durasi_per_pasien
    }
  );
  res.status(201).json({ success: true, data: created.recordset[0] });
});

const updateJadwal = asyncHandler(async (req, res) => {
  const body = parseBody(
    z.object({
      jam_mulai: z.string().optional(),
      jam_selesai: z.string().optional(),
      kuota_maks: z.number().int().min(1).max(500).optional(),
      durasi_per_pasien: z.number().int().min(5).max(240).optional(),
      aktif: z.boolean().optional()
    }),
    req.body
  );
  const keys = Object.keys(body);
  if (keys.length === 0) {
    throw ApiError.badRequest('Tidak ada perubahan');
  }
  const assignments = keys.map((key) => `${key} = @${key}`).join(', ');
  const updated = await db.query<Record<string, unknown>>(
    `UPDATE [Jadwal_Praktik] SET ${assignments} OUTPUT INSERTED.* WHERE jadwal_id = @id`,
    { ...body, id: req.params['id'] }
  );
  const row = updated.recordset[0];
  if (!row) {
    throw ApiError.notFound('Jadwal tidak ditemukan');
  }
  res.status(200).json({ success: true, data: row });
});

router.post('/jadwal-praktik/list', authenticate, stafInternal, jadwalList);
router.post('/jadwal-praktik', authenticate, admin, createJadwal);
router.patch('/jadwal-praktik/:id', authenticate, admin, updateJadwal);

// Alias TSD v1.0 untuk FE Bidan
router.post('/sesi/list', authenticate, stafInternal, jadwalList);
router.post('/sesi', authenticate, admin, createJadwal);
router.patch('/sesi/:id', authenticate, admin, updateJadwal);

export default router;
