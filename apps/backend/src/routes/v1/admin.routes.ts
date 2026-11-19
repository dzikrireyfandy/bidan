import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import db from '../../db/pool';
import ApiError from '../../errors/ApiError';
import { asyncHandler } from '../../middleware/asyncHandler';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { parseBody } from './_validate';

const router = Router();

const ADMIN = requireRole('SUPERADMIN', 'ADMIN_LOKAL');

const akunSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(8).max(128),
  peran: z.enum(['SUPERADMIN', 'ADMIN_LOKAL', 'DOKTER', 'STAFF']),
  sub_peran: z.enum(['PERAWAT', 'RESEPSIONIS']).optional()
});

router.post('/staf/:id/akun', authenticate, requireRole('SUPERADMIN'), asyncHandler(async (req, res) => {
  const body = parseBody(akunSchema, req.body);

  if (body.peran === 'STAFF' && !body.sub_peran) {
    throw ApiError.badRequest('sub_peran wajib diisi untuk peran STAFF');
  }
  if (body.peran !== 'STAFF' && body.sub_peran) {
    throw ApiError.badRequest('sub_peran hanya berlaku untuk peran STAFF');
  }

  const peran = await db.query<{ peran_id: string }>(
    `SELECT TOP 1 peran_id FROM [Peran] WHERE kode = @kode`,
    { kode: body.peran }
  );
  const peranId = peran.recordset[0]?.peran_id;
  if (!peranId) {
    throw ApiError.badRequest(`Peran ${body.peran} tidak ditemukan pada master Peran`);
  }

  const duplikat = await db.query<{ jumlah: number }>(
    `SELECT COUNT(*) AS jumlah FROM [Akun_Pengguna] WHERE username = @username`,
    { username: body.username }
  );
  if ((duplikat.recordset[0]?.jumlah ?? 0) > 0) {
    throw ApiError.conflict('Username sudah digunakan');
  }

  const hash = await bcrypt.hash(body.password, 10);
  const created = await db.query<Record<string, unknown>>(
    `INSERT INTO [Akun_Pengguna] (staf_id, peran_id, username, password_hash, aktif, percobaan_gagal, sub_peran)
     OUTPUT INSERTED.akun_id, INSERTED.username, INSERTED.sub_peran
     VALUES (@staf_id, @peran_id, @username, @hash, 1, 0, @sub_peran)`,
    {
      staf_id: req.params['id'],
      peran_id: peranId,
      username: body.username,
      hash,
      sub_peran: body.sub_peran ?? null
    }
  );

  res.status(201).json({ success: true, data: created.recordset[0] });
}));

const pemeliharaanSchema = z.object({
  teknisi_staf_id: z.string().uuid().optional(),
  jenis: z.string().min(1).max(50),
  tanggal: z.string(),
  biaya: z.number().min(0).default(0),
  hasil: z.string().max(1000).optional(),
  jadwal_berikutnya: z.string().optional()
});

router.post('/aset/:id/pemeliharaan', authenticate, ADMIN, asyncHandler(async (req, res) => {
  const body = parseBody(pemeliharaanSchema, req.body);

  const created = await db.query<Record<string, unknown>>(
    `INSERT INTO [Pemeliharaan_Aset]
       (aset_id, teknisi_staf_id, jenis, tanggal, biaya, hasil, jadwal_berikutnya)
     OUTPUT INSERTED.*
     VALUES (@aset_id, @teknisi, @jenis, @tanggal, @biaya, @hasil, @jadwal)`,
    {
      aset_id: req.params['id'],
      teknisi: body.teknisi_staf_id ?? null,
      jenis: body.jenis,
      tanggal: body.tanggal,
      biaya: body.biaya,
      hasil: body.hasil ?? null,
      jadwal: body.jadwal_berikutnya ?? null
    }
  );

  if (body.jadwal_berikutnya) {
    await db.query(
      `INSERT INTO [Notifikasi_Log] (jenis, tujuan, pesan, status, retry_count, waktu_kirim)
       SELECT 'KALIBRASI_ASET', '-',
              'Jadwal pemeliharaan aset ' + a.nama + ' pada ' + CONVERT(VARCHAR(10), @jadwal, 105),
              'ANTRE', 0, DATEADD(DAY, -1, CAST(@jadwal AS DATETIME2))
         FROM [Aset] a WHERE a.aset_id = @aset_id`,
      { jadwal: body.jadwal_berikutnya, aset_id: req.params['id'] }
    );
  }

  res.status(201).json({ success: true, data: created.recordset[0] });
}));

export default router;
