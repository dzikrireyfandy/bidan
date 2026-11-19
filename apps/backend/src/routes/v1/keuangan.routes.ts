import { Router } from 'express';
import { z } from 'zod';
import db from '../../db/pool';
import ApiError from '../../errors/ApiError';
import { asyncHandler } from '../../middleware/asyncHandler';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { parseBody, paginate } from './_validate';

const router = Router();

const kasir = requireRole('SUPERADMIN', 'ADMIN_LOKAL', 'STAFF');
const admin = requireRole('SUPERADMIN', 'ADMIN_LOKAL');

const listSchema = z.object({
  status: z.string().max(20).optional(),
  dari: z.string().optional(),
  sampai: z.string().optional(),
  limit: z.number().int().min(1).max(500).optional()
});

router.post('/kunjungan/:id/tagihan/detail', authenticate, kasir, asyncHandler(async (req, res) => {
  const kunjunganId = req.params['id'];

  const tagihan = await db.query<{ tagihan_id: string }>(
    `SELECT TOP 1 tagihan_id FROM [Tagihan] WHERE kunjungan_id = @id`,
    { id: kunjunganId }
  );
  let tagihanId = tagihan.recordset[0]?.tagihan_id;

  if (!tagihanId) {
    const created = await db.query<{ tagihan_id: string }>(
      `INSERT INTO [Tagihan] (kunjungan_id, total_tagihan, total_dibayar, status, tgl_terbit)
       OUTPUT INSERTED.tagihan_id
       VALUES (@id, 0, 0, 'BELUM_BAYAR', SYSDATETIME())`,
      { id: kunjunganId }
    );
    tagihanId = created.recordset[0]?.tagihan_id;
  }

  if (!tagihanId) {
    throw ApiError.internal('Gagal membuat tagihan');
  }

  const [rincian, header] = await Promise.all([
    db.query<Record<string, unknown>>(
      `SELECT tr.rincian_id, tr.obat_id, tr.layanan_id, tr.paket_id, tr.qty,
              tr.harga_satuan, tr.subtotal
         FROM [Tagihan_Rincian] tr WHERE tr.tagihan_id = @id`,
      { id: tagihanId }
    ),
    db.query<Record<string, unknown>>(`SELECT * FROM [Tagihan] WHERE tagihan_id = @id`, {
      id: tagihanId
    })
  ]);

  res.status(200).json({ success: true, data: { ...header.recordset[0], rincian: rincian.recordset } });
}));

const bayarSchema = z.object({
  jumlah: z.number().positive(),
  metode: z.enum(['TUNAI', 'TRANSFER', 'KARTU', 'BPJS', 'ASURANSI']),
  jenis: z.enum(['PENUH', 'SEBAGIAN']).default('PENUH'),
  penjamin_id: z.string().uuid().optional()
});

router.post('/tagihan/:id/pembayaran', authenticate, kasir, asyncHandler(async (req, res) => {
  const body = parseBody(bayarSchema, req.body);

  const tagihan = await db.query<{ total_tagihan: number; total_dibayar: number }>(
    `SELECT total_tagihan, total_dibayar FROM [Tagihan] WHERE tagihan_id = @id`,
    { id: req.params['id'] }
  );
  const row = tagihan.recordset[0];
  if (!row) {
    throw ApiError.notFound('Tagihan tidak ditemukan');
  }

  await db.query(
    `INSERT INTO [Pembayaran] (tagihan_id, penjamin_id, kasir_staf_id, jumlah, metode, jenis, waktu_bayar)
     VALUES (@tagihan_id, @penjamin_id, @kasir, @jumlah, @metode, @jenis, SYSDATETIME())`,
    {
      tagihan_id: req.params['id'],
      penjamin_id: body.penjamin_id ?? null,
      kasir: req.auth?.stafId ?? null,
      jumlah: body.jumlah,
      metode: body.metode,
      jenis: body.jenis
    }
  );

  const totalDibayar = Number(row.total_dibayar) + body.jumlah;
  const lunas = totalDibayar >= Number(row.total_tagihan);

  const updated = await db.query<Record<string, unknown>>(
    `UPDATE [Tagihan]
        SET total_dibayar = @dibayar, status = @status
      OUTPUT INSERTED.*
      WHERE tagihan_id = @id`,
    { id: req.params['id'], dibayar: totalDibayar, status: lunas ? 'LUNAS' : 'BAYAR_SEBAGIAN' }
  );

  res.status(201).json({ success: true, data: updated.recordset[0] });
}));

router.post('/tagihan/list', authenticate, kasir, asyncHandler(async (req, res) => {
  const { status, dari, sampai, limit } = parseBody(listSchema, req.body ?? {});
  const result = await db.query<Record<string, unknown>>(
    `SELECT TOP (@limit) t.*, p.nama AS nama_pasien
       FROM [Tagihan] t
       JOIN [Kunjungan] k ON k.kunjungan_id = t.kunjungan_id
       JOIN [Pasien] p ON p.pasien_id = k.pasien_id
      WHERE (@status IS NULL OR t.status = @status)
        AND (@dari IS NULL OR t.tgl_terbit >= CAST(@dari AS DATE))
        AND (@sampai IS NULL OR t.tgl_terbit < DATEADD(DAY, 1, CAST(@sampai AS DATE)))
      ORDER BY t.tgl_terbit DESC`,
    {
      limit: paginate(limit, 100, 500),
      status: status ?? null,
      dari: dari ?? null,
      sampai: sampai ?? null
    }
  );
  res.status(200).json({ success: true, data: result.recordset });
}));

router.post('/keuangan/rekap/list', authenticate, kasir, asyncHandler(async (req, res) => {
  const { dari, sampai } = parseBody(listSchema, req.body ?? {});
  const result = await db.query<Record<string, unknown>>(
    `SELECT CAST(pb.waktu_bayar AS DATE) AS tanggal, pb.metode,
            COUNT(*) AS jumlah_transaksi, SUM(pb.jumlah) AS total
       FROM [Pembayaran] pb
      WHERE (@dari IS NULL OR pb.waktu_bayar >= CAST(@dari AS DATE))
        AND (@sampai IS NULL OR pb.waktu_bayar < DATEADD(DAY, 1, CAST(@sampai AS DATE)))
      GROUP BY CAST(pb.waktu_bayar AS DATE), pb.metode
      ORDER BY tanggal DESC, pb.metode ASC`,
    { dari: dari ?? null, sampai: sampai ?? null }
  );
  res.status(200).json({ success: true, data: result.recordset });
}));

router.post('/harga/list', authenticate, requireRole('SUPERADMIN', 'ADMIN_LOKAL', 'DOKTER', 'STAFF'), asyncHandler(async (_req, res) => {
  const [layanan, obat] = await Promise.all([
    db.query<Record<string, unknown>>(
      `SELECT hl.harga_layanan_id, hl.layanan_id, l.nama, hl.kelas_id, hl.penjamin_id,
              hl.harga, hl.berlaku_dari, hl.berlaku_sampai
         FROM [Harga_Layanan] hl
         JOIN [Layanan_Medis] l ON l.layanan_id = hl.layanan_id
        WHERE hl.berlaku_sampai IS NULL OR hl.berlaku_sampai >= CAST(SYSDATETIME() AS DATE)`,
      {}
    ),
    db.query<Record<string, unknown>>(
      `SELECT ho.harga_obat_id, ho.obat_id, o.nama_generik, ho.harga_jual,
              ho.berlaku_dari, ho.berlaku_sampai
         FROM [Harga_Obat] ho
         JOIN [Obat] o ON o.obat_id = ho.obat_id
        WHERE ho.berlaku_sampai IS NULL OR ho.berlaku_sampai >= CAST(SYSDATETIME() AS DATE)`,
      {}
    )
  ]);
  res.status(200).json({ success: true, data: { layanan: layanan.recordset, obat: obat.recordset } });
}));

const hargaSchema = z.object({
  harga: z.number().min(0),
  kelas_id: z.string().uuid().optional(),
  penjamin_id: z.string().uuid().optional(),
  berlaku_dari: z.string().optional(),
  alasan: z.string().max(255).optional()
});

router.put('/harga/:ref_tipe/:ref_id', authenticate, admin, asyncHandler(async (req, res) => {
  const body = parseBody(hargaSchema, req.body);
  const refTipe = String(req.params['ref_tipe']).toUpperCase();
  const refId = req.params['ref_id'];
  const stafId = req.auth?.stafId ?? null;

  if (refTipe === 'LAYANAN') {
    await db.query(
      `UPDATE [Harga_Layanan] SET berlaku_sampai = SYSDATETIME()
        WHERE layanan_id = @id AND berlaku_sampai IS NULL`,
      { id: refId }
    );
    const created = await db.query<Record<string, unknown>>(
      `INSERT INTO [Harga_Layanan]
         (layanan_id, kelas_id, penjamin_id, diubah_oleh, harga, berlaku_dari, alasan)
       OUTPUT INSERTED.*
       VALUES (@layanan_id, @kelas_id, @penjamin_id, @staf, @harga,
               ISNULL(CAST(@dari AS DATE), CAST(SYSDATETIME() AS DATE)), @alasan)`,
      {
        layanan_id: refId,
        kelas_id: body.kelas_id ?? null,
        penjamin_id: body.penjamin_id ?? null,
        staf: stafId,
        harga: body.harga,
        dari: body.berlaku_dari ?? null,
        alasan: body.alasan ?? null
      }
    );
    res.status(201).json({ success: true, data: created.recordset[0] });
    return;
  }

  if (refTipe === 'OBAT') {
    await db.query(
      `UPDATE [Harga_Obat] SET berlaku_sampai = SYSDATETIME()
        WHERE obat_id = @id AND berlaku_sampai IS NULL`,
      { id: refId }
    );
    const created = await db.query<Record<string, unknown>>(
      `INSERT INTO [Harga_Obat] (obat_id, diubah_oleh, harga_jual, berlaku_dari, alasan)
       OUTPUT INSERTED.*
       VALUES (@obat_id, @staf, @harga, ISNULL(CAST(@dari AS DATE), CAST(SYSDATETIME() AS DATE)), @alasan)`,
      {
        obat_id: refId,
        staf: stafId,
        harga: body.harga,
        dari: body.berlaku_dari ?? null,
        alasan: body.alasan ?? null
      }
    );
    res.status(201).json({ success: true, data: created.recordset[0] });
    return;
  }

  throw ApiError.badRequest('ref_tipe harus LAYANAN atau OBAT');
}));

router.post('/harga/:ref_tipe/:ref_id/riwayat/list', authenticate, admin, asyncHandler(async (req, res) => {
  const refTipe = String(req.params['ref_tipe']).toUpperCase();
  const refId = req.params['ref_id'];

  if (refTipe === 'LAYANAN') {
    const result = await db.query<Record<string, unknown>>(
      `SELECT * FROM [Harga_Layanan] WHERE layanan_id = @id ORDER BY berlaku_dari DESC`,
      { id: refId }
    );
    res.status(200).json({ success: true, data: result.recordset });
    return;
  }

  if (refTipe === 'OBAT') {
    const result = await db.query<Record<string, unknown>>(
      `SELECT * FROM [Harga_Obat] WHERE obat_id = @id ORDER BY berlaku_dari DESC`,
      { id: refId }
    );
    res.status(200).json({ success: true, data: result.recordset });
    return;
  }

  throw ApiError.badRequest('ref_tipe harus LAYANAN atau OBAT');
}));

export default router;
