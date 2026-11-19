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
const dokter = requireRole('SUPERADMIN', 'DOKTER');

const orderSchema = z.object({
  jenis: z.enum(['LAB', 'RADIOLOGI']),
  layanan_ids: z.array(z.string().uuid()).min(1)
});

router.post('/kunjungan/:id/order-penunjang', authenticate, dokter, asyncHandler(async (req, res) => {
  const body = parseBody(orderSchema, req.body);

  const order = await db.query<{ order_id: string }>(
    `INSERT INTO [Order_Penunjang] (kunjungan_id, staf_pemesan_id, jenis, waktu_order, status)
     OUTPUT INSERTED.order_id
     VALUES (@kunjungan_id, @staf_id, @jenis, SYSDATETIME(), 'DIPESAN')`,
    {
      kunjungan_id: req.params['id'],
      staf_id: req.auth?.stafId ?? null,
      jenis: body.jenis
    }
  );
  const orderId = order.recordset[0]?.order_id;
  if (!orderId) {
    throw ApiError.internal('Gagal membuat order penunjang');
  }

  for (const layananId of body.layanan_ids) {
    await db.query(
      `INSERT INTO [Order_Penunjang_Detail] (order_id, layanan_id, status) VALUES (@order_id, @layanan_id, 'MENUNGGU')`,
      { order_id: orderId, layanan_id: layananId }
    );
  }

  res.status(201).json({ success: true, data: { order_id: orderId } });
}));

router.post('/kunjungan/:id/order/list', authenticate, klinis, asyncHandler(async (req, res) => {
  const result = await db.query<Record<string, unknown>>(
    `SELECT o.order_id, o.jenis, o.waktu_order, o.status,
            d.order_detail_id, d.layanan_id, l.nama AS nama_layanan, d.status AS status_detail
       FROM [Order_Penunjang] o
       LEFT JOIN [Order_Penunjang_Detail] d ON d.order_id = o.order_id
       LEFT JOIN [Layanan_Medis] l ON l.layanan_id = d.layanan_id
      WHERE o.kunjungan_id = @id
      ORDER BY o.waktu_order DESC`,
    { id: req.params['id'] }
  );
  res.status(200).json({ success: true, data: result.recordset });
}));

const hasilLabSchema = z.object({
  order_detail_id: z.string().uuid(),
  parameter_id: z.string().uuid(),
  nilai: z.string().min(1).max(100),
  flag: z.string().max(20).optional()
});

router.post('/order/:id/hasil-lab', authenticate, klinis, asyncHandler(async (req, res) => {
  const body = parseBody(hasilLabSchema, req.body);

  const created = await db.query<Record<string, unknown>>(
    `INSERT INTO [Hasil_Lab] (order_detail_id, parameter_id, staf_id, nilai, flag, waktu)
     OUTPUT INSERTED.*
     VALUES (@detail, @parameter, @staf, @nilai, @flag, SYSDATETIME())`,
    {
      detail: body.order_detail_id,
      parameter: body.parameter_id,
      staf: req.auth?.stafId ?? null,
      nilai: body.nilai,
      flag: body.flag ?? null
    }
  );

  await db.query(`UPDATE [Order_Penunjang_Detail] SET status = 'SELESAI' WHERE order_detail_id = @id`, {
    id: body.order_detail_id
  });

  res.status(201).json({ success: true, data: created.recordset[0] });
}));

const hasilRadSchema = z.object({
  order_detail_id: z.string().uuid(),
  temuan: z.string().min(1).max(4000),
  kesan: z.string().min(1).max(2000),
  berkas_gambar: z.string().max(255).optional()
});

router.post('/order/:id/hasil-radiologi', authenticate, klinis, asyncHandler(async (req, res) => {
  const body = parseBody(hasilRadSchema, req.body);

  const created = await db.query<Record<string, unknown>>(
    `INSERT INTO [Hasil_Radiologi] (order_detail_id, radiolog_staf_id, temuan, kesan, berkas_gambar, waktu)
     OUTPUT INSERTED.*
     VALUES (@detail, @staf, @temuan, @kesan, @berkas, SYSDATETIME())`,
    {
      detail: body.order_detail_id,
      staf: req.auth?.stafId ?? null,
      temuan: body.temuan,
      kesan: body.kesan,
      berkas: body.berkas_gambar ?? null
    }
  );

  await db.query(`UPDATE [Order_Penunjang_Detail] SET status = 'SELESAI' WHERE order_detail_id = @id`, {
    id: body.order_detail_id
  });

  res.status(201).json({ success: true, data: created.recordset[0] });
}));

export default router;
