import ApiError from '../errors/ApiError';
import { paginate } from '../validation/common';
import PublicRepository from '../repositories/public.repository';

export interface ReservasiInput {
  pasien_id: string;
  jadwal_id: string;
  layanan_id: string;
  metode_daftar: 'ONLINE' | 'WALK_IN' | 'TELEPON';
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
    const slot = await this.repository.findJadwalSlot(body.jadwal_id);
    if (!slot) {
      throw ApiError.notFound('Jadwal tidak tersedia');
    }

    const terpakai = await this.repository.countReservasi(body.jadwal_id);
    const urutan = terpakai + 1;
    if (urutan > slot.kuota_maks) {
      throw ApiError.fromCode('ERR-RSV-01');
    }

    const inserted = await this.repository.createReservasi({
      pasienId: body.pasien_id,
      jadwalId: body.jadwal_id,
      layananId: body.layanan_id,
      nomor: urutan,
      offset: (urutan - 1) * slot.durasi_per_pasien,
      jam: slot.jam_mulai,
      metode: body.metode_daftar
    });
    if (!inserted) {
      throw ApiError.internal('Gagal membuat reservasi');
    }
    return inserted;
  }
}

export default PublicService;
