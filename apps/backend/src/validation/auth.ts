import { z } from 'zod';

export const emptyBodySchema = z.object({});

export const loginSchema = z.object({
  username: z.string().min(1, 'Username wajib diisi').max(50),
  password: z.string().min(8, 'Kata sandi minimal 8 karakter').max(128)
});

export const emailSchema = z.object({
  email: z.string().email('Format email tidak valid').max(254)
});

export const resetVerifySchema = z.object({
  email: z.string().email('Format email tidak valid').max(254),
  otp: z.string().regex(/^\d{6}$/, 'Kode OTP harus 6 digit'),
  password_baru: z.string().min(8, 'Kata sandi minimal 8 karakter').max(128)
});

export const registerPasienSchema = z.object({
  username: z.string().min(3, 'Username minimal 3 karakter').max(50),
  password: z.string().min(8, 'Kata sandi minimal 8 karakter').max(128),
  nik: z.string().regex(/^\d{16}$/, 'NIK harus 16 digit angka'),
  nama: z.string().min(1, 'Nama lengkap wajib diisi').max(100),
  email: z.string().email('Format email tidak valid').max(254),
  no_hp: z.string().min(8).max(16).optional(),
  jenis_kelamin: z.string().optional()
});

export type LoginInput = z.infer<typeof loginSchema>;
export type EmailInput = z.infer<typeof emailSchema>;
export type ResetVerifyInput = z.infer<typeof resetVerifySchema>;
export type RegisterPasienInput = z.infer<typeof registerPasienSchema>;
