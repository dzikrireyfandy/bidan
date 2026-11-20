import { z } from 'zod';
import { dateSchema } from './common';

export const stokListSchema = z.object({
  q: z.string().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional()
});

export const obatSchema = z.object({
  kode: z.string().min(1).max(30),
  nama_generik: z.string().min(1).max(150),
  nama_dagang: z.string().max(150).optional(),
  kategori: z.string().min(1).max(30),
  bentuk: z.string().min(1).max(30),
  satuan: z.string().min(1).max(20),
  kekuatan: z.string().max(30).optional(),
  golongan: z.string().max(30).optional(),
  stok_minimum: z.number().int().min(0).default(0)
});

export const obatUpdateSchema = z.object({
  nama_dagang: z.string().max(150).optional(),
  stok_minimum: z.number().int().min(0).optional(),
  aktif: z.boolean().optional()
});

export const restockSchema = z.object({
  gudang_id: z.string().uuid(),
  no_batch: z.string().min(1).max(50),
  tgl_kedaluwarsa: dateSchema,
  harga_beli: z.number().min(0),
  jumlah: z.number().int().min(1),
  keterangan: z.string().max(255).optional()
});

export const batchSchema = z.object({
  no_batch: z.string().min(1).max(50),
  tgl_kedaluwarsa: dateSchema,
  harga_beli: z.number().min(0),
  gudang_id: z.string().uuid(),
  jumlah: z.number().int().min(1)
});

export const resepPengeluaranSchema = z.object({
  gudang_id: z.string().uuid(),
  kunjungan_id: z.string().uuid().optional()
});

export type StokListInput = z.infer<typeof stokListSchema>;
export type ObatBody = z.infer<typeof obatSchema>;
export type ObatUpdateBody = z.infer<typeof obatUpdateSchema>;
export type RestockBody = z.infer<typeof restockSchema>;
export type BatchBody = z.infer<typeof batchSchema>;
export type ResepPengeluaranBody = z.infer<typeof resepPengeluaranSchema>;
