import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import ApiError from '../errors/ApiError';
import { signToken } from '../middleware/auth';
import type { AuthContext, Peran, SubPeran } from '../types';
import AuthRepository from '../repositories/auth.repository';
import { sendMail } from '../jobs/mailer';

export interface LoginResult {
  token: string;
  peran: Peran;
  subPeran: SubPeran | null;
}

export class AuthService {
  constructor(private readonly repository: AuthRepository = new AuthRepository()) {}

  async login(username: string, password: string): Promise<LoginResult> {
    const cleanUsername = username.trim();
    const akun = await this.repository.findAkunByUsername(cleanUsername);
    if (!akun || !akun.aktif) {
      throw ApiError.fromCode('ERR-AUTH-02');
    }

    const cocokIdentitas =
      (akun.username !== undefined && akun.username === cleanUsername) ||
      (akun.nik !== undefined && akun.nik !== null && akun.nik === cleanUsername) ||
      (akun.email !== undefined && akun.email !== null && akun.email.toLowerCase() === cleanUsername.toLowerCase());

    if (!cocokIdentitas) {
      throw ApiError.fromCode('ERR-AUTH-02');
    }
    if (akun.terkunci_sampai && akun.terkunci_sampai > new Date()) {
      throw ApiError.fromCode('ERR-LOCK-01');
    }

    const cocok = await bcrypt.compare(password, akun.password_hash);
    if (!cocok) {
      await this.repository.recordFailedAttempt(akun.akun_id, username);
      throw ApiError.fromCode('ERR-AUTH-02');
    }

    await this.repository.recordLoginSuccess(akun.akun_id, username);

    return {
      token: signToken({
        akunId: akun.akun_id,
        peran: akun.peran,
        subPeran: akun.sub_peran,
        stafId: akun.staf_id,
        pasienId: akun.pasien_id,
        unitId: akun.unit_id
      }),
      peran: akun.peran,
      subPeran: akun.sub_peran
    };
  }

  refresh(auth: AuthContext): { token: string } {
    return {
      token: signToken({
        akunId: auth.akunId,
        peran: auth.peran,
        subPeran: auth.subPeran,
        stafId: auth.stafId,
        pasienId: auth.pasienId,
        unitId: auth.unitId
      })
    };
  }

  async logout(auth: AuthContext): Promise<void> {
    const userRef = auth.subPeran ? `${auth.peran}:${auth.subPeran}` : auth.peran;
    await this.repository.recordAudit(auth.akunId, userRef, 'LOGOUT', 'Logout');
  }

  async requestReset(email: string): Promise<{ message: string }> {
    const akunId = await this.repository.findAkunIdByEmail(email);

    if (akunId) {
      const kode = crypto.randomInt(100000, 1000000).toString();
      const kodeHash = await bcrypt.hash(kode, 10);
      await this.repository.createOtp(akunId, kodeHash);

      const pesan = `Kode OTP reset kata sandi Anda: ${kode}. Kode berlaku 15 menit.`;
      const terkirim = await sendMail(email, 'Kode OTP Reset Kata Sandi', pesan);
      // Kirim langsung agar OTP tiba < 1 menit; antrekan hanya bila SMTP gagal.
      await this.repository.recordNotification(email, pesan, terkirim ? 'TERKIRIM' : 'ANTRE');
    }

    return { message: 'Jika email terdaftar, kode OTP telah dikirim' };
  }

  async verifyReset(email: string, otp: string, passwordBaru: string): Promise<{ message: string }> {
    const akunId = await this.repository.findAkunIdByEmail(email);
    if (!akunId) {
      throw ApiError.fromCode('ERR-AUTH-05');
    }

    const otpRow = await this.repository.findActiveOtp(akunId);
    if (!otpRow || !(await bcrypt.compare(otp, otpRow.kode_hash))) {
      throw ApiError.fromCode('ERR-AUTH-05');
    }

    const hash = await bcrypt.hash(passwordBaru, 10);
    await this.repository.updatePassword(akunId, hash);
    await this.repository.markOtpUsed(akunId);

    return { message: 'Kata sandi berhasil diperbarui' };
  }

  async registerPasien(input: {
    username: string;
    password: string;
    nik: string;
    nama: string;
    email: string;
    no_hp?: string;
    jenis_kelamin?: string;
  }): Promise<LoginResult & { pasienId: string; nama: string }> {
    const cleanUsername = input.username.trim();
    const existing = await this.repository.findAkunByUsername(cleanUsername);
    if (existing) {
      throw ApiError.badRequest('Username atau NIK sudah terdaftar');
    }
    const hash = await bcrypt.hash(input.password, 10);
    const created = await this.repository.registerPasienAkun({
      username: cleanUsername,
      passwordHash: hash,
      nik: input.nik.trim(),
      nama: input.nama.trim(),
      email: input.email.trim(),
      noHp: input.no_hp?.trim(),
      jenisKelamin: input.jenis_kelamin
    });

    return {
      token: signToken({
        akunId: created.akun_id,
        peran: 'PASIEN',
        subPeran: null,
        stafId: null,
        pasienId: created.pasien_id,
        unitId: null
      }),
      peran: 'PASIEN',
      subPeran: null,
      pasienId: created.pasien_id,
      nama: input.nama
    };
  }
}

export default AuthService;
