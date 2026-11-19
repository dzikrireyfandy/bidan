import { Router } from 'express';
import { z } from 'zod';
import db from '../../db/pool';
import ApiError from '../../errors/ApiError';
import { asyncHandler } from '../../middleware/asyncHandler';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { parseBody, paginate } from './_validate';

const router = Router();

const klinis = requireRole('SUPERADMIN', 'DOKTER', 'STAFF');
const admisi = requireRole('SUPERADMIN', 'STAFF');
const dokter = requireRole('SUPERADMIN', 'DOKTER');
const admin = requireRole('SUPERADMIN', 'ADMIN_LOKAL');

const listSchema = z.object({ limit: z.number().int().min(1).max(300).optional() });

router.post('/rawat-inap/tempat-tidur/list', authenticate, klinis, asyncHandler(async (req, res) => {
  const { limit } = parseBody(listSchema, req.body ?? {});
  const result = await db.query<Record<string, unknown>>(
    `SELECT TOP (@limit) tt.bed_id, tt.no_bed, tt.status, tt.ruangan_id, r.nama AS ruangan,
            k.kode AS kelas
       FROM [Tempat_Tidur] tt
       LEFT JOIN [Ruangan] r ON r.ruangan_id = tt.ruangan_id
       LEFT JOIN [Kelas_Perawatan] k ON k.kelas_id = tt.kelas_id
      ORDER BY r.nama ASC, tt.no_bed ASC`,
    { limit: paginate(limit, 200, 300) }
  );
  res.status(200).json({ success: true, data: result.recordset });
}));

const admisiSchema = z.object({ bed_id: z.string().uuid(), catatan: z.string().max(500).optional() });

router.post('/kunjungan/:id/rawat-inap', authenticate, admisi, asyncHandler(async (req, res) => {
  const body = parseBody(admisiSchema, req.body);

  const bed = await db.query<{ status: string }>(
    `SELECT status FROM [Tempat_Tidur] WHERE bed_id = @id`,
    { id: body.bed_id }
  );
  const statusBed = bed.recordset[0]?.status;
  if (!statusBed) {
    throw ApiError.notFound('Tempat tidur tidak ditemukan');
  }
  if (statusBed !== 'KOSONG') {
    throw ApiError.conflict('Tempat tidur tidak tersedia');
  }

  const created = await db.query<Record<string, unknown>>(
    `INSERT INTO [Rawat_Inap] (kunjungan_id, bed_id, tgl_masuk)
     OUTPUT INSERTED.*
     VALUES (@kunjungan_id, @bed_id, SYSDATETIME())`,
    { kunjungan_id: req.params['id'], bed_id: body.bed_id }
  );
  await db.query(`UPDATE [Tempat_Tidur] SET status = 'TERISI' WHERE bed_id = @id`, { id: body.bed_id });

  res.status(201).json({ success: true, data: created.recordset[0] });
}));

router.patch('/rawat-inap/:id/pindah', authenticate, requireRole('SUPERADMIN', 'STAFF'), asyncHandler(async (req, res) => {
  const body = parseBody(
    z.object({ bed_id: z.string().uuid(), alasan_pindah: z.string().max(255).optional() }),
    req.body
  );

  const lama = await db.query<{ bed_id: string }>(
    `SELECT bed_id FROM [Rawat_Inap] WHERE rawat_inap_id = @id`,
    { id: req.params['id'] }
  );
  const bedLama = lama.recordset[0]?.bed_id;
  if (!bedLama) {
    throw ApiError.notFound('Rawat inap tidak ditemukan');
  }

  const updated = await db.query<Record<string, unknown>>(
    `UPDATE [Rawat_Inap] SET bed_id = @bed_id, alasan_pindah = @alasan
     OUTPUT INSERTED.* WHERE rawat_inap_id = @id`,
    { id: req.params['id'], bed_id: body.bed_id, alasan: body.alasan_pindah ?? null }
  );

  await db.query(`UPDATE [Tempat_Tidur] SET status = 'KOSONG' WHERE bed_id = @id`, { id: bedLama });
  await db.query(`UPDATE [Tempat_Tidur] SET status = 'TERISI' WHERE bed_id = @id`, { id: body.bed_id });

  res.status(200).json({ success: true, data: updated.recordset[0] });
}));

const pulangSchema = z.object({
  cara_keluar: z.enum(['SEMBUH', 'DIRUJUK', 'APS', 'MENINGGAL']),
  catatan_pulang: z.string().max(2000).optional()
});

router.patch('/rawat-inap/:id/pulang', authenticate, klinis, asyncHandler(async (req, res) => {
  const body = parseBody(pulangSchema, req.body);

  const result = await db.query<{ kode_hasil: number }>(
    `DECLARE @kode INT;
     EXEC [dbo].[sp_pulang_rawat_inap]
          @rawat_inap_id = @id, @cara_keluar = @cara,
          @catatan_pulang = @catatan, @kode_hasil = @kode OUTPUT;
     SELECT @kode AS kode_hasil;`,
    { id: req.params['id'], cara: body.cara_keluar, catatan: body.catatan_pulang ?? null }
  );

  const kode = result.recordset[0]?.kode_hasil ?? -1;
  if (kode !== 0) {
    throw ApiError.conflict(`Proses pulang gagal (kode ${kode})`);
  }

  res.status(200).json({ success: true, data: { rawat_inap_id: req.params['id'], kode_hasil: kode } });
}));

router.post('/kunjungan/:id/visite', authenticate, klinis, asyncHandler(async (req, res) => {
  const body = parseBody(z.object({ catatan: z.string().min(1).max(2000) }), req.body);
  const created = await db.query<Record<string, unknown>>(
    `INSERT INTO [Visite] (kunjungan_id, staf_id, waktu, catatan)
     OUTPUT INSERTED.*
     VALUES (@kunjungan_id, @staf_id, SYSDATETIME(), @catatan)`,
    {
      kunjungan_id: req.params['id'],
      staf_id: req.auth?.stafId ?? null,
      catatan: body.catatan
    }
  );
  res.status(201).json({ success: true, data: created.recordset[0] });
}));

const triaseSchema = z.object({
  level: z.enum(['P1', 'P2', 'P3', 'P4', 'P5']),
  keluhan_utama: z.string().min(1).max(500),
  keputusan: z.string().max(255).optional()
});

router.post('/kunjungan/:id/triase', authenticate, klinis, asyncHandler(async (req, res) => {
  const body = parseBody(triaseSchema, req.body);
  const created = await db.query<Record<string, unknown>>(
    `INSERT INTO [Triase] (kunjungan_id, staf_id, level, keluhan_utama, waktu, keputusan)
     OUTPUT INSERTED.*
     VALUES (@kunjungan_id, @staf_id, @level, @keluhan, SYSDATETIME(), @keputusan)`,
    {
      kunjungan_id: req.params['id'],
      staf_id: req.auth?.stafId ?? null,
      level: body.level,
      keluhan: body.keluhan_utama,
      keputusan: body.keputusan ?? null
    }
  );
  res.status(201).json({ success: true, data: created.recordset[0] });
}));

router.post('/igd/antrean/list', authenticate, klinis, asyncHandler(async (_req, res) => {
  const result = await db.query<Record<string, unknown>>(
    `SELECT t.triase_id, t.level, t.keluhan_utama, t.waktu, k.kunjungan_id, p.nama AS nama_pasien
       FROM [Triase] t
       JOIN [Kunjungan] k ON k.kunjungan_id = t.kunjungan_id
       JOIN [Pasien] p ON p.pasien_id = k.pasien_id
      WHERE k.status <> 'SELESAI'
      ORDER BY t.level ASC, t.waktu ASC`,
    {}
  );
  res.status(200).json({ success: true, data: result.recordset });
}));

router.post('/operasi/list', authenticate, klinis, asyncHandler(async (req, res) => {
  const { limit } = parseBody(listSchema, req.body ?? {});
  const result = await db.query<Record<string, unknown>>(
    `SELECT TOP (@limit) o.*, p.nama AS nama_pasien, r.nama AS ruangan
       FROM [Operasi] o
       JOIN [Kunjungan] k ON k.kunjungan_id = o.kunjungan_id
       JOIN [Pasien] p ON p.pasien_id = k.pasien_id
       LEFT JOIN [Ruangan] r ON r.ruangan_id = o.ruangan_id
      ORDER BY o.jadwal_mulai DESC`,
    { limit: paginate(limit, 100, 300) }
  );
  res.status(200).json({ success: true, data: result.recordset });
}));

const operasiSchema = z.object({
  layanan_id: z.string().uuid(),
  ruangan_id: z.string().uuid(),
  jenis_anestesi: z.string().max(30),
  jadwal_mulai: z.string()
});

router.post('/kunjungan/:id/operasi', authenticate, dokter, asyncHandler(async (req, res) => {
  const body = parseBody(operasiSchema, req.body);

  const bentrok = await db.query<{ jumlah: number }>(
    `SELECT COUNT(*) AS jumlah FROM [Operasi]
      WHERE ruangan_id = @ruangan AND status NOT IN ('SELESAI', 'BATAL')
        AND jadwal_mulai = CAST(@jadwal AS DATETIME2)`,
    { ruangan: body.ruangan_id, jadwal: body.jadwal_mulai }
  );
  if ((bentrok.recordset[0]?.jumlah ?? 0) > 0) {
    throw ApiError.conflict('Jadwal kamar operasi bentrok');
  }

  const created = await db.query<Record<string, unknown>>(
    `INSERT INTO [Operasi] (kunjungan_id, layanan_id, ruangan_id, jenis_anestesi, jadwal_mulai, waktu_mulai, status)
     OUTPUT INSERTED.*
     VALUES (@kunjungan_id, @layanan, @ruangan, @anestesi, CAST(@jadwal AS DATETIME2), CAST(@jadwal AS DATETIME2), 'DIJADWALKAN')`,
    {
      kunjungan_id: req.params['id'],
      layanan: body.layanan_id,
      ruangan: body.ruangan_id,
      anestesi: body.jenis_anestesi,
      jadwal: body.jadwal_mulai
    }
  );
  res.status(201).json({ success: true, data: created.recordset[0] });
}));

router.patch('/operasi/:id', authenticate, klinis, asyncHandler(async (req, res) => {
  const body = parseBody(
    z.object({
      waktu_mulai: z.string().optional(),
      waktu_selesai: z.string().optional(),
      status: z.enum(['DIJADWALKAN', 'BERLANGSUNG', 'SELESAI', 'BATAL']).optional(),
      laporan: z.string().max(4000).optional()
    }),
    req.body
  );
  const keys = Object.keys(body);
  if (keys.length === 0) {
    throw ApiError.badRequest('Tidak ada perubahan');
  }
  const assignments = keys.map((key) => (key.startsWith('waktu_') ? `${key} = CAST(@${key} AS DATETIME2)` : `${key} = @${key}`)).join(', ');
  const updated = await db.query<Record<string, unknown>>(
    `UPDATE [Operasi] SET ${assignments} OUTPUT INSERTED.* WHERE operasi_id = @id`,
    { ...body, id: req.params['id'] }
  );
  const row = updated.recordset[0];
  if (!row) {
    throw ApiError.notFound('Operasi tidak ditemukan');
  }
  res.status(200).json({ success: true, data: row });
}));

router.post('/ambulans/list', authenticate, requireRole('SUPERADMIN', 'ADMIN_LOKAL', 'STAFF'), asyncHandler(async (_req, res) => {
  const result = await db.query<Record<string, unknown>>(
    `SELECT ambulans_id, aset_id, plat_nomor, jenis, tahun, kapasitas, status, tgl_kir_berikutnya
       FROM [Ambulans] ORDER BY plat_nomor ASC`,
    {}
  );
  res.status(200).json({ success: true, data: result.recordset });
}));

router.post('/ambulans', authenticate, admin, asyncHandler(async (req, res) => {
  const body = parseBody(
    z.object({
      aset_id: z.string().uuid().optional(),
      plat_nomor: z.string().min(1).max(20),
      jenis: z.string().max(30),
      tahun: z.number().int().min(1950).max(2100),
      kapasitas: z.number().int().min(1).max(20),
      status: z.string().max(20).default('SIAP'),
      tgl_kir_berikutnya: z.string().optional()
    }),
    req.body
  );
  const created = await db.query<Record<string, unknown>>(
    `INSERT INTO [Ambulans] (aset_id, plat_nomor, jenis, tahun, kapasitas, status, tgl_kir_berikutnya)
     OUTPUT INSERTED.*
     VALUES (@aset, @plat, @jenis, @tahun, @kapasitas, @status, @kir)`,
    {
      aset: body.aset_id ?? null,
      plat: body.plat_nomor,
      jenis: body.jenis,
      tahun: body.tahun,
      kapasitas: body.kapasitas,
      status: body.status,
      kir: body.tgl_kir_berikutnya ?? null
    }
  );
  res.status(201).json({ success: true, data: created.recordset[0] });
}));

router.post('/ambulans/:id/perjalanan', authenticate, requireRole('SUPERADMIN', 'ADMIN_LOKAL', 'STAFF'), asyncHandler(async (req, res) => {
  const body = parseBody(
    z.object({
      pasien_id: z.string().uuid(),
      layanan_id: z.string().uuid(),
      kunjungan_id: z.string().uuid().optional(),
      asal: z.string().max(255),
      tujuan: z.string().max(255),
      waktu_berangkat: z.string().optional(),
      jarak_km: z.number().min(0).optional()
    }),
    req.body
  );
  const sopir = req.auth?.stafId ?? null;
  if (!sopir) {
    throw ApiError.badRequest('Akun tidak terhubung ke staf');
  }
  const created = await db.query<Record<string, unknown>>(
    `INSERT INTO [Perjalanan_Ambulans]
       (ambulans_id, pasien_id, kunjungan_id, layanan_id, sopir_staf_id, asal, tujuan, waktu_berangkat, jarak_km, status)
     OUTPUT INSERTED.*
     VALUES (@ambulans_id, @pasien, @kunjungan, @layanan, @sopir, @asal, @tujuan,
             ISNULL(CAST(@berangkat AS DATETIME2), SYSDATETIME()), @jarak, 'BERANGKAT')`,
    {
      ambulans_id: req.params['id'],
      pasien: body.pasien_id,
      kunjungan: body.kunjungan_id ?? null,
      layanan: body.layanan_id,
      sopir,
      asal: body.asal,
      tujuan: body.tujuan,
      berangkat: body.waktu_berangkat ?? null,
      jarak: body.jarak_km ?? null
    }
  );
  res.status(201).json({ success: true, data: created.recordset[0] });
}));

router.post('/ambulans/perjalanan/list', authenticate, requireRole('SUPERADMIN', 'ADMIN_LOKAL', 'STAFF'), asyncHandler(async (req, res) => {
  const { limit } = parseBody(listSchema, req.body ?? {});
  const result = await db.query<Record<string, unknown>>(
    `SELECT TOP (@limit) pj.*, a.plat_nomor
       FROM [Perjalanan_Ambulans] pj
       JOIN [Ambulans] a ON a.ambulans_id = pj.ambulans_id
      ORDER BY pj.waktu_berangkat DESC`,
    { limit: paginate(limit, 100, 300) }
  );
  res.status(200).json({ success: true, data: result.recordset });
}));

export default router;
