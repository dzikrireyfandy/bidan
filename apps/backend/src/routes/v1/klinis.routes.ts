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
const dokter = requireRole('SUPERADMIN', 'DOKTER');

const limitSchema = z.object({ limit: z.number().int().min(1).max(200).optional() });

const diagnosaSchema = z.object({
  kode_icd: z.string().max(20),
  nama: z.string().max(255),
  jenis: z.enum(['UTAMA', 'SEKUNDER', 'KOMPLIKASI']).default('SEKUNDER')
});

const kunjunganSchema = z.object({
  unit_id: z.string().uuid(),
  dpjp_staf_id: z.string().uuid().optional(),
  penjamin_id: z.string().uuid().optional(),
  jenis_kunjungan: z.string().max(30).default('RAWAT_JALAN'),
  diagnosa: z.array(diagnosaSchema).default([]),
  layanan_ids: z.array(z.string().uuid()).default([])
});

router.post('/pasien/:id/kunjungan', authenticate, dokter, asyncHandler(async (req, res) => {
  const body = parseBody(kunjunganSchema, req.body);

  const dpjp = body.dpjp_staf_id ?? req.auth?.stafId ?? (await db.query<{ staf_id: string }>(
    `SELECT TOP 1 s.staf_id FROM [Staf] s JOIN [Profesi] pr ON pr.profesi_id = s.profesi_id
      WHERE s.aktif = 1 AND pr.kode LIKE 'DOKTER%' ORDER BY s.nama ASC`,
    {}
  )).recordset[0]?.staf_id;
  const penjamin = body.penjamin_id ?? (await db.query<{ penjamin_id: string }>(
    `SELECT TOP 1 penjamin_id FROM [Penjamin] ORDER BY nama ASC`,
    {}
  )).recordset[0]?.penjamin_id;
  if (!dpjp || !penjamin) {
    throw ApiError.badRequest('DPJP atau penjamin tidak tersedia');
  }

  const kunjungan = await db.query<{ kunjungan_id: string }>(
    `INSERT INTO [Kunjungan]
       (pasien_id, unit_id, dpjp_staf_id, penjamin_id, jenis_kunjungan, status, tgl_masuk)
     OUTPUT INSERTED.kunjungan_id
     VALUES (@pasien_id, @unit_id, @dpjp, @penjamin, @jenis, 'DILAYANI', SYSDATETIME())`,
    {
      pasien_id: req.params['id'],
      unit_id: body.unit_id,
      dpjp,
      penjamin,
      jenis: body.jenis_kunjungan
    }
  );
  const kunjunganId = kunjungan.recordset[0]?.kunjungan_id;
  if (!kunjunganId) {
    throw ApiError.internal('Gagal membuat kunjungan');
  }

  // ponytail: upsert + link dalam 1 roundtrip; ganti ke MERGE bila perlu atomik penuh
  for (const diagnosa of body.diagnosa) {
    await db.query(
      `IF NOT EXISTS (SELECT 1 FROM [Diagnosa] WHERE kode_icd = @kode)
         INSERT INTO [Diagnosa] (kode_icd, nama) VALUES (@kode, @nama);
       INSERT INTO [Kunjungan_Diagnosa] (kunjungan_id, diagnosa_id, jenis)
       SELECT TOP 1 @k, diagnosa_id, @j FROM [Diagnosa] WHERE kode_icd = @kode;`,
      { kode: diagnosa.kode_icd, nama: diagnosa.nama, k: kunjunganId, j: diagnosa.jenis }
    );
  }

  const pelaksana = req.auth?.stafId ?? null;
  if (!pelaksana) {
    throw ApiError.badRequest('Akun tidak terhubung ke staf');
  }

  const layananIds = [...new Set(body.layanan_ids)];
  if (layananIds.length > 0) {
    const params: Record<string, unknown> = { k: kunjunganId, s: pelaksana };
    const rows = layananIds.map((id, i) => {
      params[`l${i}`] = id;
      return `(@k, @l${i}, @s, 1, SYSDATETIME())`;
    });
    await db.query(
      `INSERT INTO [Tindakan_Kunjungan] (kunjungan_id, layanan_id, staf_id, qty, waktu)
       VALUES ${rows.join(', ')}`,
      params
    );
  }

  res.status(201).json({ success: true, data: { kunjungan_id: kunjunganId } });
}));

const catatanSchema = z.object({
  jenis: z.enum(['CPPT', 'ASUHAN_KEPERAWATAN', 'EVALUASI_MEDIS']).default('CPPT'),
  isi: z.string().min(1).max(2000)
});

router.patch('/kunjungan/:id/catatan', authenticate, klinis, asyncHandler(async (req, res) => {
  const body = parseBody(catatanSchema, req.body);
  const created = await db.query<Record<string, unknown>>(
    `INSERT INTO [Catatan_Keperawatan] (kunjungan_id, staf_id, jenis, isi, waktu)
     OUTPUT INSERTED.*
     VALUES (@kunjungan_id, @staf_id, @jenis, @isi, SYSDATETIME())`,
    {
      kunjungan_id: req.params['id'],
      staf_id: req.auth?.stafId ?? null,
      jenis: body.jenis,
      isi: body.isi
    }
  );
  res.status(201).json({ success: true, data: created.recordset[0] });
}));

router.post('/pasien/:id/kehamilan/list', authenticate, klinis, asyncHandler(async (req, res) => {
  const { limit } = parseBody(limitSchema, req.body ?? {});
  const result = await db.query<Record<string, unknown>>(
    `SELECT TOP (@limit) * FROM [Kehamilan] WHERE pasien_id = @id ORDER BY hpht DESC`,
    { id: req.params['id'], limit: paginate(limit, 50, 200) }
  );
  res.status(200).json({ success: true, data: result.recordset });
}));

const kehamilanSchema = z.object({
  hpht: z.string(),
  hpl: z.string().optional(),
  gravida: z.number().int().min(0).default(0),
  paritas: z.number().int().min(0).default(0),
  abortus: z.number().int().min(0).default(0),
  status_risiko: z.string().max(30).default('RENDAH'),
  status: z.string().max(30).default('AKTIF')
});

router.post('/pasien/:id/kehamilan', authenticate, klinis, asyncHandler(async (req, res) => {
  const body = parseBody(kehamilanSchema, req.body);
  const created = await db.query<Record<string, unknown>>(
    `INSERT INTO [Kehamilan] (pasien_id, hpht, hpl, gravida, paritas, abortus, status_risiko, status)
     OUTPUT INSERTED.*
     VALUES (@pasien_id, @hpht, DATEADD(DAY, 280, CAST(@hpht AS DATE)), @g, @p, @a, @risiko, @status)`,
    {
      pasien_id: req.params['id'],
      hpht: body.hpht,
      g: body.gravida,
      p: body.paritas,
      a: body.abortus,
      risiko: body.status_risiko,
      status: body.status
    }
  );
  res.status(201).json({ success: true, data: created.recordset[0] });
}));

router.post('/kehamilan/:id/anc/list', authenticate, klinis, asyncHandler(async (req, res) => {
  const { limit } = parseBody(limitSchema, req.body ?? {});
  const result = await db.query<Record<string, unknown>>(
    `SELECT TOP (@limit) * FROM [Pemeriksaan_ANC] WHERE kehamilan_id = @id ORDER BY kunjungan_ke DESC`,
    { id: req.params['id'], limit: paginate(limit, 50, 200) }
  );
  res.status(200).json({ success: true, data: result.recordset });
}));

const ancSchema = z.object({
  kunjungan_ke: z.number().int().min(1).max(20),
  usia_kehamilan_minggu: z.number().int().min(1).max(45),
  tinggi_fundus: z.number().int().min(1).max(60).optional(),
  djj: z.number().int().min(60).max(220).optional(),
  letak_janin: z.string().max(30).optional(),
  tablet_fe_diberikan: z.boolean().default(false)
});

router.post('/kehamilan/:id/anc', authenticate, klinis, asyncHandler(async (req, res) => {
  const body = parseBody(ancSchema, req.body);
  const created = await db.query<Record<string, unknown>>(
    `INSERT INTO [Pemeriksaan_ANC]
       (pemeriksaan_id, kehamilan_id, kunjungan_ke, usia_kehamilan_minggu, tinggi_fundus, djj, letak_janin, tablet_fe_diberikan)
     OUTPUT INSERTED.*
     VALUES (NEWID(), @kehamilan_id, @ke, @minggu, @tf, @djj, @letak, @fe)`,
    {
      kehamilan_id: req.params['id'],
      ke: body.kunjungan_ke,
      minggu: body.usia_kehamilan_minggu,
      tf: body.tinggi_fundus ?? null,
      djj: body.djj ?? null,
      letak: body.letak_janin ?? null,
      fe: body.tablet_fe_diberikan
    }
  );
  res.status(201).json({ success: true, data: created.recordset[0] });
}));

const persalinanSchema = z.object({
  kunjungan_id: z.string().uuid().optional(),
  penolong_staf_id: z.string().uuid().optional(),
  waktu_persalinan: z.string().optional(),
  jenis_persalinan: z.string().max(30),
  komplikasi: z.string().max(255).optional(),
  kondisi_ibu: z.string().max(30).default('STABIL')
});

router.post('/kehamilan/:id/persalinan', authenticate, dokter, asyncHandler(async (req, res) => {
  const body = parseBody(persalinanSchema, req.body);
  const created = await db.query<Record<string, unknown>>(
    `INSERT INTO [Persalinan]
       (kehamilan_id, kunjungan_id, penolong_staf_id, waktu_persalinan, jenis_persalinan, komplikasi, kondisi_ibu)
     OUTPUT INSERTED.*
     VALUES (@kehamilan_id, @kunjungan_id, @penolong, ISNULL(CAST(@waktu AS DATETIME2), SYSDATETIME()), @jenis, @komplikasi, @kondisi)`,
    {
      kehamilan_id: req.params['id'],
      kunjungan_id: body.kunjungan_id ?? null,
      penolong: body.penolong_staf_id ?? req.auth?.stafId ?? null,
      waktu: body.waktu_persalinan ?? null,
      jenis: body.jenis_persalinan,
      komplikasi: body.komplikasi ?? null,
      kondisi: body.kondisi_ibu
    }
  );
  await db.query(`UPDATE [Kehamilan] SET status = 'SELESAI' WHERE kehamilan_id = @id`, {
    id: req.params['id']
  });
  res.status(201).json({ success: true, data: created.recordset[0] });
}));

const bayiSchema = z.object({
  berat_lahir_gram: z.number().int().min(200).max(7000),
  panjang_lahir_cm: z.number().min(20).max(80),
  apgar_1: z.number().int().min(0).max(10).optional(),
  apgar_5: z.number().int().min(0).max(10).optional(),
  kondisi: z.string().max(30).default('SEHAT'),
  nama: z.string().min(1).max(100),
  jenis_kelamin: z.enum(['LAKI_LAKI', 'PEREMPUAN']),
  tgl_lahir: z.string(),
  ibu_pasien_id: z.string().uuid()
});

router.post('/persalinan/:id/bayi', authenticate, dokter, asyncHandler(async (req, res) => {
  const body = parseBody(bayiSchema, req.body);

  const pasien = await db.query<{ pasien_id: string }>(
    `INSERT INTO [Pasien]
       (no_rm, nik, nama, jenis_kelamin, tgl_lahir, tempat_lahir, alamat, no_telepon,
        gol_darah, status_pernikahan, pekerjaan, ibu_pasien_id)
     OUTPUT INSERTED.pasien_id
     VALUES (RIGHT('000000' + CAST(NEXT VALUE FOR dbo.Seq_NoRM AS VARCHAR(10)), 6),
             @nik, @nama, @jk, @tgl, '-', '-', '-', '-', 'BELUM_MENIKAH', '-', @ibu)`,
    {
      nik: `B${Date.now()}`.slice(0, 16).padEnd(16, '0'),
      nama: body.nama,
      jk: body.jenis_kelamin,
      tgl: body.tgl_lahir,
      ibu: body.ibu_pasien_id
    }
  );
  const bayiPasienId = pasien.recordset[0]?.pasien_id;
  if (!bayiPasienId) {
    throw ApiError.internal('Gagal membuat data pasien bayi');
  }

  const created = await db.query<Record<string, unknown>>(
    `INSERT INTO [Bayi_Lahir]
       (persalinan_id, pasien_id, berat_lahir_gram, panjang_lahir_cm, apgar_1, apgar_5, kondisi)
     OUTPUT INSERTED.*
     VALUES (@persalinan_id, @pasien_id, @berat, @panjang, @apgar1, @apgar5, @kondisi)`,
    {
      persalinan_id: req.params['id'],
      pasien_id: bayiPasienId,
      berat: body.berat_lahir_gram,
      panjang: body.panjang_lahir_cm,
      apgar1: body.apgar_1 ?? null,
      apgar5: body.apgar_5 ?? null,
      kondisi: body.kondisi
    }
  );
  res.status(201).json({ success: true, data: created.recordset[0] });
}));

router.post('/pasien/:id/imunisasi/list', authenticate, klinis, asyncHandler(async (req, res) => {
  const { limit } = parseBody(limitSchema, req.body ?? {});
  const result = await db.query<Record<string, unknown>>(
    `SELECT TOP (@limit) i.*, v.nama AS nama_vaksin
       FROM [Imunisasi_Pasien] i
       LEFT JOIN [Vaksin] v ON v.vaksin_id = i.vaksin_id
      WHERE i.pasien_id = @id
      ORDER BY i.tanggal DESC`,
    { id: req.params['id'], limit: paginate(limit, 50, 200) }
  );
  res.status(200).json({ success: true, data: result.recordset });
}));

const imunisasiSchema = z.object({
  vaksin_id: z.string().uuid(),
  kunjungan_id: z.string().uuid().optional(),
  batch_id: z.string().uuid().optional(),
  dosis_ke: z.number().int().min(1).max(10),
  tanggal: z.string()
});

router.post('/pasien/:id/imunisasi', authenticate, klinis, asyncHandler(async (req, res) => {
  const body = parseBody(imunisasiSchema, req.body);
  const created = await db.query<Record<string, unknown>>(
    `INSERT INTO [Imunisasi_Pasien] (pasien_id, vaksin_id, kunjungan_id, batch_id, staf_id, dosis_ke, tanggal)
     OUTPUT INSERTED.*
     VALUES (@pasien_id, @vaksin, @kunjungan, @batch, @staf, @dosis, @tanggal)`,
    {
      pasien_id: req.params['id'],
      vaksin: body.vaksin_id,
      kunjungan: body.kunjungan_id ?? null,
      batch: body.batch_id ?? null,
      staf: req.auth?.stafId ?? null,
      dosis: body.dosis_ke,
      tanggal: body.tanggal
    }
  );
  res.status(201).json({ success: true, data: created.recordset[0] });
}));

router.post('/pasien/:id/kb/list', authenticate, klinis, asyncHandler(async (req, res) => {
  const { limit } = parseBody(limitSchema, req.body ?? {});
  const result = await db.query<Record<string, unknown>>(
    `SELECT TOP (@limit) kb.*, m.nama AS metode
       FROM [Pelayanan_KB] kb
       LEFT JOIN [Metode_KB] m ON m.metode_id = kb.metode_id
      WHERE kb.pasien_id = @id
      ORDER BY kb.tanggal DESC`,
    { id: req.params['id'], limit: paginate(limit, 50, 200) }
  );
  res.status(200).json({ success: true, data: result.recordset });
}));

const kbSchema = z.object({
  metode_id: z.string().uuid(),
  kunjungan_id: z.string().uuid().optional(),
  tanggal: z.string(),
  kontrol_berikutnya: z.string().optional(),
  efek_samping: z.string().max(255).optional()
});

router.post('/pasien/:id/kb', authenticate, klinis, asyncHandler(async (req, res) => {
  const body = parseBody(kbSchema, req.body);
  const created = await db.query<Record<string, unknown>>(
    `INSERT INTO [Pelayanan_KB] (pasien_id, metode_id, kunjungan_id, tanggal, kontrol_berikutnya, efek_samping)
     OUTPUT INSERTED.*
     VALUES (@pasien_id, @metode, @kunjungan, @tanggal, @kontrol, @efek)`,
    {
      pasien_id: req.params['id'],
      metode: body.metode_id,
      kunjungan: body.kunjungan_id ?? null,
      tanggal: body.tanggal,
      kontrol: body.kontrol_berikutnya ?? null,
      efek: body.efek_samping ?? null
    }
  );
  res.status(201).json({ success: true, data: created.recordset[0] });
}));

export default router;
