import { z } from 'zod';
import { dateSchema } from './common';

export const periodeSchema = z.object({
  dari: dateSchema.optional(),
  sampai: dateSchema.optional(),
  limit: z.coerce.number().int().min(1).max(200).optional()
});

export const kontenSchema = z.object({
  tipe: z.string().max(20),
  judul: z.string().min(1).max(100),
  isi: z.string().min(1),
  media_url: z.string().max(255).default(''),
  urutan: z.number().int().min(0).default(0),
  terbit: z.boolean().default(true)
});

export const kontenUpdateSchema = kontenSchema.partial();

export type PeriodeInput = z.infer<typeof periodeSchema>;
export type KontenBody = z.infer<typeof kontenSchema>;
export type KontenUpdateBody = z.infer<typeof kontenUpdateSchema>;
