import bcrypt from 'bcryptjs';
import ApiError from '../errors/ApiError';
import { paginate } from '../validation/common';
import PublicRepository from '../repositories/public.repository';
import AuthRepository from '../repositories/auth.repository';

export interface ReservasiInput {
  pasien_id?: string;
  jadwal_id?: string;
  sesi_id?: string;
  layanan_id: string;
  metode_daftar?: 'ONLINE' | 'WALK_IN' | 'TELEPON';
  nik?: string;
  nama?: string;
  no_hp?: string;
  email?: string;
  jenis_kelamin?: 'P' | 'L';
  keluhan?: string;
  username?: string;
  password?: string;
}

export class PublicService {
  constructor(private readonly repository: PublicRepository = new PublicRepository()) {}

  listKonten(limit?: number, tipe?: string): Promise<Record<string, unknown>[]> {
    return this.repository.listKonten(paginate(limit, 50, 200), tipe ?? null);
  }

  listLayanan(limit?: number, unitId?: string): Promise<Record<string, unknown>[]> {
    return this.repository.listLayanan(paginate(limit, 100, 200), unitId ?? null);
  }

  listJadwal(limit?: number, unitId?: string): Promise<Record<string, unknown>[]> {
    return this.repository.listJadwal(paginate(limit, 100, 200), unitId ?? null);
  }

  async cekPasien(nik?: string, noRm?: string): Promise<Record<string, unknown>> {
    const pasien = await this.repository.findPasien(nik ?? null, noRm ?? null);
    return pasien ? { terdaftar: true, ...pasien } : { terdaftar: false };
  }

  async createReservasi(body: ReservasiInput): Promise<Record<string, unknown>> {
    const jadwalId = body.jadwal_id ?? body.sesi_id;
    if (!jadwalId) {
      throw ApiError.badRequest('jadwal_id atau sesi_id wajib diisi');
    }

    let pasienId = body.pasien_id;
    if (!pasienId && body.nik) {
      const existing = await this.repository.findPasien(body.nik, null);
      if (existing) {
        pasienId = existing.pasien_id;
      } else {
        pasienId = await this.repository.createPasienRingkas({
          nik: body.nik,
          nama: body.nama,
          noHp: body.no_hp,
          email: body.email,
          jenisKelamin: body.jenis_kelamin
        });
      }
    }

    if (!pasienId) {
      throw ApiError.badRequest('pasien_id atau NIK pasien wajib diisi');
    }

    if (body.password && (body.username || body.nama) && body.email && body.nik) {
      try {
        const authRepo = new AuthRepository();
        const uname = (body.username ?? body.nama ?? body.nik).trim();
        const existingAkun = await authRepo.findAkunByUsername(uname);
        if (!existingAkun) {
          const hash = await bcrypt.hash(body.password, 10);
          await authRepo.registerPasienAkun({
            username: uname,
            passwordHash: hash,
            nik: body.nik.trim(),
            nama: (body.nama ?? uname).trim(),
            email: body.email.trim(),
            noHp: body.no_hp?.trim(),
            jenisKelamin: body.jenis_kelamin
          });
        }
      } catch {
        // Abaikan jika akun sudah ada, lanjutkan pembuatan tiket reservasi
      }
    }

    const slot = await this.repository.findJadwalSlot(jadwalId);
    if (!slot) {
      throw ApiError.notFound('Jadwal tidak tersedia');
    }

    const terpakai = await this.repository.countReservasi(jadwalId);
    const urutan = terpakai + 1;
    if (urutan > slot.kuota_maks) {
      throw ApiError.fromCode('ERR-RSV-01');
    }

    const inserted = await this.repository.createReservasi({
      pasienId,
      jadwalId,
      layananId: body.layanan_id,
      nomor: urutan,
      offset: (urutan - 1) * slot.durasi_per_pasien,
      jam: slot.jam_mulai,
      metode: body.metode_daftar ?? 'ONLINE'
    });
    if (!inserted) {
      throw ApiError.internal('Gagal membuat reservasi');
    }
    return inserted;
  }
}

export default PublicService;
