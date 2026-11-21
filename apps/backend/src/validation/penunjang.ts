import { z } from 'zod';

export const orderSchema = z.object({
  jenis: z.enum(['LAB', 'RADIOLOGI']),
  layanan_ids: z.array(z.string().uuid()).min(1)
});

export const hasilLabSchema = z.object({
  order_detail_id: z.string().uuid(),
  parameter_id: z.string().uuid(),
  nilai: z.string().min(1).max(100),
  flag: z.string().max(20).optional()
});

export const hasilRadSchema = z.object({
  order_detail_id: z.string().uuid(),
  temuan: z.string().min(1).max(4000),
  kesan: z.string().min(1).max(2000),
  berkas_gambar: z.string().max(255).optional()
});

export type OrderBody = z.infer<typeof orderSchema>;
export type HasilLabBody = z.infer<typeof hasilLabSchema>;
export type HasilRadBody = z.infer<typeof hasilRadSchema>;
