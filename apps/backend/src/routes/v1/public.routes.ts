import { Router } from 'express';
import { z } from 'zod';
import db from '../../db/pool';
import ApiError from '../../errors/ApiError';
import { asyncHandler } from '../../middleware/asyncHandler';
import { parseBody, paginate } from './_validate';

const router = Router();

const listSchema = z.object({
  limit: z.number().int().min(1).max(200).optional(),
  tipe: z.string().max(20).optional(),
  unit_id: z.string().uuid().optional()
});

router.post('/public/konten/list', asyncHandler(async (req, res) => {
  const { limit, tipe } = parseBody(listSchema, req.body ?? {});
  const result = await db.query<Record<string, unknown>>(
    `SELECT TOP (@limit) konten_id, tipe, judul, isi, media_url, urutan, updated_at
       FROM [Konten_Publik]
      WHERE terbit = 1 AND (@tipe IS NULL OR tipe = @tipe)
      ORDER BY urutan ASC`,
    { limit: paginate(limit, 50, 200), tipe: tipe ?? null }
  );
  res.status(200).json({ success: true, data: result.recordset });
}));

router.post('/public/layanan/list', asyncHandler(async (req, res) => {
  const { limit, unit_id } = parseBody(listSchema, req.body ?? {});
  const result = await db.query<Record<string, unknown>>(
    `SELECT TOP (@limit) layanan_id, unit_id, kode, nama, kategori, satuan, kode_icd9
       FROM [Layanan_Medis]
      WHERE aktif = 1 AND (@unit_id IS NULL OR unit_id = @unit_id)
      ORDER BY nama ASC`,
    { limit: paginate(limit, 100, 200), unit_id: unit_id ?? null }
  );
  res.status(200).json({ success: true, data: result.recordset });
}));

const jadwalList = asyncHandler(async (req, res) => {
  const { limit, unit_id } = parseBody(listSchema, req.body ?? {});
  const result = await db.query<Record<string, unknown>>(
    `SELECT TOP (@limit) jadwal_id, staf_id, unit_id, ruangan_id, tanggal,
            jam_mulai, jam_selesai, kuota_maks, durasi_per_pasien
       FROM [Jadwal_Praktik]
      WHERE aktif = 1 AND tanggal >= CAST(SYSDATETIME() AS DATE)
        AND (@unit_id IS NULL OR unit_id = @unit_id)
      ORDER BY tanggal ASC, jam_mulai ASC`,
    { limit: paginate(limit, 100, 200), unit_id: unit_id ?? null }
  );

  const rows = await Promise.all(
    result.recordset.map(async (row) => {
      const terpakai = await db.query<{ jumlah: number }>(
        `SELECT COUNT(*) AS jumlah FROM [Reservasi]
          WHERE jadwal_id = @id AND status NOT IN ('BATAL', 'TIDAK_HADIR')`,
        { id: row['jadwal_id'] }
      );
      const dipakai = terpakai.recordset[0]?.jumlah ?? 0;
      const kuota = Number(row['kuota_maks'] ?? 0);
      return { ...row, sisa_kuota: Math.max(kuota - dipakai, 0) };
    })
  );

  res.status(200).json({ success: true, data: rows });
});

router.post('/public/jadwal/list', jadwalList);
router.post('/public/sesi/list', jadwalList);

const cekPasienSchema = z.object({
  nik: z.string().length(16).optional(),
  no_rm: z.string().max(30).optional()
}).refine((v) => Boolean(v.nik ?? v.no_rm), { message: 'nik atau no_rm wajib diisi' });

router.post('/public/pasien/cek', asyncHandler(async (req, res) => {
  const { nik, no_rm } = parseBody(cekPasienSchema, req.body);
  const result = await db.query<{ pasien_id: string; no_rm: string; nama: string }>(
    `SELECT TOP 1 pasien_id, no_rm, nama FROM [Pasien]
      WHERE nik = @nik OR no_rm = @no_rm`,
    { nik: nik ?? null, no_rm: no_rm ?? null }
  );
  const pasien = result.recordset[0];
  res.status(200).json({
    success: true,
    data: pasien ? { terdaftar: true, ...pasien } : { terdaftar: false }
  });
}));

const reservasiSchema = z.object({
  pasien_id: z.string().uuid(),
  jadwal_id: z.string().uuid(),
  layanan_id: z.string().uuid(),
  metode_daftar: z.enum(['ONLINE', 'WALK_IN', 'TELEPON']).default('ONLINE')
});

router.post('/public/reservasi', asyncHandler(async (req, res) => {
  const body = parseBody(reservasiSchema, req.body);

  const jadwal = await db.query<{ jam_mulai: string; durasi_per_pasien: number; kuota_maks: number }>(
    `SELECT jam_mulai, durasi_per_pasien, kuota_maks FROM [Jadwal_Praktik]
      WHERE jadwal_id = @id AND aktif = 1 AND tanggal >= CAST(SYSDATETIME() AS DATE)`,
    { id: body.jadwal_id }
  );
  const slot = jadwal.recordset[0];
  if (!slot) {
    throw ApiError.notFound('Jadwal tidak tersedia');
  }

  const terpakai = await db.query<{ jumlah: number }>(
    `SELECT COUNT(*) AS jumlah FROM [Reservasi]
      WHERE jadwal_id = @id AND status NOT IN ('BATAL', 'TIDAK_HADIR')`,
    { id: body.jadwal_id }
  );
  const urutan = (terpakai.recordset[0]?.jumlah ?? 0) + 1;
  if (urutan > slot.kuota_maks) {
    throw ApiError.conflict('Kuota jadwal sudah penuh');
  }

  const inserted = await db.query<{ reservasi_id: string; nomor_antrean: number; estimasi_jam: string }>(
    `INSERT INTO [Reservasi]
       (pasien_id, jadwal_id, layanan_id, nomor_antrean, estimasi_jam, status, metode_daftar)
     OUTPUT INSERTED.reservasi_id, INSERTED.nomor_antrean, INSERTED.estimasi_jam
     VALUES (@pasien_id, @jadwal_id, @layanan_id, @nomor, DATEADD(MINUTE, @offset, CAST(@jam AS TIME(0))), 'MENUNGGU', @metode)`,
    {
      pasien_id: body.pasien_id,
      jadwal_id: body.jadwal_id,
      layanan_id: body.layanan_id,
      nomor: urutan,
      offset: (urutan - 1) * slot.durasi_per_pasien,
      jam: slot.jam_mulai,
      metode: body.metode_daftar
    }
  );

  res.status(201).json({ success: true, data: inserted.recordset[0] });
}));

export default router;
