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
const pendaftaran = requireRole('SUPERADMIN', 'ADMIN_LOKAL', 'DOKTER', 'STAFF');

const searchSchema = z.object({
  q: z.string().max(100).optional(),
  limit: z.number().int().min(1).max(200).optional()
});

router.post('/pasien/identitas/list', authenticate, pendaftaran, asyncHandler(async (req, res) => {
  const { q, limit } = parseBody(searchSchema, req.body ?? {});
  const term = q ? `%${q}%` : null;
  const result = await db.query<Record<string, unknown>>(
    `SELECT TOP (@limit) pasien_id, no_rm, nik, nama, jenis_kelamin, tgl_lahir,
            no_telepon, alamat, email
       FROM [Pasien]
      WHERE @term IS NULL OR nama LIKE @term OR nik LIKE @term OR no_rm LIKE @term
      ORDER BY nama ASC`,
    { limit: paginate(limit, 50, 200), term }
  );
  res.status(200).json({ success: true, data: result.recordset });
}));

const walkInSchema = z.object({
  nik: z.string().length(16),
  nama: z.string().min(1).max(100),
  jenis_kelamin: z.string().max(20),
  tgl_lahir: z.string(),
  tempat_lahir: z.string().max(100),
  alamat: z.string().max(255),
  no_telepon: z.string().max(16),
  gol_darah: z.string().max(20),
  status_pernikahan: z.string().max(20),
  pekerjaan: z.string().max(100),
  email: z.string().email().max(254).optional(),
  unit_id: z.string().uuid(),
  dpjp_staf_id: z.string().uuid().optional(),
  penjamin_id: z.string().uuid().optional(),
  jenis_kunjungan: z.string().max(30).default('RAWAT_JALAN')
});

router.post(
  '/pasien/walk-in',
  authenticate,
  requireRole('SUPERADMIN', 'ADMIN_LOKAL', 'STAFF'),
  asyncHandler(async (req, res) => {
    const body = parseBody(walkInSchema, req.body);

    const existing = await db.query<{ pasien_id: string }>(
      `SELECT TOP 1 pasien_id FROM [Pasien] WHERE nik = @nik`,
      { nik: body.nik }
    );
    let pasienId = existing.recordset[0]?.pasien_id;

    if (!pasienId) {
      const created = await db.query<{ pasien_id: string }>(
        `INSERT INTO [Pasien]
           (no_rm, nik, nama, jenis_kelamin, tgl_lahir, tempat_lahir, alamat, no_telepon,
            gol_darah, status_pernikahan, pekerjaan, email)
         OUTPUT INSERTED.pasien_id
         VALUES (RIGHT('000000' + CAST(NEXT VALUE FOR dbo.Seq_NoRM AS VARCHAR(10)), 6),
                 @nik, @nama, @jenis_kelamin, @tgl_lahir, @tempat_lahir, @alamat, @no_telepon,
                 @gol_darah, @status_pernikahan, @pekerjaan, @email)`,
        {
          nik: body.nik,
          nama: body.nama,
          jenis_kelamin: body.jenis_kelamin,
          tgl_lahir: body.tgl_lahir,
          tempat_lahir: body.tempat_lahir,
          alamat: body.alamat,
          no_telepon: body.no_telepon,
          gol_darah: body.gol_darah,
          status_pernikahan: body.status_pernikahan,
          pekerjaan: body.pekerjaan,
          email: body.email ?? null
        }
      );
      pasienId = created.recordset[0]?.pasien_id;
    }

    if (!pasienId) {
      throw ApiError.internal('Gagal membuat data pasien');
    }

    const dpjp = body.dpjp_staf_id ?? (await db.query<{ staf_id: string }>(
      `SELECT TOP 1 s.staf_id
         FROM [Staf] s
         JOIN [Profesi] pr ON pr.profesi_id = s.profesi_id
        WHERE s.aktif = 1 AND pr.kode LIKE 'DOKTER%'
        ORDER BY s.nama ASC`,
      {}
    )).recordset[0]?.staf_id;
    if (!dpjp) {
      throw ApiError.badRequest('Tidak ada dokter aktif untuk dijadikan DPJP');
    }

    const penjamin = body.penjamin_id ?? (await db.query<{ penjamin_id: string }>(
      `SELECT TOP 1 penjamin_id FROM [Penjamin] ORDER BY nama ASC`,
      {}
    )).recordset[0]?.penjamin_id;
    if (!penjamin) {
      throw ApiError.badRequest('Tidak ada penjamin terdaftar');
    }

    const kunjungan = await db.query<{ kunjungan_id: string }>(
      `INSERT INTO [Kunjungan]
         (pasien_id, unit_id, dpjp_staf_id, penjamin_id, jenis_kunjungan, tgl_masuk, status)
       OUTPUT INSERTED.kunjungan_id
       VALUES (@pasien_id, @unit_id, @dpjp_staf_id, @penjamin_id, @jenis, SYSDATETIME(), 'MENUNGGU')`,
      {
        pasien_id: pasienId,
        unit_id: body.unit_id,
        dpjp_staf_id: dpjp,
        penjamin_id: penjamin,
        jenis: body.jenis_kunjungan
      }
    );

    res.status(201).json({
      success: true,
      data: { pasien_id: pasienId, kunjungan_id: kunjungan.recordset[0]?.kunjungan_id }
    });
  })
);

router.post('/pasien/list', authenticate, requireRole('SUPERADMIN', 'DOKTER', 'STAFF'), asyncHandler(async (req, res) => {
  const { q, limit } = parseBody(searchSchema, req.body ?? {});
  const term = q ? `%${q}%` : null;
  const result = await db.query<Record<string, unknown>>(
    `SELECT TOP (@limit) p.pasien_id, p.no_rm, p.nama, p.jenis_kelamin, p.tgl_lahir,
            CASE WHEN EXISTS (SELECT 1 FROM [Alergi_Kondisi] a WHERE a.pasien_id = p.pasien_id AND a.aktif = 1)
                 THEN 1 ELSE 0 END AS red_flag
       FROM [Pasien] p
      WHERE @term IS NULL OR p.nama LIKE @term OR p.nik LIKE @term OR p.no_rm LIKE @term
      ORDER BY p.nama ASC`,
    { limit: paginate(limit, 50, 200), term }
  );
  res.status(200).json({ success: true, data: result.recordset });
}));

router.post('/pasien/:id/rme/detail', authenticate, klinis, asyncHandler(async (req, res) => {
  const pasienId = req.params['id'];
  const pasien = await db.query<Record<string, unknown>>(
    `SELECT * FROM [Pasien] WHERE pasien_id = @id`,
    { id: pasienId }
  );
  const row = pasien.recordset[0];
  if (!row) {
    throw ApiError.notFound('Pasien tidak ditemukan');
  }

  const [alergi, kunjungan, kehamilan] = await Promise.all([
    db.query<Record<string, unknown>>(
      `SELECT TOP 100 * FROM [Alergi_Kondisi] WHERE pasien_id = @id ORDER BY created_at DESC`,
      { id: pasienId }
    ),
    db.query<Record<string, unknown>>(
      `SELECT TOP 50 * FROM [Kunjungan] WHERE pasien_id = @id ORDER BY tgl_masuk DESC`,
      { id: pasienId }
    ),
    db.query<Record<string, unknown>>(
      `SELECT TOP 100 * FROM [Kehamilan] WHERE pasien_id = @id ORDER BY hpht DESC`,
      { id: pasienId }
    )
  ]);

  res.status(200).json({
    success: true,
    data: {
      pasien: row,
      alergi: alergi.recordset,
      kunjungan: kunjungan.recordset,
      kehamilan: kehamilan.recordset
    }
  });
}));

const alergiSchema = z.object({
  obat_id: z.string().uuid().optional(),
  kategori: z.string().max(30),
  nama: z.string().max(100),
  keterangan: z.string().max(255).optional()
});

router.post('/pasien/:id/alergi', authenticate, klinis, asyncHandler(async (req, res) => {
  const body = parseBody(alergiSchema, req.body);
  const created = await db.query<Record<string, unknown>>(
    `INSERT INTO [Alergi_Kondisi] (pasien_id, obat_id, dicatat_oleh, kategori, nama, keterangan, aktif)
     OUTPUT INSERTED.*
     VALUES (@pasien_id, @obat_id, @dicatat_oleh, @kategori, @nama, @keterangan, 1)`,
    {
      pasien_id: req.params['id'],
      obat_id: body.obat_id ?? null,
      dicatat_oleh: req.auth?.stafId ?? null,
      kategori: body.kategori,
      nama: body.nama,
      keterangan: body.keterangan ?? null
    }
  );
  res.status(201).json({ success: true, data: created.recordset[0] });
}));

const alergiUpdateSchema = z.object({
  kategori: z.string().max(30).optional(),
  nama: z.string().max(100).optional(),
  keterangan: z.string().max(255).optional(),
  aktif: z.boolean().optional()
});

router.patch('/alergi/:id', authenticate, requireRole('SUPERADMIN', 'DOKTER'), asyncHandler(async (req, res) => {
  const body = parseBody(alergiUpdateSchema, req.body);
  const keys = Object.keys(body);
  if (keys.length === 0) {
    throw ApiError.badRequest('Tidak ada perubahan');
  }
  const assignments = keys.map((key) => `${key} = @${key}`).join(', ');
  const updated = await db.query<Record<string, unknown>>(
    `UPDATE [Alergi_Kondisi] SET ${assignments} OUTPUT INSERTED.* WHERE alergi_id = @id`,
    { ...body, id: req.params['id'] }
  );
  const row = updated.recordset[0];
  if (!row) {
    throw ApiError.notFound('Data alergi tidak ditemukan');
  }
  res.status(200).json({ success: true, data: row });
}));

const konfirmasiSchema = z.object({
  kunjungan_id: z.string().uuid().optional(),
  catatan: z.string().max(500).optional()
});

router.post('/pasien/:id/red-flag/konfirmasi', authenticate, klinis, asyncHandler(async (req, res) => {
  const body = parseBody(konfirmasiSchema, req.body ?? {});

  if (body.kunjungan_id) {
    await db.query(
      `INSERT INTO [Catatan_Keperawatan] (kunjungan_id, staf_id, jenis, isi, waktu)
       VALUES (@kunjungan_id, @staf_id, 'KONFIRMASI_RED_FLAG', @isi, SYSDATETIME())`,
      {
        kunjungan_id: body.kunjungan_id,
        staf_id: req.auth?.stafId ?? null,
        isi: body.catatan ?? 'Tenaga klinis mengonfirmasi pembacaan red-flag pasien'
      }
    );
  }

  res.status(200).json({
    success: true,
    data: { pasien_id: req.params['id'], dikonfirmasi: true, oleh: req.auth?.akunId ?? null }
  });
}));

router.post('/pasien/:id/rme/export', authenticate, requireRole('SUPERADMIN', 'DOKTER'), asyncHandler(async (req, res) => {
  const pasienId = req.params['id'];
  const pasien = await db.query<Record<string, unknown>>(
    `SELECT * FROM [Pasien] WHERE pasien_id = @id`,
    { id: pasienId }
  );
  const row = pasien.recordset[0];
  if (!row) {
    throw ApiError.notFound('Pasien tidak ditemukan');
  }

  const kunjungan = await db.query<Record<string, unknown>>(
    `SELECT TOP 100 k.kunjungan_id, k.tgl_masuk, k.tgl_keluar, k.status,
            (SELECT d.kode_icd + ' - ' + d.nama
               FROM [Kunjungan_Diagnosa] kd
               JOIN [Diagnosa] d ON d.diagnosa_id = kd.diagnosa_id
              WHERE kd.kunjungan_id = k.kunjungan_id
              FOR JSON PATH) AS diagnosa
       FROM [Kunjungan] k
      WHERE k.pasien_id = @id
      ORDER BY k.tgl_masuk DESC`,
    { id: pasienId }
  );

  // ponytail: ekspor JSON dulu; render PDF ditambahkan saat pustaka PDF dipilih
  res.status(200).json({
    success: true,
    data: { pasien: row, kunjungan: kunjungan.recordset, format: 'JSON' }
  });
}));

export default router;
