import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';
import db from '../../db/pool';
import ApiError from '../../errors/ApiError';
import { asyncHandler } from '../../middleware/asyncHandler';
import { authenticate, signToken } from '../../middleware/auth';
import type { Peran, SubPeran } from '../../types';
import { parseBody } from './_validate';

const router = Router();

interface AkunRow {
  akun_id: string;
  password_hash: string;
  aktif: boolean;
  pasien_id: string | null;
  staf_id: string | null;
  sub_peran: SubPeran | null;
  peran: Peran;
  terkunci_sampai: Date | null;
}

const loginSchema = z.object({
  username: z.string().min(1).max(50),
  password: z.string().min(1).max(128)
});

const emailSchema = z.object({ email: z.string().email().max(254) });

const resetVerifySchema = z.object({
  email: z.string().email().max(254),
  otp: z.string().regex(/^\d{6}$/),
  password_baru: z.string().min(8).max(128)
});

const findAkunByEmail = async (email: string): Promise<string | null> => {
  const found = await db.query<{ akun_id: string }>(
    `SELECT a.akun_id FROM [Akun_Pengguna] a
       LEFT JOIN [Pasien] p ON p.pasien_id = a.pasien_id
       LEFT JOIN [Staf] s ON s.staf_id = a.staf_id
      WHERE p.email = @email OR s.email = @email`,
    { email }
  );
  return found.recordset[0]?.akun_id ?? null;
};

router.post('/auth/login', asyncHandler(async (req, res) => {
  const { username, password } = parseBody(loginSchema, req.body);

  const result = await db.query<AkunRow>(
    `SELECT a.akun_id, a.password_hash, a.aktif, a.pasien_id, a.staf_id, a.sub_peran,
            a.terkunci_sampai, p.kode AS peran
       FROM [Akun_Pengguna] a
       JOIN [Peran] p ON p.peran_id = a.peran_id
      WHERE a.username = @username`,
    { username }
  );
  const akun = result.recordset[0];
  if (!akun || !akun.aktif) {
    throw ApiError.unauthorized('Kredensial tidak valid');
  }
  if (akun.terkunci_sampai && akun.terkunci_sampai > new Date()) {
    throw ApiError.forbidden('Akun terkunci sementara, coba lagi nanti');
  }

  const cocok = await bcrypt.compare(password, akun.password_hash);
  if (!cocok) {
    await db.query(
      `UPDATE [Akun_Pengguna]
          SET percobaan_gagal = percobaan_gagal + 1,
              terkunci_sampai = CASE WHEN percobaan_gagal + 1 >= 5
                                     THEN DATEADD(MINUTE, 15, SYSDATETIME()) ELSE terkunci_sampai END
        WHERE akun_id = @id`,
      { id: akun.akun_id }
    );
    throw ApiError.unauthorized('Kredensial tidak valid');
  }

  await db.query(
    `UPDATE [Akun_Pengguna] SET last_login_at = SYSDATETIME(), percobaan_gagal = 0 WHERE akun_id = @id`,
    { id: akun.akun_id }
  );

  const token = signToken({
    akunId: akun.akun_id,
    peran: akun.peran,
    subPeran: akun.sub_peran,
    stafId: akun.staf_id,
    pasienId: akun.pasien_id
  });

  res.status(200).json({
    success: true,
    data: { token, peran: akun.peran, subPeran: akun.sub_peran }
  });
}));

router.post('/auth/logout', authenticate, asyncHandler(async (_req, res) => {
  res.status(200).json({ success: true, data: { message: 'Logout berhasil' } });
}));

router.post('/auth/refresh', authenticate, asyncHandler(async (req, res) => {
  const auth = req.auth;
  if (!auth) {
    throw ApiError.unauthorized('Token tidak ditemukan');
  }
  const token = signToken({
    akunId: auth.akunId,
    peran: auth.peran,
    subPeran: auth.subPeran,
    stafId: auth.stafId,
    pasienId: auth.pasienId
  });
  res.status(200).json({ success: true, data: { token } });
}));

router.post('/auth/reset/request', asyncHandler(async (req, res) => {
  const { email } = parseBody(emailSchema, req.body);
  const akunId = await findAkunByEmail(email);

  if (akunId) {
    const kode = crypto.randomInt(100000, 1000000).toString();
    const kodeHash = await bcrypt.hash(kode, 10);
    await db.query(
      `INSERT INTO [Otp_Reset] (akun_id, kode_hash, expired_at, dipakai)
       VALUES (@id, @hash, DATEADD(MINUTE, 15, SYSDATETIME()), 0)`,
      { id: akunId, hash: kodeHash }
    );
    // ponytail: OTP disimpan di antrean notifikasi sampai worker SMTP (Todo 6) ada
    await db.query(
      `INSERT INTO [Notifikasi_Log] (jenis, tujuan, pesan, status, retry_count, waktu_kirim)
       VALUES ('OTP_RESET', @email, @pesan, 'ANTRE', 0, SYSDATETIME())`,
      { email, pesan: `Kode OTP reset kata sandi Anda: ${kode}` }
    );
  }

  res.status(200).json({
    success: true,
    data: { message: 'Jika email terdaftar, kode OTP telah dikirim' }
  });
}));

router.post('/auth/reset/verify', asyncHandler(async (req, res) => {
  const { email, otp, password_baru } = parseBody(resetVerifySchema, req.body);
  const akunId = await findAkunByEmail(email);
  if (!akunId) {
    throw ApiError.badRequest('Kode OTP tidak valid atau kedaluwarsa');
  }

  const otpResult = await db.query<{ otp_id: string; kode_hash: string }>(
    `SELECT TOP 1 otp_id, kode_hash FROM [Otp_Reset]
      WHERE akun_id = @id AND dipakai = 0 AND expired_at > SYSDATETIME()
      ORDER BY created_at DESC`,
    { id: akunId }
  );
  const otpRow = otpResult.recordset[0];
  if (!otpRow || !(await bcrypt.compare(otp, otpRow.kode_hash))) {
    throw ApiError.badRequest('Kode OTP tidak valid atau kedaluwarsa');
  }

  const hash = await bcrypt.hash(password_baru, 10);
  await db.query(`UPDATE [Akun_Pengguna] SET password_hash = @hash WHERE akun_id = @id`, {
    id: akunId,
    hash
  });
  await db.query(`UPDATE [Otp_Reset] SET dipakai = 1 WHERE akun_id = @id AND dipakai = 0`, {
    id: akunId
  });

  res.status(200).json({ success: true, data: { message: 'Kata sandi berhasil diperbarui' } });
}));

export default router;
